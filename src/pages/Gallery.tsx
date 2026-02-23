// src/pages/Gallery.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CameraOff, ExternalLink, X } from "lucide-react";

const INITIAL_COUNT = 8; // 2 rows of 4
const BATCH_SIZE = 8;

interface GalleryItem {
  id: string;
  image_url: string;
  title?: string;
  description?: string;
}

// ─── Lightbox ────────────────────────────────────────────────────────────────
function Lightbox({ item, onClose }: { item: GalleryItem; onClose: () => void }) {
  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    // Backdrop — click outside the card closes it
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      {/* Card — stop propagation so clicking inside doesn't close */}
      <div
        className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Image */}
        <div className="flex-shrink-0 bg-black flex items-center justify-center max-h-[65vh]">
          <img
            src={item.image_url}
            alt={item.title || "Gallery image"}
            className="max-h-[65vh] w-auto object-contain"
          />
        </div>

        {/* Description / link row */}
        <div className="p-4 flex items-start justify-between gap-4">
          <div className="flex-1">
            {item.description ? (
              <p className="text-sm text-muted-foreground">{item.description}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">No description</p>
            )}
          </div>
          <a
            href={item.image_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 flex items-center gap-1 text-xs text-blue-500 hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open full image
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Main Gallery Page ────────────────────────────────────────────────────────
export default function Gallery() {
  const [allItems, setAllItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchGallery = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("gallery")
          .select("id, image_url, title, description")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setAllItems(data || []);
      } catch (err) {
        console.error("Error fetching gallery:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, []);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting) {
        setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, allItems.length));
      }
    },
    [allItems.length]
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(handleIntersect, { rootMargin: "200px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleIntersect, loading]);

  const visibleItems = allItems.slice(0, visibleCount);
  const hasMore = visibleCount < allItems.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100 pt-24 px-4 py-8">
      {/* Lightbox */}
      {lightboxItem && (
        <Lightbox item={lightboxItem} onClose={() => setLightboxItem(null)} />
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
            Gallery
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            A collection of moments from Synapsis events and activities.
          </p>
        </div>

        {/* Skeleton while loading */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: INITIAL_COUNT }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-gray-200 animate-pulse" />
            ))}
          </div>
        )}

        {/* Photo Grid */}
        {!loading && allItems.length > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {visibleItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setLightboxItem(item)}
                  className="group relative aspect-square overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 text-left"
                >
                  <img
                    src={item.image_url}
                    alt={item.title || "Gallery image"}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-end">
                    {item.description && (
                      <div className="w-full bg-gradient-to-t from-black/70 to-transparent px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <p className="text-white text-xs line-clamp-2">{item.description}</p>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Sentinel */}
            <div ref={sentinelRef} className="h-4" />

            {hasMore && (
              <div className="flex justify-center py-4">
                <div className="flex gap-2 items-center text-gray-400 text-sm">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  Loading more photos…
                </div>
              </div>
            )}

            {!hasMore && allItems.length > INITIAL_COUNT && (
              <p className="text-center text-sm text-gray-400">
                Showing all {allItems.length} photos
              </p>
            )}
          </>
        )}

        {/* Empty state */}
        {!loading && allItems.length === 0 && (
          <div className="text-center py-24 text-muted-foreground border rounded-xl">
            <CameraOff className="h-14 w-14 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium">No images available yet.</p>
            <p className="text-sm mt-1">Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}
