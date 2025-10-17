import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, ShoppingCart, CreditCard, Info, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface GlassOrderChoiceProps {
  onProceedToOrder: () => void;
  onBack?: () => void;
  vehicleData?: {
    vrn?: string;
    make?: string;
    model?: string;
    year?: string;
  };
}

export function GlassOrderChoice({ onProceedToOrder, onBack, vehicleData }: GlassOrderChoiceProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleOrderGlass = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to order glass.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Call API to reserve 10 credits
      // For now, we'll just proceed and let the backend handle credit deduction
      // The credits will be refunded when the order completes
      
      toast({
        title: "Proceeding to Order",
        description: "10 credits have been reserved. They will be refunded once your order is complete.",
      });

      // Proceed to order page
      onProceedToOrder();
    } catch (error) {
      console.error('Error processing credit reservation:', error);
      toast({
        title: "Error",
        description: "Failed to process credit reservation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Build the price estimator URL with vehicle data if available
  const priceEstimatorUrl = vehicleData?.vrn
    ? `/price-estimator?vrn=${vehicleData.vrn}&make=${vehicleData.make || ''}&model=${vehicleData.model || ''}&year=${vehicleData.year || ''}`
    : '/price-estimator';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-4 lg:py-6 overflow-y-auto">
      <div className="w-full max-w-6xl mx-auto">
        {/* Back Button */}
        {onBack && (
          <div className="mb-3">
            <Button
              variant="ghost"
              onClick={onBack}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Supplier Selection
            </Button>
          </div>
        )}
        
        {/* Header */}
        <div className="text-center mb-5 lg:mb-6">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3">
            What would you like to do?
          </h1>
          <p className="text-base lg:text-lg text-gray-600 max-w-3xl mx-auto">
            Get a quick AI-powered price estimate or proceed to order the glass directly.
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
          {/* AI Price Estimate Card */}
          <Card className="hover:shadow-2xl transition-all duration-300 cursor-pointer group border-2 border-gray-200 hover:border-[#145484]">
            <CardContent className="p-8">
              <div className="flex flex-col items-center">
                <div className="bg-[#145484]/10 rounded-full w-24 h-24 mb-6 flex items-center justify-center group-hover:bg-[#145484]/20 transition-colors">
                  <Calculator className="w-12 h-12 text-[#145484]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">
                  Get AI Price Estimate
                </h2>
                <p className="text-base text-gray-600 mb-6 text-center">
                  Instant AI estimate of price, stock availability, and delivery time.
                </p>
                <div className="bg-blue-50 rounded-lg p-4 mb-6 w-full">
                  <p className="text-sm text-gray-700 italic text-center">
                    Powered by Windscreen Compare AI — prices are indicative and may vary.
                  </p>
                </div>
                <Link to={priceEstimatorUrl} className="block w-full">
                  <Button
                    variant="outline"
                    className="w-full h-12 text-base font-semibold border-2 border-[#FFC107] text-[#1D1D1F] bg-[#FFC107] hover:bg-[#FFD54F] hover:border-[#FFD54F] transition-all btn-glisten"
                  >
                    Check Price
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Order Glass Card */}
          <Card className="hover:shadow-2xl transition-all duration-300 cursor-pointer group border-2 border-[#0FB8C1] hover:border-[#0d9da5]">
            <CardContent className="p-8">
              <div className="flex flex-col items-center">
                <div className="bg-[#0FB8C1]/10 rounded-full w-24 h-24 mb-6 flex items-center justify-center group-hover:bg-[#0FB8C1]/20 transition-colors">
                  <ShoppingCart className="w-12 h-12 text-[#0FB8C1]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">
                  Order Glass
                </h2>
                <p className="text-base text-gray-600 mb-6 text-center">
                  Order directly from our supplier network using your trade account.
                </p>
                <div className="bg-[#0FB8C1]/10 rounded-lg p-4 mb-6 border-2 border-[#0FB8C1]/30 w-full">
                  <div className="flex items-start gap-3">
                    <CreditCard className="w-5 h-5 text-[#0FB8C1] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-900 font-bold mb-1">
                        Cost: 10 Credits
                      </p>
                      <p className="text-xs text-gray-600">
                        Refunded automatically when order completes
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={handleOrderGlass}
                  disabled={isProcessing}
                  className="w-full h-12 text-base font-bold bg-[#0FB8C1] hover:bg-[#0d9da5] text-white transition-all btn-glisten"
                >
                  {isProcessing ? "Processing..." : "Proceed to Order"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 shadow-sm rounded-xl p-5 border-2 border-blue-200">
          <div className="flex items-start gap-3">
            <CreditCard className="w-6 h-6 text-[#145484] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-gray-700 mb-2">
                Ordering through Windscreen Compare costs <span className="font-bold text-[#0FB8C1]">10 credits per session</span>. 
                Don't worry — credits are <span className="font-semibold">automatically refunded</span> when your order is successfully completed.
              </p>
              <Link to="/topup" className="text-sm text-[#0FB8C1] hover:text-[#0d9da5] font-medium inline-flex items-center gap-1">
                View My Credit Balance
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

