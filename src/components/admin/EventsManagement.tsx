// src/components/admin/EventsManagement.tsx
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit2, Trash2, Calendar, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import useSessionStorageState from "@/hooks/useSessionStorageState";

interface Event {
  id: string;
  title: string;
  date: string;
  time?: string;
  location: string;
  description?: string;
  image_url?: string;
  is_upcoming: boolean;
}

const initialFormData = {
  title: "",
  date: "",
  time: "",
  location: "",
  description: "",
  image_url: "",
};

export function EventsManagement() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const formCardRef = useRef<HTMLDivElement>(null);


  const [showAddForm, setShowAddForm] = useSessionStorageState('eventsShowAddForm', false);
  const [formData, setFormData] = useSessionStorageState('eventsFormData', initialFormData);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase.from("events").select("*").order("date", { ascending: false });
      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast({ title: "Error", description: "Failed to fetch events", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingEvent(null);
    setShowAddForm(false);
  };

  const handleEdit = (event: Event) => {
    if (showAddForm && editingEvent?.id !== event.id) {
      if (!confirm("You have unsaved changes. Are you sure you want to discard them?")) {
        return;
      }
    }
    setFormData({
      title: event.title,
      date: event.date,
      time: event.time || "",
      location: event.location,
      description: event.description || "",
      image_url: event.image_url || "",
    });
    setEditingEvent(event);
    setShowAddForm(true);
    setTimeout(() => {
      formCardRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `event-images/${fileName}`;

      let { error: uploadError } = await supabase.storage
        .from('member-photos') // Assuming a general bucket
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('member-photos')
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: data.publicUrl });
      toast({ title: "Success", description: "Image uploaded." });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({ title: "Error", description: "Failed to upload image.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

const handleSaveEvent = async () => {
  try {
    const eventDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const is_upcoming = eventDate >= today;

    // Build eventData, using empty strings for NOT NULL optional fields
    const eventData: Record<string, any> = {
      title: formData.title,
      date: formData.date,
      location: formData.location,
      description: formData.description || "", // default to empty string
      image_url: formData.image_url || "",    // default to empty string
      is_upcoming,
    };

    if (formData.time) eventData.time = formData.time; // only include if user entered

    if (editingEvent) {
      await supabase
        .from("events")
        .update(eventData)
        .eq("id", editingEvent.id)
        .throwOnError();

      toast({ title: "Success", description: "Event updated." });
    } else {
      await supabase.from("events").insert(eventData).throwOnError();
      toast({ title: "Success", description: "Event added." });
    }

    fetchEvents();
    resetForm();
  } catch (error: any) {
    console.error("Error saving event:", error.message || error);
    toast({
      title: "Error",
      description: error.message || "Failed to save event.",
      variant: "destructive",
    });
  }
};




  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    try {
      await supabase.from("events").delete().eq("id", id).throwOnError();
      toast({ title: "Success", description: "Event deleted." });
      fetchEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({ title: "Error", description: "Failed to delete event.", variant: "destructive" });
    }
  };

  if (loading) return <div>Loading events...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2"><Calendar className="h-5 w-5" /> Events Management</h3>
        <Button onClick={() => setShowAddForm(true)}><Plus className="h-4 w-4 mr-2" /> Add Event</Button>
      </div>

      {showAddForm && (
        <Card ref={formCardRef}>
          <CardHeader><CardTitle>{editingEvent ? "Edit Event" : "Add New Event"}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveEvent(); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="title">Title<span className="text-red-500">*</span></Label><Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required /></div>
                <div className="space-y-2"><Label htmlFor="date">Date<span className="text-red-500">*</span></Label><Input id="date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required /></div>
                <div className="space-y-2"><Label htmlFor="time">Time</Label><Input id="time" type="time" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} /></div>
                <div className="space-y-2"><Label htmlFor="location">Location<span className="text-red-500">*</span></Label><Input id="location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} required /></div>
              </div>
              <div className="space-y-2"><Label htmlFor="description">Description</Label><Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Event Image</Label>
                <div className="flex items-center gap-4">
                  {formData.image_url && <img src={formData.image_url} alt="Preview" className="w-24 h-24 object-cover rounded" />}
                  <div className="flex-grow space-y-2">
                    <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                    {/* <p className="text-sm text-muted-foreground">Recommended size: 600x400px</p> */}
                    {uploading && <p>Uploading...</p>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2"><Button type="submit">Save Event</Button><Button type="button" variant="outline" onClick={resetForm}>Cancel</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {events.map((event) => (
          <Card key={event.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {event.image_url && <img src={event.image_url} alt={event.title} className="w-16 h-16 rounded object-cover" />}
                <div>
                  <h4 className="font-semibold">{event.title}</h4>
                  <p className="text-sm text-gray-600">{event.date} {event.time} • {event.location}</p>
                </div>
              </div>
              <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => handleEdit(event)}><Edit2 className="h-4 w-4" /></Button><Button size="sm" variant="destructive" onClick={() => handleDelete(event.id)}><Trash2 className="h-4 w-4" /></Button></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
