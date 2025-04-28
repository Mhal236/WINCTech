import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const plans = [
  {
    name: "Pro",
    price: "99",
    description: "Perfect for getting started with auto glass repairs",
    features: [
      "15% company commission",
      "10 searches per day",
      "+10% earnings boost", 
      "Priority job allocation",
      "14-day free trial",
      "Basic reporting"
    ]
  },
  {
    name: "Elite",
    price: "199",
    description: "Best value for professional technicians",
    popular: true,
    features: [
      "10% company commission",
      "25 searches per day",
      "+20% earnings boost",
      "Instant payouts",
      "Premium job access",
      "Advanced reporting",
      "Priority support"
    ]
  },
  {
    name: "Enterprise",
    price: "299",
    description: "For established auto glass businesses",
    features: [
      "5% company commission",
      "Unlimited searches",
      "+30% earnings boost",
      "Dedicated account manager",
      "First access to high-ticket jobs",
      "Custom reporting",
      "24/7 phone support"
    ]
  }
];

export const PricingPlans = () => {
  return (
    <div className="py-8 px-4 md:px-0">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-[#145484] mb-4">Simple, Transparent Pricing</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Choose the plan that best fits your needs. All plans include a 14-day free trial with no credit card required.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {plans.map((plan) => (
            <div key={plan.name} className="relative">
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                  <span className="bg-[#145484] text-white px-4 py-1 rounded-full text-sm font-medium shadow-sm">
                    Most Popular
                  </span>
                </div>
              )}
              <Card 
                className={`rounded-lg overflow-hidden transition-all duration-300 hover:shadow-xl flex flex-col h-full ${
                  plan.popular ? 'border-[#145484] ring-1 ring-[#145484] transform md:-translate-y-2 mt-3' : ''
                }`}
              >
                <CardHeader className={`p-4 md:p-6 ${
                  plan.popular 
                    ? 'bg-gradient-to-b from-[#145484]/30 via-[#145484]/20 to-white/90' 
                    : 'bg-gradient-to-b from-gray-100/40 via-gray-50/30 to-white/90'
                } rounded-t-lg backdrop-blur-sm`}>
                  <CardTitle className="text-xl md:text-2xl font-bold text-[#1D1D1F]">{plan.name}</CardTitle>
                  <CardDescription className="text-sm md:text-base text-[#1D1D1F]">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6 bg-white/90 backdrop-blur-sm flex-grow">
                  <div className="mb-4">
                    <span className="text-3xl md:text-4xl font-bold text-[#1D1D1F]">
                      £{plan.price}
                    </span>
                    <span className="text-sm md:text-base text-[#1D1D1F]">/month</span>
                  </div>
                  <ul className="space-y-2 md:space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm md:text-base">
                        <Check className="h-4 w-4 md:h-5 md:w-5 text-[#145484] flex-shrink-0" />
                        <span className="text-[#1D1D1F]">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="p-4 md:p-6 bg-white/90 rounded-b-lg backdrop-blur-sm mt-auto">
                  <Button 
                    className={`w-full h-10 md:h-12 text-sm md:text-base ${
                      plan.popular ? 'font-medium' : ''
                    }`}
                    onClick={() => alert(`Selected ${plan.name} plan with 14-day free trial`)}
                  >
                    Start Free Trial
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
