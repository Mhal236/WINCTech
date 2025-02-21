import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Home, Briefcase, Calendar, Settings, User } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Briefcase, label: "Jobs", href: "/JobSwipe" },
  { icon: Calendar, label: "Schedule", href: "/Calendar" },
  { icon: User, label: "Profile", href: "/Contact" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="pb-16"> {/* Add padding bottom to account for nav bar */}
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 sm:hidden">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full",
                  "text-xs font-medium",
                  isActive 
                    ? "text-red-600" 
                    : "text-gray-500 hover:text-gray-900"
                )}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sidebar - hidden on mobile */}
      <nav className="hidden sm:block fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200">
        <Sidebar />
      </nav>
    </div>
  );
}

