import React from "react";
import { Bell, Calendar, FileText, Home, Settings, Users, X, Plus } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

// Define a type for your navigation items
interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
}

const mainItems: NavItem[] = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "All Notices", url: "/notices", icon: Bell },
  { title: "Calendar View", url: "/calendar", icon: Calendar },
];

const adminItems: NavItem[] = [
  { title: "Archive", url: "/archive", icon: FileText },
  { title: "User Management", url: "/users", icon: Users },
  { title: "Settings", url: "/settings", icon: Settings },
];

// Add the role prop to the component interface
interface AppSidebarProps {
  role: string | null;
}

// Accept the role prop as an argument
export function AppSidebar({ role }: AppSidebarProps) {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;

  // Function to apply active class based on NavLink's state
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "bg-primary text-primary-foreground font-medium shadow-md"
      : "hover:bg-accent text-pure-black hover:text-accent-foreground transition-all duration-200";

  return (
    <Sidebar className={`${collapsed ? "w-16" : "w-64"} transition-all duration-300 border-r border-border bg-card shadow-lg`}>
      <SidebarContent className="px-3 py-6">
        {/* Logo/Brand with Close Button */}
        <div className={`mb-8 px-2 ${collapsed ? "text-center" : ""}`}>
          {collapsed ? (
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg">
              <Bell className="h-5 w-5 text-primary-foreground" />
            </div>
          ) : (
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg">
                  <Bell className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <span className="font-bold text-lg bg-gradient-primary bg-clip-text text-transparent">
                    NoticeBoard
                  </span>
                  <p className="text-xs text-pure-black">Management System</p>
                </div>
              </div>
              <button
                onClick={toggleSidebar}
                className="p-1.5 hover:bg-accent rounded-lg transition-colors text-foreground/70 hover:text-foreground"
                title="Close sidebar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Main Navigation Group */}
        <SidebarGroup className="mb-6">
          <SidebarGroupLabel className={`${collapsed ? "sr-only" : "text-xs font-semibold text-pure-black uppercase tracking-wider mb-2"}`}>
            Main Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="w-full h-11">
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className={getNavCls}
                      title={collapsed ? item.title : undefined}
                    >
                      <item.icon className={`h-5 w-5 ${collapsed ? "mx-auto" : "mr-3"} transition-transform hover:scale-110`} />
                      {!collapsed && <span className="font-medium text-pure-black">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Administration Group - Conditionally Rendered */}
        {role === "admin" && (
          <SidebarGroup>
            <SidebarGroupLabel className={`${collapsed ? "sr-only" : "text-xs font-semibold text-pure-black uppercase tracking-wider mb-2"}`}>
              Administration
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="w-full h-11">
                      <NavLink
                        to={item.url}
                        className={getNavCls}
                        title={collapsed ? item.title : undefined}
                      >
                        <item.icon className={`h-5 w-5 ${collapsed ? "mx-auto" : "mr-3"} transition-transform hover:scale-110`} />
                        {!collapsed && <span className="font-medium text-pure-black">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}