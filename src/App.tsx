import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";

import { EvAuthProvider } from "@/contexts/EvAuthContext";
import { AlarmProvider } from "@/lib/alarmStore";
import { EvProtectedRoute } from "@/components/EvProtectedRoute";
import { EvLayout } from "@/components/EvLayout";

import Login from "./pages/ev/Login";
import Register from "./pages/ev/Register";
import Dashboard from "./pages/ev/Dashboard";
import Companies from "./pages/ev/Companies";
import Locations from "./pages/ev/Locations";
import Users from "./pages/ev/Users";
import UserDetail from "./pages/ev/UserDetail";
import Devices from "./pages/ev/Devices";
import DeviceDetail from "./pages/ev/DeviceDetail";
import BulkSim from "./pages/ev/BulkSim";
import Messages from "./pages/ev/Messages";
import Alerts from "./pages/ev/Alerts";
import ErrorLogs from "./pages/ev/ErrorLogs";
import Webhooks from "./pages/ev/Webhooks";
import EvSettings from "./pages/ev/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const Protected = ({ children }: { children: React.ReactNode }) => (
  <EvProtectedRoute>
    <EvLayout>{children}</EvLayout>
  </EvProtectedRoute>
);

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <EvAuthProvider>
            <AlarmProvider>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
                  <Route path="/companies" element={<Protected><Companies /></Protected>} />
                  <Route path="/locations" element={<Protected><Locations /></Protected>} />
                  <Route path="/users" element={<Protected><Users /></Protected>} />
                  <Route path="/users/:userId" element={<Protected><UserDetail /></Protected>} />
                  <Route path="/devices" element={<Protected><Devices /></Protected>} />
                  <Route path="/devices/sim/bulk" element={<Protected><BulkSim /></Protected>} />
                  <Route path="/devices/:deviceId" element={<Protected><DeviceDetail /></Protected>} />
                  <Route path="/messages" element={<Protected><Messages /></Protected>} />
                  <Route path="/alerts" element={<Protected><Alerts /></Protected>} />
                  <Route path="/admin/error-logs" element={<Protected><ErrorLogs /></Protected>} />
                  <Route path="/admin/webhooks" element={<Protected><Webhooks /></Protected>} />
                  <Route path="/settings" element={<Protected><EvSettings /></Protected>} />

                  <Route path="*" element={<NotFound />} />
                </Routes>
            </AlarmProvider>
          </EvAuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
