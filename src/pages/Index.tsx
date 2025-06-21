import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { VerificationForm } from "@/components/auth/VerificationForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { History, Heart, CreditCard, Download, Gift, Brain, Clock, Star, Award } from "lucide-react";
import { PricingPlans } from "@/components/pricing/PricingPlans";
import { useAuth } from "@/contexts/AuthContext";
import { PageTransition } from "@/components/PageTransition";

const Index = () => {
  const { user, isLoading } = useAuth();
  const [isCheckingVerification, setIsCheckingVerification] = useState(true);

  // Add a delay to prevent flashing during page transitions
  useEffect(() => {
    if (!isLoading && user) {
      // Add a small delay to ensure auth state is stable
      const timer = setTimeout(() => {
        setIsCheckingVerification(false);
      }, 200);
      
      return () => clearTimeout(timer);
    } else if (!isLoading) {
      setIsCheckingVerification(false);
    }
  }, [user, isLoading]);

  // Show verification form for users who haven't completed verification
  // Priority: verification_status takes precedence over user_role
  const needsVerification = !user || 
    (user.verification_status === 'non-verified' || 
     user.verification_status === 'pending' || 
     user.verification_status === 'rejected') ||
    // Only check user_role if verification_status is not set
    (!user.verification_status && 
     (user.user_role === 'non-verified' || 
      (!user.user_role && user.user_role !== 'admin')));

  // Show loading state during auth transitions
  if (isLoading || isCheckingVerification) {
    return (
      <DashboardLayout>
        <PageTransition>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 bg-[#145484]/10 rounded-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#145484] border-t-transparent"></div>
              </div>
              <p className="text-gray-600 font-medium">Loading dashboard...</p>
            </div>
          </div>
        </PageTransition>
      </DashboardLayout>
    );
  }

  if (needsVerification) {
    return (
      <DashboardLayout>
        <PageTransition>
          <VerificationForm />
        </PageTransition>
      </DashboardLayout>
    );
  }

  // If we reach here, user is verified and should see the main dashboard

  const features = [
    {
      icon: <CreditCard className="h-6 w-6 text-[#145484]" />,
      title: "Membership-based Pricing & Discounts",
      description: "Exclusive discounts for members on all services"
    },
    {
      icon: <Download className="h-6 w-6 text-[#145484]" />,
      title: "Automated Invoicing",
      description: "Seamless billing with Stripe and GoCardless"
    },
    {
      icon: <Gift className="h-6 w-6 text-[#145484]" />,
      title: "Loyalty Rewards & Cashback",
      description: "Earn points and get cashback on every order"
    },
    {
      icon: <Brain className="h-6 w-6 text-[#145484]" />,
      title: "AI-powered Price Adjustments",
      description: "Dynamic pricing using AI"
    },
    {
      icon: <Clock className="h-6 w-6 text-[#145484]" />,
      title: "Streamlined Quote Process",
      description: "Quick quotes and instant booking"
    }
  ];

  const loyaltyRewards = [
    {
      icon: <Star className="h-5 w-5 text-[#145484]" />,
      title: "10% Off Next Order",
      progress: 65,
      points: "650/1000"
    },
    {
      icon: <Award className="h-5 w-5 text-[#145484]" />,
      title: "Free Premium Service",
      progress: 30,
      points: "300/1000"
    },
    {
      icon: <Gift className="h-5 w-5 text-[#145484]" />,
      title: "Birthday Reward",
      progress: 90,
      points: "900/1000"
    }
  ];

  return (
    <DashboardLayout>
      <PageTransition>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-[#145484]">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-muted-foreground mt-1">
                Status: <span className="font-medium text-green-600 capitalize">
                  {user?.user_role === 'admin' ? 'Admin' : 
                   user?.verification_status === 'verified' ? 'Verified' : 
                   'Verified'}
                </span>
              </p>
            </div>
          </div>

          {/* Subscription Plans - Main Focus for Verified Users */}
          <section className="py-8">
            <PricingPlans />
          </section>

          {/* Features Section */}
          <section className="py-12 bg-gray-50 rounded-lg">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center text-[#145484] mb-8">Platform Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.map((feature, index) => (
                  <Card key={index} className="hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        {feature.icon}
                        <h3 className="font-semibold text-lg">{feature.title}</h3>
                      </div>
                      <p className="text-gray-600">{feature.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:shadow-lg transition-shadow duration-200 border-[#145484]/20">
              <CardHeader className="space-y-1">
                <CardTitle className="text-xl md:text-2xl text-[#145484]">Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>Order #12345</span>
                    <span className="text-muted-foreground">£299.99</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Order #12344</span>
                    <span className="text-muted-foreground">£449.99</span>
                  </div>
                  <Button variant="outline">
                    <History className="mr-2 h-4 w-4" />
                    View All Orders
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-200 border-[#145484]/20">
              <CardHeader className="space-y-1">
                <CardTitle className="text-xl md:text-2xl text-[#145484]">Saved Quotes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>Toyota Camry 2022</span>
                    <span className="text-muted-foreground">£299.99</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Honda Civic 2023</span>
                    <span className="text-muted-foreground">£249.99</span>
                  </div>
                  <Button variant="outline">
                    <Heart className="mr-2 h-4 w-4" />
                    View Favorites
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Loyalty Section - Moved to bottom */}
          <section className="py-8">
            <div className="container mx-auto px-4">
              <div className="flex items-center gap-3 mb-6">
                <Award className="h-8 w-8 text-[#145484]" />
                <h2 className="text-2xl font-bold text-gray-800">Your Rewards</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {loyaltyRewards.map((reward, index) => (
                  <Card key={index} className="hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-[#145484]/5">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-2 bg-[#145484]/10 rounded-lg">
                          {reward.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-gray-800">{reward.title}</h3>
                          <p className="text-sm text-gray-600">{reward.points} points</p>
                        </div>
                      </div>
                      <Progress 
                        value={reward.progress} 
                        className="h-2 [&>div]:bg-[#145484] bg-[#145484]/10" 
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        </div>
      </PageTransition>
    </DashboardLayout>
  );
};

export default Index;

