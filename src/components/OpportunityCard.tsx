// src/components/OpportunityCard.tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Users, Calendar, User, Clock, Hash, ExternalLink, Tag, ListChecks } from "lucide-react";

interface OpportunityCardProps {
  title: string;
  description?: string;
  contactPerson: string;
  contactProfileUrl?: string;
  prerequisites?: string;
  opportunityType: string;
  teamSize?: number;
  deadline?: string;
  chamberNumber?: string;
  available_date?: string;
  available_time?: string;
}

const TITLE_TRUNCATE_LENGTH = 50;
const DESC_TRUNCATE_LENGTH = 120;
const PREREQ_TRUNCATE_LENGTH = 80;


export function OpportunityCard({
  title,
  description,
  contactPerson,
  contactProfileUrl,
  prerequisites,
  opportunityType,
  teamSize,
  deadline,
  chamberNumber,
  available_date,
  available_time,
}: OpportunityCardProps) {
  const [isTitleExpanded, setIsTitleExpanded] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isPrereqExpanded, setIsPrereqExpanded] = useState(false);


  const isLongTitle = title.length > TITLE_TRUNCATE_LENGTH;
  const isLongDesc = description && description.length > DESC_TRUNCATE_LENGTH;
  const isLongPrereq = prerequisites && prerequisites.length > PREREQ_TRUNCATE_LENGTH;


  const formattedDeadline = deadline ? new Date(deadline).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  }) : 'N/A';

  return (
    <Card className="flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1 min-h-[420px]">
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <CardTitle
            className={cn(
              "text-2xl font-bold leading-tight cursor-pointer",
              !isTitleExpanded && isLongTitle && "line-clamp-2"
            )}
            onClick={() => isLongTitle && setIsTitleExpanded(!isTitleExpanded)}
          >
            {title}
          </CardTitle>
        </div>
        <div className="flex items-center text-sm text-muted-foreground pt-2">
          <User className="h-4 w-4 mr-2" />
          <span>Posted by {contactPerson}</span>
          {contactProfileUrl && (
            <a href={contactProfileUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-500 hover:underline">
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow">
        <div className="flex-grow">
          {description && (
            <>
              <p className={cn(
                "text-muted-foreground mb-4",
                !isDescExpanded && isLongDesc && "line-clamp-3"
              )}>
                {description}
              </p>
              {isLongDesc && (
                <Button
                  variant="link"
                  className="p-0 h-auto text-blue-600 hover:text-blue-800"
                  onClick={() => setIsDescExpanded(!isDescExpanded)}
                >
                  {isDescExpanded ? "Show Less" : "Read More"}
                </Button>
              )}
            </>
          )}
          {prerequisites && (
            <div className="mt-4">
              <h4 className="font-semibold text-sm flex items-center gap-2 mb-2"><ListChecks className="h-4 w-4" /> Prerequisites</h4>
              <p className={cn(
                "text-muted-foreground mb-4 text-sm",
                !isPrereqExpanded && isLongPrereq && "line-clamp-2"
              )}>
                {prerequisites}
              </p>
              {isLongPrereq && (
                <Button
                  variant="link"
                  className="p-0 h-auto text-blue-600 hover:text-blue-800 text-sm"
                  onClick={() => setIsPrereqExpanded(!isPrereqExpanded)}
                >
                  {isPrereqExpanded ? "Show Less" : "Read More"}
                </Button>
              )}
            </div>
          )}
        </div>
        <div className="border-t pt-4 mt-auto space-y-3 text-sm">
          <div className="flex items-center text-muted-foreground">
              <Tag className="h-4 w-4 mr-2" />
              <Badge
                variant="secondary"
                className="whitespace-nowrap flex-shrink-0 px-3 py-1 text-sm"
              >
                {opportunityType}
              </Badge>
          </div>
          {teamSize && (
            <div className="flex items-center text-muted-foreground">
              <Users className="h-4 w-4 mr-2" />
              <span>Team Size: {teamSize}</span>
            </div>
          )}
          {deadline && (
            <div className="flex items-center text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2" />
              <span>Deadline: {formattedDeadline}</span>
            </div>
          )}
          {chamberNumber && (
            <div className="flex items-center text-muted-foreground">
              <Hash className="h-4 w-4 mr-2" />
              <span>Chamber: {chamberNumber}</span>
            </div>
          )}
          {available_date && available_time && (
            <div className="flex items-center text-muted-foreground">
              <Clock className="h-4 w-4 mr-2" />
              <span>Available: {available_date}, {available_time}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}