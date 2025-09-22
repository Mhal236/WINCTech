import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Home, Briefcase, Calendar, Settings, User, Search, ShoppingCart, ClipboardList, MessageCircle, MoreHorizontal, X, Sparkles } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useRoleBasedAccess } from "@/components/auth/RoleBasedAccess";
import { Button } from "@/components/ui/button";

// Primary navigation items (always visible in bottom bar)
const primaryNavItems = [
  { icon: Home, label: "Home", href: "/", requiredRole: "user" },
  { icon: Briefcase, label: "Jobs", href: "/job-swipe", requiredRole: "pro-1" },
  { icon: ClipboardList, label: "History", href: "/history", requiredRole: "pro-1" },
  { icon: Settings, label: "Settings", href: "/settings", requiredRole: "user" },
];

// Secondary navigation items (shown in "More" menu)
const secondaryNavItems = [
  { icon: Calendar, label: "Calendar", href: "/calendar", requiredRole: "pro-1" },
  { icon: Sparkles, label: "Tony A.I", href: "/tony-ai", requiredRole: "user" },
  { icon: Search, label: "ARGIC Search", href: "/glass-search", requiredRole: "pro-2" },
  { icon: ShoppingCart, label: "Order", href: "/price-lookup", requiredRole: "pro-2" },
  { icon: MessageCircle, label: "Contact", href: "/contact", requiredRole: "user" },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { hasPermission, user } = useRoleBasedAccess();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Filter items based on user permissions
  const getAccessibleItems = (items: typeof primaryNavItems) => {
    return items.filter(item => {
      const isMasterAutoGlassEmail = user?.email?.endsWith('@master-auto-glass.com') || false;
      const isRestrictedPage = item.href === '/history' || item.href === '/reporting';
      const isRestrictedUser = user?.name === 'Mehrdad' || isMasterAutoGlassEmail;
      const isRestricted = isRestrictedUser && isRestrictedPage && user?.user_role !== 'admin';
      return hasPermission(item.requiredRole) && !isRestricted;
    });
  };

  const accessiblePrimaryItems = getAccessibleItems(primaryNavItems);
  const accessibleSecondaryItems = getAccessibleItems(secondaryNavItems);

  return (
    <Sidebar>
      <div className="p-3 sm:p-4 md:p-6 h-full overflow-y-auto">
        {children}
      </div>
      
      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-md border border-gray-200 
        rounded-2xl shadow-xl w-[95%] max-w-sm z-[2000] sm:hidden safe-area-pb">
        <div className="flex justify-around items-center h-16 px-3">
          {/* Primary Navigation Items */}
          {accessiblePrimaryItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200",
                  "text-xs font-medium min-w-[48px] min-h-[48px] gap-1",
                  isActive 
                    ? "text-[#145484] bg-[#145484]/15 scale-105" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:scale-105"
                )}
              >
                <Icon className="h-6 w-6" />
                <span className="text-[10px] leading-none">{item.label}</span>
              </Link>
            );
          })}
          
          {/* More Menu Button */}
          {accessibleSecondaryItems.length > 0 && (
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200",
                "text-xs font-medium min-w-[48px] min-h-[48px] gap-1",
                showMoreMenu
                  ? "text-[#145484] bg-[#145484]/15 scale-105" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:scale-105"
              )}
            >
              <MoreHorizontal className="h-6 w-6" />
              <span className="text-[10px] leading-none">More</span>
            </button>
          )}
        </div>
      </nav>

      {/* More Menu Overlay */}
      {showMoreMenu && (
        <div 
          className="fixed inset-0 bg-black/20 z-[1999] sm:hidden"
          onClick={() => setShowMoreMenu(false)}
        >
          <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-md border border-gray-200 
            rounded-2xl shadow-xl w-[95%] max-w-sm animate-in slide-in-from-bottom-2 duration-200">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">More Options</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMoreMenu(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {accessibleSecondaryItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setShowMoreMenu(false)}
                      className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200",
                        "text-sm font-medium min-h-[80px] gap-2",
                        isActive 
                          ? "text-[#145484] bg-[#145484]/15" 
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      )}
                    >
                      <Icon className="h-8 w-8" />
                      <span className="text-center leading-tight">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </Sidebar>
  );
}

