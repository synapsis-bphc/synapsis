// src/pages/AllEvents.tsx
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EventCard } from "@/components/EventCard";
import { EventCardSkeleton } from "@/components/EventCardSkeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Star, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  location: string;
  image_url?: string;
  is_upcoming: boolean;
  swd_link?: string; // ADDED
  unifest_link?: string; // ADDED
}

// Helper function to format time (if you don't have it globally)
const formatTime = (timeString: string | null | undefined): string => {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  const h = parseInt(hours, 10);
  const m = parseInt(minutes, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const formattedHours = h % 12 || 12;
  const formattedMinutes = m < 10 ? '0' + m : m;
  return `${formattedHours}:${formattedMinutes} ${ampm}`;
};


const INITIAL_PAST = 4;
const BATCH_PAST = 4;

export default function AllEvents() {
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [visiblePastCount, setVisiblePastCount] = useState(INITIAL_PAST);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchAllEvents();
  }, []);

  const fetchAllEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("events")
        .select("id, title, description, date, time, location, image_url, is_upcoming, swd_link, unifest_link") // UPDATED select
        .order("date", { ascending: false });

      if (error) throw error;
      setAllEvents(data || []);
    } catch (error) {
      console.error("Error fetching all events:", error);
    } finally {
      setLoading(false);
    }
  };

  // Separate events into upcoming and past
  const { upcomingEvents, pastEvents } = useMemo(() => {
    const upcoming = allEvents
        .filter(event => event.is_upcoming)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const past = allEvents
        .filter(event => !event.is_upcoming);
    return { upcomingEvents: upcoming, pastEvents: past };
  }, [allEvents]);

  const visiblePastEvents = pastEvents.slice(0, visiblePastCount);
  const hasMorePast = visiblePastCount < pastEvents.length;

  // IntersectionObserver for past events
  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting) {
        setVisiblePastCount((prev) => Math.min(prev + BATCH_PAST, pastEvents.length));
      }
    },
    [pastEvents.length]
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || loading) return;
    const observer = new IntersectionObserver(handleIntersect, { rootMargin: "200px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleIntersect, loading]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-slate-900 dark:via-purple-950 dark:to-slate-900 p-4 md:p-8 pt-24">
      <div className="container pt-10 mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Club Events
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Discover upcoming activities and look back at past moments from the Synapsis Club.
          </p>
        </div>

        {/* Upcoming Events Section */}
        {loading || upcomingEvents.length > 0 ? (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center flex items-center justify-center gap-2">
              <Star className="text-yellow-500" />
              Upcoming Events
            </h2>
            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {Array.from({ length: 2 }).map((_, index) => (
                  <EventCardSkeleton key={`upcoming-skel-${index}`} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {upcomingEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    title={event.title}
                    date={new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    time={formatTime(event.time)}
                    location={event.location}
                    description={event.description}
                    type="Upcoming"
                    image={event.image_url}
                    swd_link={event.swd_link} // ADDED
                    unifest_link={event.unifest_link} // ADDED
                  />
                ))}
              </div>
            )}
          </div>
        ) : null}

        {/* Separator between sections if both exist */}
        {upcomingEvents.length > 0 && pastEvents.length > 0 && <Separator className="my-12" />}

        {/* Past Events Section */}
        {loading || pastEvents.length > 0 ? (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center flex items-center justify-center gap-2">
              <Clock className="text-gray-500 dark:text-gray-400" />
              Past Events Archive
            </h2>
            {loading ? (
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {Array.from({ length: 4 }).map((_, index) => (
                  <EventCardSkeleton key={`past-skel-${index}`} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {visiblePastEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    title={event.title}
                    date={new Date(event.date).toLocaleDateString()}
                    time={formatTime(event.time)}
                    location={event.location}
                    description={event.description}
                    type="Past Event"
                    image={event.image_url}
                    swd_link={event.swd_link}
                    unifest_link={event.unifest_link}
                  />
                ))}
              </div>
            )}
            {/* Sentinel for lazy loading more past events */}
            {!loading && <div ref={sentinelRef} className="h-4" />}
            {!loading && hasMorePast && (
              <div className="flex justify-center py-4">
                <div className="flex gap-2 items-center text-gray-400 text-sm">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  Loading more events…
                </div>
              </div>
            )}
          </div>
         ) : null }

        {/* No Events Message */}
        {!loading && upcomingEvents.length === 0 && pastEvents.length === 0 && (
          <Card className="shadow-lg bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border border-white/20 dark:border-slate-700/50 rounded-2xl">
            <CardContent className="text-center py-16">
              <Calendar className="h-16 w-16 mx-auto text-gray-400 mb-6" />
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">No Events Found</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Check back soon for upcoming activities!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}