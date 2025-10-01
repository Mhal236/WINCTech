import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Car, Check, CheckCircle, AlertCircle, Info, Coins } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { VehicleService, VehicleData } from "@/services/vehicleService";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const VrnSearch = () => {
  const { toast } = useToast();
  const { user, refreshUser } = useAuth();
  const [vrnSearchInput, setVrnSearchInput] = useState("");
  const [searchedVrn, setSearchedVrn] = useState(""); // Store the VRN that was actually searched
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [vrnSearchLoading, setVrnSearchLoading] = useState(false);

  // VRN Search function with credit deduction
  const handleVrnSearch = async () => {
    if (!vrnSearchInput.trim()) {
      toast({
        title: "Search Error",
        description: "Please enter a VRN",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to use VRN search",
        variant: "destructive",
      });
      return;
    }

    // Check if user has enough credits (10 credits required)
    const creditCost = 10;
    const userCredits = user.credits || 0;
    
    if (userCredits < creditCost) {
      toast({
        title: "Insufficient Credits",
        description: `You need ${creditCost} credits to search VRN data. You currently have ${userCredits} credits.`,
        variant: "destructive",
      });
      return;
    }

    setVrnSearchLoading(true);
    const searchVrn = vrnSearchInput.trim().toUpperCase();
    setSearchedVrn(searchVrn); // Store the VRN being searched
    
    try {
      // Get user data from app_users table (modern system)
      const { data: userData, error: userError } = await supabase
        .from('app_users')
        .select('id, credits, user_role')
        .eq('id', user.id)
        .single();

      if (userError || !userData) {
        toast({
          title: "Error",
          description: "Failed to verify user account",
          variant: "destructive",
        });
        return;
      }

      const currentCredits = userData.credits || 0;
      if (currentCredits < creditCost) {
        toast({
          title: "Insufficient Credits",
          description: `You need ${creditCost} credits to search VRN data. You currently have ${currentCredits} credits.`,
          variant: "destructive",
        });
        return;
      }

      // First perform the VRN lookup to check if data exists
      const result = await VehicleService.lookupVehicleData(searchVrn);
      
      if (!result.success) {
        // Don't deduct credits if VRN data not found
        setVehicleData(result);
        toast({
          title: "Vehicle Not Found",
          description: `No vehicle data found for ${searchVrn}. No credits were deducted.`,
          variant: "destructive",
        });
        return;
      }

      // VRN data found successfully, now deduct credits
      const newCredits = currentCredits - creditCost;

      // Update user credits in app_users table
      const { error: updateError } = await supabase
        .from('app_users')
        .update({ credits: newCredits })
        .eq('id', user.id);

      if (updateError) {
        toast({
          title: "Error",
          description: "Failed to deduct credits",
          variant: "destructive",
        });
        return;
      }

      // Try to get technician_id for transaction record (if user has technician profile)
      const { data: technicianData } = await supabase
        .from('technicians')
        .select('id')
        .eq('user_id', user.id)
        .single();

      // Create transaction record in credit_transactions table
      if (technicianData?.id) {
        // User has technician profile, use technician_id
        await supabase
          .from('credit_transactions')
          .insert({
            technician_id: technicianData.id,
            type: 'usage',
            credits: -creditCost,
            description: `VRN search for ${searchVrn}`,
            status: 'completed'
          });
      } else {
        // Admin/user without technician profile, create transaction with user info
        await supabase
          .from('credit_transactions')
          .insert({
            technician_id: null, // No technician profile
            type: 'usage',
            credits: -creditCost,
            description: `VRN search for ${searchVrn} (Admin: ${user.email})`,
            status: 'completed',
            metadata: {
              user_id: user.id,
              user_email: user.email,
              user_role: userData.user_role
            }
          });
      }

      // Refresh user credits in sidebar immediately after deduction
      await refreshUser();

      // Display successful result
      setVehicleData(result);
      toast({
        title: "VRN Search Complete",
        description: `Vehicle data found for ${searchVrn}. ${creditCost} credits deducted.`,
      });
    } catch (error) {
      console.error('VRN search error:', error);
      toast({
        title: "VRN Search Error",
        description: "An error occurred during the VRN search",
        variant: "destructive",
      });
    } finally {
      setVrnSearchLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-semibold text-[#3d99be]">VRN Search</h1>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-blue-800">VRN Vehicle Data Search</h3>
          </div>
          <p className="text-sm text-blue-700 mb-2">
            Search for detailed vehicle information using a Vehicle Registration Number (VRN).
          </p>
          <div className="flex items-center gap-2 text-sm">
            <Coins className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-800">Cost: 10 credits per search</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full">
          <Input
            placeholder="Enter VRN (e.g., AB12 CDE)..."
            className="w-full border-[#3d99be] focus:ring-[#3d99be]"
            value={vrnSearchInput}
            onChange={(e) => setVrnSearchInput(e.target.value.toUpperCase())}
          />
          <Button 
            variant="secondary" 
            className="bg-[#3d99be] hover:bg-[#2d7994] text-white"
            onClick={handleVrnSearch}
            disabled={vrnSearchLoading || !user?.id || (user?.credits || 0) < 10}
          >
            {vrnSearchLoading ? "Searching..." : "Search VRN"}
          </Button>
        </div>
        
        {!user?.id && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              Please log in to use VRN search functionality.
            </p>
          </div>
        )}
        
        {user?.id && (user?.credits || 0) < 10 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              You need at least 10 credits to perform a VRN search. 
              <Button variant="link" className="p-0 h-auto text-red-800 underline ml-1" onClick={() => window.location.href = '/topup'}>
                Top up your credits
              </Button>
            </p>
          </div>
        )}
        
        {vehicleData && (
          <Card className="mt-6">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Car className="h-6 w-6 text-[#3d99be] mr-2" />
              <CardTitle className="text-lg font-semibold">
                Vehicle Information - {searchedVrn}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vehicleData.success ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Make</p>
                      <p className="text-lg font-semibold">{vehicleData.make}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Model</p>
                      <p className="text-lg font-semibold">{vehicleData.model}</p>
                    </div>
                    {vehicleData.year && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Year</p>
                        <p className="text-lg font-semibold">{vehicleData.year}</p>
                      </div>
                    )}
                  </div>
                  {/* Cache indicator */}
                  {vehicleData.cached && (
                    <div className="p-3 bg-blue-50 rounded-lg mb-4">
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          Data retrieved from cache (faster lookup)
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        Vehicle data found successfully {vehicleData.cached ? '(from cache)' : '(from external API)'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-amber-800 mb-1">
                          Vehicle Not Found
                        </h4>
                        <p className="text-sm text-amber-700">
                          We couldn't find any vehicle data for <strong>{searchedVrn}</strong> in our database or external sources.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-blue-800 mb-2">
                          What to try:
                        </h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>• Double-check the VRN spelling and format</li>
                          <li>• Try without spaces (e.g., AB11CAE instead of AB11 CAE)</li>
                          <li>• Ensure the vehicle is UK registered</li>
                          <li>• Contact support if you believe this is an error</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        No credits were deducted for this search
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!vehicleData && !vrnSearchLoading && (
          <div className="text-center p-10 border border-dashed rounded-lg">
            <p className="text-gray-500">Enter a VRN above to search for vehicle information.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default VrnSearch;
