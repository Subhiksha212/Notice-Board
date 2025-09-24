import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, UserPlus, Shield, Search, Filter, Edit, Trash2, Mail, Calendar, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  role: "admin" | "user";
  department: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const departments = [
  "Computer Science",
  "Information Technology", 
  "Electronics & Communication",
  "Mechanical Engineering",
  "Civil Engineering",
  "Administration",
  "Library",
  "Academic Affairs"
];

const roleColors = {
  admin: "bg-destructive text-destructive-foreground",
  user: "bg-success text-success-foreground"
};

type ViewType = "all" | "admin" | "user" | "active";

const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [currentView, setCurrentView] = useState<ViewType>("all");
  const [viewTitle, setViewTitle] = useState("All Users");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setUsers((data || []).map(user => ({
        ...user,
        role: user.role as "admin" | "user"
      })));
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      // Prevent deactivating admin
      const user = users.find(u => u.user_id === userId);
      if (user?.role === "admin") {
        toast({
          title: "Error",
          description: "Cannot deactivate admin user",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(user => 
        user.user_id === userId ? { ...user, is_active: !currentStatus } : user
      ));

      toast({
        title: currentStatus ? "User Deactivated" : "User Activated",
        description: `User has been ${currentStatus ? "deactivated" : "activated"}`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive"
      });
    }
  };

  const handleViewChange = (view: ViewType, title: string) => {
    setCurrentView(view);
    setViewTitle(title);
    // Reset search when changing view but keep filters for "all" view
    setSearchTerm("");
    if (view !== "all") {
      setSelectedRole("all");
      setSelectedDepartment("all");
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    const matchesDepartment = selectedDepartment === "all" || user.department === selectedDepartment;
    
    // Apply view filter
    let matchesView = true;
    if (currentView === "admin") {
      matchesView = user.role === "admin";
    } else if (currentView === "user") {
      matchesView = user.role === "user";
    } else if (currentView === "active") {
      matchesView = user.is_active;
    }
    
    return matchesSearch && matchesRole && matchesDepartment && matchesView;
  });

  // Count active users excluding admin
  const activeUsersCount = users.filter(u => u.is_active && u.role !== "admin").length;
  // Count regular users
  const regularUsersCount = users.filter(u => u.role === "user").length;
  // Count admin (should only be 1)
  const adminCount = users.filter(u => u.role === "admin").length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card className="w-96 shadow-glow">
          <CardContent className="text-center py-12">
            <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4 animate-pulse" />
            <h3 className="text-lg font-semibold mb-2">Loading Users...</h3>
            <p className="text-muted-foreground">Please wait while we fetch user data</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderUserList = () => (
    <div className="grid gap-4">
      {filteredUsers.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="text-center py-12">
            <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No users found</h3>
            <p className="text-muted-foreground">
              {searchTerm || selectedRole !== "all" || selectedDepartment !== "all"
                ? "Try adjusting your search criteria" 
                : "No users have been registered yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        filteredUsers.map((user) => (
          <Card key={user.id} className="shadow-card hover:shadow-lg transition-all duration-300 animate-fade-in">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.avatar_url || undefined} alt={user.display_name || "User"} />
                  <AvatarFallback className="text-lg font-semibold bg-gradient-primary text-primary-foreground">
                    {user.display_name ? user.display_name.charAt(0).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{user.display_name || 'Unnamed User'}</h3>
                    <Badge className={`${roleColors[user.role]} transition-colors`}>
                      {user.role.toUpperCase()}
                    </Badge>
                    {!user.is_active && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                  
                  <div className="space-y-1 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{user.email || 'No email provided'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <span>{user.department || 'No department assigned'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="flex items-center h-10 px-3 py-2 text-sm rounded-md border border-input bg-background">
                      {user.role === "admin" ? "Admin" : "User"}
                    </div>
                    
                    <Button
                      variant={user.is_active ? "destructive" : "default"}
                      size="sm"
                      onClick={() => toggleUserStatus(user.user_id, user.is_active)}
                      disabled={user.role === "admin"}
                    >
                      {user.is_active ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  const renderMainView = () => (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card 
          className="shadow-card cursor-pointer transition-all hover:shadow-lg"
          onClick={() => handleViewChange("admin", "Administrators")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{adminCount}</p>
                <p className="text-sm text-muted-foreground">Administrator</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card 
          className="shadow-card cursor-pointer transition-all hover:shadow-lg"
          onClick={() => handleViewChange("user", "Users")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{regularUsersCount}</p>
                <p className="text-sm text-muted-foreground">Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card 
          className="shadow-card cursor-pointer transition-all hover:shadow-lg"
          onClick={() => handleViewChange("active", "Active Users")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeUsersCount}</p>
                <p className="text-sm text-muted-foreground">Active Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search for All Users view */}
      <Card className="shadow-glow border-0 bg-card/70 backdrop-blur-sm mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl font-display">
            <Filter className="h-6 w-6 text-primary" />
            Search & Filter Users
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Users</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-40">
              <Label htmlFor="role">Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <Label htmlFor="department">Department</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Grid */}
      {renderUserList()}
    </>
  );

  const renderFilteredView = () => (
    <>
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => handleViewChange("all", "All Users")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to All Users
        </Button>
        <h2 className="text-2xl font-semibold">{viewTitle}</h2>
      </div>

      {/* Only show search in filtered views */}
      <Card className="shadow-glow border-0 bg-card/70 backdrop-blur-sm mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl font-display">
            <Search className="h-6 w-6 text-primary" />
            Search {viewTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${viewTitle.toLowerCase()} by name or email...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Grid */}
      {renderUserList()}
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-subtle animate-fade-in">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center animate-scale-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center">
              <Users className="h-7 w-7 text-accent-foreground" />
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold bg-gradient-hero bg-clip-text text-transparent leading-tight">
              User Management
            </h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Manage user accounts, roles, and permissions. View user activity and control access to the notice board system.
          </p>
        </div>

        {currentView === "all" ? renderMainView() : renderFilteredView()}
      </div>
    </div>
  );
};

export default UserManagement;