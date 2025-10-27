// src/pages/AllEvents.tsx
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EventCard } from "@/components/EventCard";
import { EventCardSkeleton } from "@/components/EventCardSkeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Star, Clock } from "lucide-react"; // Added Star
import { Separator } from "@/components/ui/separator"; // Added Separator

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  location: string;
  image_url?: string;
  is_upcoming: boolean; // Keep this field
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


export default function AllEvents() { // Renamed component
  const [allEvents, setAllEvents] = useState<Event[]>([]); // State to hold all events
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllEvents(); // Changed function name
  }, []);

  const fetchAllEvents = async () => { // Changed function name
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        // Removed the filter .eq("is_upcoming", false)
        .order("date", { ascending: false }); // Keep ordering, newest first overall

      if (error) throw error;
      setAllEvents(data || []);
    } catch (error) {
      console.error("Error fetching all events:", error); // Updated error message
    } finally {
      setLoading(false);
    }
  };

  // Separate events into upcoming and past
  const { upcomingEvents, pastEvents } = useMemo(() => {
    const upcoming = allEvents
        .filter(event => event.is_upcoming)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort upcoming ascending by date
    const past = allEvents
        .filter(event => !event.is_upcoming); // Already sorted descending by date
    return { upcomingEvents: upcoming, pastEvents: past };
  }, [allEvents]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-slate-900 dark:via-purple-950 dark:to-slate-900 p-4 md:p-8 pt-24"> {/* Adjusted background */}
      <div className="container pt-8 mx-auto space-y-12">
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
                    // Format date more clearly for upcoming
                    date={new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    time={formatTime(event.time)}
                    location={event.location}
                    description={event.description}
                    type="Upcoming"
                    image={event.image_url}
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
                {pastEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    title={event.title}
                    date={new Date(event.date).toLocaleDateString()} // Simpler date format for past
                    time={formatTime(event.time)}
                    location={event.location}
                    description={event.description}
                    type="Past Event"
                    image={event.image_url}
                  />
                ))}
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