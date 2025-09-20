// src/components/admin/AdminDashboard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut, Users, Calendar, Camera, BookOpen, Briefcase, User as UserIcon } from "lucide-react";
import { MembersManagement } from "./MembersManagement";
import { LecturesManagement } from "./LecturesManagement";
import { EventsManagement } from "./EventsManagement";
import { GalleryManagement } from "./GalleryManagement";
import { UserManagement } from "./UserManagement";
import { ProjectsManagement } from "./ProjectsManagement";
import ProfileManagement  from "./ProfileManagement";
import type { User } from "@supabase/supabase-js";
import useSessionStorageState from "@/hooks/useSessionStorageState";

interface AdminDashboardProps {
  user: User | null;
  userRoles: string[];
  onLogout: () => void;
  isLoading: boolean; // This line was missing
}

export function AdminDashboard({ user, userRoles, onLogout, isLoading }: AdminDashboardProps) {
  const canManageUsers = userRoles.includes('admin');
  const canManageMembers = userRoles.includes('admin') || userRoles.includes('members_editor');
  const canManageLectures = userRoles.includes('admin') || userRoles.includes('lectures_editor');
  const canManageEvents = userRoles.includes('admin') || userRoles.includes('events_editor');
  const canManageGallery = userRoles.includes('admin') || userRoles.includes('gallery_editor');
  const canManageProjects = userRoles.includes('admin') || userRoles.includes('project_editor');

  const availableTabs = [
    'profile',
    canManageUsers && 'users',
    canManageMembers && 'members',
    canManageLectures && 'lectures',
    canManageEvents && 'events',
    canManageGallery && 'gallery',
    canManageProjects && 'projects',
  ].filter(Boolean) as string[];

  const [activeTab, setActiveTab] = useSessionStorageState('adminActiveTab', availableTabs[0] || '');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-1 py-2 sm:px-4 sm:py-4 md:px-8 md:py-8 pt-24">
      <div className="container mx-auto space-y-6 pt-10">
        <Card className="shadow-lg ">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-bold ">Admin Dashboard</CardTitle>
                <p className="text-gray-600 pt-2">Synapsis Club Management Portal</p>
                {user && <p className="text-sm text-gray-500 mt-1">Logged in as: {user.email}</p>}
              </div>
              <Button onClick={onLogout} variant="outline" className="w-full sm:w-auto">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </CardHeader>
        </Card>

        <Card className="shadow-lg">
          <CardContent className="p-0">
            {!isLoading && (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="w-full overflow-x-auto border-b">
                  <TabsList className="rounded-none bg-transparent px-4">
                    <TabsTrigger value="profile" className="flex-shrink-0 flex items-center gap-2"><UserIcon className="h-4 w-4" /> My Profile</TabsTrigger>
                    {canManageUsers && <TabsTrigger value="users" className="flex-shrink-0 flex items-center gap-2"> <Users className="h-4 w-4" /> Users</TabsTrigger>}
                    {canManageMembers && <TabsTrigger value="members" className="flex-shrink-0 flex items-center gap-2"><Users className="h-4 w-4" /> Members</TabsTrigger>}
                    {canManageLectures && <TabsTrigger value="lectures" className="flex-shrink-0 flex items-center gap-2"><BookOpen className="h-4 w-4" /> Lectures</TabsTrigger>}
                    {canManageEvents && <TabsTrigger value="events" className="flex-shrink-0 flex items-center gap-2"><Calendar className="h-4 w-4" /> Events</TabsTrigger>}
                    {canManageGallery && <TabsTrigger value="gallery" className="flex-shrink-0 flex items-center gap-2"><Camera className="h-4 w-4" /> Gallery</TabsTrigger>}
                    {canManageProjects && <TabsTrigger value="projects" className="flex-shrink-0 flex items-center gap-2"><Briefcase className="h-4 w-4" /> Projects</TabsTrigger>}
                  </TabsList>
                </div>
                <div className="p-4 sm:p-6">
                  <TabsContent value="profile" className="mt-0"><ProfileManagement /></TabsContent>
                  {canManageUsers && <TabsContent value="users" className="mt-0"><UserManagement /></TabsContent>}
                  {canManageMembers && <TabsContent value="members" className="mt-0"><MembersManagement /></TabsContent>}
                  {canManageLectures && <TabsContent value="lectures" className="mt-0"><LecturesManagement /></TabsContent>}
                  {canManageEvents && <TabsContent value="events" className="mt-0"><EventsManagement /></TabsContent>}
                  {canManageGallery && <TabsContent value="gallery" className="mt-0"><GalleryManagement /></TabsContent>}
                  {canManageProjects && <TabsContent value="projects" className="mt-0"><ProjectsManagement /></TabsContent>}
                </div>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
