// src/pages/Resources.tsx
import { useEffect, useState } from "react";
import { ResourceCard } from "@/components/ResourceCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FolderSearch } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { Session } from "@supabase/supabase-js";

type UserResource = Tables<"user_resources">;

const Resources = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [resources, setResources] = useState<UserResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      setError(null);

      const [{ data: sessionData }, { data, error }] = await Promise.all([
        supabase.auth.getSession(),
        supabase
          .from("user_resources")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

      setSession(sessionData.session ?? null);

      if (error) {
        setError("Failed to load resources. Please try again later.");
      } else {
        setResources(data || []);
      }
      setLoading(false);
    };

    fetchResources();
  }, []);

  const filteredResources = resources.filter((res) =>
    res.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (res.owner_name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-muted/10 flex flex-col">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 flex-grow w-full">
        
        {/* Minimalist Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6 border-b pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FolderSearch className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Study Resources
              </h1>
            </div>
            <p className="text-muted-foreground max-w-xl">
              Access course materials, notes, and past papers directly from the drive.
            </p>
          </div>
          
          {/* Search Bar */}
          <div className="w-full md:w-auto flex flex-col gap-3 md:items-end">
            <div className="w-full md:w-auto relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Filter by name or author..." 
                className="pl-9 w-full md:w-[260px] bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              className="self-start md:self-end"
              onClick={() => navigate("/resources/add")}
            >
              Add your resource
            </Button>
          </div>
        </div>

      {/* Grid Section */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-3">
          <p className="text-lg font-medium">Loading resources...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-3">
          <p className="text-lg font-medium">{error}</p>
        </div>
      ) : filteredResources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((res) => (
            <ResourceCard
              key={res.id}
              title={res.title}
              description={res.description || undefined}
              link={res.link}
              author={res.owner_name}
              year={res.year}
              semester="" // not collected from user, so leave blank
              canDelete={!!session && session.user.id === res.user_id}
              onDelete={async () => {
                // extra safety: only allow if current user owns this row
                if (!session || session.user.id !== res.user_id) return;
                const confirmed = window.confirm("Are you sure you want to delete this resource?");
                if (!confirmed) return;
                const { error: deleteError } = await supabase
                  .from("user_resources")
                  .delete()
                  .eq("id", res.id)
                  .eq("user_id", session.user.id);
                if (!deleteError) {
                  setResources((prev) => prev.filter((r) => r.id !== res.id));
                } else {
                  // optional: setError or alert
                  alert("Failed to delete resource. Please try again.");
                }
              }}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-3">
          <FolderSearch className="h-10 w-10 opacity-20" />
          <p className="text-lg font-medium">No resources found</p>
          <Button variant="link" onClick={() => setSearchTerm("")}>Clear Filters</Button>
        </div>
      )}
      </div>

      {/* Footer */}
      {/* <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border/40 bg-background/50">
        <p>Made by Ranjit Choudhary</p>
      </footer> */}
    </div>
  );
};

export default Resources;