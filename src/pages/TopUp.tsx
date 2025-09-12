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

// Credit packages
const creditPackages = [
  {
    id: "starter",
    name: "Starter Pack",
    credits: 100,
    price: 9.99,
    originalPrice: null,
    description: "Perfect for getting started",
    icon: Zap,
    color: "bg-blue-500",
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
    price: 39.99,
    originalPrice: 49.99,
    description: "Most popular choice for professionals",
    icon: Star,
    color: "bg-emerald-500",
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
    price: 99.99,
    originalPrice: 129.99,
    description: "For high-volume users",
    icon: Crown,
    color: "bg-purple-500",
    popular: false,
    features: [
      "1,500 credits",
      "Valid for 18 months",
      "24/7 phone support",
      "All features access",
      "50% bonus credits",
      "Dedicated account manager"
    ]
  }
];

export default function TopUp() {
  const { user } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [customCredits, setCustomCredits] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal">("card");

  // Calculate credits from custom amount (1 credit = £0.10)
  const calculateCreditsFromAmount = (amount: string) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return 0;
    return Math.floor(numAmount * 10); // £0.10 per credit
  };

  // Calculate amount from custom credits
  const calculateAmountFromCredits = (credits: string) => {
    const numCredits = parseInt(credits);
    if (isNaN(numCredits) || numCredits <= 0) return "0.00";
    return (numCredits * 0.10).toFixed(2);
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setCustomCredits(calculateCreditsFromAmount(value).toString());
  };

  const handleCustomCreditsChange = (value: string) => {
    setCustomCredits(value);
    setCustomAmount(calculateAmountFromCredits(value));
  };

  const handlePurchase = (packageId?: string) => {
    if (packageId) {
      const pkg = creditPackages.find(p => p.id === packageId);
      toast({
        title: "Payment Processing",
        description: `Processing payment for ${pkg?.name} (${pkg?.credits} credits)`,
      });
    } else if (customAmount && parseFloat(customAmount) > 0) {
      toast({
        title: "Payment Processing",
        description: `Processing custom payment of £${customAmount} (${customCredits} credits)`,
      });
    }
    // TODO: Integrate with Stripe payment processing
  };

  const currentCredits = user?.credits || 0;

  return (
    <Sidebar>
      <PageTransition>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <CreditCard className="h-8 w-8 text-blue-600" />
                    Top Up Credits
                  </h1>
                  <p className="mt-2 text-gray-600">
                    Add credits to your account to access premium features
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Current Balance</p>
                    <div className="flex items-center gap-2">
                      <Coins className="h-5 w-5 text-yellow-500" />
                      <span className="text-2xl font-bold text-gray-900">{currentCredits}</span>
                      <span className="text-sm text-gray-500">credits</span>
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
                        isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''
                      } ${pkg.popular ? 'border-emerald-200' : ''}`}
                      onClick={() => setSelectedPackage(pkg.id)}
                    >
                      {pkg.popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <Badge className="bg-emerald-500 text-white px-4 py-1">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Most Popular
                          </Badge>
                        </div>
                      )}
                      
                      <CardHeader className="text-center pb-4">
                        <div className={`w-12 h-12 ${pkg.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <CardTitle className="text-xl">{pkg.name}</CardTitle>
                        <CardDescription>{pkg.description}</CardDescription>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {/* Pricing */}
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-3xl font-bold text-gray-900">£{pkg.price}</span>
                            {pkg.originalPrice && (
                              <span className="text-lg text-gray-500 line-through">£{pkg.originalPrice}</span>
                            )}
                          </div>
                          <div className="flex items-center justify-center gap-1 mt-1">
                            <Coins className="h-4 w-4 text-yellow-500" />
                            <span className="text-lg font-semibold text-gray-700">{pkg.credits} credits</span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            £{(pkg.price / pkg.credits).toFixed(3)} per credit
                          </p>
                        </div>

                        {/* Features */}
                        <div className="space-y-2">
                          {pkg.features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                              <span className="text-gray-600">{feature}</span>
                            </div>
                          ))}
                        </div>

                        <Button
                          onClick={() => handlePurchase(pkg.id)}
                          className={`w-full ${
                            isSelected ? 'bg-blue-600 hover:bg-blue-700' : ''
                          } ${pkg.popular ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                          variant={isSelected ? "default" : "outline"}
                        >
                          {isSelected ? "Selected" : "Select Package"}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            <Separator className="my-8" />

            {/* Custom Amount */}
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <Plus className="h-5 w-5" />
                    Custom Amount
                  </CardTitle>
                  <CardDescription>
                    Choose your own amount or number of credits
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="custom-amount">Amount (£)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">£</span>
                        <Input
                          id="custom-amount"
                          type="number"
                          placeholder="0.00"
                          value={customAmount}
                          onChange={(e) => handleCustomAmountChange(e.target.value)}
                          className="pl-8"
                          min="1"
                          step="0.01"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="custom-credits">Credits</Label>
                      <div className="relative">
                        <Input
                          id="custom-credits"
                          type="number"
                          placeholder="0"
                          value={customCredits}
                          onChange={(e) => handleCustomCreditsChange(e.target.value)}
                          min="10"
                          step="1"
                        />
                        <Coins className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-yellow-500" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-blue-800">
                      <Gift className="h-4 w-4" />
                      <span className="font-medium">Credit Rate</span>
                    </div>
                    <p className="text-sm text-blue-600 mt-1">
                      1 credit = £0.10 • Minimum purchase: 10 credits (£1.00)
                    </p>
                  </div>

                  <Button
                    onClick={() => handlePurchase()}
                    className="w-full"
                    disabled={!customAmount || parseFloat(customAmount) < 1}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Purchase {customCredits} Credits for £{customAmount}
                  </Button>
                </CardContent>
              </Card>
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
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>SSL Encrypted</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Instant Delivery</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </PageTransition>
    </Sidebar>
  );
}
