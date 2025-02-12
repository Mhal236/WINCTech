import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { 
  ClipboardList, 
  Home, 
  Settings, 
  Users, 
  MessageCircle, 
  Search, 
  LogOut,
  Calendar,
  BarChart,
  Briefcase
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  
  const isActive = (url: string, title: string) => {
    if (title === 'Order') {
      return location.pathname === '/price-lookup';
    }
    return location.pathname === url;
  };
  
  const menuItems = [
    { title: "Dashboard", icon: Home, url: "/" },
    { title: "Jobs", icon: Briefcase, url: "/jobs" },
    { title: "Calendar", icon: Calendar, url: "/calendar" },
    { title: "Glass Order", icon: Search, url: "/price-lookup" },
    { title: "History", icon: ClipboardList, url: "/quotes" },
    { title: "Reports", icon: BarChart, url: "/reporting" },
    { title: "Contact Us", icon: MessageCircle, url: "/contact" },
  ];

  return (
    <div className="min-h-screen flex w-full">
      <Sidebar>
        <SidebarContent className="flex flex-col min-h-screen">
          <SidebarGroup className="flex-1 flex flex-col">
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarGroupContent className="flex-1 flex flex-col">
              <SidebarMenu className="flex-1 flex flex-col">
                <div>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Link 
                          to={item.url} 
                          className={`flex items-center gap-3 ${
                            isActive(item.url, item.title) ? 'text-[#0D9488]' : ''
                          }`}
                        >
                          <item.icon className="h-5 w-5" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </div>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Bottom section with settings and logout */}
          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <SidebarMenu>
                <div className="border-t border-gray-200 pt-2">
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link 
                        to="/settings" 
                        className={`flex items-center gap-3 ${location.pathname === '/settings' ? 'text-[#0D9488]' : ''}`}
                      >
                        <Settings className="h-5 w-5" />
                        <span>Settings</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <button className="flex items-center gap-3 w-full">
                        <LogOut className="h-5 w-5" />
                        <span>Logout</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </div>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
};

