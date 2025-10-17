import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TwoFactorSettings } from "@/components/auth/TwoFactorSettings";
import { CashoutSettings } from "@/components/settings/CashoutSettings";
import { MAGAuthProvider } from "@/contexts/MAGAuthContext";
import { Settings as SettingsIcon, User, Bell, Lock, CreditCard, Crown, Calendar, AlertTriangle, DollarSign, Loader2, Plug, CheckCircle, XCircle, Bot } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMAGAuth } from "@/contexts/MAGAuthContext";
import { supabase } from "@/lib/supabase";
import SubscriptionService, { type SubscriptionStatus } from "@/services/subscriptionService";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";

const Settings = () => {
  const { user, refreshUser } = useAuth();
  const { magUser, logoutMAG } = useMAGAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  
  // Profile state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Labour rate state
  const [labourRate, setLabourRate] = useState<number>(100);
  const [isLoadingLabourRate, setIsLoadingLabourRate] = useState(true);
  const [isSavingLabourRate, setIsSavingLabourRate] = useState(false);

  // AI Widget state
  const [aiWidgetEnabled, setAiWidgetEnabled] = useState(() => {
    const saved = localStorage.getItem('aiWidgetEnabled');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    if (user?.id) {
      checkSubscriptionStatus();
      loadProfileData();
      loadLabourRate();
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

  const loadLabourRate = async () => {
    if (!user?.id) return;
    
    setIsLoadingLabourRate(true);
    try {
      // Try to fetch from technicians table first
      const { data: technicianData, error: techError } = await supabase
        .from('technicians')
        .select('labor_rate')
        .eq('id', user.id)
        .single();

      if (technicianData && technicianData.labor_rate) {
        setLabourRate(technicianData.labor_rate);
      } else {
        // Try app_users table as fallback
        const { data: appUserData, error: appError } = await supabase
          .from('app_users')
          .select('labor_rate')
          .eq('id', user.id)
          .single();

        if (appUserData && appUserData.labor_rate) {
          setLabourRate(appUserData.labor_rate);
        } else {
          // Default to 100 if not set
          setLabourRate(100);
        }
      }
    } catch (error) {
      console.error('Error loading labour rate:', error);
      setLabourRate(100); // Default
    } finally {
      setIsLoadingLabourRate(false);
    }
  };

  const handleSaveLabourRate = async () => {
    if (!user?.id) return;

    if (labourRate < 0) {
      toast({
        title: "Validation Error",
        description: "Labour rate cannot be negative",
        variant: "destructive",
      });
      return;
    }

    setIsSavingLabourRate(true);
    
    try {
      // Try to update technicians table first
      const { error: techError } = await supabase
        .from('technicians')
        .update({ labor_rate: labourRate })
        .eq('id', user.id);

      if (techError) {
        // Fallback to app_users table
        const { error: appError } = await supabase
          .from('app_users')
          .update({ labor_rate: labourRate })
          .eq('id', user.id);

        if (appError) throw appError;
      }

      toast({
        title: "Labour Rate Updated",
        description: `Your labour rate has been set to £${labourRate.toFixed(2)} per glass piece`,
      });
    } catch (error) {
      console.error('Error saving labour rate:', error);
      toast({
        title: "Error",
        description: "Failed to update labour rate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingLabourRate(false);
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
                    const endDate = new Date(subscriptionStatus.currentPeriodEnd).toLocaleDateString('en-GB');
    
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

  const handleAiWidgetToggle = (checked: boolean) => {
    // Prevent any form submission or navigation
    try {
      console.log('🔧 Toggling AI widget to:', checked);
      
      setAiWidgetEnabled(checked);
      localStorage.setItem('aiWidgetEnabled', checked.toString());
      
      // Use setTimeout to dispatch event after state update
      setTimeout(() => {
        try {
          window.dispatchEvent(new CustomEvent('aiWidgetToggle', { 
            detail: { enabled: checked },
            bubbles: false,
            cancelable: false
          }));
        } catch (eventError) {
          console.error('Error dispatching event:', eventError);
        }
      }, 0);
      
      toast({
        title: checked ? "AI Assistant Enabled" : "AI Assistant Disabled",
        description: checked 
          ? "The AI assistant widget is now visible in the bottom right corner"
          : "The AI assistant widget has been hidden",
      });
    } catch (error) {
      console.error('Error toggling AI widget:', error);
      toast({
        title: "Error",
        description: "Failed to update AI widget setting",
        variant: "destructive",
      });
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
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">General</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="flex items-center gap-2">
              <Plug className="h-4 w-4" />
              <span className="hidden sm:inline">Suppliers</span>
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
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-[#145484] mr-2" />
                <CardTitle className="text-base sm:text-lg font-semibold">Labour Rate Configuration</CardTitle>
              </CardHeader>
              <CardContent className="mobile-card">
                {isLoadingLabourRate ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[#145484]" />
                    <span className="ml-2 text-sm text-gray-600">Loading labour rate...</span>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    <p className="text-sm text-gray-600">
                      Set your base labour rate per glass piece. This will be used in the Price Estimator to calculate job costs.
                    </p>
                    <div className="space-y-2">
                      <label className="mobile-text font-medium">Labour Rate per Glass Piece</label>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-gray-700">£</span>
                        <Input 
                          type="number"
                          min="0"
                          step="0.01"
                          value={labourRate} 
                          onChange={(e) => setLabourRate(parseFloat(e.target.value) || 0)}
                          className="border-[#145484] focus:ring-[#145484] mobile-form-input flex-1" 
                          placeholder="100.00"
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Default: £100.00 per glass piece. This is multiplied by the number of pieces in each estimate.
                      </p>
                    </div>
                    <Button 
                      onClick={handleSaveLabourRate}
                      disabled={isSavingLabourRate}
                      className="w-full sm:w-auto touch-target"
                    >
                      {isSavingLabourRate ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Labour Rate'
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2 mobile-card">
                <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-[#145484] mr-2" />
                <CardTitle className="text-base sm:text-lg font-semibold">AI Assistant</CardTitle>
              </CardHeader>
              <CardContent className="mobile-card">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-start justify-between gap-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex-1 space-y-1">
                      <Label htmlFor="ai-widget" className="mobile-text font-medium cursor-pointer">
                        Enable AI Chat Widget
                      </Label>
                      <p className="text-xs sm:text-sm text-gray-500">
                        Show the AI assistant in the bottom right corner. Get instant help with your questions.
                      </p>
                    </div>
                    <div onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}>
                      <Switch
                        id="ai-widget"
                        checked={aiWidgetEnabled}
                        onCheckedChange={(checked) => {
                          handleAiWidgetToggle(checked);
                        }}
                        className="data-[state=checked]:bg-[#145484]"
                      />
                    </div>
                  </div>
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

          {/* Supplier Connections Tab */}
          <TabsContent value="suppliers" className="space-y-4 sm:space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Supplier Connections</h2>
              <p className="text-gray-600">
                When you connect a supplier, their live stock availability and your specific trade prices will be automatically shown during the parts search and at checkout.
              </p>
            </div>

            {/* Master Auto Glass Connection */}
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <img
                        src="/MAG.png"
                        alt="Master Auto Glass"
                        className="h-12 w-auto object-contain"
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Master Auto Glass</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {magUser?.isAuthenticated ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-600">Connected</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-500">Not Connected</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {magUser?.isAuthenticated ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-gray-600 hover:text-gray-900"
                          onClick={() => window.location.href = '/glass-order'}
                        >
                          Re-authorise
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            logoutMAG();
                            toast({
                              title: "Disconnected",
                              description: "Master Auto Glass account has been disconnected",
                            });
                          }}
                        >
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="bg-[#FFC107] hover:bg-[#e6ad06] text-black font-semibold"
                        onClick={() => window.location.href = '/glass-order'}
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                </div>

                {magUser?.isAuthenticated && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Pricing Tier:</span> Trade Tier 2
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Last Sync:</span> {new Date().toLocaleDateString('en-GB')} at {new Date().toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Charles Pugh Connection */}
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <img
                        src="/pughs_logo.png"
                        alt="Charles Pugh"
                        className="h-12 w-auto object-contain"
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Charles Pugh</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <XCircle className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-500">Not Connected</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="bg-[#FFC107] hover:bg-[#e6ad06] text-black font-semibold"
                      onClick={() => window.location.href = '/glass-order'}
                    >
                      Connect
                    </Button>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Pricing Tier:</span> N/A
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Last Sync:</span> N/A
                  </p>
                </div>
              </CardContent>
            </Card>
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
                            {new Date(subscriptionStatus.currentPeriodEnd).toLocaleDateString('en-GB')}
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

// Wrap with MAGAuthProvider to enable supplier connections
const SettingsWithMAGAuth = () => {
  return (
    <MAGAuthProvider>
      <Settings />
    </MAGAuthProvider>
  );
};

export default SettingsWithMAGAuth;