import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, CalendarDays, Filter, Plus, Search, SortAsc, SortDesc, Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Notice {
  id: string;
  title: string;
  content: string;
  department: string;
  priority: "low" | "medium" | "high" | "urgent";
  created_at: string;
  author: string;
  tags: string[];
  image_url?: string;
  user_id: string;
  is_archived: boolean;
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
  low: "bg-green-100 text-green-800 border-green-300",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
  high: "bg-orange-100 text-orange-800 border-orange-300",
  urgent: "bg-red-100 text-red-800 border-red-300"
};

// Custom auto-resizing textarea component
const AutoResizeTextarea = ({ value, onChange, placeholder, className = "" }: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto to get the correct scrollHeight
      textareaRef.current.style.height = "auto";
      // Set the height to the scrollHeight to fit the content
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`resize-none overflow-hidden min-h-[120px] p-2 border rounded-md ${className}`}
      style={{ minHeight: '120px' }}
    />
  );
};

const NoticeBoard = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch notices from Supabase
  const { data: notices = [], isLoading } = useQuery({
    queryKey: ["notices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .eq("is_archived", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Create notice mutation
  const createNoticeMutation = useMutation({
    mutationFn: async (newNotice: {
      title: string;
      content: string;
      department: string;
      priority: string;
      author: string;
      tags: string[];
      imageFile?: File;
    }) => {
      let imageUrl = undefined;

      // Upload image if provided
      if (newNotice.imageFile) {
        const fileExt = newNotice.imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `notice-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('notices')
          .upload(filePath, newNotice.imageFile);

        if (uploadError) {
          throw new Error(`Image upload failed: ${uploadError.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('notices')
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
      }

      const { data, error } = await supabase
        .from("notices")
        .insert({
          title: newNotice.title,
          content: newNotice.content,
          department: newNotice.department,
          priority: newNotice.priority,
          author: newNotice.author,
          tags: newNotice.tags,
          image_url: imageUrl,
          user_id: user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notices"] });
      toast({
        title: "Notice Created",
        description: "Your notice has been published successfully."
      });
      setNewNotice({
        title: "",
        content: "",
        department: "",
        priority: "medium",
        author: "",
        tags: "",
        imageFile: undefined,
        imagePreview: ""
      });
      setActiveTab("viewer");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create notice. Please try again.",
        variant: "destructive"
      });
    }
  });

  const [activeTab, setActiveTab] = useState("viewer");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isUploading, setIsUploading] = useState(false);

  const [newNotice, setNewNotice] = useState({
    title: "",
    content: "",
    department: "",
    priority: "medium" as const,
    author: "",
    tags: "",
    imageFile: undefined as File | undefined,
    imagePreview: ""
  });

  const filteredAndSortedNotices = useMemo(() => {
    if (!notices) return [];

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG, GIF, etc.)",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setNewNotice(prev => ({
        ...prev,
        imageFile: file,
        imagePreview: e.target?.result as string
      }));
      setIsUploading(false);
    };
    reader.onerror = () => {
      toast({
        title: "Error",
        description: "Failed to read the image file",
        variant: "destructive"
      });
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removeImage = () => {
    setNewNotice(prev => ({
      ...prev,
      imageFile: undefined,
      imagePreview: ""
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCreateNotice = () => {
    if (!newNotice.title || !newNotice.content || !newNotice.department || !newNotice.author) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const noticeData = {
      title: newNotice.title,
      content: newNotice.content,
      department: newNotice.department,
      priority: newNotice.priority,
      author: newNotice.author,
      tags: newNotice.tags ? newNotice.tags.split(',').map(tag => tag.trim()) : [],
      imageFile: newNotice.imageFile
    };

    createNoticeMutation.mutate(noticeData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 animate-fade-in">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center animate-scale-in">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent mb-4 leading-tight">
            Department Notice Board
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
            Stay connected with the latest announcements, updates, and important information from your academic community
          </p>
        </div>

        {/* Main Layout with Right Sidebar */}
        <div className="flex gap-6 max-w-7xl mx-auto">
          {/* Main Content */}
          <div className="flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 h-12 bg-white/80 backdrop-blur-sm border shadow-md">
                <TabsTrigger value="viewer" className="flex items-center gap-2 text-base font-medium h-10 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <CalendarDays className="h-5 w-5" />
                  Notice Viewer
                </TabsTrigger>
                {role === 'admin' && (
                  <TabsTrigger value="creator" className="flex items-center gap-2 text-base font-medium h-10 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    <Plus className="h-5 w-5" />
                    Create Notice
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="viewer" className="space-y-6">
                {/* Filters and Search */}
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <Filter className="h-6 w-6 text-blue-600" />
                      Filters & Search
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1">
                        <Label htmlFor="search">Search Notices</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
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
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Notices Grid */}
                <div className="grid gap-4">
                  {isLoading ? (
                    <Card className="shadow-md">
                      <CardContent className="text-center py-12">
                        <Calendar className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Loading notices...</h3>
                        <p className="text-gray-500">Please wait while we fetch the latest notices</p>
                      </CardContent>
                    </Card>
                  ) : filteredAndSortedNotices.length === 0 ? (
                    <Card className="shadow-md">
                      <CardContent className="text-center py-12">
                        <Calendar className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No notices found</h3>
                        <p className="text-gray-500">
                          {searchTerm || selectedDepartment !== "all"
                            ? "Try adjusting your search criteria"
                            : "No notices have been posted yet"}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    filteredAndSortedNotices.map((notice) => (
                      <Card
                        key={notice.id}
                        className="shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-fade-in cursor-pointer"
                        onClick={() => navigate(`/notice/${notice.id}`)}
                      >
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
                          </div>
                        )}
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <CardTitle className="text-xl mb-2 leading-tight">{notice.title}</CardTitle>
                              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                                <span className="font-medium">{notice.department}</span>
                                <span>•</span>
                                <span>{notice.author}</span>
                                <span>•</span>
                                <span>{new Date(notice.created_at).toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })}</span>
                              </div>
                            </div>
                            <Badge
                              className={`${priorityColors[notice.priority]} text-xs px-2 py-0.5 ml-2 flex-shrink-0`}
                            >
                              {notice.priority.toUpperCase()}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-gray-700 leading-relaxed mb-4 whitespace-pre-wrap break-words">
                            {notice.content}
                          </div>
                          {notice.tags && notice.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {notice.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              {role === 'admin' && (
                <TabsContent value="creator" className="space-y-6">
                  <Card className="shadow-md">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        Create New Notice
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">Notice Title *</Label>
                          <Input
                            id="title"
                            placeholder="Enter notice title"
                            value={newNotice.title}
                            onChange={(e) => setNewNotice(prev => ({ ...prev, title: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="author">Author *</Label>
                          <Input
                            id="author"
                            placeholder="Your name"
                            value={newNotice.author}
                            onChange={(e) => setNewNotice(prev => ({ ...prev, author: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dept">Department *</Label>
                          <Select
                            value={newNotice.department}
                            onValueChange={(value) => setNewNotice(prev => ({ ...prev, department: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                              {departments.map(dept => (
                                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="priority">Priority</Label>
                          <Select
                            value={newNotice.priority}
                            onValueChange={(value: any) => setNewNotice(prev => ({ ...prev, priority: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="content">Notice Content *</Label>
                        <AutoResizeTextarea
                          value={newNotice.content}
                          onChange={(e) => setNewNotice(prev => ({ ...prev, content: e.target.value }))}
                          placeholder="Enter the notice content"
                          className="w-full border rounded-md p-2"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tags">Tags (comma-separated)</Label>
                        <Input
                          id="tags"
                          placeholder="e.g., important, deadline, announcement"
                          value={newNotice.tags}
                          onChange={(e) => setNewNotice(prev => ({ ...prev, tags: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="image">Notice Image (Optional)</Label>
                        <div className="space-y-2">
                          <input
                            id="image"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            ref={fileInputRef}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={triggerFileInput}
                            disabled={isUploading}
                            className="w-full flex items-center gap-2"
                          >
                            <Upload className="h-4 w-4" />
                            {isUploading ? "Uploading..." : "Upload Image"}
                          </Button>
                          {newNotice.imagePreview && (
                            <div className="relative mt-2">
                              <img
                                src={newNotice.imagePreview}
                                alt="Preview"
                                className="w-full h-48 object-contain rounded-md border"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={removeImage}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                          <div className="text-xs text-gray-500">
                            <ImageIcon className="h-3 w-3 inline mr-1" />
                            Supported formats: JPEG, PNG, GIF, WEBP. Max size: 5MB
                          </div>
                        </div>
                      </div>
                      <div className="pt-6">
                        <Button
                          onClick={handleCreateNotice}
                          disabled={createNoticeMutation.isPending}
                          className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 h-12 text-base shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {createNoticeMutation.isPending ? (
                            <>Uploading...</>
                          ) : (
                            <>
                              <Plus className="h-5 w-5 mr-2" />
                              Publish Notice
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>

          {/* Right Sidebar - All Notices */}
          <div className="w-80 flex-shrink-0">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm sticky top-4">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-blue-600">All Notices</CardTitle>
                  <X className="h-4 w-4 text-gray-500 cursor-pointer hover:text-gray-700 transition-colors" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
                {notices.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">No notices available</p>
                  </div>
                ) : (
                  notices.map((notice) => (
                    <div
                      key={notice.id}
                      onClick={() => navigate(`/notice/${notice.id}`)}
                      className="p-3 rounded-lg bg-gray-50 border hover:bg-white transition-all duration-200 cursor-pointer hover:shadow-md"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-sm leading-tight text-gray-900">
                          {notice.title}
                        </h4>
                        <Badge
                          className={`${priorityColors[notice.priority]} text-xs px-2 py-0.5 ml-2 flex-shrink-0`}
                        >
                          {notice.priority.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(notice.created_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoticeBoard;