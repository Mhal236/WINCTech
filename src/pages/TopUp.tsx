import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CreditCard, 
  Zap, 
  Star, 
  Crown,
  Gift,
  CheckCircle,
  Plus,
  Coins,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { PageTransition } from "@/components/PageTransition";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import PaymentModal from "@/components/payments/PaymentModal";
import SubscriptionModal from "@/components/subscriptions/SubscriptionModal";

// Credit packages
const creditPackages = [
  {
    id: "starter",
    name: "Starter Pack",
    credits: 100,
    price: 49.99,
    originalPrice: null,
    description: "Perfect for getting started",
    icon: Zap,
    color: "bg-[#145484]",
    popular: false,
    features: [
      "100 credits",
      "Valid for 6 months",
      "Email support",
      "Basic features access"
    ]
  },
  {
    id: "professional",
    name: "Professional Pack",
    credits: 500,
    price: 99.99,
    originalPrice: null,
    description: "Most popular choice for professionals",
    icon: Star,
    color: "bg-[#FFC107]",
    popular: true,
    features: [
      "500 credits",
      "Valid for 12 months",
      "Priority support",
      "Advanced features access",
      "20% bonus credits"
    ]
  },
  {
    id: "enterprise",
    name: "Enterprise Pack",
    credits: 1500,
    price: 150.00,
    originalPrice: null,
    description: "Monthly subscription for high-volume users",
    icon: Crown,
    color: "bg-[#1D1D1F]",
    popular: false,
    isSubscription: true, // Mark as subscription
    features: [
      "1,500 credits per month",
      "Monthly recurring billing",
      "24/7 phone support",
      "All features access",
      "50% bonus credits",
      "Dedicated account manager"
    ]
  }
];

export default function TopUp() {
  const { user, refreshUser } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState<{
    amount: number;
    credits: number;
    packageName?: string;
  } | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<{
    priceId: string;
    planName: string;
    price: number;
    credits: number;
    role: string;
  } | null>(null);


  const handlePurchase = (packageId: string) => {
    const pkg = creditPackages.find(p => p.id === packageId);
    if (pkg) {
      if (pkg.isSubscription) {
        // Handle Enterprise pack as subscription
        setSubscriptionData({
          priceId: 'STRIPE_ENTERPRISE_MONTHLY_PRICE', // Environment variable for Enterprise monthly price
          planName: pkg.name,
          price: pkg.price,
          credits: pkg.credits,
          role: 'pro-2' // Enterprise users get pro-2 role
        });
        setIsSubscriptionModalOpen(true);
      } else {
        // Handle Starter and Professional as one-time payments
        setPaymentData({
          amount: pkg.price,
          credits: pkg.credits,
          packageName: pkg.name
        });
        setIsPaymentModalOpen(true);
      }
    }
  };

  const handlePaymentSuccess = async (newCredits: number) => {
    // Refresh user data to update credits display
    await refreshUser();
    setIsPaymentModalOpen(false);
    setPaymentData(null);
    setSelectedPackage(null);
    
    toast({
      title: "Payment Successful!",
      description: `Your account has been updated with the new credits.`,
    });
  };

  const handleSubscriptionSuccess = async (role: string, planName: string) => {
    // Refresh user data to update role and credits
    await refreshUser();
    setIsSubscriptionModalOpen(false);
    setSubscriptionData(null);
    setSelectedPackage(null);
    
    toast({
      title: "Subscription Activated!",
      description: `Welcome to ${planName}! Your account has been upgraded.`,
    });
  };

  const currentCredits = user?.credits || 0;

  return (
    <Sidebar>
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-white">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#FFC107] to-[#FFD54F] border-b border-amber-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-[#1D1D1F] flex items-center gap-3">
                    <CreditCard className="h-8 w-8 text-[#145484]" />
                    Top Up Credits
                  </h1>
                  <p className="mt-2 text-[#1D1D1F]/80">
                    Add credits to your account to access premium features
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                    <p className="text-sm text-[#1D1D1F]/70">Current Balance</p>
                    <div className="flex items-center gap-2">
                      <Coins className="h-5 w-5 text-[#145484]" />
                      <span className="text-2xl font-bold text-[#1D1D1F]">{currentCredits}</span>
                      <span className="text-sm text-[#1D1D1F]/70">credits</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Credit Packages */}
            <div className="mb-12">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Credit Package</h2>
                <p className="text-gray-600">Select the package that best fits your needs</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {creditPackages.map((pkg) => {
                  const Icon = pkg.icon;
                  const isSelected = selectedPackage === pkg.id;
                  
                  return (
                    <Card 
                      key={pkg.id} 
                      className={`relative transition-all duration-200 cursor-pointer hover:shadow-lg ${
                        isSelected ? 'ring-2 ring-[#FFC107] shadow-lg' : ''
                      } ${pkg.popular ? 'border-[#FFC107] border-2' : ''}`}
                      onClick={() => setSelectedPackage(pkg.id)}
                    >
                      {pkg.popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <Badge className="bg-[#FFC107] text-[#1D1D1F] px-4 py-1 font-semibold">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Most Popular
                          </Badge>
                        </div>
                      )}
                      
                      <CardHeader className="text-center pb-4">
                        <div className={`w-12 h-12 ${pkg.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                          <Icon className={`h-6 w-6 ${pkg.id === 'professional' ? 'text-[#1D1D1F]' : 'text-white'}`} />
                        </div>
                        <CardTitle className="text-xl">{pkg.name}</CardTitle>
                        <CardDescription>{pkg.description}</CardDescription>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {/* Pricing */}
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-3xl font-bold text-gray-900">£{pkg.price}</span>
                            {pkg.isSubscription && (
                              <span className="text-lg text-gray-600">/month</span>
                            )}
                            {pkg.originalPrice && (
                              <span className="text-lg text-gray-500 line-through">£{pkg.originalPrice}</span>
                            )}
                          </div>
                          <div className="flex items-center justify-center gap-1 mt-1">
                            <Coins className="h-4 w-4 text-[#FFC107]" />
                            <span className="text-lg font-semibold text-gray-700">
                              {pkg.credits} credits{pkg.isSubscription ? " per month" : ""}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            £{(pkg.price / pkg.credits).toFixed(3)} per credit{pkg.isSubscription ? " monthly" : ""}
                          </p>
                        </div>

                        {/* Features */}
                        <div className="space-y-2">
                          {pkg.features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-[#FFC107] flex-shrink-0" />
                              <span className="text-gray-600">{feature}</span>
                            </div>
                          ))}
                        </div>

                        <Button
                          onClick={() => handlePurchase(pkg.id)}
                          className={`w-full ${
                            isSelected ? 'bg-[#145484] hover:bg-[#145484]/90 text-white' : ''
                          } ${pkg.popular ? 'bg-[#FFC107] hover:bg-[#FFC107]/90 text-[#1D1D1F] font-semibold' : ''}`}
                          variant={isSelected ? "default" : "outline"}
                        >
                          {isSelected ? "Selected" : pkg.isSubscription ? "Subscribe Monthly" : "Select Package"}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>


            {/* Payment Methods Info */}
            <div className="max-w-2xl mx-auto mt-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-center text-lg">Secure Payment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      <span>Credit/Debit Cards</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-[#FFC107]" />
                      <span>SSL Encrypted</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-[#FFC107]" />
                      <span>Instant Delivery</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Payment Modal */}
        {paymentData && (
          <PaymentModal
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            amount={paymentData.amount}
            credits={paymentData.credits}
            packageName={paymentData.packageName}
            onSuccess={handlePaymentSuccess}
          />
        )}

        {/* Subscription Modal */}
        {subscriptionData && (
          <SubscriptionModal
            isOpen={isSubscriptionModalOpen}
            onClose={() => setIsSubscriptionModalOpen(false)}
            priceId={subscriptionData.priceId}
            planName={subscriptionData.planName}
            price={subscriptionData.price}
            isAnnual={false}
            credits={subscriptionData.credits}
            role={subscriptionData.role}
            onSuccess={handleSubscriptionSuccess}
          />
        )}
      </PageTransition>
    </Sidebar>
  );
}
