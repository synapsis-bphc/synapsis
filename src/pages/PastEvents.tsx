
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EventCard } from "@/components/EventCard";
import { EventCardSkeleton } from "@/components/EventCardSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  location: string;
  image_url?: string;
}

export default function PastEvents() {
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPastEvents();
  }, []);

  const fetchPastEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("is_upcoming", true)
        .order("date", { ascending: false });

      if (error) throw error;
      setPastEvents(data || []);
    } catch (error) {
      console.error("Error fetching past events:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 p-8 pt-24">
      <div className="container mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Past Events
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Relive the memorable moments from Synapsis Club's past events
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <EventCardSkeleton key={index} />
            ))}
          </div>
        ) : pastEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastEvents.map((event) => (
              <EventCard
                key={event.id}
                title={event.title}
                date={new Date(event.date).toLocaleDateString()}
                time={event.time}
                location={event.location}
                description={event.description}
                type="Past Event"
                image={event.image_url || "photo-1511795409834-ef04bbd61622"}
              />
            ))}
          </div>
        ) : (
          <Card className="shadow-lg">
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600">No past events found</h3>
              <p className="text-gray-500">Past events will appear here once they are added.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
