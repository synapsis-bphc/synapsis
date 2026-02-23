
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DatabaseMemberCard } from "@/components/DatabaseMemberCard";
import { DatabaseMemberCardSkeleton } from "@/components/DatabaseMemberCardSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Member {
  id: string;
  name: string;
  position: string;
  year: number;
  photo_url?: string;
  linkedin_url?: string;
  instagram_url?: string;
  member_id?: string;
  is_current: boolean;
}

const POSITIONS = [
  "Head of Department",
  "Faculty in charge",
  "President",
  "Vice-President",
  "Secretary",
  "Joint Secretary",
  "Treasurer",
  "Informatics lead",
  "Events head",
  "Tech Head",
  "Core Team",
  "Design Team",
  "Editorial Team",
  "Event Management",
  "ME/PhD Representatives (Editorial)",
  "PhD Representative (Graphic Designing)",
];

const INITIAL_YEARS = 2;
const BATCH_YEARS = 2;

export default function AllMembers() {
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPosition, setSelectedPosition] = useState<string>("all");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [visibleYears, setVisibleYears] = useState(INITIAL_YEARS);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchAllMembers();

    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fetchAllMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .order("year", { ascending: false });

      if (error) throw error;

      // Remove duplicates only based on member_id (same person with multiple entries)
      const uniqueMembers =
        data?.reduce((acc: Member[], current) => {
          const existingIndex = acc.findIndex(
            (member) =>
              member.member_id &&
              current.member_id &&
              member.member_id === current.member_id
          );

          if (existingIndex === -1) {
            acc.push(current);
          } else {
            // Keep the entry with more complete information
            if (
              current.position &&
              (!acc[existingIndex].position ||
                current.position.length > acc[existingIndex].position.length)
            ) {
              acc[existingIndex] = current;
            }
          }
          return acc;
        }, []) || [];

      setAllMembers(uniqueMembers);
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers =
    selectedPosition === "all"
      ? allMembers
      : allMembers.filter((member) => member.position === selectedPosition);

  const sortedYearEntries = Object.entries(
    filteredMembers.reduce((acc, member) => {
      if (!acc[member.year]) acc[member.year] = [];
      acc[member.year].push(member);
      return acc;
    }, {} as Record<number, Member[]>)
  ).sort(([a], [b]) => Number(b) - Number(a));

  // Reset visible count when filter changes so all matches are reachable
  useEffect(() => {
    setVisibleYears(INITIAL_YEARS);
  }, [selectedPosition]);

  // IntersectionObserver to load more year groups
  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting) {
        setVisibleYears((prev) => Math.min(prev + BATCH_YEARS, sortedYearEntries.length));
      }
    },
    [sortedYearEntries.length]
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || loading) return;
    const observer = new IntersectionObserver(handleIntersect, { rootMargin: "200px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleIntersect, loading]);

  const visibleEntries = sortedYearEntries.slice(0, visibleYears);
  const hasMoreYears = visibleYears < sortedYearEntries.length;

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pt-24 px-0 sm:px-8 py-8">
      <div className="container mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            All Members
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Complete directory of all Synapsis Bioinformatics Club members
          </p>
        </div>

        {/* Position Filter Tabs */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Filter by Position
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedPosition} onValueChange={setSelectedPosition}>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedPosition("all")}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedPosition === "all"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                  }`}
                >
                  All
                </button>
                {POSITIONS.map((position) => (
                  <button
                    key={position}
                    onClick={() => setSelectedPosition(position)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                      selectedPosition === position
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                    }`}
                  >
                    {position}
                  </button>
                ))}
              </div>
            </Tabs>
          </CardContent>
        </Card>

        {/* Members by Year */}
        {loading ? (
          <div className="space-y-8">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <div className="w-32 h-6 bg-gray-200 rounded-md"></div>
                  <Badge variant="outline"><div className="w-20 h-4 bg-gray-200 rounded-md"></div></Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <DatabaseMemberCardSkeleton key={index} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-8">
            {visibleEntries.map(([year, members]) => (
              <Card key={year} className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Academic Year {year}
                    <Badge variant="outline">{(members as Member[]).length} members</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {(members as Member[]).map((member) => (
                      <DatabaseMemberCard
                        key={member.id}
                        name={member.name}
                        position={member.position}
                        year={member.year}
                        photoUrl={member.photo_url}
                        linkedinUrl={member.linkedin_url}
                        instagramUrl={member.instagram_url}
                        isCurrent={member.is_current}
                        memberId={member.member_id}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            {/* Sentinel for lazy loading more year groups */}
            <div ref={sentinelRef} className="h-4" />
            {hasMoreYears && (
              <div className="flex justify-center py-4">
                <div className="flex gap-2 items-center text-gray-400 text-sm">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  Loading more…
                </div>
              </div>
            )}
          </div>
        )}

        {filteredMembers.length === 0 && !loading && (
          <Card className="shadow-lg">
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600">
                No members found
              </h3>
              <p className="text-gray-500">
                {selectedPosition === "all"
                  ? "No members data available yet."
                  : `No ${selectedPosition} members found.`}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      {showBackToTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 rounded-full h-12 w-12"
          size="icon"
        >
          <ArrowUp className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}
