import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, User, FileText, Edit, Trash2, Archive } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const priorityColors = {
  low: "bg-success-light text-success-foreground border-success",
  medium: "bg-warning-light text-warning-foreground border-warning", 
  high: "bg-destructive/10 text-destructive border-destructive",
  urgent: "bg-destructive text-destructive-foreground border-destructive"
};

const NoticeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Check if the current user has the 'admin' role
  const isAdmin = user?.role === 'admin';

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

  // Delete notice mutation
  const deleteNoticeMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notices")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notices"] });
      toast({
        title: "Notice Deleted",
        description: "The notice has been successfully deleted."
      });
      navigate("/");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete notice. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Archive notice mutation
  const archiveNoticeMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notices")
        .update({ is_archived: true })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notices"] });
      toast({
        title: "Notice Archived",
        description: "The notice has been successfully archived."
      });
      navigate("/");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to archive notice. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this notice? This action cannot be undone.")) {
      deleteNoticeMutation.mutate();
    }
  };

  const handleArchive = () => {
    if (window.confirm("Are you sure you want to archive this notice? It will be removed from the main view.")) {
      archiveNoticeMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-4xl mx-auto shadow-glow border-0 bg-card/70 backdrop-blur-sm">
          <CardContent className="text-center py-12">
            <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Loading notice...</h3>
            <p className="text-muted-foreground">Please wait while we fetch the notice details</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!notice) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="text-center py-8">
            <h2 className="text-xl font-semibold mb-2">Notice Not Found</h2>
            <p className="text-muted-foreground mb-4">The notice you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Notices
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // The creator can edit their own notice OR an admin can edit any notice
  const canModify = user?.id === notice.user_id || isAdmin;

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <Button 
            onClick={() => navigate('/')} 
            variant="ghost" 
            className="hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to All Notices
          </Button>
          
          {canModify && (
            <div className="flex gap-2">
              <Button 
                onClick={() => navigate(`/notice/${id}/edit`)} 
                variant="outline"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Notice
              </Button>
              <Button 
                onClick={handleDelete}
                disabled={deleteNoticeMutation.isPending}
                variant="destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleteNoticeMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
              <Button
                onClick={handleArchive}
                disabled={archiveNoticeMutation.isPending}
                variant="secondary"
              >
                <Archive className="h-4 w-4 mr-2" />
                {archiveNoticeMutation.isPending ? "Archiving..." : "Archive"}
              </Button>
            </div>
          )}
        </div>
        
        <Card className="shadow-glow border-0 bg-card/70 backdrop-blur-sm">
          {notice.image_url && (
            <div className="relative h-64 overflow-hidden rounded-t-lg">
              <img 
                src={notice.image_url} 
                alt={notice.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          )}
          
          <CardHeader className="space-y-4">
            <div className="flex items-start justify-between">
              <CardTitle className="text-3xl font-display text-primary pr-4">
                {notice.title}
              </CardTitle>
              <Badge className={`${priorityColors[notice.priority as keyof typeof priorityColors]} flex-shrink-0`}>
                {notice.priority.toUpperCase()}
              </Badge>
            </div>
            
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(notice.created_at).toLocaleDateString('en-US', { 
                    day: '2-digit', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{notice.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>{notice.department}</span>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="prose prose-sm max-w-none">
              <p className="text-foreground text-base leading-relaxed whitespace-pre-wrap">
                {notice.content}
              </p>
            </div>
            
            {notice.tags && notice.tags.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {notice.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NoticeDetail;