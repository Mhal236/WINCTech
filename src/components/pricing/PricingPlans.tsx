import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const plans = [
  {
    name: "Starter",
    price: "88",
    originalPrice: "118",
    description: "Perfect for getting started with auto glass repairs",
    features: [
      "15% company commission",
      "100 credits included",
      "4 credits per standard search (25 searches)",
      "VRN searching",
      "Job leads",
      "Calendar integration"
    ]
  },
  {
    name: "Pro",
    price: "148",
    originalPrice: "198",
    description: "Best value for professional technicians",
    popular: true,
    features: [
      "10% company commission",
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
    price: "Custom",
    description: "Tailored to your needs",
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
  return (
    <div className="py-6 sm:py-8 mobile-container">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6 sm:mb-8 md:mb-12">
          <h2 className="mobile-heading font-bold text-[#145484] mb-3 sm:mb-4">Simple, Transparent Pricing</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mobile-text">Choose the plan that best fits your needs. All plans include a 14-day free trial with no credit card required.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {plans.map((plan) => (
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
                    {plan.originalPrice && plan.price !== "Custom" && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg sm:text-xl text-gray-400 line-through">
                          £{plan.originalPrice}
                        </span>
                        <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                          Save £{parseInt(plan.originalPrice) - parseInt(plan.price)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-baseline gap-1">
                      {plan.price !== "Custom" && (
                        <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1D1D1F]">
                          £{plan.price}
                        </span>
                      )}
                      {plan.price === "Custom" ? (
                        <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1D1D1F]">
                          Custom
                        </span>
                      ) : (
                        <span className="mobile-text text-[#1D1D1F]">/month</span>
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
                    }`}
                    variant={plan.name === "Enterprise" ? "outline" : "default"}
                    onClick={() => {
                      if (plan.name === "Enterprise") {
                        alert("Contact sales team for custom pricing and enterprise solutions");
                      } else {
                        alert(`Selected ${plan.name} plan - £${plan.price}/month`);
                      }
                    }}
                  >
                    {plan.name === "Enterprise" ? "Contact sales" : "Select plan"}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
