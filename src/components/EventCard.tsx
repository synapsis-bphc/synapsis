// src/components/EventCard.tsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventCardProps {
  title: string;
  date: string;
  time?: string;
  location: string;
  description?: string;
  type: string;
  image?: string; // This is the prop passed in
}

const DESCRIPTION_TRUNCATE_LENGTH = 150; // Adjust as needed

export function EventCard({ title, date, time, location, description, type, image }: EventCardProps) {
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const isLongDescription = description && description.length > DESCRIPTION_TRUNCATE_LENGTH;
  const imageSrc = image || '/favicon.png'; // Use original prop 'image' to check for default
  const hasSpecificImage = !!image; // Check if a specific image URL was provided

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300 ease-in-out",
      // Reduced glassiness: Increased opacity, slightly reduced blur
      "bg-white/80 dark:bg-slate-800/70 backdrop-blur-md",
      "border border-white/30 dark:border-slate-700/60", // Slightly more visible border
      "rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1",
      "flex flex-col md:flex-row h-full" // Flex layout for columns
    )}>
      {/* --- Image Column --- */}
      <div className={cn(
          "w-full md:w-1/3 lg:w-2/5 flex-shrink-0 relative",
          // Reverted to aspect ratio for mobile, auto for desktop
          "aspect-[9/16] md:aspect-auto",
          "overflow-hidden", // Needed for blurred background effect
          "md:rounded-l-2xl md:rounded-r-none rounded-t-2xl", // Adjust rounding
          // Add a simple background only if there's no specific image
          !hasSpecificImage && "bg-gray-100 dark:bg-gray-800"
      )}>
        {/* Blurred Background Image - Conditionally Rendered */}
        {hasSpecificImage && (
          <img
            src={imageSrc}
            alt="" // Decorative
            aria-hidden="true"
            className={cn(
                "absolute inset-0 w-full h-full object-cover blur-sm scale-105", // Reduced blur, slight zoom
                "opacity-40 dark:opacity-25", // Reduced opacity
                "pointer-events-none" // Ignore pointer events
            )}
            onError={(e) => { e.currentTarget.style.display = 'none'; }} // Hide if error
          />
        )}
        {/* Foreground Image */}
        <img
          src={imageSrc} // Use imageSrc which includes the fallback
          alt={`Poster for ${title}`}
          className={cn(
              "absolute inset-0 w-full h-full object-contain z-10", // Contain sits on top
          )}
          onError={(e) => { e.currentTarget.src = '/favicon.png'; }} // Fallback on error still needed here
        />
      </div>

      {/* --- Content Column --- */}
      <div className="flex flex-col flex-grow p-6 md:w-2/3 lg:w-3/5">
        <CardHeader className="p-0 mb-4">
          <Badge variant="secondary" className="w-fit mb-2">{type}</Badge>
          <CardTitle className="text-xl md:text-2xl font-bold">{title}</CardTitle>
        </CardHeader>

        <CardContent className="p-0 flex-grow mb-4">
          {description && (
            <>
              <p className={cn(
                "text-muted-foreground text-sm transition-all duration-300",
                !isDescExpanded && isLongDescription ? "line-clamp-4" : "" // Use line-clamp
              )}>
                {description}
              </p>
              {isLongDescription && (
                <Button
                  variant="link"
                  className="p-0 h-auto text-blue-600 hover:text-blue-800 text-sm mt-1"
                  onClick={() => setIsDescExpanded(!isDescExpanded)}
                >
                  {isDescExpanded ? "Show Less" : "Read More"}
                </Button>
              )}
            </>
          )}
        </CardContent>

        <CardFooter className="p-0 mt-auto flex flex-col items-start gap-2 text-sm text-muted-foreground border-t border-border/50 pt-4">
          <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>{date}</span>
          </div>
          {time && (
              <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>{time}</span>
              </div>
          )}
          <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>{location}</span>
          </div>
        </CardFooter>
      </div>
    </Card>
  );
}