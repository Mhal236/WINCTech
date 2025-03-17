import { cn } from "@/lib/utils";
import {
  Home,
  Briefcase,
  Calendar,
  Search,
  ClipboardList,
  BarChart,
  MessageCircle,
  Menu,
  Settings,
  LogOut,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

// Instead of importing from the public folder, reference the image using its absolute path.
const logo = "/windscreen-compare-technician.png";

export const Sidebar = ({ children }: { children?: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Update the navigation array with the DashboardLayout menu items
  const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Jobs", href: "/job-swipe", icon: Briefcase },
    { name: "Calendar", href: "/calendar", icon: Calendar },
    { name: "Glass Order", href: "/price-lookup", icon: Search },
    { name: "History", href: "/history", icon: ClipboardList },
    { name: "Reports", href: "/reporting", icon: BarChart },
    { name: "Contact Us", href: "/contact", icon: MessageCircle },
  ];

  const settingsNav = {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 z-40 h-screen transition-all bg-card border-r",
          collapsed ? "w-16" : "w-64",
          isMobile && !collapsed && "backdrop-blur-sm bg-background/80"
        )}
      >
        <div className="flex flex-col h-full px-3 py-4">
          <div className="flex justify-between items-center mb-6">
            {!collapsed ? (
              <div className="flex items-center gap-2">
                <div className="relative h-15 w-50 transition-all duration-300 overflow-hidden">
                  <img
                    src={logo}
                    alt="Windscreen Compare Trade"
                    className="h-full w-full object-contain object-left transition-all duration-300"
                  />
                </div>
              </div>
            ) : (
              <div className="relative h-12 w-12 overflow-hidden">
                <img
                  src={logo}
                  alt="Windscreen Compare Trade"
                  className="h-full w-full object-contain object-left transition-all duration-300"
                />
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-lg hover:bg-accent"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          <nav className="space-y-1 mt-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center px-2 py-2 text-sm rounded-md hover:bg-accent/50 transition-colors",
                  location.pathname === item.href && "ring-2 ring-accent",
                  collapsed && "justify-center"
                )}
              >
                <item.icon className="h-5 w-5 min-w-5" />
                {!collapsed && <span className="ml-3">{item.name}</span>}
              </Link>
            ))}
          </nav>

          {/* Bottom section with Settings and Logout */}
          <div className="mt-auto pt-4 border-t space-y-2">
            <Link
              to={settingsNav.href}
              className={cn(
                "flex items-center p-2 rounded-lg hover:bg-accent",
                location.pathname === settingsNav.href && "ring-2 ring-accent",
                collapsed ? "justify-center" : "space-x-3"
              )}
            >
              <settingsNav.icon className="h-5 w-5 min-w-5" />
              {!collapsed && <span className="ml-3">{settingsNav.name}</span>}
            </Link>
            <button
              className={cn(
                "flex items-center p-2 rounded-lg hover:bg-accent w-full",
                collapsed && "justify-center"
              )}
              onClick={() => {
                // Implement logout functionality here
              }}
            >
              <LogOut className="h-5 w-5 min-w-5" />
              {!collapsed && <span className="ml-3">Logout</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobile && !collapsed && (
        <div
          className="fixed inset-0 bg-black/20 z-30"
          onClick={() => setCollapsed(true)}
        />
      )}

      {/* Main content */}
      <main
        className={cn(
          "flex-1 w-full transition-all duration-200 overflow-y-auto",
          collapsed ? "pl-16" : "pl-64",
          isMobile && "pl-0"
        )}
      >
        {children}
      </main>
    </div>
  );
};
