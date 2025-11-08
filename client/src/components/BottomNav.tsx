import { Info, Mic, FileText, FolderOpen } from "lucide-react";
import { useLocation, Link } from "wouter";

const tabs = [
  { id: "info", label: "Info", icon: Info, path: "/" },
  { id: "record", label: "Record", icon: Mic, path: "/record" },
  { id: "contract", label: "Contract", icon: FileText, path: "/contract" },
  { id: "files", label: "Files", icon: FolderOpen, path: "/files" },
];

export default function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-card-border z-50">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location === tab.path;
          
          return (
            <Link key={tab.id} href={tab.path}>
              <button
                className="flex flex-col items-center justify-center gap-1 px-4 py-2 min-w-[60px] hover-elevate active-elevate-2 rounded-lg transition-colors"
                data-testid={`nav-${tab.id}`}
              >
                <Icon
                  className={`h-5 w-5 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <span
                  className={`text-xs ${
                    isActive ? "font-semibold text-foreground" : "font-normal text-muted-foreground"
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
