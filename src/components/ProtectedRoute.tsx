import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "admin" | "user";
}

const ProtectedRoute = ({ children, requiredRole = undefined }: ProtectedRouteProps) => {
  const { user, isLoading, role } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Log access attempts when the user's authentication state changes.
    if (!isLoading) {
      if (!user) {
        console.warn(`🔒 Unauthorized access attempt to ${location.pathname}. Redirecting to /auth.`);
      } else if (requiredRole && role !== requiredRole) {
        console.warn(`🛡️ Access denied for user '${user.email}' (role: ${role}) to ${location.pathname}. Required role: ${requiredRole}.`);
      } else {
        console.log(`✅ User '${user.email}' (role: ${role}) successfully accessed ${location.pathname}.`);
      }
    }
  }, [user, isLoading, requiredRole, role, location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card className="shadow-glow border-0 bg-card/80 backdrop-blur-sm">
          <CardContent className="text-center py-8">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-primary-foreground font-bold text-sm">NB</span>
            </div>
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;