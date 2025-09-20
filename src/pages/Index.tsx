// src/pages/Index.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DatabaseMemberCard } from "@/components/DatabaseMemberCard";
import { EventCard } from "@/components/EventCard";
import { FeaturedSeminarCard } from "@/components/FeaturedSeminarCard";
import { OpportunityCard } from "@/components/OpportunityCard";
import {
  Instagram,
  Users,
  Calendar,
  Dna,
  Microscope,
  Brain,
  ChevronDown,
  ChevronUp,
  CameraOff,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

const CurrentMembersDisplay = ({ members }: { members: any[] }) => {
  const [showAll, setShowAll] = useState(false);
  const positionsOrder = [
    "Head of Department", "Faculty in charge", "President", "Vice-President", "Secretary", "Joint Secretary", "Treasurer", "Informatics lead", "Events head", "Tech Head", "Core Team", "Design Team", "Editorial Team", "Event Management", "ME/PhD Representatives (Editorial)", "PhD Representative (Graphic Designing)",
  ];
  const sortedMembers = [...members].sort((a, b) => {
    const aIndex = positionsOrder.indexOf(a.position);
    const bIndex = positionsOrder.indexOf(b.position);
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });
  const firstRow = sortedMembers.slice(0, 4);
  const remainingMembers = sortedMembers.slice(4);
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {firstRow.map((member) => (
          <DatabaseMemberCard key={member.id} name={member.name} position={member.position} year={member.year} photoUrl={member.photo_url} linkedinUrl={member.linkedin_url} bio={member.bio} isCurrent={true} memberId={member.member_id} instagramUrl={member.instagram_url} />
        ))}
      </div>
      {remainingMembers.length > 0 && (
        <>
          {showAll && (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {remainingMembers.map((member) => (
                <DatabaseMemberCard 
                  key={member.id} 
                  name={member.name} 
                  position={member.position} 
                  year={member.year} 
                  photoUrl={member.photo_url} 
                  linkedinUrl={member.linkedin_url} 
                  bio={member.bio} 
                  isCurrent={true} 
                  memberId={member.member_id} 
                  instagramUrl={member.instagram_url}
                />
              ))}
            </div>
          )}
          <div className="text-center">
            <Button variant="outline" onClick={() => setShowAll(!showAll)} className="flex items-center gap-2 mx-auto">
              {showAll ? (<>Show Less <ChevronUp className="h-4 w-4" /></>) : (<>Show All Members  <ChevronDown className="h-4 w-4" /></>)}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};


const Index = () => {
  const [currentDatabaseMembers, setCurrentDatabaseMembers] = useState<any[]>([]);
  const [upcomingDatabaseLectures, setUpcomingDatabaseLectures] = useState<any[]>([]);
  const [upcomingDatabaseEvents, setUpcomingDatabaseEvents] = useState<any[]>([]);
  const [galleryDatabaseItems, setGalleryDatabaseItems] = useState<any[]>([]);
  const [recentOpportunities, setRecentOpportunities] = useState<any[]>([]);

  useEffect(() => {
    const fetchDatabaseData = async () => {
      const CACHE_KEY = 'homePageData';

      try {
        const { data: metaData, error: metaError } = await supabase
          .from('metadata')
          .select('last_updated')
          .single();

        if (metaError) throw metaError;
        const serverLastUpdated = new Date(metaData.last_updated).getTime();

        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
          const { timestamp, data } = JSON.parse(cachedData);
          
          if (timestamp >= serverLastUpdated) {
            setCurrentDatabaseMembers(data.currentDatabaseMembers || []);
            setUpcomingDatabaseLectures(data.upcomingDatabaseLectures || []);
            setUpcomingDatabaseEvents(data.upcomingDatabaseEvents || []);
            setGalleryDatabaseItems(data.galleryDatabaseItems || []);
            setRecentOpportunities(data.recentOpportunities || []);
            return;
          }
        }
      } catch (error) {
        console.error("Error checking cache or metadata:", error);
      }
      
      try {
        const today = new Date().toISOString().split("T")[0];

        const [
          membersResponse,
          lecturesResponse,
          eventsResponse,
          galleryResponse,
          opportunitiesResponse
        ] = await Promise.all([
          supabase.from("members").select("id, name, position, year, photo_url, linkedin_url, bio, member_id, instagram_url").eq("is_current", true),
          supabase.from("lectures").select("id, topic, speaker, speaker_title, speaker_photo_url, speaker_profile_url, date, time, location, description, type, image_url").gte("date", today).eq("is_upcoming", true).order("date"),
          supabase.from("events").select("id, title, date, time, location, description, image_url").gte("date", today).eq("is_upcoming", true).order("date"),
          supabase.from("gallery").select("id, image_url, title").order("created_at", { ascending: false }).limit(6),
          supabase.from("opportunities").select("id, title, description, contact_person, contact_profile_url, prerequisites, opportunity_type, expected_team_size, application_deadline, chamber_number, available_date, available_time").eq("is_active", true).order("created_at", { ascending: false }).limit(3)
        ]);

        let filteredMembers: any[] = [];
        if (membersResponse.data) {
            const highestYear = membersResponse.data.reduce((max, member) => (member.year > max ? member.year : max), 0) || new Date().getFullYear();
            filteredMembers = membersResponse.data.filter((member) => member.year === highestYear);
            setCurrentDatabaseMembers(filteredMembers);
        }

        const lecturesData = lecturesResponse.data || [];
        const eventsData = eventsResponse.data || [];
        const galleryData = galleryResponse.data || [];
        const opportunitiesData = opportunitiesResponse.data || [];

        setUpcomingDatabaseLectures(lecturesData);
        setUpcomingDatabaseEvents(eventsData);
        setGalleryDatabaseItems(galleryData);
        setRecentOpportunities(opportunitiesData);

        try {
            const { data: metaData } = await supabase.from('metadata').select('last_updated').single();
            const serverLastUpdated = new Date(metaData!.last_updated).getTime();

            const dataToCache = {
                timestamp: serverLastUpdated,
                data: {
                currentDatabaseMembers: filteredMembers,
                upcomingDatabaseLectures: lecturesData,
                upcomingDatabaseEvents: eventsData,
                galleryDatabaseItems: galleryData,
                recentOpportunities: opportunitiesData,
                },
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(dataToCache));
        } catch (error) {
          console.error("Error writing to cache:", error);
        }

      } catch (error) {
        console.error("Error fetching database data:", error);
      }
    };

    fetchDatabaseData();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section id="home" className="relative h-screen flex items-center justify-end hero-section">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="w-full flex justify-end">
            <div className="max-w-2xl text-right">
              <h1 className="text-5xl md:text-7xl font-bold mb-6 text-foreground" style={{ color: "#0f172a" }}>Synapsis</h1>
              <p className="text-xl md:text-2xl mb-8 text-muted-foreground">Bridging Biology & Technology</p>
              <p className="text-lg mb-12 text-foreground/80" style={{ color: "#0f172a" }}>
                Synapsis, the official student association for Biological Science at BITS Pilani, Hyderabad Campus, where we explore the intersection of biology and technology.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-8 text-foreground">About Synapsis</h2>
            <p className="text-lg text-muted-foreground mb-12  md:text-left">
Synapsis, the official Biological Sciences Association of BITS Pilani Hyderabad Campus, is a student-driven initiative supported by the Department of Biological Sciences. We inspire undergraduates, postgraduates, and PhDs toward STEM research through lectures, flagship events, and activities like the Synapsis Lecture Series . Our efforts foster scientific curiosity, interdisciplinary innovation, and vibrant outreach within the department.            </p>
            <div className="grid md:grid-cols-3 gap-8">
              <Card><CardHeader><Microscope className="h-12 w-12 text-primary mx-auto mb-4" /><CardTitle>20+ Active Members</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Students from Biology, Computer Science, and related fields</p></CardContent></Card>
              <Card><CardHeader><Brain className="h-12 w-12 text-primary mx-auto mb-4" /><CardTitle>Weekly Seminars</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Talks on Ongoing computational biology and bioinformatics research</p></CardContent></Card>
              <Card><CardHeader><Dna className="h-12 w-12 text-primary mx-auto mb-4" /><CardTitle>Various Events</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Collaborations with companies and research institutes</p></CardContent></Card>
            </div>
          </div>
        </div>
      </section>

      {/* Opportunities Section */}
      <section id="opportunities" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center text-center md:text-left mb-12">
            <div>
              <h2 className="text-4xl font-bold mb-2 text-foreground">Latest Projects</h2>
              <p className="text-lg text-muted-foreground">Find projects, internships, and more.</p>
            </div>
            <Link to="/projects" className="mt-4 md:mt-0">
              <Button size="lg" className="bg-gray-800 text-white hover:bg-gray-700">View All Projects</Button>
            </Link>
          </div>
          {recentOpportunities.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentOpportunities.map((op) => (
                <OpportunityCard
                  key={op.id}
                  title={op.title}
                  description={op.description}
                  contactPerson={op.contact_person}
                  contactProfileUrl={op.contact_profile_url}
                  prerequisites={op.prerequisites}
                  opportunityType={op.opportunity_type}
                  teamSize={op.expected_team_size}
                  deadline={op.application_deadline}
                  chamberNumber={op.chamber_number}
                  available_date={op.available_date}
                  available_time={op.available_time}
                />
              ))}
            </div>
          ) : (<div className="text-center text-muted-foreground py-16"><p>No active projects yet! 🚧</p></div>)}
        </div>
      </section>

      {/* Upcoming Lectures Section */}
      <section id="lectures" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center text-center md:text-left mb-12">
            <div>
              <h2 className="text-4xl font-bold mb-2 text-foreground">Upcoming Seminars</h2>
              <p className="text-lg text-muted-foreground">Expert talks on cutting-edge bioinformatics.</p>
            </div>
            <Link to="/seminars" className="mt-4 md:mt-0">
              <Button size="lg" className="bg-gray-800 text-white hover:bg-gray-700">View Past Seminars</Button>
            </Link>
          </div>
          {upcomingDatabaseLectures.length > 0 ? (
            <div className="grid grid-cols-1 gap-8">
              {upcomingDatabaseLectures.map((lecture) => (
                <FeaturedSeminarCard
                  key={lecture.id}
                  topic={lecture.topic}
                  speakerName={lecture.speaker}
                  speakerTitle={lecture.speaker_title || ''}
                  speakerPhotoUrl={lecture.speaker_photo_url}
                  speakerProfileUrl={lecture.speaker_profile_url}
                  description={lecture.description}
                  date={lecture.date}
                  time={lecture.time}
                  venue={lecture.location}
                />
              ))}
            </div>
          ) : (<div className="text-center text-muted-foreground py-16"><p>No upcoming seminars scheduled at the moment.</p></div>)}
        </div>
      </section>

      {/* Events Section */}
      <section id="events" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center text-center md:text-left mb-12">
            <div>
              <h2 className="text-4xl font-bold mb-2 text-foreground">Upcoming Events</h2>
            </div>
            <Link to="/events" className="mt-4 md:mt-0">
              <Button size="lg" className="bg-gray-800 text-white hover:bg-gray-700">View All Events</Button>
            </Link>
          </div>
          {upcomingDatabaseEvents.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingDatabaseEvents.map((event) => (
                <EventCard key={event.id} title={event.title} date={new Date(event.date).toLocaleDateString()} time={event.time || undefined} location={event.location} description={event.description} type="Event" image={event.image_url || "photo-1511795409834-ef04bbd61622"} />
              ))}
            </div>
          ) : (<div className="text-center text-muted-foreground py-16"><p>No upcoming events scheduled at the moment.</p></div>)}
        </div>
      </section>

      {/* Current Members Section */}
      <section id="members" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center text-center md:text-left mb-12">
            <div>
              <h2 className="text-4xl font-bold mb-2 text-foreground">Current Members</h2>
            </div>
            <Link to="/all-members" className="mt-4 md:mt-0">
              <Button size="lg" className="bg-gray-800 text-white hover:bg-gray-700">View All Members</Button>
            </Link>
          </div>
          <CurrentMembersDisplay members={currentDatabaseMembers} />
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12"><h2 className="text-4xl font-bold mb-4 text-foreground">Our Gallery</h2></div>
          
          {galleryDatabaseItems.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {galleryDatabaseItems.map((item) => (
                <div key={item.id} className="aspect-square overflow-hidden rounded-lg">
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground border rounded-lg">
              <CameraOff className="h-12 w-12 mx-auto mb-4" />
              <p>No images available at the moment.</p>
              <p className="text-sm">Check back soon!</p>
            </div>
          )}

        </div>
      </section>

      {/* Instagram Section */}
      <section
        id="instagram"
        className="py-20 bg-cover bg-center"
        style={{ backgroundImage: "url('/Synapsis_insta_bg.webp')" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Instagram className="h-16 w-16 text-black mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-4 text-black">
      Follow Us on Instagram
    </h2>
    <Button
      size="lg"
      className="text-lg px-8 py-6 bg-black text-white hover:bg-gray-800"
      onClick={() =>
        window.open("https://instagram.com/synapsis_bitshyd", "_blank")
      }
    >
      <Instagram className="h-5 w-5 mr-2" /> @synapsis_bitshyd
    </Button>
        </div>
      </section>

      {/* Footer */}
       <footer className="bg-primary text-primary-foreground py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">Synapsis</h3>
              {/* <ul className="space-y-2 text-primary-foreground/80"> */}
                {/* <li><a href="https://synapsis-chat.vercel.app/" className="hover:text-primary-foreground transition-colors">Chat</a></li> */}
              {/* </ul> */}
              <a className="text-lg font-semibold mb-4" href="mailto:bios@hyderabad.bits-pilani.ac.in">Feedback</a>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-primary-foreground/80">
                <li><a href="/projects" className="hover:text-primary-foreground transition-colors">All Projects</a></li>
                <li><a href="/seminars" className="hover:text-primary-foreground transition-colors">All Seminars</a></li>
                <li><a href="/events" className="hover:text-primary-foreground transition-colors">All Events</a></li>
                <li><a href="/all-members" className="hover:text-primary-foreground transition-colors">All Members</a></li>
                <li><a href="mailto:bios@hyderabad.bits-pilani.ac.in" className="hover:text-primary-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
              <p className="text-primary-foreground/80">Department of Biological Science<br />bios@hyderabad.bits-pilani.ac.in</p>
            </div>
          </div>
          <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center space-y-2">
            <p className="text-primary-foreground/60">© {new Date().getFullYear()} Synapsis . All rights reserved.</p>
            <p className="text-primary-foreground/60 text-sm">Made by Synapsis Team ❤️</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
