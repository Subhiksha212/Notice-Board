import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Archive as ArchiveIcon, Search, SortAsc, SortDesc, Download, RotateCcw, Eye, Calendar, Filter } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ArchivedNotice {
  id: string;
  title: string;
  content: string;
  department: string;
  priority: "low" | "medium" | "high" | "urgent";
  author: string;
  tags: string[];
  image_url?: string;
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

const priorityColors = {
  low: "bg-success-light text-success-foreground border-success",
  medium: "bg-warning-light text-warning-foreground border-warning", 
  high: "bg-destructive/10 text-destructive border-destructive",
  urgent: "bg-destructive text-destructive-foreground border-destructive"
};

const Archive = () => {
  const navigate = useNavigate();
  const [notices, setNotices] = useState<ArchivedNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetchArchivedNotices();
  }, []);

  const fetchArchivedNotices = async () => {
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .eq('is_archived', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setNotices((data || []).map(notice => ({
        ...notice,
        priority: notice.priority as "low" | "medium" | "high" | "urgent",
        tags: notice.tags || []
      })));
    } catch (error) {
      console.error('Error fetching archived notices:', error);
      toast({
        title: "Error",
        description: "Failed to load archived notices",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const restoreNotice = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notices')
        .update({ is_archived: false })
        .eq('id', id);

      if (error) throw error;

      setNotices(prev => prev.filter(notice => notice.id !== id));
      toast({
        title: "Notice Restored",
        description: "The notice has been restored to active notices.",
        variant: "default"
      });
    } catch (error) {
      console.error('Error restoring notice:', error);
      toast({
        title: "Error",
        description: "Failed to restore notice",
        variant: "destructive"
      });
    }
  };

  const filteredAndSortedNotices = useMemo(() => {
    let filtered = notices.filter(notice => {
      const matchesSearch = notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           notice.content.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment = selectedDepartment === "all" || notice.department === selectedDepartment;
      return matchesSearch && matchesDepartment;
    });

    return filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });
  }, [notices, searchTerm, selectedDepartment, sortOrder]);

  const handleExport = () => {
    const exportData = {
      archivedNotices: filteredAndSortedNotices,
      exportDate: new Date().toISOString(),
      totalNotices: filteredAndSortedNotices.length
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `archived-notices-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: "Archived notices have been exported successfully.",
      variant: "default"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card className="w-96 shadow-glow">
          <CardContent className="text-center py-12">
            <ArchiveIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4 animate-pulse" />
            <h3 className="text-lg font-semibold mb-2">Loading Archive...</h3>
            <p className="text-muted-foreground">Please wait while we fetch archived notices</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle animate-fade-in">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center animate-scale-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center">
              <ArchiveIcon className="h-7 w-7 text-accent-foreground" />
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold bg-gradient-hero bg-clip-text text-transparent leading-tight">
              Notice Archive
            </h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Browse through archived notices and announcements. You can restore notices or export them for record keeping.
          </p>
        </div>

        {/* Filters and Search */}
        <Card className="shadow-glow border-0 bg-card/70 backdrop-blur-sm mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl font-display">
              <Filter className="h-6 w-6 text-primary" />
              Search & Filter Archive
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Search Archived Notices</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by title or content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
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
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                  title={`Sort ${sortOrder === "desc" ? "oldest first" : "newest first"}`}
                >
                  {sortOrder === "desc" ? <SortDesc className="h-4 w-4" /> : <SortAsc className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExport}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Archive Grid */}
        <div className="grid gap-4">
          {filteredAndSortedNotices.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="text-center py-12">
                <ArchiveIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No archived notices found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || selectedDepartment !== "all" 
                    ? "Try adjusting your search criteria" 
                    : "No notices have been archived yet"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredAndSortedNotices.map((notice) => (
              <Card key={notice.id} className="shadow-card hover:shadow-lg transition-all duration-300 animate-fade-in">
                {notice.image_url && (
                  <div className="relative h-48 overflow-hidden rounded-t-lg">
                    <img 
                      src={notice.image_url} 
                      alt={notice.title}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    <div className="absolute top-4 right-4">
                      <Badge variant="secondary" className="bg-card/80 backdrop-blur-sm">
                        <ArchiveIcon className="h-3 w-3 mr-1" />
                        Archived
                      </Badge>
                    </div>
                  </div>
                )}
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2 leading-tight">{notice.title}</CardTitle>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium">{notice.department}</span>
                        <span>•</span>
                        <span>{notice.author}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(notice.created_at).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                    </div>
                    <Badge className={`${priorityColors[notice.priority]} transition-colors`}>
                      {notice.priority.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground leading-relaxed mb-4 line-clamp-3">{notice.content}</p>
                  {notice.tags && notice.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {notice.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/notice/${notice.id}`)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => restoreNotice(notice.id)}
                      className="flex items-center gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Restore
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Archive;