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
  Sparkles,
  Package,
  Globe,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { UserProfile } from "@/components/auth/UserProfile";
import { useRoleBasedAccess } from "@/components/auth/RoleBasedAccess";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";

// Reference the logo image from the public folder
const logo = "/windscreen-compare-technician.png";

export const Sidebar = ({ children }: { children?: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { hasPermission, isAdmin, user } = useRoleBasedAccess();
  const { signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      console.log('🔵 Sidebar logout clicked');
      await signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Define navigation items with their required roles - organized like Calendly
  const navigation = [
    { name: "Home", href: "/", icon: Home, requiredRole: "user" },
  ];

  const jobsAndCalendarNavigation = [
    { name: "Jobs", href: "/job-swipe", icon: Briefcase, requiredRole: "admin" },
    { name: "Calendar", href: "/calendar", icon: Calendar, requiredRole: "admin" },
  ];

  const bottomNavigation = [
    { name: "ARGIC Search", href: "/glass-search", icon: Search, requiredRole: "pro-2" },
    { name: "Glass Order", href: "/price-lookup", icon: ShoppingCart, requiredRole: "pro-2" },
    { name: "Shop Supplies", href: "/shop-supplies", icon: Package, requiredRole: "pro-2" },
  ];

  const websiteNavigation = [
    { name: "Website", href: "/website", icon: Globe, requiredRole: "pro-2" },
  ];

  const preSettingsNavigation = [
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
                  "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150",
                  "hover:bg-gray-50 hover:text-gray-900",
                  location.pathname === item.href 
                    ? "bg-gray-100 text-gray-900 font-semibold" 
                    : "text-gray-600",
                  isUpgrade && "bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100",
                  collapsed && "justify-center px-2"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 flex-shrink-0 transition-colors",
                  location.pathname === item.href ? "text-gray-700" : "text-gray-400 group-hover:text-gray-600"
                )} />
                {!collapsed && (
                  <span className="truncate">{item.name}</span>
                )}
                {isUpgrade && !collapsed && (
                  <DollarSign className="ml-auto h-4 w-4 text-emerald-600" />
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
      {/* Sidebar - Hidden on mobile */}
      <div
        className={cn(
          "fixed top-0 left-0 z-40 h-screen transition-all duration-300 bg-white border-r border-gray-200",
          collapsed ? "w-16" : "w-64",
          isMobile && !collapsed && "backdrop-blur-sm bg-white/95",
          isMobile && "hidden" // Hide sidebar completely on mobile
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

            {/* Jobs & Calendar Section */}
            <div className="mx-3 my-4">
              <Separator className="bg-gray-200" />
            </div>
            <div className="p-3 space-y-1">
              {jobsAndCalendarNavigation.map((item) => renderNavItem(item))}
            </div>

            {/* Separator before ARGIC Search section */}
            <div className="mx-3 my-4">
              <Separator className="bg-gray-200" />
            </div>

            {/* Bottom Navigation */}
            <div className="p-3 space-y-1">
              {bottomNavigation.map((item) => renderNavItem(item))}
            </div>

            {/* Separator before Website section */}
            <div className="mx-3 my-4">
              <Separator className="bg-gray-200" />
            </div>

            {/* Website Navigation */}
            <div className="p-3 space-y-1">
              {websiteNavigation.map((item) => renderNavItem(item))}
            </div>

          </div>

          {/* Bottom Section - History and Settings */}
          <div className="border-t border-gray-100 p-3">
            {/* Tony AI Promo - Above History */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to="/tony-ai"
                    className={cn(
                      "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition-all duration-300",
                      location.pathname === "/tony-ai" ? "bg-gray-100" : "hover:bg-gray-50",
                      collapsed && "justify-center px-2"
                    )}
                  >
                    <Sparkles className="h-5 w-5 flex-shrink-0 text-[#23b7c0]" />
                    {!collapsed && (
                      <span className="truncate bg-gradient-to-r from-[#23b7c0] via-[#1a9ca5] to-[#148189] bg-clip-text text-transparent animate-pulse">
                        Try Tony A.I
                      </span>
                    )}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Preview our Windscreen A.I assistant</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* History - Right above Settings */}
            <div className="space-y-1 mb-3">
              {preSettingsNavigation.map((item) => renderNavItem(item))}
            </div>
            {!collapsed ? (
              <div>
                {/* Settings Header - Collapsible */}
                <button
                  onClick={() => setSettingsExpanded(!settingsExpanded)}
                  className="w-full flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="h-5 w-5 text-gray-400" />
                    <span>Settings</span>
                  </div>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-gray-400 transition-transform duration-200",
                    settingsExpanded && "rotate-180"
                  )} />
                </button>

                {/* Settings Submenu */}
                {settingsExpanded && (
                  <div className="mt-1 ml-8 space-y-1">
                    <Link
                      to="/settings"
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        location.pathname === "/settings"
                          ? "bg-gray-100 text-gray-900"
                          : "text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      <Settings className="h-4 w-4 text-gray-400" />
                      <span>General</span>
                    </Link>
                    <Link
                      to="/contact"
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        location.pathname === "/contact"
                          ? "bg-gray-100 text-gray-900"
                          : "text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      <MessageCircle className="h-4 w-4 text-gray-400" />
                      <span>Contact Us</span>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              /* Collapsed Settings - Show both as separate items */
              <div className="space-y-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        to="/settings"
                        className="flex justify-center items-center p-2.5 rounded-md hover:bg-gray-50 text-gray-600 transition-colors"
                      >
                        <Settings className="h-5 w-5" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-gray-900 text-white">
                      Settings
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        to="/contact"
                        className="flex justify-center items-center p-2.5 rounded-md hover:bg-gray-50 text-gray-600 transition-colors"
                      >
                        <MessageCircle className="h-5 w-5" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-gray-900 text-white">
                      Contact Us
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}

            {/* Logout when collapsed */}
            {collapsed && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className="mt-2 flex justify-center items-center p-2.5 rounded-lg hover:bg-gray-100 w-full text-red-500 transition-colors disabled:opacity-50"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{isLoggingOut ? "Logging out..." : "Logout"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </div>

      {/* Mobile overlay - Not needed since sidebar is hidden on mobile */}

      {/* Main content */}
      <main
        className={cn(
          "flex-1 w-full transition-all duration-300 overflow-y-auto bg-gray-50",
          !isMobile && (collapsed ? "pl-16" : "pl-64"), // Only apply left padding on desktop
          isMobile && "pl-0 pb-20" // No left padding on mobile, add bottom padding for mobile bottom nav
        )}
      >
        {children}
      </main>
    </div>
  );
};
