import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import NoticeDetail from "./pages/NoticeDetail";
import EditNotice from "./pages/EditNotice";
import CalendarView from "./pages/Calendar";
import Archive from "./pages/Archive";
import UserManagement from "./pages/UserManagement";
import Settings from "./pages/Settings";

// Define the base name for routing.
// IMPORTANT: This must match your GitHub repository name prefixed with a slash.
// Your repository name is 'Notice-Board'.
const basename = import.meta.env.MODE === "production" ? "/Notice-Board" : "/";

// Create a new QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Main application content, wrapped in providers
const AppContent = () => {
  const { user, signOut, role } = useAuth();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-gradient-subtle">
        <AppSidebar role={role} />
        <div className="flex-1 flex flex-col">
          <header className="h-16 flex items-center justify-between border-b bg-card/80 backdrop-blur-sm px-6 shadow-sm sticky top-0 z-40">
            <div className="flex items-center">
              <SidebarTrigger className="mr-4 p-2 hover:bg-accent rounded-lg transition-colors" />
              <div className="w-1 h-6 bg-border mr-4"></div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">NB</span>
                </div>
                <h2 className="font-bold text-lg bg-gradient-primary bg-clip-text text-transparent">
                  Department Notice Board
                </h2>
              </div>
            </div>
            {user && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground hidden md:block">
                  {user.email} {role && `(${role})`}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={signOut}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            )}
          </header>
          <main className="flex-1 overflow-auto">
            <Routes>
              {/* Public Route for authentication */}
              <Route path="/auth" element={<Auth />} />

              {/* Protected Routes for all authenticated users */}
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/notices" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/notice/:id" element={<ProtectedRoute><NoticeDetail /></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute><CalendarView /></ProtectedRoute>} />
              <Route path="/archive" element={<ProtectedRoute><Archive /></ProtectedRoute>} />
              
              {/* Protected Routes for Admins Only */}
              <Route path="/notice/:id/edit" element={<ProtectedRoute requiredRole="admin"><EditNotice /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute requiredRole="admin"><UserManagement /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute requiredRole="admin"><Settings /></ProtectedRoute>} />

              {/* Fallback route for 404 Not Found */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

// Top-level App component with all providers
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {/*
          💡 IMPORTANT: Added 'basename' to BrowserRouter for GitHub Pages deployment
          This ensures routes work correctly in production
        */}
        <BrowserRouter basename={basename}>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;