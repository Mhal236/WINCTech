import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TwoFactorSettings } from "@/components/auth/TwoFactorSettings";
import { Settings as SettingsIcon, User, Bell, Lock, CreditCard } from "lucide-react";

const Settings = () => {
  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <h1 className="mobile-heading font-semibold text-[#145484]">Settings</h1>
        </div>

        <div className="grid gap-4 sm:gap-6">
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2 mobile-card">
              <User className="h-5 w-5 sm:h-6 sm:w-6 text-[#145484] mr-2" />
              <CardTitle className="text-base sm:text-lg font-semibold">Profile Settings</CardTitle>
            </CardHeader>
            <CardContent className="mobile-card">
              <div className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <label className="mobile-text font-medium">Full Name</label>
                  <Input defaultValue="John Doe" className="border-[#145484] focus:ring-[#145484] mobile-form-input" />
                </div>
                <div className="space-y-2">
                  <label className="mobile-text font-medium">Email</label>
                  <Input defaultValue="john@example.com" className="border-[#145484] focus:ring-[#145484] mobile-form-input" />
                </div>
                <Button className="w-full sm:w-auto touch-target">
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2 mobile-card">
              <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-[#145484] mr-2" />
              <CardTitle className="text-base sm:text-lg font-semibold">Notification Settings</CardTitle>
            </CardHeader>
            <CardContent className="mobile-card">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="mobile-text font-medium">Email Notifications</span>
                  <Button variant="outline" className="w-full sm:w-auto touch-target">
                    Configure
                  </Button>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="mobile-text font-medium">SMS Notifications</span>
                  <Button variant="outline" className="w-full sm:w-auto touch-target">
                    Configure
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2 mobile-card">
              <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-[#145484] mr-2" />
              <CardTitle className="text-base sm:text-lg font-semibold">Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="mobile-card">
              <div className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <label className="mobile-text font-medium">Current Password</label>
                  <Input type="password" className="border-[#145484] focus:ring-[#145484] mobile-form-input" />
                </div>
                <div className="space-y-2">
                  <label className="mobile-text font-medium">New Password</label>
                  <Input type="password" className="border-[#145484] focus:ring-[#145484] mobile-form-input" />
                </div>
                <Button className="w-full sm:w-auto touch-target">
                  Update Password
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Two-Factor Authentication Settings */}
          <TwoFactorSettings className="hover:shadow-lg transition-shadow duration-200" />

          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2 mobile-card">
              <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-[#145484] mr-2" />
              <CardTitle className="text-base sm:text-lg font-semibold">Billing Settings</CardTitle>
            </CardHeader>
            <CardContent className="mobile-card">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-medium mobile-text">Current Plan</p>
                    <p className="text-xs sm:text-sm text-gray-500">Pro Plan</p>
                  </div>
                  <Button variant="outline" className="w-full sm:w-auto touch-target">
                    Change Plan
                  </Button>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-medium mobile-text">Payment Method</p>
                    <p className="text-xs sm:text-sm text-gray-500">Visa ending in 4242</p>
                  </div>
                  <Button variant="outline" className="w-full sm:w-auto touch-target">
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