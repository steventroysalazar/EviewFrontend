import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";
  const next = isDark ? "light" : "dark";

  if (compact) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(next)}
        className="h-6 w-6 text-sidebar-foreground hover:bg-sidebar-accent"
        title={`Switch to ${next} mode`}
        aria-label={`Switch to ${next} mode`}
      >
        {isDark ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(next)}
      className="h-7 w-full justify-start gap-2 px-2 text-[12px] text-sidebar-foreground hover:bg-sidebar-accent"
    >
      {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
      <span>{isDark ? "Light mode" : "Dark mode"}</span>
    </Button>
  );
}
