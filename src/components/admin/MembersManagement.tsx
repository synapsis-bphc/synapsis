// src/components/admin/MembersManagement.tsx
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit2, Trash2, Users, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import useSessionStorageState from "@/hooks/useSessionStorageState"; // Import the new hook

interface Member {
  id: string;
  name: string;
  position: string;
  year: number;
  photo_url?: string;
  linkedin_url?: string;
  instagram_url?: string;
  is_current: boolean;
  bio?: string;
  member_id?: string;
}

const initialFormData = {
  name: "",
  position: "",
  year: new Date().getFullYear(),
  photo_url: "",
  linkedin_url: "",
  instagram_url: "",
  is_current: true,
  bio: "",
  member_id: "",
};

export function MembersManagement() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const formCardRef = useRef<HTMLDivElement>(null);


  // Replace useState with our new custom hook
  const [showAddForm, setShowAddForm] = useSessionStorageState('membersShowAddForm', false);
  const [formData, setFormData] = useSessionStorageState('membersFormData', initialFormData);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase.from("members").select("*").order("year", { ascending: false }).order("name");
      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error("Error fetching members:", error);
      toast({ title: "Error", description: "Failed to fetch members", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingMember(null);
    setShowAddForm(false);
  };

  const handleEdit = (member: Member) => {
    if (showAddForm && editingMember?.id !== member.id) {
        if (!confirm("You have unsaved changes. Are you sure you want to discard them?")) {
            return;
        }
    }
    setFormData({
      name: member.name,
      position: member.position,
      year: member.year,
      photo_url: member.photo_url || "",
      linkedin_url: member.linkedin_url || "",
      instagram_url: member.instagram_url || "",
      is_current: member.is_current,
      bio: member.bio || "",
      member_id: member.member_id || "",
    });
    setEditingMember(member);
    setShowAddForm(true);
    setTimeout(() => {
        formCardRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };
  
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `member-photos/${fileName}`;

      let { error: uploadError } = await supabase.storage
        .from('member-photos')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('member-photos')
        .getPublicUrl(filePath);

      setFormData({ ...formData, photo_url: data.publicUrl });
      toast({ title: "Success", description: "Photo uploaded successfully." });
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast({ title: "Error", description: "Failed to upload photo.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveMember = async () => {
    try {
      const memberData = { ...formData, year: Number(formData.year) };
      
      if (editingMember) {
        await supabase.from("members").update(memberData).eq("id", editingMember.id).throwOnError();
        toast({ title: "Success", description: "Member updated successfully." });
      } else {
        await supabase.from("members").insert(memberData).throwOnError();
        toast({ title: "Success", description: "Member added successfully." });
      }
      fetchMembers();
      resetForm();
    } catch (error) {
      console.error("Error saving member:", error);
      toast({ title: "Error", description: "Failed to save member.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this member?")) return;
    try {
      await supabase.from("members").delete().eq("id", id).throwOnError();
      toast({ title: "Success", description: "Member deleted successfully." });
      fetchMembers();
    } catch (error) {
      console.error("Error deleting member:", error);
      toast({ title: "Error", description: "Failed to delete member.", variant: "destructive" });
    }
  };

  if (loading) return <div>Loading members...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2"><Users className="h-5 w-5" /> Members Management</h3>
        <Button onClick={() => setShowAddForm(true)}><Plus className="h-4 w-4 mr-2" /> Add Member</Button>
      </div>

      {showAddForm && (
        <Card ref={formCardRef}>
          <CardHeader><CardTitle>{editingMember ? "Edit Member" : "Add New Member"}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveMember(); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2"><Label htmlFor="name">Name</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
                <div className="space-y-2"><Label htmlFor="position">Position</Label><Input id="position" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} required /></div>
                <div className="space-y-2"><Label htmlFor="year">Year</Label><Input id="year" type="number" value={formData.year} onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })} required /></div>
                <div className="space-y-2"><Label htmlFor="linkedin_url">LinkedIn URL</Label><Input id="linkedin_url" value={formData.linkedin_url} onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })} /></div>
                <div className="space-y-2"><Label htmlFor="instagram_url">Instagram URL</Label><Input id="instagram_url" value={formData.instagram_url} onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })} /></div>
                <div className="space-y-2"><Label htmlFor="member_id">Member ID</Label><Input id="member_id" value={formData.member_id} onChange={(e) => setFormData({ ...formData, member_id: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label htmlFor="bio">Bio</Label><Textarea id="bio" value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Photo</Label>
                <div className="flex items-center gap-4">
                  {formData.photo_url && <img src={formData.photo_url} alt="Photo preview" className="w-16 h-16 rounded-full object-cover" />}
                  <Input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} />
                  {uploading && <p>Uploading...</p>}
                </div>
              </div>
              <div className="flex items-center space-x-2"><Switch id="is_current" checked={formData.is_current} onCheckedChange={(checked) => setFormData({ ...formData, is_current: checked })} /><Label htmlFor="is_current">Is Current Member</Label></div>
              <div className="flex gap-2"><Button type="submit">Save Member</Button><Button type="button" variant="outline" onClick={resetForm}>Cancel</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {members.map((member) => (
          <Card key={member.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {member.photo_url && <img src={member.photo_url} alt={member.name} className="w-12 h-12 rounded-full object-cover" />}
                <div>
                  <h4 className="font-semibold">{member.name}</h4>
                  <p className="text-sm text-gray-600">{member.position} • {member.year}</p>
                </div>
              </div>
              <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => handleEdit(member)}><Edit2 className="h-4 w-4" /></Button><Button size="sm" variant="destructive" onClick={() => handleDelete(member.id)}><Trash2 className="h-4 w-4" /></Button></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}