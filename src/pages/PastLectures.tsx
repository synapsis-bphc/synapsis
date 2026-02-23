// src/pages/PastLectures.tsx
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SeminarCard } from "@/components/SeminarCard"; 
import { FeaturedSeminarCard } from "@/components/FeaturedSeminarCard"; // Import the featured card
import { SeminarCardSkeleton } from "@/components/SeminarCardSkeleton";
import { FeaturedSeminarCardSkeleton } from "@/components/FeaturedSeminarCardSkeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BookOpen as BookOpenIcon, Search, Star } from "lucide-react"; 

interface Lecture {
  id: string;
  topic: string;
  speaker: string;
  speaker_title?: string;
  speaker_photo_url?: string;
  speaker_profile_url?: string;
  date: string;
  time: string;
  location: string;
  description: string;
  type: string;
  image_url?: string;
  is_upcoming: boolean;
}

// Add this helper function at the top of the file
const formatTime = (timeString: string | null | undefined): string => {
  if (!timeString) return '';
  // This function assumes the time is in "HH:MM:SS" or "HH:MM" format
  const [hours, minutes] = timeString.split(':');
  const h = parseInt(hours, 10);
  const m = parseInt(minutes, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const formattedHours = h % 12 || 12; // Convert hour to 12-hour format
  const formattedMinutes = m < 10 ? '0' + m : m;
  return `${formattedHours}:${formattedMinutes} ${ampm}`;
};

const INITIAL_PAST = 6;
const BATCH_PAST = 6;

export default function PastLectures() {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [visiblePastCount, setVisiblePastCount] = useState(INITIAL_PAST);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Reset visible count when search changes so all results are accessible
  useEffect(() => {
    setVisiblePastCount(INITIAL_PAST);
  }, [searchTerm]);

  useEffect(() => {
    fetchLectures();
  }, []);

  const fetchLectures = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("lectures")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;
      setLectures(data || []);
    } catch (error) {
      console.error("Error fetching lectures:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const { upcomingLectures, pastLectures } = useMemo(() => {
    const filtered = lectures.filter(l => 
      l.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.speaker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const upcoming = filtered.filter(l => l.is_upcoming);
    const past = filtered.filter(l => !l.is_upcoming);

    return { upcomingLectures: upcoming, pastLectures: past };
  }, [lectures, searchTerm]);

  const visiblePastLectures = pastLectures.slice(0, visiblePastCount);
  const hasMorePast = visiblePastCount < pastLectures.length;

  // IntersectionObserver for past lectures
  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting) {
        setVisiblePastCount((prev) => Math.min(prev + BATCH_PAST, pastLectures.length));
      }
    },
    [pastLectures.length]
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || loading) return;
    const observer = new IntersectionObserver(handleIntersect, { rootMargin: "200px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleIntersect, loading]);


  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-24 px-4 py-8">
      <div 
        className="absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"
      ></div>
      <div className="container mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Seminars
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Explore insightful seminars, lectures, and talks from the Synapsis Club.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-lg mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by topic, speaker, or description..."
              className="pl-10 h-12 text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Upcoming Seminars Section */}
        {loading ? (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center flex items-center justify-center gap-2">
              <Star className="text-yellow-500" />
              Upcoming Seminars
            </h2>
            <div className="grid grid-cols-1 gap-8">
              {Array.from({ length: 1 }).map((_, index) => (
                <FeaturedSeminarCardSkeleton key={index} />
              ))}
            </div>
          </div>
        ) : upcomingLectures.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center flex items-center justify-center gap-2">
              <Star className="text-yellow-500" />
              Upcoming Seminars
            </h2>
            <div className="grid grid-cols-1 gap-8">
              {upcomingLectures.map((lecture) => (
                <FeaturedSeminarCard
                  key={lecture.id}
                  topic={lecture.topic}
                  speakerName={lecture.speaker}
                  speakerTitle={lecture.speaker_title || ''}
                  speakerPhotoUrl={lecture.speaker_photo_url}
                  speakerProfileUrl={lecture.speaker_profile_url}
                  description={lecture.description}
                  date={lecture.date}
                  time={formatTime(lecture.time)}
                  venue={lecture.location}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Archive Section */}
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center">Archive</h2>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
                {Array.from({ length: 6 }).map((_, index) => (
                  <SeminarCardSkeleton key={index} />
                ))}
              </div>
            ) : visiblePastLectures.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
                    {visiblePastLectures.map((lecture) => (
                      <SeminarCard
                        key={lecture.id}
                        topic={lecture.topic}
                        speakerName={lecture.speaker}
                        speakerTitle={lecture.speaker_title || ''}
                        speakerPhotoUrl={lecture.speaker_photo_url}
                        speakerProfileUrl={lecture.speaker_profile_url}
                        description={lecture.description}
                        date={lecture.date}
                        time={formatTime(lecture.time)}
                        venue={lecture.location}
                        isUpcoming={lecture.is_upcoming}
                      />
                    ))}
                </div>
            ) : (
                <Card className="shadow-lg col-span-full">
                    <CardContent className="text-center py-12">
                    <BookOpenIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600">No Past Seminars Found</h3>
                    <p className="text-gray-500">
                        {searchTerm ? `No past seminars match your search for "${searchTerm}".` : "The archive is currently empty."}
                    </p>
                    </CardContent>
                </Card>
            )}
            {/* Sentinel for lazy loading more past seminars */}
            {!loading && <div ref={sentinelRef} className="h-4" />}
            {!loading && hasMorePast && (
              <div className="flex justify-center py-4">
                <div className="flex gap-2 items-center text-gray-400 text-sm">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  Loading more seminars…
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
