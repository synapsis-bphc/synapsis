// src/pages/Opportunities.tsx
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { OpportunityCard } from "@/components/OpportunityCard";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Briefcase, Search, X } from "lucide-react";

interface PublicProject {
  id: string;
  title: string;
  description?: string;
  contact_person: string;
  contact_profile_url?: string;
  prerequisites?: string;
  opportunity_type: string;
  expected_team_size?: number;
  application_deadline?: string;
  chamber_number?: string;
  available_date?: string;
  available_time?: string;
}

export default function Opportunities() {
  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("opportunities")
          .select("*")
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        setProjects(data || []);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const projectTypes = useMemo(() => {
    const types = new Set(projects.map(p => p.opportunity_type));
    return ["all", ...Array.from(types)];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = 
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        p.contact_person.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = selectedType === "all" || p.opportunity_type === selectedType;

      return matchesSearch && matchesType;
    });
  }, [projects, searchTerm, selectedType]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedType("all");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 pt-32">
        <div className="container mx-auto text-center">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-32 p-4 md:p-8">
       <div 
        className="absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"
      ></div>
      <div className="container mx-auto space-y-12 mt-24">
        <div className="text-center space-y-4 ">
          <h1 className="text-5xl pb-2 font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
            Projects
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore research projects, internships, and other opportunities from the Synapsis community.
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="flex flex-col md:flex-row gap-4 w-full max-w-3xl mx-auto items-end">
            <div className="relative flex-grow w-full">
              <Label htmlFor="search" className="font-semibold">Search Projects</Label>
              <Search className="absolute left-3 bottom-3 h-5 w-5 text-gray-400" />
              <Input
                id="search"
                type="text"
                placeholder="Search by title, description, or contact..."
                className="pl-10 h-12 text-base mt-2 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex-shrink-0 w-full md:w-auto">
              <Label htmlFor="type-filter" className="font-semibold">Filter by Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger id="type-filter" className="h-12 text-base mt-2 w-full md:w-[200px]">
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  {projectTypes.map(type => (
                    <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
             <Button variant="ghost" onClick={clearFilters} className="text-sm h-12 flex-shrink-0">
                <X className="h-4 w-4 mr-2"/>
                Clear
            </Button>
        </div>

        {/* Projects Grid */}
        <div>
          {filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProjects.map((project) => (
                <OpportunityCard
                  key={project.id}
                  title={project.title}
                  description={project.description}
                  contactPerson={project.contact_person}
                  contactProfileUrl={project.contact_profile_url}
                  prerequisites={project.prerequisites}
                  opportunityType={project.opportunity_type}
                  teamSize={project.expected_team_size}
                  deadline={project.application_deadline}
                  chamberNumber={project.chamber_number}
                  available_date={project.available_date}
                  available_time={project.available_time}
                />
              ))}
            </div>
          ) : (
            <Card className="shadow-lg">
              <CardContent className="text-center py-16">
                <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600">No Projects Found</h3>
                <p className="text-gray-500">
                  Your search and filter combination did not match any projects.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
