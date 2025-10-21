import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Coins, Plus, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function UserProfile({ 
  className, 
  collapsed = false, 
  showLogout = false 
}: { 
  className?: string; 
  collapsed?: boolean;
  showLogout?: boolean;
}) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const handleTopUp = () => {
    navigate('/topup');
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      console.log('🔵 UserProfile logout clicked');
      await signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };
  
  // Error prevention - if no user, show a default avatar
  if (!user) {
    return (
      <div className={cn(
        "flex items-center py-4", 
        collapsed ? "justify-center" : "gap-3",
        className
      )}>
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarFallback>?</AvatarFallback>
        </Avatar>
        
        {!collapsed && (
          <div className="flex flex-col text-sm min-w-0">
            <span className="font-medium truncate">Guest User</span>
            <span className="text-xs text-muted-foreground truncate">Not logged in</span>
          </div>
        )}
      </div>
    );
  }

  // Get the first letter of the email or name for avatar fallback
  const getInitials = () => {
    try {
      if (user.name && user.name.length > 0) {
        return user.name.charAt(0).toUpperCase();
      }
      if (user.email && user.email.length > 0) {
        return user.email.charAt(0).toUpperCase();
      }
      return '?';
    } catch (e) {
      return '?';
    }
  };

  // Display name (email or name if available)
  const displayName = user.name || user.email || 'User';
  
  // Format email for display - truncate if necessary
  const formatEmail = (email: string) => {
    try {
      if (!email) return '';
      if (email.length > 18) {
        return `${email.substring(0, 15)}...`;
      }
      return email;
    } catch (e) {
      return 'Invalid email';
    }
  };

  // Format credits for display
  const formatCredits = (credits: number | undefined) => {
    if (credits === undefined || credits === null) return '0.00';
    return credits.toFixed(2);
  };

  return (
    <div className={cn(
      "flex flex-col py-4", 
      className
    )}>
      {/* User Info Section */}
      <div className={cn(
        "flex items-center", 
        collapsed ? "justify-center" : "gap-3"
      )}>
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={user?.photo_url || ""} alt={displayName} className="object-cover" />
          <AvatarFallback className="bg-gradient-to-br from-[#145484] to-[#0FB8C1] text-white">{getInitials()}</AvatarFallback>
        </Avatar>
        
        {!collapsed && (
          <>
            <div className="flex flex-col text-sm min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-medium truncate">{displayName}</span>
                {user.user_role && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase bg-gradient-to-br from-[#FFD700] via-[#FFC107] to-[#FFB300] text-[#1D1D1F] shadow-md border border-[#FFD700]/40" style={{
                    textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    boxShadow: '0 1px 3px rgba(255, 193, 7, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                  }}>
                    {user.user_role === 'admin' ? (
                      <>
                        <svg className="w-2.5 h-2.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9.504 1.132a1 1 0 01.992 0l1.75 1a1 1 0 11-.992 1.736L10 3.152l-1.254.716a1 1 0 11-.992-1.736l1.75-1zM5.618 4.504a1 1 0 01-.372 1.364L5.016 6l.23.132a1 1 0 11-.992 1.736L4 7.723V8a1 1 0 01-2 0V6a.996.996 0 01.52-.878l1.734-.99a1 1 0 011.364.372zm8.764 0a1 1 0 011.364-.372l1.733.99A1.002 1.002 0 0118 6v2a1 1 0 11-2 0v-.277l-.254.145a1 1 0 11-.992-1.736l.23-.132-.23-.132a1 1 0 01-.372-1.364zm-7 4a1 1 0 011.364-.372L10 8.848l1.254-.716a1 1 0 11.992 1.736L11 10.58V12a1 1 0 11-2 0v-1.42l-1.246-.712a1 1 0 01-.372-1.364zM3 11a1 1 0 011 1v1.42l1.246.712a1 1 0 11-.992 1.736l-1.75-1A1 1 0 012 14v-2a1 1 0 011-1zm14 0a1 1 0 011 1v2a1 1 0 01-.504.868l-1.75 1a1 1 0 11-.992-1.736L16 13.42V12a1 1 0 011-1zm-9.618 5.504a1 1 0 011.364-.372l.254.145V16a1 1 0 112 0v.277l.254-.145a1 1 0 11.992 1.736l-1.735.992a.995.995 0 01-1.022 0l-1.735-.992a1 1 0 01-.372-1.364z" clipRule="evenodd" />
                        </svg>
                        ADMIN
                      </>
                    ) : (
                      user.user_role.toUpperCase()
                    )}
                  </span>
                )}
              </div>
              {user.email && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-xs text-muted-foreground truncate">
                        {formatEmail(user.email)}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{user.email}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            
            {/* Logout Icon */}
            {showLogout && (
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="p-1.5 rounded-md hover:bg-red-50 transition-colors text-red-500 hover:text-red-600 flex-shrink-0 disabled:opacity-50"
                title={isLoggingOut ? "Logging out..." : "Logout"}
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Credits Section */}
      {!collapsed && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-[#145484]" />
              <div className="flex flex-col">
                <span className="text-xs font-medium text-muted-foreground">Credits</span>
                <span className="text-sm font-semibold text-[#145484]">
                  {formatCredits(user.credits)}
                </span>
              </div>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleTopUp}
              className="h-7 px-2 text-xs border-[#FFC107] text-[#1D1D1F] hover:bg-[#FFC107] hover:text-[#1D1D1F] hover:border-[#FFC107] btn-glisten"
            >
              <Plus className="h-3 w-3 mr-1" />
              Top Up
            </Button>
          </div>
        </div>
      )}

      {/* Collapsed Credits Display */}
      {collapsed && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="mt-2 flex justify-center">
                <div className="flex items-center justify-center w-8 h-6 bg-[#145484]/10 rounded text-xs font-semibold text-[#145484]">
                  {formatCredits(user.credits)}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Credits: {formatCredits(user.credits)}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
} 