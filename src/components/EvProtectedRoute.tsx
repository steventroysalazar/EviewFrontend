import { Navigate } from "react-router-dom";
import { useEvAuth } from "@/contexts/EvAuthContext";

export function EvProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useEvAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
