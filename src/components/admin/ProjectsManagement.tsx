// src/components/admin/ProjectsManagement.tsx
import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Briefcase, User as UserIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";
import useSessionStorageState from "@/hooks/useSessionStorageState"; // Import the hook

interface Project {
  id: string;
  title: string;
  description?: string;
  contact_person: string;
  contact_user_id: string;
  contact_profile_url?: string;
  prerequisites?: string;
  opportunity_type: string;
  expected_team_size?: number;
  application_deadline?: string;
  is_active: boolean;
  chamber_number?: string;
  available_date?: string;
  available_time?: string;
}

const projectTypes = [
  'Formal Project', 'Informal Project', 'Internship', 'Competition', 'External Opportunity',
  'Study oriented project', 'Lab oriented project', 'Design oriented project'
];

const daysOfWeek = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const initialFormData = {
  title: "",
  description: "",
  contact_person: "",
  contact_profile_url: "",
  prerequisites: "",
  opportunity_type: "",
  expected_team_size: 0,
  application_deadline: "",
  is_active: true,
  chamber_number: "",
  available_date: "",
  available_time: "",
};

export function ProjectsManagement() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const { toast } = useToast();
  const formCardRef = useRef<HTMLDivElement>(null);


  // --- THIS IS THE FIX ---
  // Replace useState with our new custom hook for form data and visibility
  const [showAddForm, setShowAddForm] = useSessionStorageState('projectsShowAddForm', false);
  const [formData, setFormData] = useSessionStorageState('projectsFormData', initialFormData);

  const isAdmin = useMemo(() => userRoles.includes('admin'), [userRoles]);

  useEffect(() => {
    const fetchUserAndData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      if (user) {
        const { data: roles } = await supabase.rpc('get_user_roles', { user_uuid: user.id });
        setUserRoles(roles || []);
      }
      fetchProjects();
    };
    fetchUserAndData();
  }, []);

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
      toast({ title: "Error", description: "Failed to fetch projects.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const groupedProjects = useMemo(() => {
    if (!isAdmin) return {};
    return projects.reduce((acc, project) => {
      const key = project.contact_person || 'Unknown User';
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(project);
      return acc;
    }, {} as Record<string, Project[]>);
  }, [projects, isAdmin]);

  const handleAddNewClick = () => {
    if (showAddForm) {
        if (!confirm("You have unsaved changes. Are you sure you want to discard them?")) {
            return;
        }
    }
    setEditingProject(null);
    setFormData({
      ...initialFormData,
      contact_person: currentUser?.user_metadata?.full_name || currentUser?.email || '',
      contact_profile_url: currentUser?.user_metadata?.profile_url || '',
      available_date: currentUser?.user_metadata?.available_date || "",
      available_time: currentUser?.user_metadata?.available_time || "",
    });
    setShowAddForm(true);
  };

  const resetFormAndClose = () => {
    setFormData(initialFormData);
    setEditingProject(null);
    setShowAddForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!formData.title || !formData.contact_person || !formData.opportunity_type) {
      toast({
        title: "Missing Information",
        description: "Please fill out all required fields marked with an asterisk.",
        variant: "destructive",
      });
      return;
    }

    try {
      const submitData = {
        ...formData,
        expected_team_size: Number(formData.expected_team_size) || null,
        application_deadline: formData.application_deadline || null,
        chamber_number: formData.chamber_number || null,
        available_date: formData.available_date || null,
        available_time: formData.available_time || null,
      };

      if (editingProject) {
        await supabase.from("opportunities").update(submitData).eq("id", editingProject.id).throwOnError();
        toast({ title: "Success", description: "Project updated." });
      } else {
        await supabase.from("opportunities").insert({ ...submitData, contact_user_id: currentUser.id }).throwOnError();
        toast({ title: "Success", description: "Project created." });
      }
      fetchProjects();
      resetFormAndClose();
    } catch (error) {
      console.error("Error saving project:", error);
      toast({ title: "Error", description: "Failed to save project.", variant: "destructive" });
    }
  };

  const handleEdit = (project: Project) => {
    if (showAddForm && editingProject?.id !== project.id) {
        if (!confirm("You have unsaved changes. Are you sure you want to discard them?")) {
            return;
        }
    }
    const { id, contact_user_id, ...rest } = project;
    setFormData({
      ...initialFormData,
      ...rest,
      description: rest.description || "",
      contact_profile_url: rest.contact_profile_url || "",
      prerequisites: rest.prerequisites || "",
      expected_team_size: rest.expected_team_size || 0,
      application_deadline: rest.application_deadline || "",
      chamber_number: rest.chamber_number || "",
      available_date: rest.available_date || "",
      available_time: rest.available_time || "",
    });
    setEditingProject(project);
    setShowAddForm(true);
    setTimeout(() => {
        formCardRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await supabase.from("opportunities").delete().eq("id", id).throwOnError();
      toast({ title: "Success", description: "Project deleted." });
      fetchProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({ title: "Error", description: "Failed to delete project.", variant: "destructive" });
    }
  };

  const filteredProjects = isAdmin ? projects : projects.filter(p => currentUser && p.contact_user_id === currentUser.id)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="text-lg font-semibold flex items-center gap-2"><Briefcase className="h-5 w-5" /> Projects Management</h3>
        <Button onClick={handleAddNewClick} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" /> Add Project
        </Button>
      </div>

      {showAddForm && (
        <Card ref={formCardRef}>
          <CardHeader><CardTitle>{editingProject ? "Edit Project" : "Add New Project"}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
                  <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_person">Contact Person <span className="text-red-500">*</span></Label>
                  <Input id="contact_person" value={formData.contact_person} onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_profile_url">Contact Profile URL</Label>
                  <Input id="contact_profile_url" value={formData.contact_profile_url} onChange={(e) => setFormData({ ...formData, contact_profile_url: e.target.value })} placeholder="Your Bits Profile Page" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="opportunity_type">Type <span className="text-red-500">*</span></Label>
                  <Select value={formData.opportunity_type} onValueChange={(value) => setFormData({ ...formData, opportunity_type: value })}>
                    <SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger>
                    <SelectContent>{projectTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="application_deadline">Application Deadline</Label>
                  <Input id="application_deadline" type="date" value={formData.application_deadline} onChange={(e) => setFormData({ ...formData, application_deadline: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expected_team_size">Expected Team Size</Label>
                  <Input id="expected_team_size" type="number" value={formData.expected_team_size} onChange={(e) => setFormData({ ...formData, expected_team_size: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chamber_number">Chamber Number</Label>
                  <Input id="chamber_number" value={formData.chamber_number} onChange={(e) => setFormData({ ...formData, chamber_number: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="available_date">Available Day</Label>
                  <Select value={formData.available_date} onValueChange={(value) => setFormData({ ...formData, available_date: value })}>
                    <SelectTrigger><SelectValue placeholder="Select a day" /></SelectTrigger>
                    <SelectContent>{daysOfWeek.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="available_time">Available Time</Label>
                  <Input id="available_time" type="time" value={formData.available_time} onChange={(e) => setFormData({ ...formData, available_time: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prerequisites">Prerequisites</Label>
                <Textarea id="prerequisites" value={formData.prerequisites} onChange={(e) => setFormData({ ...formData, prerequisites: e.target.value })} />
              </div>
              <div className="flex items-center space-x-2 pt-4"><Switch id="is_active" checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} /><Label htmlFor="is_active">Is Active (Visible to public)</Label></div>
              <div className="flex flex-wrap gap-2 pt-4"><Button type="submit">{editingProject ? "Update" : "Create"} Project</Button><Button type="button" variant="outline" onClick={resetFormAndClose}>Cancel</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      {isAdmin ? (
        <div className="space-y-6">
          {Object.entries(groupedProjects).map(([contactPerson, userProjects]) => (
            <div key={contactPerson}>
              <h4 className="text-md font-semibold flex items-center gap-2 mb-2 text-muted-foreground">
                <UserIcon className="h-4 w-4" />
                Posted by: {contactPerson}
              </h4>
              <div className="grid gap-4">
                {userProjects.map((project) => <ProjectListItem key={project.id} project={project} onEdit={handleEdit} onDelete={handleDelete} />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredProjects.map((project) => <ProjectListItem key={project.id} project={project} onEdit={handleEdit} onDelete={handleDelete} />)}
        </div>
      )}

       {loading && (<div className="text-center py-8 text-muted-foreground">Loading projects...</div>)}
       {!loading && projects.length === 0 && (<div className="text-center py-8 text-muted-foreground">No projects found.</div>)}
    </div>
  );
}

const ProjectListItem = ({ project, onEdit, onDelete }: { project: Project, onEdit: (p: Project) => void, onDelete: (id: string) => void }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-grow">
          <h4 className="font-semibold">{project.title} <Badge variant={project.is_active ? "default" : "outline"}>{project.is_active ? "Active" : "Inactive"}</Badge></h4>
          <p className="text-sm text-gray-600">{project.opportunity_type}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button size="sm" variant="outline" onClick={() => onEdit(project)}><Edit2 className="h-4 w-4" /></Button>
          <Button size="sm" variant="destructive" onClick={() => onDelete(project.id)}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>
    </CardContent>
  </Card>
);