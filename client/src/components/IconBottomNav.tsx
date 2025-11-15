import { useLocation } from "wouter";
import { FolderOpen, Sparkles, Share2, Plus, School } from "lucide-react";

export default function IconBottomNav() {
  const [location, setLocation] = useLocation();

  const navItems = [
    { path: "/", icon: Plus, label: "Create", testId: "nav-create" },
    { path: "/titleix", icon: School, label: "Title IX", testId: "nav-title-ix" },
    { path: "/files", icon: FolderOpen, label: "Contracts", testId: "nav-files" },
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
              className={`flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-0 hover-elevate active-elevate-2 ${
                isActive
                  ? "text-green-600 dark:text-green-400"
                  : "text-muted-foreground"
              }`}
              data-testid={item.testId}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              {typeof Icon === "string" ? (
                <span className="text-lg">
                  {Icon}
                </span>
              ) : (
                <Icon className="h-5 w-5" />
              )}
              <span className="text-xs">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
