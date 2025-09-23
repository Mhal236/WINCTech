import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import SubscriptionModal from "@/components/subscriptions/SubscriptionModal";
import { useAuth } from "@/contexts/AuthContext";
import SubscriptionService, { type SubscriptionStatus } from "@/services/subscriptionService";

const plans = [
  {
    name: "Starter",
    monthlyPrice: 118.00,
    annualPrice: 1298.00,
    monthlySavings: 0,
    annualSavings: 118.00,
    description: "Perfect for getting started with auto glass repairs",
    features: [
      "20% company commission",
      "100 credits included",
      "4 credits per standard search (25 searches)",
      "VRN searching",
      "Job leads",
      "Calendar integration"
    ]
  },
  {
    name: "Professional",
    monthlyPrice: 198.00,
    annualPrice: 2178.00,
    monthlySavings: 0,
    annualSavings: 198.00,
    description: "Best value for professional technicians",
    popular: true,
    features: [
      "15% company commission",
      "350 credits included",
      "4 credits per standard search (87 searches)",
      "VRN searching",
      "Job leads",
      "Calendar integration",
      "Priority email & phone support"
    ]
  },
  {
    name: "Enterprise",
    monthlyPrice: 0,
    annualPrice: 0,
    monthlySavings: 0,
    annualSavings: 0,
    description: "Tailored to your needs",
    isCustom: true,
    features: [
      "5% company commission",
      "Custom credit packages",
      "Volume discounts available",
      "VRN searching",
      "Job leads",
      "Calendar integration",
      "Dedicated account manager",
      "24/7 priority support",
      "Custom integrations"
    ]
  }
];

export const PricingPlans = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<{
    priceId: string;
    planName: string;
    price: number;
    credits: number;
    role: string;
  } | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const { user, refreshUser } = useAuth();

  // Check user's current subscription status
  useEffect(() => {
    if (user?.id) {
      checkSubscriptionStatus();
    }
  }, [user?.id]);

  const checkSubscriptionStatus = async () => {
    if (!user?.id) return;
    
    setIsLoadingStatus(true);
    try {
      const status = await SubscriptionService.getSubscriptionStatus(user.id);
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('Error checking subscription status:', error);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleSubscriptionSelect = (plan: any, canSubscribe: boolean, isCurrentPlan: boolean, isDowngrade: boolean) => {
    if (plan.isCustom) {
      alert("Contact sales team for custom pricing and enterprise solutions");
      return;
    }

    // Prevent subscription to same tier
    if (isCurrentPlan) {
      alert(`You are already subscribed to the ${plan.name} plan.`);
      return;
    }

    // Prevent downgrades
    if (isDowngrade) {
      alert(`You cannot downgrade from ${subscriptionStatus?.planName} to ${plan.name}. Please contact support if you need to change your plan.`);
      return;
    }

    // Only allow if no subscription or upgrade
    if (!canSubscribe) {
      alert("Please contact support for plan changes.");
      return;
    }

    const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
    const role = plan.name === 'Starter' ? 'pro-1' : 'pro-2';
    const credits = plan.name === 'Starter' ? 100 : 350;
    
    // Send environment variable name to server - server will resolve actual price ID
    let priceIdEnvVar = '';
    if (plan.name === 'Starter') {
      priceIdEnvVar = isAnnual ? 'STRIPE_STARTER_ANNUAL_PRICE' : 'STRIPE_STARTER_MONTHLY_PRICE';
    } else if (plan.name === 'Professional') {
      priceIdEnvVar = isAnnual ? 'STRIPE_PROFESSIONAL_ANNUAL_PRICE' : 'STRIPE_PROFESSIONAL_MONTHLY_PRICE';
    }

    setSelectedSubscription({
      priceId: priceIdEnvVar,
      planName: plan.name,
      price,
      credits,
      role
    });
    setIsSubscriptionModalOpen(true);
  };

  const handleSubscriptionSuccess = async (role: string, planName: string) => {
    // Refresh user data to update role and credits
    await refreshUser();
    setIsSubscriptionModalOpen(false);
    setSelectedSubscription(null);
  };

  return (
    <div className="py-6 sm:py-8 mobile-container">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6 sm:mb-8 md:mb-12">
          <h2 className="mobile-heading font-bold text-[#145484] mb-3 sm:mb-4">Simple, Transparent Pricing</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mobile-text">Choose the plan that best fits your needs. All plans include a 14-day free trial with no credit card required.</p>
          
          {/* Pricing Toggle */}
          <div className="flex items-center justify-center gap-4 mt-6 mb-8">
            <Label htmlFor="pricing-toggle" className={`text-sm font-medium ${!isAnnual ? 'text-[#145484]' : 'text-gray-500'}`}>
              Monthly
            </Label>
            <Switch
              id="pricing-toggle"
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
              className="data-[state=checked]:bg-[#145484]"
            />
            <div className="flex items-center gap-2">
              <Label htmlFor="pricing-toggle" className={`text-sm font-medium ${isAnnual ? 'text-[#145484]' : 'text-gray-500'}`}>
                Annual
              </Label>
              <span className="bg-[#FFC107] text-[#1D1D1F] text-xs font-semibold px-2 py-1 rounded-full">
                Save up to 10%
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {plans.map((plan) => {
            const currentPrice = isAnnual ? plan.annualPrice : plan.monthlyPrice;
            const currentSavings = isAnnual ? plan.annualSavings : plan.monthlySavings;
            
            // Check subscription status for this plan
            const hasThisPlan = subscriptionStatus?.planName === plan.name;
            const isCurrentPlan = hasThisPlan && subscriptionStatus?.status === 'active';
            
            // Determine tier levels for upgrade/downgrade logic
            const tierLevels = { 'Starter': 1, 'Professional': 2, 'Enterprise': 3 };
            const currentTierLevel = subscriptionStatus?.planName ? tierLevels[subscriptionStatus.planName as keyof typeof tierLevels] || 0 : 0;
            const planTierLevel = tierLevels[plan.name as keyof typeof tierLevels] || 0;
            
            const isUpgrade = planTierLevel > currentTierLevel;
            const isDowngrade = planTierLevel < currentTierLevel && currentTierLevel > 0;
            const canSubscribe = !subscriptionStatus || isUpgrade;
            
            return (
              <div key={plan.name} className="relative">
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                    <span className="bg-[#145484] text-white px-4 py-1 rounded-full text-sm font-medium shadow-sm">
                      Popular
                    </span>
                  </div>
                )}
                <Card 
                  className={`rounded-lg overflow-hidden transition-all duration-300 hover:shadow-xl flex flex-col h-full ${
                    plan.popular ? 'border-[#145484] ring-1 ring-[#145484] transform md:-translate-y-2 mt-3' : ''
                  }`}
                >
                  <CardHeader className={`mobile-card ${
                    plan.popular 
                      ? 'bg-gradient-to-b from-[#145484]/30 via-[#145484]/20 to-white/90' 
                      : 'bg-gradient-to-b from-gray-100/40 via-gray-50/30 to-white/90'
                  } rounded-t-lg backdrop-blur-sm`}>
                    <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-[#1D1D1F]">{plan.name}</CardTitle>
                    <CardDescription className="mobile-text text-[#1D1D1F]">{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="mobile-card bg-white/90 backdrop-blur-sm flex-grow">
                    <div className="mb-3 sm:mb-4">
                      {isAnnual && currentSavings > 0 && (
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                            Save £{currentSavings.toFixed(2)} annually
                          </span>
                        </div>
                      )}
                      <div className="text-center">
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1D1D1F]">
                            {plan.isCustom ? 'Custom' : 
                             isAnnual ? `£${(currentPrice / 12).toFixed(2)}` : `£${currentPrice.toFixed(2)}`}
                          </span>
                          {!plan.isCustom && (
                            <span className="mobile-text text-[#1D1D1F]">
                              /month
                            </span>
                          )}
                        </div>
                        {isAnnual && !plan.isCustom && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-500">
                              £{currentPrice.toFixed(2)} annually
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <ul className="space-y-2 sm:space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 mobile-text">
                          <Check className="h-4 w-4 sm:h-5 sm:w-5 text-[#145484] flex-shrink-0" />
                          <span className="text-[#1D1D1F]">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="mobile-card bg-white/90 rounded-b-lg backdrop-blur-sm mt-auto">
                    <Button 
                      className={`w-full touch-target mobile-text ${
                        plan.popular ? 'cta-primary font-medium' : ''
                      } ${
                        isCurrentPlan 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : isDowngrade 
                            ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                            : ''
                      }`}
                      variant={plan.name === "Enterprise" ? "outline" : "default"}
                      onClick={() => handleSubscriptionSelect(plan, canSubscribe, isCurrentPlan, isDowngrade)}
                      disabled={isCurrentPlan || isDowngrade}
                    >
                      {plan.name === "Enterprise" 
                        ? "Contact sales"
                        : isCurrentPlan 
                          ? "Current Plan"
                          : isDowngrade 
                            ? "Contact Support"
                            : isUpgrade 
                              ? `Upgrade to ${plan.name}`
                              : "Select plan"}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            );
          })}
        </div>
        
        {/* Subscription Modal */}
        {selectedSubscription && (
          <SubscriptionModal
            isOpen={isSubscriptionModalOpen}
            onClose={() => setIsSubscriptionModalOpen(false)}
            priceId={selectedSubscription.priceId}
            planName={selectedSubscription.planName}
            price={selectedSubscription.price}
            isAnnual={isAnnual}
            credits={selectedSubscription.credits}
            role={selectedSubscription.role}
            onSuccess={handleSubscriptionSuccess}
          />
        )}
      </div>
    </div>
  );
};