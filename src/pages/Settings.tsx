import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TwoFactorSettings } from "@/components/auth/TwoFactorSettings";
import { CashoutSettings } from "@/components/settings/CashoutSettings";
import { Settings as SettingsIcon, User, Bell, Lock, CreditCard, Crown, Calendar, AlertTriangle, DollarSign, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import SubscriptionService, { type SubscriptionStatus } from "@/services/subscriptionService";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";

const Settings = () => {
  const { user, refreshUser } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  
  // Profile state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (user?.id) {
      checkSubscriptionStatus();
      loadProfileData();
    }
  }, [user?.id]);

  const loadProfileData = async () => {
    if (!user?.id) return;
    
    setIsLoadingProfile(true);
    try {
      // Fetch from technicians table
      const { data: technicianData, error: techError } = await supabase
        .from('technicians')
        .select('name, contact_email')
        .eq('id', user.id)
        .single();

      if (technicianData && !techError) {
        setFullName(technicianData.name || '');
        setEmail(technicianData.contact_email || user.email || '');
      } else {
        // Fallback to app_users table
        const { data: appUserData, error: appError } = await supabase
          .from('app_users')
          .select('name, email')
          .eq('id', user.id)
          .single();

        if (appUserData && !appError) {
          setFullName(appUserData.name || '');
          setEmail(appUserData.email || user.email || '');
        } else {
          // Use auth context data as fallback
          setFullName(user.name || '');
          setEmail(user.email || '');
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      // Use auth context data as fallback
      setFullName(user.name || '');
      setEmail(user.email || '');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;

    if (!fullName.trim()) {
      toast({
        title: "Validation Error",
        description: "Name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: "Validation Error", 
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsSavingProfile(true);

    try {
      // Update in technicians table
      const { error: techError } = await supabase
        .from('technicians')
        .update({ 
          name: fullName.trim(),
          contact_email: email.trim()
        })
        .eq('id', user.id);

      // Update in app_users table
      const { error: appError } = await supabase
        .from('app_users')
        .update({ 
          name: fullName.trim(),
          email: email.trim()
        })
        .eq('id', user.id);

      if (techError && appError) {
        throw new Error('Failed to update profile');
      }

      // Refresh user context
      await refreshUser();

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const checkSubscriptionStatus = async () => {
    if (!user?.id) return;
    
    setIsLoadingSubscription(true);
    try {
      const status = await SubscriptionService.getSubscriptionStatus(user.id);
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('Error checking subscription status:', error);
    } finally {
      setIsLoadingSubscription(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user?.id || !subscriptionStatus) return;
    
    const planName = subscriptionStatus.planName;
    const endDate = new Date(subscriptionStatus.currentPeriodEnd).toLocaleDateString();
    
    const confirmed = confirm(
      `Are you sure you want to cancel your ${planName} subscription?\n\n` +
      `• You will keep access until ${endDate}\n` +
      `• Your role will be downgraded after the billing period ends\n` +
      `• You can resubscribe at any time\n\n` +
      `Click OK to proceed with cancellation.`
    );
    
    if (!confirmed) return;

    setIsCanceling(true);
    try {
      const result = await SubscriptionService.cancelSubscription(user.id);
      
      if (result.success) {
        toast({
          title: "Subscription Canceled",
          description: `Your ${planName} subscription will end on ${endDate}. You'll keep access until then.`,
        });
        await checkSubscriptionStatus(); // Refresh status
      } else {
        toast({
          title: "Cancellation Failed",
          description: result.error || "Failed to cancel subscription. Please try again or contact support.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred while canceling your subscription.",
        variant: "destructive",
      });
    } finally {
      setIsCanceling(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Enhanced Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 rounded-b-2xl">
          <div className="px-6 py-8">
            <div className="flex flex-col gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold text-gray-900">Settings</h1>
                </div>
                <p className="text-gray-600 text-lg">
                  Manage your account settings and preferences
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">General</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Billing</span>
            </TabsTrigger>
            <TabsTrigger value="cashout" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Cashout</span>
            </TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-4 sm:space-y-6">
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2 mobile-card">
                <User className="h-5 w-5 sm:h-6 sm:w-6 text-[#145484] mr-2" />
                <CardTitle className="text-base sm:text-lg font-semibold">Profile Settings</CardTitle>
              </CardHeader>
              <CardContent className="mobile-card">
                {isLoadingProfile ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[#145484]" />
                    <span className="ml-2 text-sm text-gray-600">Loading profile...</span>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="space-y-2">
                      <label className="mobile-text font-medium">Full Name</label>
                      <Input 
                        value={fullName} 
                        onChange={(e) => setFullName(e.target.value)}
                        className="border-[#145484] focus:ring-[#145484] mobile-form-input" 
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="mobile-text font-medium">Email</label>
                      <Input 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border-[#145484] focus:ring-[#145484] mobile-form-input" 
                        placeholder="Enter your email"
                      />
                    </div>
                    <Button 
                      onClick={handleSaveProfile}
                      disabled={isSavingProfile}
                      className="w-full sm:w-auto touch-target"
                    >
                      {isSavingProfile ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </div>
                )}
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
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4 sm:space-y-6">
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
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-4 sm:space-y-6">
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

            {/* Subscription Management */}
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2 mobile-card">
                <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-[#145484] mr-2" />
                <CardTitle className="text-base sm:text-lg font-semibold">Subscription Management</CardTitle>
              </CardHeader>
              <CardContent className="mobile-card">
                {isLoadingSubscription ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#145484] border-t-transparent"></div>
                    <span className="ml-2 text-sm text-gray-600">Loading subscription...</span>
                  </div>
                ) : subscriptionStatus ? (
                  <div className="space-y-4">
                    {/* Current Subscription Info */}
                    <div className="bg-amber-50 border border-[#FFC107] rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Crown className="h-4 w-4 text-[#FFC107]" />
                        <span className="font-semibold text-[#1D1D1F]">Current Plan</span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-[#1D1D1F]/80">Plan:</span>
                          <span className="font-medium text-[#1D1D1F]">{subscriptionStatus.planName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#1D1D1F]/80">Status:</span>
                          <span className={`font-medium capitalize ${
                            subscriptionStatus.status === 'active' ? 'text-green-600' : 'text-orange-600'
                          }`}>
                            {subscriptionStatus.status}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#1D1D1F]/80">Access Level:</span>
                          <span className="font-medium text-[#1D1D1F] uppercase">{subscriptionStatus.role}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#1D1D1F]/80">Renewal Date:</span>
                          <span className="font-medium text-[#1D1D1F]">
                            {new Date(subscriptionStatus.currentPeriodEnd).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Subscription Actions */}
                    <div className="space-y-3">
                      {subscriptionStatus.status === 'active' && (
                        <Alert className="border-orange-200 bg-orange-50">
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                          <AlertDescription className="text-orange-600">
                            Canceling will maintain access until your next billing date.
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      <div className="flex gap-3">
                        <Button 
                          variant="outline"
                          className="flex-1"
                          onClick={() => window.open('https://billing.stripe.com/p/login/test_', '_blank')}
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Manage Billing
                        </Button>
                        {subscriptionStatus.status === 'active' && (
                          <Button 
                            variant="destructive"
                            className="flex-1"
                            onClick={handleCancelSubscription}
                            disabled={isCanceling}
                          >
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            {isCanceling ? 'Canceling...' : 'Cancel Plan'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Crown className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 mb-3">No active subscription found</p>
                    <Button 
                      variant="outline"
                      onClick={() => window.location.href = '/'}
                    >
                      View Plans
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cashout Tab */}
          <TabsContent value="cashout" className="space-y-4 sm:space-y-6">
            <CashoutSettings />
          </TabsContent>
        </Tabs>
      </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;