// src/components/SeminarCard.tsx
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

interface SeminarCardProps {
  topic: string;
  speakerName: string;
  speakerTitle: string;
  speakerPhotoUrl?: string;
  speakerProfileUrl?: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  isUpcoming: boolean;
}

const ExternalLinkIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M10 6v2H5v11h11v-5h2v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6zm11-3v8h-2V6.41l-7.79 7.8-1.42-1.42L17.59 5H13V3h8z"/></svg>
);

const DESCRIPTION_TRUNCATE_LENGTH = 150;
const TITLE_TRUNCATE_LENGTH = 70; // Heuristic length to decide if a title is "long"

export function SeminarCard({
  topic,
  speakerName,
  speakerTitle,
  speakerPhotoUrl,
  speakerProfileUrl,
  description,
  date,
  time,
  venue,
  isUpcoming,
}: SeminarCardProps) {
  
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isTitleExpanded, setIsTitleExpanded] = useState(false);
  
  const isLongDescription = description.length > DESCRIPTION_TRUNCATE_LENGTH;
  const isLongTitle = topic.length > TITLE_TRUNCATE_LENGTH;

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div
      className={cn(
        "bg-white rounded-2xl shadow-lg w-full max-w-md p-8 relative overflow-hidden border border-gray-200 transition-all duration-300 ease-in-out flex flex-col",
        isUpcoming ? "hover:-translate-y-1 hover:shadow-xl" : "scale-95 opacity-90 hover:scale-[0.97] hover:opacity-100"
      )}
    >
      <h2 
        className={cn(
          "text-4xl font-bold text-gray-800 leading-tight mb-6 cursor-pointer",
          !isTitleExpanded && isLongTitle && "h-32 line-clamp-3"
        )}
        onClick={() => isLongTitle && setIsTitleExpanded(!isTitleExpanded)}
        dangerouslySetInnerHTML={{ __html: topic.replace(/\n/g, '<br />') }}
      ></h2>
      
      <div className="flex items-center gap-4 mb-5">
        <img 
          src={speakerPhotoUrl || `https://placehold.co/150x150/e2e8f0/2d3748?text=${speakerName.charAt(0)}`} 
          alt={`Photo of ${speakerName}`} 
          className="w-16 h-16 rounded-xl object-cover border-2 border-gray-200"
          onError={(e) => { e.currentTarget.src = `https://placehold.co/150x150/e2e8f0/2d3748?text=${speakerName.charAt(0)}`; }}
        />
        <div className="flex justify-between items-start w-full">
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
      </div>
      
      <div className="flex-grow">
        <p className={cn(
            "text-base text-gray-600 leading-relaxed mb-4 transition-all duration-300",
            !isDescExpanded && isLongDescription ? "line-clamp-3" : ""
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
  );
}
