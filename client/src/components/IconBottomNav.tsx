import { useLocation } from "wouter";
import { FolderOpen, Sparkles, Share2, Plus, School, Wrench, User } from "lucide-react";

export default function IconBottomNav() {
  const [location, setLocation] = useLocation();

  const navItems = [
    { path: "/", icon: Plus, label: "Create", testId: "nav-create" },
    { path: "/tools", icon: Wrench, label: "Tools", testId: "nav-tools" },
    { path: "/files", icon: FolderOpen, label: "Contracts", testId: "nav-files" },
    { path: "/profile", icon: User, label: "Profile", testId: "nav-profile" },
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
                  ? "text-success"
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
