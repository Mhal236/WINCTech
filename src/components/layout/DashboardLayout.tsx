import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Home, Briefcase, Calendar, Settings, User } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Briefcase, label: "Jobs", href: "/job-swipe" },
  { icon: Calendar, label: "Schedule", href: "/calendar" },
  { icon: User, label: "Profile", href: "/contact" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <Sidebar>
      <div className="p-3 sm:p-4 md:p-6 h-full overflow-y-auto">
        {children}
      </div>
      
      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-md border border-gray-200 
        rounded-full shadow-xl w-[90%] max-w-md z-[2000] sm:hidden safe-area-pb">
        <div className="flex justify-around items-center h-14 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center p-2 rounded-full transition-colors",
                  "text-xs font-medium min-w-[44px] min-h-[44px]", // Improved touch targets
                  isActive 
                    ? "text-[#145484] bg-[#145484]/10" 
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="sr-only">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </Sidebar>
  );
}

