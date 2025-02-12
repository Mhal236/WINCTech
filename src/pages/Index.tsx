import { useState } from "react";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LoginForm } from "@/components/auth/LoginForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Search, Car, History, Heart, Receipt, Download, Printer, Star, CreditCard, Gift, Brain, Clock, Users, Check, Award } from "lucide-react";
import { PricingPlans } from "@/components/pricing/PricingPlans";
import { WelcomeScreen } from "@/components/WelcomeScreen";

const Index = () => {
  const [isAuthenticated] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [progress] = useState(65);

  if (!isAuthenticated) {
    return (
      <AuthLayout>
        <LoginForm />
      </AuthLayout>
    );
  }

  const features = [
    {
      icon: <CreditCard className="h-6 w-6 text-[#0D9488]" />,
      title: "Membership-based Pricing & Discounts",
      description: "Exclusive discounts for members on all services"
    },
    {
      icon: <Download className="h-6 w-6 text-[#0D9488]" />,
      title: "Automated Invoicing",
      description: "Seamless billing with Stripe and GoCardless"
    },
    {
      icon: <Gift className="h-6 w-6 text-[#0D9488]" />,
      title: "Loyalty Rewards & Cashback",
      description: "Earn points and get cashback on every order"
    },
    {
      icon: <Brain className="h-6 w-6 text-[#0D9488]" />,
      title: "AI-powered Price Adjustments",
      description: "Dynamic pricing using AI"
    },
    {
      icon: <Clock className="h-6 w-6 text-[#0D9488]" />,
      title: "Streamlined Quote Process",
      description: "Quick quotes and instant booking"
    }
  ];

  const loyaltyRewards = [
    {
      icon: <Star className="h-5 w-5 text-[#0D9488]" />,
      title: "10% Off Next Order",
      progress: 65,
      points: "650/1000"
    },
    {
      icon: <Award className="h-5 w-5 text-[#0D9488]" />,
      title: "Free Premium Service",
      progress: 30,
      points: "300/1000"
    },
    {
      icon: <Gift className="h-5 w-5 text-[#0D9488]" />,
      title: "Birthday Reward",
      progress: 90,
      points: "900/1000"
    }
  ];

  return (
    <DashboardLayout>
      <WelcomeScreen />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-semibold text-[#0D9488]">Welcome Back</h1>
          <div className="flex items-center gap-4 w-full md:w-1/3">
            <Input
              placeholder="Search glass parts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border-[#0D9488] focus:ring-[#0D9488]"
            />
            <Button variant="secondary" size="icon" className="bg-[#0D9488] hover:bg-[#0F766E] flex-shrink-0">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <section className="py-12 bg-gray-50 rounded-lg">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-[#0D9488] mb-8">Our Features</h2>
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

        <PricingPlans />

        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-lg transition-shadow duration-200 border-[#0D9488]/20">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl md:text-2xl text-[#0D9488]">Recent Orders</CardTitle>
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
                <Button variant="outline" className="w-full border-[#0D9488] text-[#0D9488] hover:bg-[#0D9488] hover:text-white">
                  <History className="mr-2 h-4 w-4" />
                  View All Orders
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200 border-[#0D9488]/20">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl md:text-2xl text-[#0D9488]">Saved Quotes</CardTitle>
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
                <Button variant="outline" className="w-full border-[#0D9488] text-[#0D9488] hover:bg-[#0D9488] hover:text-white">
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
              <Award className="h-8 w-8 text-[#0D9488]" />
              <h2 className="text-2xl font-bold text-gray-800">Your Rewards</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {loyaltyRewards.map((reward, index) => (
                <Card key={index} className="hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-[#0D9488]/5">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-2 bg-[#0D9488]/10 rounded-lg">
                        {reward.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-800">{reward.title}</h3>
                        <p className="text-sm text-gray-600">{reward.points} points</p>
                      </div>
                    </div>
                    <Progress 
                      value={reward.progress} 
                      className="h-2 [&>div]:bg-[#0D9488] bg-[#0D9488]/10" 
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default Index;

