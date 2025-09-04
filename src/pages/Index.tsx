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
        <div className="space-y-4 sm:space-y-6">
          <div className="mobile-flex justify-between items-start md:items-center mobile-gap">
            <div>
              <h1 className="mobile-heading font-semibold text-[#145484]">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-muted-foreground mt-1 mobile-text">
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
          <section className="py-8 sm:py-12 bg-gray-50 rounded-lg">
            <div className="mobile-container">
              <h2 className="mobile-heading font-bold text-center text-[#145484] mb-6 sm:mb-8">Platform Features</h2>
              <div className="mobile-grid mobile-gap">
                {features.map((feature, index) => (
                  <Card key={index} className="hover:shadow-lg transition-all duration-300">
                    <CardContent className="mobile-card">
                      <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                        {feature.icon}
                        <h3 className="font-semibold text-base sm:text-lg">{feature.title}</h3>
                      </div>
                      <p className="text-gray-600 mobile-text">{feature.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:shadow-lg transition-shadow duration-200 border-[#145484]/20">
              <CardHeader className="space-y-1">
                <CardTitle className="text-lg sm:text-xl md:text-2xl text-[#145484]">Recent Orders</CardTitle>
              </CardHeader>
              <CardContent className="mobile-card">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between mobile-text">
                    <span>Order #12345</span>
                    <span className="text-muted-foreground">£299.99</span>
                  </div>
                  <div className="flex items-center justify-between mobile-text">
                    <span>Order #12344</span>
                    <span className="text-muted-foreground">£449.99</span>
                  </div>
                  <Button variant="outline" className="w-full sm:w-auto touch-target">
                    <History className="mr-2 h-4 w-4" />
                    <span className="mobile-text">View All Orders</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-200 border-[#145484]/20">
              <CardHeader className="space-y-1">
                <CardTitle className="text-lg sm:text-xl md:text-2xl text-[#145484]">Saved Quotes</CardTitle>
              </CardHeader>
              <CardContent className="mobile-card">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between mobile-text">
                    <span>Toyota Camry 2022</span>
                    <span className="text-muted-foreground">£299.99</span>
                  </div>
                  <div className="flex items-center justify-between mobile-text">
                    <span>Honda Civic 2023</span>
                    <span className="text-muted-foreground">£249.99</span>
                  </div>
                  <Button variant="outline" className="w-full sm:w-auto touch-target">
                    <Heart className="mr-2 h-4 w-4" />
                    <span className="mobile-text">View Favorites</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Loyalty Section - Moved to bottom */}
          <section className="py-6 sm:py-8">
            <div className="mobile-container">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <Award className="h-6 w-6 sm:h-8 sm:w-8 text-[#145484]" />
                <h2 className="text-lg sm:text-2xl font-bold text-gray-800">Your Rewards</h2>
              </div>
              <div className="mobile-grid mobile-gap">
                {loyaltyRewards.map((reward, index) => (
                  <Card key={index} className="hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-[#145484]/5">
                    <CardContent className="mobile-card">
                      <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                        <div className="p-2 bg-[#145484]/10 rounded-lg">
                          {reward.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-base sm:text-lg text-gray-800">{reward.title}</h3>
                          <p className="text-xs sm:text-sm text-gray-600">{reward.points} points</p>
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

