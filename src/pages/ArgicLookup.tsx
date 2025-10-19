import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Package, ArrowLeft, Wrench } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";

const ArgicLookup = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 relative overflow-hidden flex items-center justify-center p-4">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 -left-4 w-96 h-96 bg-[#0FB8C1]/5 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-700" />
          </div>
        <Card className="max-w-2xl w-full shadow-2xl border-0">
          <CardContent className="p-12 text-center">
            {/* Icon */}
            <div className="mb-8 relative">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full mx-auto flex items-center justify-center relative">
                <Package className="w-16 h-16 text-blue-600" />
                <div className="absolute bottom-0 right-4 w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center border-4 border-white">
                  <Wrench className="w-6 h-6 text-yellow-900" />
                </div>
              </div>
            </div>

            {/* Coming Soon Message */}
            <div className="space-y-4 mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">ARGIC Code Lookup</h1>
              <div className="inline-block px-4 py-2 bg-yellow-100 border-2 border-yellow-400 rounded-full">
                <span className="text-lg font-semibold text-yellow-800">Coming Soon...</span>
              </div>
              <p className="text-gray-600 text-lg max-w-md mx-auto mt-4">
                We're building a powerful ARGIC code lookup tool to help you find the exact windscreen specifications for any vehicle.
              </p>
            </div>

            {/* Features Preview */}
            <div className="bg-blue-50 rounded-lg p-6 mb-8 border border-blue-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">What to expect:</h3>
              <ul className="text-left space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>Instant ARGIC code lookup by VRN</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>Detailed windscreen specifications</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>Real-time pricing from suppliers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>Stock availability checker</span>
                </li>
              </ul>
            </div>

            {/* Action Button */}
            <Button
              onClick={() => navigate(-1)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              size="lg"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
      </PageTransition>
    </DashboardLayout>
  );
};

export default ArgicLookup;

