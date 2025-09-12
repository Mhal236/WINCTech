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
          <AvatarImage src="" alt={displayName} />
          <AvatarFallback>{getInitials()}</AvatarFallback>
        </Avatar>
        
        {!collapsed && (
          <>
            <div className="flex flex-col text-sm min-w-0 flex-1">
              <span className="font-medium truncate">{displayName}</span>
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
              className="h-7 px-2 text-xs border-[#145484] text-[#145484] hover:bg-[#145484] hover:text-white"
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