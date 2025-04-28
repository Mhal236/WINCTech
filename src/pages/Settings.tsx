import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings as SettingsIcon, User, Bell, Lock, CreditCard } from "lucide-react";

const Settings = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-semibold text-[#145484]">Settings</h1>
        </div>

        <div className="grid gap-4 md:gap-6">
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <User className="h-6 w-6 text-[#145484] mr-2" />
              <CardTitle className="text-lg font-semibold">Profile Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <Input defaultValue="John Doe" className="border-[#145484] focus:ring-[#145484]" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input defaultValue="john@example.com" className="border-[#145484] focus:ring-[#145484]" />
                </div>
                <Button>
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Bell className="h-6 w-6 text-[#145484] mr-2" />
              <CardTitle className="text-lg font-semibold">Notification Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Email Notifications</span>
                  <Button variant="outline">
                    Configure
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">SMS Notifications</span>
                  <Button variant="outline">
                    Configure
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Lock className="h-6 w-6 text-[#145484] mr-2" />
              <CardTitle className="text-lg font-semibold">Security Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Current Password</label>
                  <Input type="password" className="border-[#145484] focus:ring-[#145484]" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">New Password</label>
                  <Input type="password" className="border-[#145484] focus:ring-[#145484]" />
                </div>
                <Button>
                  Update Password
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CreditCard className="h-6 w-6 text-[#145484] mr-2" />
              <CardTitle className="text-lg font-semibold">Billing Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Current Plan</p>
                    <p className="text-sm text-gray-500">Pro Plan</p>
                  </div>
                  <Button variant="outline">
                    Change Plan
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Payment Method</p>
                    <p className="text-sm text-gray-500">Visa ending in 4242</p>
                  </div>
                  <Button variant="outline">
                    Update
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;