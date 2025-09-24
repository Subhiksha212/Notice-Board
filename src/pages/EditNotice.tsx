import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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

const EditNotice = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [department, setDepartment] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [author, setAuthor] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");

  // Fetch notice from Supabase
  const { data: notice, isLoading } = useQuery({
    queryKey: ["notice", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // Update notice mutation
  const updateNoticeMutation = useMutation({
    mutationFn: async (updatedNotice: {
      title: string;
      content: string;
      department: string;
      priority: string;
      author: string;
      tags: string[];
      image_url?: string;
    }) => {
      const { error } = await supabase
        .from("notices")
        .update(updatedNotice)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notices"] });
      queryClient.invalidateQueries({ queryKey: ["notice", id] });
      toast({
        title: "Notice Updated",
        description: "The notice has been successfully updated."
      });
      navigate(`/notice/${id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update notice. Please try again.",
        variant: "destructive"
      });
    }
  });

  useEffect(() => {
    if (notice) {
      // Check if user can edit this notice
      if (user?.id !== notice.user_id) {
        toast({
          title: "Access Denied",
          description: "You can only edit notices that you created.",
          variant: "destructive"
        });
        navigate(`/notice/${id}`);
        return;
      }

      setTitle(notice.title);
      setContent(notice.content);
      setDepartment(notice.department);
      setPriority(notice.priority as "low" | "medium" | "high" | "urgent");
      setAuthor(notice.author);
      setTags(notice.tags || []);
      setTagsInput((notice.tags || []).join(", "));
      setImageUrl(notice.image_url || "");
    }
  }, [notice, user, id, navigate, toast]);

  const handleAddTag = () => {
    if (tagsInput.trim()) {
      const newTags = tagsInput.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0);
      setTags(newTags);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = tags.filter(tag => tag !== tagToRemove);
    setTags(updatedTags);
    setTagsInput(updatedTags.join(", "));
  };

  const handleSave = () => {
    if (!title.trim() || !content.trim() || !department || !author.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    handleAddTag();
    
    const updatedNotice = {
      title: title.trim(),
      content: content.trim(),
      department,
      priority,
      author: author.trim(),
      tags,
      image_url: imageUrl.trim() || undefined
    };

    updateNoticeMutation.mutate(updatedNotice);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">Loading notice...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!notice) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">Notice not found</p>
            <Button onClick={() => navigate("/")} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Notice Board
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button 
          onClick={() => navigate(`/notice/${id}`)} 
          variant="ghost" 
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Notice
        </Button>
      </div>

      <Card className="max-w-4xl mx-auto shadow-glow border-0 bg-card/70 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            Edit Notice
            <Badge className={priorityColors[priority]} variant="outline">
              {priority.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter notice title..."
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Author *</label>
              <Input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Your name"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Department *</label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Priority</label>
            <Select value={priority} onValueChange={(value: "low" | "medium" | "high" | "urgent") => setPriority(value)}>
              <SelectTrigger className="w-full md:w-48">
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

          <div className="space-y-2">
            <label className="text-sm font-medium">Content *</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter notice content..."
              className="min-h-[120px] w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Image URL (Optional)</label>
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Enter image URL..."
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tags</label>
            <div className="flex gap-2 mb-2">
              <Input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Enter tags separated by commas..."
                className="flex-1"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                Update Tags
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleSave} 
              disabled={updateNoticeMutation.isPending}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {updateNoticeMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
            <Button 
              onClick={() => navigate(`/notice/${id}`)} 
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditNotice;