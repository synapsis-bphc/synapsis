// src/components/admin/UserManagement.tsx
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, UserPlus, Save, ChevronsUpDown, Trash2, KeyRound, Mail, MoreHorizontal, Users2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";


// Define interfaces for our data structures
interface Role {
  id: string;
  role_name: string;
}

interface UserData {
  id: string;
  email: string | null;
  roles: Role[];
  profile_url: string | null;
}

export function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRoles, setNewUserRoles] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState("");
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [updatedEmail, setUpdatedEmail] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  // State for bulk add functionality
  const [bulkEmails, setBulkEmails] = useState("");
  const [bulkRoles, setBulkRoles] = useState<string[]>([]);
  const [isBulkAdding, setIsBulkAdding] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: rolesData, error: rolesError } = await supabase.from("roles").select("id, role_name").order("role_name");
      if (rolesError) throw rolesError;
      setAllRoles(rolesData || []);

      const { data: usersWithRoles, error: rpcError } = await supabase.rpc("get_admin_user_list_v2");
      if (rpcError) throw rpcError;

      const formattedUsers: UserData[] = (usersWithRoles || []).map((user: any) => ({
        id: user.id,
        email: user.email,
        roles: user.roles || [],
        profile_url: user.profile_url || "",
      }));
      setUsers(formattedUsers);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast({
        title: "Permission Error",
        description: error.message || "Failed to load user data. Only admins can access this section.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRolesChange = async (userId: string, newRoleIds: string[]) => {
    const originalUsers = [...users];
    const user = originalUsers.find(u => u.id === userId);
    if (!user) return;
    const originalRoleIds = user.roles.map(r => r.id);
    const newRoles = allRoles.filter(r => newRoleIds.includes(r.id));
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, roles: newRoles } : u));
    try {
      const rolesToAdd = newRoleIds.filter(id => !originalRoleIds.includes(id)).map(role_id => ({ user_id: userId, role_id }));
      const rolesToRemove = originalRoleIds.filter(id => !newRoleIds.includes(id));
      if (rolesToRemove.length > 0) {
        const { error } = await supabase.from("user_roles").delete().eq('user_id', userId).in('role_id', rolesToRemove);
        if (error) throw error;
      }
      if (rolesToAdd.length > 0) {
        const { error } = await supabase.from("user_roles").insert(rolesToAdd);
        if (error) throw error;
      }
      toast({ title: "Success", description: "User roles updated." });
    } catch (error) {
      setUsers(originalUsers);
      console.error("Error updating user roles:", error);
      toast({ title: "Error", description: "Failed to update user roles.", variant: "destructive" });
    }
  };

  const handleProfileUrlChange = (userId: string, newUrl: string) => {
    setUsers(prevUsers =>
      prevUsers.map(user => (user.id === userId ? { ...user, profile_url: newUrl } : user))
    );
  };

  const handleSaveProfileUrl = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    try {
      const { error } = await supabase.rpc('update_user_profile_url', { user_id_to_update: userId, new_url: user.profile_url });
      if (error) throw error;
      toast({ title: "Success", description: "Profile URL saved." });
    } catch (error) {
      console.error("Error saving profile URL:", error);
      toast({ title: "Error", description: "Failed to save Profile URL.", variant: "destructive" });
    }
  };

  const handleInviteUser = async () => {
    if (!newUserEmail) {
      toast({ title: "Error", description: "Email is required.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: {
          email: newUserEmail,
          role_ids: newUserRoles,
          custom_message: customMessage,
        },
      });

      if (data?.error) throw new Error(data.error);
      if (error) throw error;
      
      toast({ title: "Success", description: `Invitation sent to ${newUserEmail}.` });
      setNewUserEmail("");
      setNewUserRoles([]);
      setCustomMessage("");
      fetchData();
      document.getElementById('close-invite-dialog')?.click();
    } catch (error: any) {
      console.error("Error inviting user:", error);
      toast({ title: "Error", description: error.message || "Failed to invite user.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkAddUsers = async () => {
    const emails = bulkEmails.split(/[\n,;]+/).map(e => e.trim()).filter(e => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    if (emails.length === 0) {
        toast({ title: "Error", description: "Please enter at least one valid email address.", variant: "destructive" });
        return;
    }
    if (bulkRoles.length === 0) {
        toast({ title: "Error", description: "Please select at least one role to assign.", variant: "destructive" });
        return;
    }

    setIsBulkAdding(true);
    try {
        const { data, error } = await supabase.functions.invoke('bulk-create-users', {
            body: { emails, role_ids: bulkRoles },
        });

        if (error) throw error;

        const { createdCount = 0, errors = [] } = data || {};

        if (errors.length > 0) {
            const errorMessages = errors.map((e: any) => `${e.email}: ${e.error}`).join('\n');
            toast({
                title: `Completed with ${errors.length} errors`,
                description: (
                    <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
                        <code className="text-white">{errorMessages}</code>
                    </pre>
                ),
                variant: "destructive",
            });
        } else {
            toast({ title: "Success", description: `${createdCount} users created successfully.` });
        }

        if (createdCount > 0) {
            fetchData();
        }
        
        setBulkEmails("");
        setBulkRoles([]);
        document.getElementById('close-bulk-add-dialog')?.click();

    } catch (error: any) {
        toast({ title: "Function Error", description: error.message || "Failed to bulk add users. Make sure the 'bulk-create-users' Edge Function is deployed.", variant: "destructive" });
    } finally {
        setIsBulkAdding(false);
    }
  };


  const handleSendRecovery = async (email: string) => {
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        toast({ title: "Success", description: `Password recovery email sent to ${email}.` });
    } catch (error: any) {
        toast({ title: "Error", description: error.message || "Failed to send recovery email.", variant: "destructive" });
    }
  };

  const handleUpdateUserEmail = async () => {
    if (!editingUser || !updatedEmail) return;
    setIsSubmitting(true);
    try {
        const { error } = await supabase.functions.invoke('update-user', {
            body: { userId: editingUser.id, newEmail: updatedEmail }
        });
        if (error) throw error;
        toast({ title: "Success", description: "User email updated. A confirmation email has been sent to both addresses." });
        fetchData();
        document.getElementById('close-edit-dialog')?.click();
    } catch (error: any) {
        toast({ title: "Error", description: error.message || "Failed to update email.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };


  const handleDeleteUser = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('delete_user_by_admin', {
        user_id_to_delete: userId,
      });

      if (error) throw error;

      toast({ title: "Success", description: "User has been deleted." });
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast({ title: "Error", description: error.message || "Failed to delete user.", variant: "destructive" });
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const validBulkEmailsCount = bulkEmails.split(/[\n,;]+/).map(e => e.trim()).filter(e => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" /> User Management
        </h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <Dialog>
            <DialogTrigger asChild><Button variant="outline" className="w-full sm:w-auto"><UserPlus className="h-4 w-4 mr-2" /> Invite New User</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Invite New User</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label htmlFor="new-email">Email</Label><Input id="new-email" type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} /></div>
                <div className="space-y-2"><Label>Initial Roles</Label><MultiRoleSelect allRoles={allRoles} selectedRoleIds={newUserRoles} onRolesChange={setNewUserRoles} /></div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button id="close-invite-dialog" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
                <Button onClick={handleInviteUser} disabled={isSubmitting}>{isSubmitting ? "Sending..." : "Send Invitation"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto"><Users2 className="h-4 w-4 mr-2" /> Bulk Add Users</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Bulk Add Users</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="bulk-emails">Email Addresses</Label>
                        <Textarea
                            id="bulk-emails"
                            value={bulkEmails}
                            onChange={(e) => setBulkEmails(e.target.value)}
                            placeholder="Enter emails separated by commas, semicolons, or new lines."
                            rows={5}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Assign Roles</Label>
                        <MultiRoleSelect allRoles={allRoles} selectedRoleIds={bulkRoles} onRolesChange={setBulkRoles} />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button id="close-bulk-add-dialog" variant="outline" disabled={isBulkAdding}>Cancel</Button></DialogClose>
                    <Button onClick={handleBulkAddUsers} disabled={isBulkAdding || validBulkEmailsCount === 0}>
                        {isBulkAdding ? "Creating..." : `Create ${validBulkEmailsCount} Users`}
                    </Button>
                </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage User Roles & Profiles</CardTitle>
           <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by email..."
                className="pl-10 h-12 text-base w-full max-w-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profile URL</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roles</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Input value={user.profile_url || ""} onChange={(e) => handleProfileUrlChange(user.id, e.target.value)} placeholder="https://example.com/profile" className="w-48" />
                        <Button size="sm" variant="ghost" onClick={() => handleSaveProfileUrl(user.id)}><Save className="h-4 w-4" /></Button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <MultiRoleSelect allRoles={allRoles} selectedRoleIds={user.roles.map(r => r.id)} onRolesChange={(newRoleIds) => handleRolesChange(user.id, newRoleIds)} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <UserActions
                        user={user}
                        onSendRecovery={handleSendRecovery}
                        onEditUser={(user) => { setEditingUser(user); setUpdatedEmail(user.email || ''); }}
                        onDeleteUser={handleDeleteUser}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="block md:hidden space-y-4">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="p-4">
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs font-medium text-gray-500">Email</Label>
                    <p className="text-sm font-medium text-gray-900 break-all">{user.email}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-500">Profile URL</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input value={user.profile_url || ""} onChange={(e) => handleProfileUrlChange(user.id, e.target.value)} placeholder="https://example.com/profile" className="w-full" />
                      <Button size="icon" variant="ghost" onClick={() => handleSaveProfileUrl(user.id)}><Save className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-500">Roles</Label>
                    <div className="mt-1">
                       <MultiRoleSelect allRoles={allRoles} selectedRoleIds={user.roles.map(r => r.id)} onRolesChange={(newRoleIds) => handleRolesChange(user.id, newRoleIds)} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-500">Actions</Label>
                    <div className="mt-1">
                       <UserActions
                        user={user}
                        onSendRecovery={handleSendRecovery}
                        onEditUser={(user) => { setEditingUser(user); setUpdatedEmail(user.email || ''); }}
                        onDeleteUser={handleDeleteUser}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {loading && (<div className="text-center py-8 text-muted-foreground">Loading users...</div>)}
          {!loading && filteredUsers.length === 0 && (<div className="text-center py-8 text-muted-foreground">No users found. Invite one to get started.</div>)}
        </CardContent>
      </Card>
      
      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit User: {editingUser?.email}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label htmlFor="update-email">Email Address</Label><Input id="update-email" type="email" value={updatedEmail} onChange={(e) => setUpdatedEmail(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button id="close-edit-dialog" variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button></DialogClose>
            <Button onClick={handleUpdateUserEmail} disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UserActions({ user, onSendRecovery, onEditUser, onDeleteUser }: { user: UserData, onSendRecovery: (email: string) => void, onEditUser: (user: UserData) => void, onDeleteUser: (id: string) => void }) {
  return (
    <AlertDialog>
      <Dialog>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm"><MoreHorizontal /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DialogTrigger asChild>
                <DropdownMenuItem onSelect={() => onEditUser(user)}><Mail className="h-4 w-4 mr-2" /> Update Email</DropdownMenuItem>
            </DialogTrigger>
            <AlertDialogTrigger asChild>
                <DropdownMenuItem><KeyRound className="h-4 w-4 mr-2" /> Send Password Recovery</DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogTrigger asChild>
                <DropdownMenuItem className="text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Delete User</DropdownMenuItem>
            </AlertDialogTrigger>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* This content is for Send Recovery and Delete User */}
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will send a password recovery link to {user.email}. Or are you trying to delete the user permanently?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onSendRecovery(user.email!)}>Send Recovery Email</AlertDialogAction>
            <AlertDialogAction className={buttonVariants({ variant: "destructive"})} onClick={() => onDeleteUser(user.id)}>Delete User</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </Dialog>
    </AlertDialog>
  );
}

function MultiRoleSelect({ allRoles, selectedRoleIds, onRolesChange }: { allRoles: Role[], selectedRoleIds: string[], onRolesChange: (ids: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const handleSelect = (roleId: string) => {
    const newSelection = selectedRoleIds.includes(roleId) ? selectedRoleIds.filter(id => id !== roleId) : [...selectedRoleIds, roleId];
    onRolesChange(newSelection);
  };
  const selectedRoles = allRoles.filter(r => selectedRoleIds.includes(r.id));
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full sm:w-[250px] h-auto min-h-10 justify-between">
          <div className="flex gap-1 flex-wrap">
            {selectedRoles.length > 0 ? selectedRoles.map(r => <Badge key={r.id} variant="secondary">{r.role_name}</Badge>) : "Select roles..."}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search roles..." />
          <CommandList>
            <CommandEmpty>No roles found.</CommandEmpty>
            <CommandGroup>
              {allRoles.map((role) => (
                <CommandItem key={role.id} onSelect={() => handleSelect(role.id)} className="cursor-pointer">
                  <Checkbox checked={selectedRoleIds.includes(role.id)} className="mr-2" />
                  {role.role_name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}