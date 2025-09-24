// src/components/FeaturedSeminarCard.tsx
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

interface FeaturedSeminarCardProps {
  topic: string;
  speakerName: string;
  speakerTitle: string;
  speakerPhotoUrl?: string;
  speakerProfileUrl?: string;
  description: string;
  date: string;
  time: string;
  venue: string;
}

const ExternalLinkIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M10 6v2H5v11h11v-5h2v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6zm11-3v8h-2V6.41l-7.79 7.8-1.42-1.42L17.59 5H13V3h8z"/></svg>
);

const DESCRIPTION_TRUNCATE_LENGTH = 200;

export function FeaturedSeminarCard({
  topic,
  speakerName,
  speakerTitle,
  speakerPhotoUrl,
  speakerProfileUrl,
  description,
  date,
  time,
  venue,
}: FeaturedSeminarCardProps) {
  
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const isLongDescription = description.length > DESCRIPTION_TRUNCATE_LENGTH;

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="bg-white rounded-2xl shadow-lg w-full overflow-hidden border border-gray-200 transition-all duration-300 ease-in-out flex flex-col md:flex-row hover:shadow-xl hover:-translate-y-1">
      {/* Image Section */}
      <div className="w-full md:w-1/3 flex-shrink-0">
          <div className="relative h-64 md:h-full w-full">
            <img 
              src={speakerPhotoUrl || `https://placehold.co/400x600/e2e8f0/2d3748?text=Speaker`} 
              alt={`Photo of ${speakerName}`} 
              className="absolute h-full w-full object-cover"
              onError={(e) => { e.currentTarget.src = `https://placehold.co/400x600/e2e8f0/2d3748?text=Speaker`; }}
            />
          </div>
        </div>
      
      {/* Content Section */}
      <div className="p-8 flex flex-col flex-grow">
        <h2 className="text-4xl font-bold text-gray-800 leading-tight mb-4" dangerouslySetInnerHTML={{ __html: topic.replace(/\n/g, '<br />') }}></h2>
        
        <div className="flex items-center gap-4 mb-5">
          <div>
              <h3 className="text-lg font-semibold text-gray-800">{speakerName}</h3>
              <p className="text-sm text-gray-500">{speakerTitle}</p>
          </div>
          {speakerProfileUrl && (
              <a href={speakerProfileUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-500 transition-colors" aria-label="View speaker profile">
                <ExternalLinkIcon />
              </a>
            )}
        </div>
        
        <div className="flex-grow">
          <p className={cn(
              "text-base text-gray-600 leading-relaxed mb-4 transition-all duration-300",
              !isDescExpanded && isLongDescription ? "line-clamp-4" : ""
            )}>
            {description}
          </p>
          {isLongDescription && (
            <Button 
              variant="link" 
              className="p-0 h-auto text-blue-600 hover:text-blue-800"
              onClick={() => setIsDescExpanded(!isDescExpanded)}
            >
              {isDescExpanded ? "Show Less" : "Read More"}
            </Button>
          )}
        </div>
        
        <div className="border-t border-gray-200 pt-5 mt-5">
          <p className="text-sm text-gray-600 mb-2"><strong>Date:</strong> {formattedDate}</p>
          <p className="text-sm text-gray-600 mb-2"><strong>Time:</strong> {time}</p>
          <p className="text-sm text-gray-600"><strong>Venue:</strong> {venue}</p>
        </div>
      </div>
    </div>
  );
}
