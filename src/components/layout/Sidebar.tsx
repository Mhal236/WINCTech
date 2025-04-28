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
  LockIcon,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { UserProfile } from "@/components/auth/UserProfile";
import { Separator } from "@/components/ui/separator";
import { useRoleBasedAccess } from "@/components/auth/RoleBasedAccess";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Reference the logo image from the public folder
const logo = "/windscreen-compare-technician.png";

export const Sidebar = ({ children }: { children?: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { hasPermission, isAdmin, user } = useRoleBasedAccess();

  // Define navigation items with their required roles
  const navigation = [
    { name: "Dashboard", href: "/", icon: Home, requiredRole: "user" },
    { name: "Jobs", href: "/job-swipe", icon: Briefcase, requiredRole: "admin" },
    { name: "Calendar", href: "/calendar", icon: Calendar, requiredRole: "admin" },
    { name: "Glass Order", href: "/price-lookup", icon: Search, requiredRole: "user" },
    { name: "History", href: "/history", icon: ClipboardList, requiredRole: "user" },
    { name: "Reports", href: "/reporting", icon: BarChart, requiredRole: "user" },
    { name: "Contact Us", href: "/contact", icon: MessageCircle, requiredRole: "user" },
  ];

  const settingsNav = {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    requiredRole: "user"
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
                <div className="relative h-12 transition-all duration-300 overflow-hidden py-1">
                  <img
                    src={logo}
                    alt="Windscreen Compare Technician"
                    className="h-full object-contain max-w-[180px]"
                  />
                </div>
              </div>
            ) : (
              <div className="relative h-8 w-8 overflow-hidden mx-auto">
                <img
                  src={logo}
                  alt="Windscreen Compare Technician"
                  className="h-full w-full object-contain"
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
          
          {/* User Profile */}
          <UserProfile collapsed={collapsed} className="px-2" />
          <Separator className="my-2" />

          <nav className="space-y-1 mt-6">
            {navigation.map((item) => {
              // Special check for restricted users - block History and Reports
              const isMasterAutoGlassEmail = user?.email?.endsWith('@master-auto-glass.com') || false;
              const isRestrictedPage = item.href === '/history' || item.href === '/reporting';
              const isRestrictedUser = user?.name === 'Mehrdad' || isMasterAutoGlassEmail;
              
              const isRestricted = isRestrictedUser && isRestrictedPage;
              
              // User has access if they have the required role AND aren't restricted from this page
              const hasAccess = hasPermission(item.requiredRole) && !isRestricted;
              
              return (
                <TooltipProvider key={item.name}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {hasAccess ? (
                        <Link
                          to={item.href}
                          className={cn(
                            "flex items-center px-2 py-2 text-sm rounded-md transition-colors",
                            location.pathname === item.href && "ring-2 ring-accent",
                            collapsed && "justify-center",
                            "hover:bg-accent/50"
                          )}
                        >
                          <item.icon className="h-5 w-5 min-w-5" />
                          {!collapsed && <span className="ml-3">{item.name}</span>}
                        </Link>
                      ) : (
                        <div
                          className={cn(
                            "flex items-center px-2 py-2 text-sm rounded-md cursor-not-allowed",
                            collapsed && "justify-center",
                            "text-gray-400 bg-gray-100"
                          )}
                        >
                          <item.icon className="h-5 w-5 min-w-5" />
                          {!collapsed && (
                            <>
                              <span className="ml-3">{item.name}</span>
                              <LockIcon className="ml-auto h-4 w-4" />
                            </>
                          )}
                        </div>
                      )}
                    </TooltipTrigger>
                    {!hasAccess && (
                      <TooltipContent side="right">
                        <p>
                          {isRestricted
                            ? "This feature is not available for your account" 
                            : "You don't have permission to access this page"}
                        </p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </nav>

          {/* Bottom section with Settings and Logout */}
          <div className="mt-auto pt-4 border-t space-y-2">
            {hasPermission(settingsNav.requiredRole) ? (
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
            ) : (
              <div
                className={cn(
                  "flex items-center p-2 rounded-lg cursor-not-allowed text-gray-400",
                  collapsed ? "justify-center" : "space-x-3"
                )}
              >
                <settingsNav.icon className="h-5 w-5 min-w-5" />
                {!collapsed && <span className="ml-3">{settingsNav.name}</span>}
              </div>
            )}
            
            {collapsed ? (
              <button
                className="flex justify-center items-center p-2 rounded-lg hover:bg-accent w-full text-red-500"
                onClick={() => navigate('/login')}
              >
                <LogOut className="h-5 w-5 min-w-5" />
              </button>
            ) : (
              <div className="px-2">
                <LogoutButton />
              </div>
            )}
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
