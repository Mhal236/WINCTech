import { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen flex w-full">
      <Sidebar />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
};

