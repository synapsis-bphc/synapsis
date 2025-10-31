// src/components/EventCard.tsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Ticket, Building } from "lucide-react"; // Added Ticket and Building
import { cn } from "@/lib/utils";

interface EventCardProps {
  title: string;
  date: string;
  time?: string;
  location: string;
  description?: string;
  type: string;
  image?: string;
  swd_link?: string; // ADDED
  unifest_link?: string; // ADDED
}

const DESCRIPTION_TRUNCATE_LENGTH = 150; // Adjust as needed

export function EventCard({ title, date, time, location, description, type, image, swd_link, unifest_link }: EventCardProps) {
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const isLongDescription = description && description.length > DESCRIPTION_TRUNCATE_LENGTH;
  const imageSrc = image || '/favicon.png'; // Determine image source once
  const hasSpecificImage = !!image; // Check if a specific image URL was provided
  const showRegistration = type === "Upcoming" && (!!swd_link || !!unifest_link);

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300 ease-in-out",
      "bg-white/80 dark:bg-slate-800/70 backdrop-blur-md",
      "border border-white/30 dark:border-slate-700/60",
      "rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1",
      "flex flex-col md:flex-row h-full"
    )}>
      {/* --- Image Column --- */}
      <div className={cn(
          "w-full md:w-1/3 lg:w-2/5 flex-shrink-0 relative",
          "aspect-[9/16] md:aspect-auto",
          "overflow-hidden",
          "md:rounded-l-2xl md:rounded-r-none rounded-t-2xl",
          !hasSpecificImage && "bg-gray-100 dark:bg-gray-800"
      )}>
        {hasSpecificImage && (
          <img
            src={imageSrc}
            alt=""
            aria-hidden="true"
            className={cn(
                "absolute inset-0 w-full h-full object-cover blur-sm scale-105",
                "opacity-40 dark:opacity-25",
                "pointer-events-none"
            )}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}
        <img
          src={imageSrc}
          alt={`Poster for ${title}`}
          className={cn(
              "absolute inset-0 w-full h-full object-contain z-10",
          )}
          onError={(e) => { e.currentTarget.src = '/favicon.png'; }}
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
                !isDescExpanded && isLongDescription ? "line-clamp-4" : ""
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
          
          {/* UPDATED REGISTRATION BUTTONS */}
          {showRegistration && (
            // Use flex-wrap to allow buttons to stack on narrow screens
            <div className="w-full flex flex-row flex-wrap gap-2 mt-2">
              {swd_link && (
                // flex-1 allows buttons to grow, min-w-fit prevents shrinking too small
                <Button asChild className="flex-1 min-w-fit">
                  <a href={swd_link} target="_blank" rel="noopener noreferrer">
                    <Building className="h-4 w-4 mr-2" />
                    Register (Bitsian)
                  </a>
                </Button>
              )}
              {unifest_link && (
                // flex-1 allows buttons to grow, min-w-fit prevents shrinking too small
                <Button asChild className="flex-1 min-w-fit" variant={swd_link ? "secondary" : "default"}>
                  <a href={unifest_link} target="_blank" rel="noopener noreferrer">
                    <Ticket className="h-4 w-4 mr-2" />
                    Register (External)
                  </a>
                </Button>
              )}
            </div>
          )}
        </CardFooter>
      </div>
    </Card>
  );
}

