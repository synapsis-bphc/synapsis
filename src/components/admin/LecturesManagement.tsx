// src/components/admin/LecturesManagement.tsx
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit2, Trash2, BookOpen, Mail, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import useSessionStorageState from "@/hooks/useSessionStorageState";

interface Lecture {
  id: string;
  topic: string;
  speaker: string;
  speaker_title?: string;
  speaker_photo_url?: string;
  speaker_profile_url?: string;
  date: string;
  time: string;
  location: string;
  description: string;
  type: string;
  is_upcoming: boolean;
  image_url?: string; // Keep for legacy data, but won't be managed in the form
}

interface LectureFormData {
  id?: string;
  topic: string;
  speaker: string;
  speaker_title: string;
  speaker_photo_url: string;
  speaker_profile_url: string;
  date: string;
  time: string;
  location: string;
  description: string;
  type: string;
}

const initialFormData: LectureFormData = {
    topic: "",
    speaker: "",
    speaker_title: "",
    speaker_photo_url: "",
    speaker_profile_url: "",
    date: "",
    time: "",
    location: "",
    description: "",
    type: "Lecture",
};

export function LecturesManagement() {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLecture, setEditingLecture] = useState<Lecture | null>(null);
  const [showMailConfirmDialog, setShowMailConfirmDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const formCardRef = useRef<HTMLDivElement>(null);


  const [showAddForm, setShowAddForm] = useSessionStorageState('lecturesShowAddForm', false);
  const [formData, setFormData] = useSessionStorageState('lecturesFormData', initialFormData);

  useEffect(() => {
    fetchLectures();
  }, []);

  const fetchLectures = async () => {
    try {
      const { data, error } = await supabase.from("lectures").select("*").order("date", { ascending: false });
      if (error) throw error;
      setLectures(data || []);
    } catch (error) {
      console.error("Error fetching lectures:", error);
      toast({ title: "Error", description: "Failed to fetch lectures", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddNewClick = () => {
    if (showAddForm) {
        if (!confirm("You have unsaved changes. Are you sure you want to discard them?")) {
            return;
        }
    }
    setEditingLecture(null);
    setFormData(initialFormData);
    setShowAddForm(true);
  };

  const resetFormAndClose = () => {
    setEditingLecture(null);
    setFormData(initialFormData);
    setShowAddForm(false);
  };
  
  const handleSpeakerPhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `speaker-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('member-photos') // Using the same bucket for simplicity
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('member-photos')
        .getPublicUrl(filePath);

      setFormData({ ...formData, speaker_photo_url: data.publicUrl });
      toast({ title: "Success", description: "Speaker photo uploaded successfully." });
    } catch (error) {
      console.error("Error uploading speaker photo:", error);
      toast({ title: "Error", description: "Failed to upload photo.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveLecture = async (andThenMail: boolean = false) => {
    try {
      const lectureDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const is_upcoming = lectureDate >= today;
      const finalData = { ...formData, is_upcoming };

      if (editingLecture) {
        await supabase.from("lectures").update(finalData).eq("id", editingLecture.id).throwOnError();
        toast({ title: "Success", description: "Lecture updated successfully." });
      } else {
        const { id, ...insertData } = finalData;
        await supabase.from("lectures").insert(insertData).throwOnError();
        toast({ title: "Success", description: "Lecture added successfully." });
      }

      fetchLectures();
      if (andThenMail) composeMail();
      resetFormAndClose();
    } catch (error) {
      console.error("Error saving lecture:", error);
      toast({ title: "Error", description: "Failed to save lecture.", variant: "destructive" });
    }
  };

  const composeMail = () => {
    const subject = encodeURIComponent(`Synapsis Seminar: ${formData.topic}`);
    const siteUrl = window.location.origin; // Gets the base URL (e.g., https://yoursite.com)
    const lecturesPageUrl = `${siteUrl}/seminars`;

    const body = encodeURIComponent(
      `Dear All,\n\n` +
      `We are pleased to announce an upcoming seminar hosted by Synapsis.\n\n` +
      `Topic: ${formData.topic}\n` +
      `Speaker: ${formData.speaker} (${formData.speaker_title})\n` +
      `Date: ${formData.date}\n` +
      `Time: ${formData.time}\n` +
      `Venue: ${formData.location}\n\n` +
      `Description:\n${formData.description}\n\n` +
      `For more details and to view other seminars, please visit our website:\n${lecturesPageUrl}\n\n` +
      `We look forward to seeing you there.\n\n` +
      `Best regards,\nSynapsis Team`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleMailButtonClick = () => {
    if (!formData.topic || !formData.speaker || !formData.date || !formData.time || !formData.location || !formData.description) {
      toast({
        title: "Incomplete Form",
        description: "Please fill all fields before composing the mail.",
        variant: "destructive",
      });
      return;
    }
    setShowMailConfirmDialog(true);
  };

  const handleConfirmAndMail = async () => {
    setShowMailConfirmDialog(false);
    composeMail();
  };

  const handleEdit = (lecture: Lecture) => {
    if (showAddForm && editingLecture?.id !== lecture.id) {
        if (!confirm("You have unsaved changes. Are you sure you want to discard them?")) {
            return;
        }
    }
    const { is_upcoming, image_url, ...formData } = lecture;
    setFormData({
        ...initialFormData,
        ...formData,
        speaker_title: lecture.speaker_title ?? '',
        speaker_photo_url: lecture.speaker_photo_url ?? '',
        speaker_profile_url: lecture.speaker_profile_url ?? '',
    });
    setEditingLecture(lecture);
    setShowAddForm(true);
    setTimeout(() => {
        formCardRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleDelete = async (id: string) => {
     if (!confirm("Are you sure you want to delete this lecture?")) return;
    try {
      await supabase.from("lectures").delete().eq("id", id).throwOnError();
      toast({ title: "Success", description: "Lecture deleted successfully" });
      fetchLectures();
    } catch (error) {
      console.error("Error deleting lecture:", error);
      toast({ title: "Error", description: "Failed to delete lecture", variant: "destructive" });
    }
  };

  if (loading) return <div>Loading lectures...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2"><BookOpen className="h-5 w-5" /> Lectures Management</h3>
        <Button onClick={handleAddNewClick}>
            <Plus className="h-4 w-4 mr-2" /> Add Lecture
        </Button>
      </div>

      {showAddForm && (
        <Card ref={formCardRef}>
          <CardHeader><CardTitle>{editingLecture ? "Edit Lecture" : "Add New Lecture"}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveLecture(); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="topic">Topic</Label><Input id="topic" value={formData.topic} onChange={(e) => setFormData({...formData, topic: e.target.value})} required /></div>
                <div className="space-y-2"><Label htmlFor="speaker">Speaker Name</Label><Input id="speaker" value={formData.speaker} onChange={(e) => setFormData({...formData, speaker: e.target.value})} required /></div>
                <div className="space-y-2"><Label htmlFor="speaker_title">Speaker Title</Label><Input id="speaker_title" value={formData.speaker_title} onChange={(e) => setFormData({...formData, speaker_title: e.target.value})} placeholder="e.g., Professor of Biology" /></div>
                <div className="space-y-2"><Label htmlFor="speaker_profile_url">Speaker Profile URL</Label><Input id="speaker_profile_url" value={formData.speaker_profile_url} onChange={(e) => setFormData({...formData, speaker_profile_url: e.target.value})} placeholder="https://linkedin.com/in/..." /></div>
                <div className="space-y-2"><Label htmlFor="date">Date</Label><Input id="date" type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required /></div>
                <div className="space-y-2"><Label htmlFor="time">Time</Label><Input id="time" type="time" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} required /></div>
                <div className="space-y-2"><Label htmlFor="location">Location</Label><Input id="location" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} required /></div>
                <div className="space-y-2"><Label htmlFor="type">Type</Label><Input id="type" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} placeholder="Lecture, Workshop, etc." required /></div>
              </div>
              <div className="space-y-2"><Label htmlFor="description">Description</Label><Textarea id="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required /></div>
              
              <div className="space-y-2">
                <Label htmlFor="speaker_photo_url">Speaker Photo</Label>
                <div className="flex items-center gap-4">
                    {formData.speaker_photo_url && <img src={formData.speaker_photo_url} alt="Speaker Preview" className="w-16 h-16 rounded-lg object-cover" />}
                    <div className="flex-grow space-y-2">
                        <Input id="speaker_photo_url" value={formData.speaker_photo_url} onChange={(e) => setFormData({...formData, speaker_photo_url: e.target.value})} placeholder="Paste image URL here..." />
                        <div className="text-sm text-muted-foreground text-center my-2">OR</div>
                        <Input id="speaker-photo-upload" type="file" accept="image/*" onChange={handleSpeakerPhotoUpload} disabled={isUploading} className="block" />
                        {isUploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
                    </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isUploading}>
                  {isUploading ? "Uploading..." : (editingLecture ? "Update Lecture" : "Add Lecture")}
                </Button>
                <Button type="button" variant="secondary" onClick={handleMailButtonClick}><Mail className="h-4 w-4 mr-2" /> Compose Mail</Button>
                <Button type="button" variant="outline" onClick={resetFormAndClose}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      
      <div className="grid gap-4 mt-6">
        {lectures.map((lecture) => (
          <Card key={lecture.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {lecture.speaker_photo_url && <img src={lecture.speaker_photo_url} alt={lecture.speaker} className="w-16 h-16 rounded object-cover" />}
                  <div>
                    <h4 className="font-semibold">{lecture.topic}</h4>
                    <p className="text-sm text-gray-600">{lecture.speaker} • {lecture.date} {lecture.time} • {lecture.location}</p>
                    <p className="text-sm text-gray-500">{lecture.type} • {lecture.is_upcoming ? "Future" : "Past"}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(lecture)}><Edit2 className="h-4 w-4" /></Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(lecture.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <AlertDialog open={showMailConfirmDialog} onOpenChange={setShowMailConfirmDialog}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Confirm Action</AlertDialogTitle><AlertDialogDescription>This will save the current lecture details and then open a pre-filled email draft.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleConfirmAndMail}>Save and Mail</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}