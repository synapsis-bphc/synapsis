// src/components/EventCard.tsx
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin } from "lucide-react";

interface EventCardProps {
  title: string;
  date: string;
  time?: string;
  location: string;
  description?: string;
  type: string;
  image?: string;
}

export function EventCard({ title, date, time, location, description, type, image }: EventCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
      {image && (
        <div className="relative h-48 w-full">
          <img 
            src={image} 
            alt={`Image for ${title}`} 
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.src = '/favicon.png'; }} // Fallback to Synapsis logo
          />
        </div>
      )}
      <CardHeader>
        <Badge variant="secondary" className="w-fit">{type}</Badge>
        <CardTitle className="pt-2">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-muted-foreground line-clamp-3">{description}</p>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-2 text-sm text-muted-foreground border-t pt-4">
        <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{date}</span>
        </div>
        {time && (
            <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                <span>{time}</span>
            </div>
        )}
        <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2" />
            <span>{location}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
