import { useLocation } from "wouter";
import { FolderOpen, Sparkles, Share2 } from "lucide-react";

export default function IconBottomNav() {
  const [location, setLocation] = useLocation();

  const navItems = [
    { path: "/", icon: "IX", label: "Info", testId: "nav-title-ix" },
    { path: "/files", icon: FolderOpen, label: "Files", testId: "nav-files" },
    { path: "/custom", icon: Sparkles, label: "Custom", testId: "nav-custom" },
    { path: "/share", icon: Share2, label: "Share", testId: "nav-share" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-card-border z-40">
      <div className="max-w-md mx-auto px-2 h-16 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className="flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-0 hover-elevate active-elevate-2"
              data-testid={item.testId}
              aria-label={item.label}
            >
              {typeof Icon === "string" ? (
                <span className={`text-lg ${isActive ? "font-bold" : "font-normal"}`}>
                  {Icon}
                </span>
              ) : (
                <Icon className="h-5 w-5" />
              )}
              <span className={`text-xs ${isActive ? "font-bold" : "font-normal"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
