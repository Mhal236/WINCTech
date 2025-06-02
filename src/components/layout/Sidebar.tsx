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
  ShoppingCart,
  DollarSign,
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

  // Define navigation items with their required roles - organized like Calendly
  const navigation = [
    { name: "Dashboard", href: "/", icon: Home, requiredRole: "user" },
    { name: "Jobs", href: "/job-swipe", icon: Briefcase, requiredRole: "admin" },
    { name: "Calendar", href: "/calendar", icon: Calendar, requiredRole: "admin" },
  ];

  const bottomNavigation = [
    { name: "ARGIC Search", href: "/glass-search", icon: Search, requiredRole: "admin" },
    { name: "Glass Order", href: "/price-lookup", icon: ShoppingCart, requiredRole: "admin" },
    { name: "History", href: "/history", icon: ClipboardList, requiredRole: "admin" },
  ];

  const renderNavItem = (item: any, isUpgrade = false) => {
    const isMasterAutoGlassEmail = user?.email?.endsWith('@master-auto-glass.com') || false;
    const isRestrictedPage = item.href === '/history' || item.href === '/reporting';
    const isRestrictedUser = user?.name === 'Mehrdad' || isMasterAutoGlassEmail;
    // Only restrict if user is restricted AND not an admin
    const isRestricted = isRestrictedUser && isRestrictedPage && user?.user_role !== 'admin';
    const hasAccess = hasPermission(item.requiredRole) && !isRestricted;

    return (
      <TooltipProvider key={item.name}>
        <Tooltip>
          <TooltipTrigger asChild>
            {hasAccess ? (
              <Link
                to={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  "hover:bg-gray-100 hover:text-gray-900",
                  location.pathname === item.href 
                    ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700" 
                    : "text-gray-700",
                  isUpgrade && "bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100",
                  collapsed && "justify-center px-2"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 flex-shrink-0 transition-colors",
                  location.pathname === item.href ? "text-blue-700" : "text-gray-500 group-hover:text-gray-700"
                )} />
                {!collapsed && (
                  <span className="truncate">{item.name}</span>
                )}
                {isUpgrade && !collapsed && (
                  <DollarSign className="ml-auto h-4 w-4 text-blue-600" />
                )}
              </Link>
            ) : (
              <div
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium cursor-not-allowed",
                  "text-gray-400 bg-gray-50",
                  collapsed && "justify-center px-2"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0 text-gray-400" />
                {!collapsed && (
                  <>
                    <span className="truncate">{item.name}</span>
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
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 z-40 h-screen transition-all duration-300 bg-white border-r border-gray-200",
          collapsed ? "w-16" : "w-64",
          isMobile && !collapsed && "backdrop-blur-sm bg-white/95"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            {!collapsed ? (
              <div className="flex items-center gap-2">
                <div className="relative h-8 transition-all duration-300 overflow-hidden">
                  <img
                    src={logo}
                    alt="Windscreen Compare"
                    className="h-full object-contain max-w-[140px]"
                  />
                </div>
              </div>
            ) : (
              <div className="relative h-8 w-8 overflow-hidden mx-auto">
                <img
                  src={logo}
                  alt="WC"
                  className="h-full w-full object-contain"
                />
              </div>
            )}
            
            {/* Hamburger menu - always visible, works for both expand and collapse */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
            >
              <Menu className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          {/* User Profile */}
          {!collapsed && (
            <div className="p-4 border-b border-gray-100">
              <UserProfile collapsed={collapsed} className="px-0" showLogout={true} />
            </div>
          )}

          {/* Main Navigation */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-3 space-y-1">
              {navigation.map((item) => renderNavItem(item))}
            </div>

            {/* Separator */}
            <div className="mx-3 my-4">
              <Separator className="bg-gray-200" />
            </div>

            {/* Bottom Navigation */}
            <div className="p-3 space-y-1">
              {bottomNavigation.map((item) => renderNavItem(item))}
            </div>
          </div>

          {/* Contact Us & Settings Section */}
          <div className="border-t border-gray-100 p-3">
            <Link
              to="/contact"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <MessageCircle className="h-5 w-5 text-gray-500" />
              {!collapsed && (
                <span>Contact Us</span>
              )}
            </Link>

            {/* Settings */}
            <Link
              to="/settings"
              className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Settings className="h-5 w-5 text-gray-500" />
              {!collapsed && (
                <span>Settings</span>
              )}
            </Link>

            {/* Logout when collapsed */}
            {collapsed && (
              <button
                className="mt-2 flex justify-center items-center p-2.5 rounded-lg hover:bg-gray-100 w-full text-red-500 transition-colors"
                onClick={() => navigate('/login')}
              >
                <LogOut className="h-5 w-5" />
              </button>
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
          "flex-1 w-full transition-all duration-300 overflow-y-auto bg-gray-50",
          collapsed ? "pl-16" : "pl-64",
          isMobile && "pl-0"
        )}
      >
        {children}
      </main>
    </div>
  );
};
