import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  MapPin,
  Users,
  Cpu,
  MessageSquare,
  Bell,
  AlertTriangle,
  Webhook,
  Smartphone,
  Settings,
  LogOut,
  Menu,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { StackedLogo } from "./StackedLogo";
import { useAlarms } from "@/lib/alarmStore";
import { useEvAuth } from "@/contexts/EvAuthContext";
import { ThemeToggle } from "./ThemeToggle";

const SimIcon = Smartphone;

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/companies", label: "Companies", icon: Building2 },
  { to: "/locations", label: "Locations", icon: MapPin },
  { to: "/users", label: "Users", icon: Users },
  { to: "/devices", label: "Devices", icon: Cpu },
  { to: "/devices/sim/bulk", label: "Bulk SIM", icon: SimIcon },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/admin/error-logs", label: "Error Logs", icon: AlertTriangle },
  { to: "/admin/webhooks", label: "Webhooks", icon: Webhook },
  { to: "/settings", label: "Settings", icon: Settings },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const { connected } = useAlarms();
  const { user, logout } = useEvAuth();

  const initials =
    `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase() ||
    (user?.email?.[0] ?? "U").toUpperCase();

  return (
    <>
      <div className="flex items-center gap-2 px-3 h-11 border-b border-sidebar-border">
        <StackedLogo size={16} color="currentColor" />
        <span className="font-bold uppercase tracking-[0.08em] text-[14px] text-sidebar-accent-foreground">
          EV12
        </span>
        <span
          className={cn(
            "ml-auto inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded",
            connected ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
          )}
          title={connected ? "Live alarm stream connected" : "Alarm stream offline"}
        >
          <span className={cn("w-1.5 h-1.5 rounded-full", connected ? "bg-success" : "bg-muted-foreground")} />
          {connected ? "Live" : "Off"}
        </span>
      </div>

      <nav className="flex-1 py-1.5 px-1.5 space-y-px overflow-y-auto">
        {nav.map((item) => {
          const active =
            location.pathname === item.to ||
            (item.to !== "/" && location.pathname.startsWith(item.to + "/"));
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded text-[13px] transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-2 space-y-1">
        <div className="flex items-center gap-2 px-1">
          <div className="h-5 w-5 rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-[9px] flex items-center justify-center">
            {initials}
          </div>
          <span className="text-[12px] text-sidebar-foreground truncate flex-1">
            {user?.firstName ? `${user.firstName} ${user.lastName ?? ""}` : user?.email ?? "User"}
          </span>
          <ThemeToggle compact />
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="text-sidebar-foreground hover:bg-sidebar-accent h-6 w-6"
            title="Sign out"
          >
            <LogOut className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </>
  );
}

export function EvLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:flex flex-col bg-sidebar border-r border-sidebar-border h-screen sticky top-0 w-56">
        <NavList />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 flex md:hidden items-center justify-between h-11 border-b border-border bg-background px-3">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-56 bg-sidebar">
              <div className="flex flex-col h-full">
                <NavList onNavigate={() => setOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-1.5">
            <StackedLogo size={16} />
            <span className="font-bold uppercase tracking-[0.08em] text-[14px] text-foreground">EV12</span>
          </div>
          <div className="w-7" />
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
