import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function UserProfile({ className, collapsed = false }: { className?: string; collapsed?: boolean }) {
  const { user } = useAuth();
  
  // Error prevention - if no user, show a default avatar
  if (!user) {
    return (
      <div className={cn("flex items-center gap-3 py-4", className)}>
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

  return (
    <div className={cn("flex items-center gap-3 py-4", className)}>
      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarImage src="" alt={displayName} />
        <AvatarFallback>{getInitials()}</AvatarFallback>
      </Avatar>
      
      {!collapsed && (
        <div className="flex flex-col text-sm min-w-0">
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
      )}
    </div>
  );
} 