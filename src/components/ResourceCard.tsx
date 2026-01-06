// src/components/ResourceCard.tsx
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Folder, FolderOpen, Calendar, User, Trash2 } from "lucide-react";
import { useState } from "react";

interface ResourceProps {
  title: string;
  description?: string;
  link: string;
  author: string;
  year: string;
  semester?: string;
  canDelete?: boolean;
  onDelete?: () => void;
}

export function ResourceCard({
  title,
  description,
  link,
  author,
  year,
  semester,
  canDelete = false,
  onDelete,
}: ResourceProps) {
  // State now tracks hovering of the BUTTON only, not the card
  const [isButtonHovered, setIsButtonHovered] = useState(false);

  return (
    <Card className="relative flex flex-col h-full border border-border/60 shadow-sm bg-card transition-shadow duration-300">
      
      {/* Static Folder Tab Accent (No longer grows on card hover) */}
      <div className={`absolute top-0 left-0 w-full h-1 bg-primary/80 rounded-t-xl transition-all duration-300 ${isButtonHovered ? 'h-1.5' : 'h-1'}`} />

      <CardHeader className="pb-2 pt-6">
        <div className="flex items-start gap-4">
          {/* Icon reacts only when button is hovered */}
          <div className={`p-3 rounded-lg transition-colors duration-300 ${isButtonHovered ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
            {isButtonHovered ? <FolderOpen className="w-6 h-6" /> : <Folder className="w-6 h-6" />}
          </div>
          <div className="space-y-1">
            <CardTitle className={`text-lg font-semibold leading-tight transition-colors ${isButtonHovered ? 'text-primary' : ''}`}>
              {title}
            </CardTitle>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {year}
                {semester ? ` • ${semester}` : null}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow pb-4">
        {description && (
          <p className="text-sm text-muted-foreground/90 leading-relaxed line-clamp-3">
            {description}
          </p>
        )}
      </CardContent>

      <CardFooter className="pt-0 pb-4 px-6 flex items-center justify-between border-t border-border/40 bg-muted/5 mt-auto h-14">
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <User className="w-3.5 h-3.5 opacity-70" />
          <span className="font-medium truncate max-w-[120px]">{author}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {canDelete && onDelete && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
              onClick={onDelete}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
          {/* Hover Logic Moved Directly to Button */}
          <Button 
            size="sm" 
            variant="outline"
            className={`h-8 gap-1.5 text-xs font-medium transition-colors ${isButtonHovered ? 'bg-primary text-primary-foreground border-primary' : ''}`}
            onMouseEnter={() => setIsButtonHovered(true)}
            onMouseLeave={() => setIsButtonHovered(false)}
            onClick={() => window.open(link, '_blank')}
          >
            Open Folder
            <ExternalLink className="w-3 h-3" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}