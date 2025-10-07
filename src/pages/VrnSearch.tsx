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

    setVrnSearchLoading(true);
    const searchVrn = vrnSearchInput.trim().toUpperCase();
    setSearchedVrn(searchVrn); // Store the VRN being searched
    
    try {
      // First perform the VRN lookup to check if data exists (this will check cache first)
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

      // Check if data came from cache (no credits needed)
      if (result.cached) {
        console.log(`✅ Vehicle data loaded from cache for ${searchVrn} - no credits deducted`);
        setVehicleData(result);
        toast({
          title: "VRN Search Complete",
          description: `Vehicle data found for ${searchVrn} (from cache - no credits deducted).`,
        });
        return;
      }

      // Data NOT from cache, need to check and deduct credits
      const creditCost = 10;
      
      // Get user data from app_users table
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
          description: `This VRN requires ${creditCost} credits (not in cache). You have ${currentCredits} credits.`,
          variant: "destructive",
        });
        return;
      }

      // VRN data found from API, now deduct credits
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Enhanced Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 rounded-b-2xl">
          <div className="px-6 py-8">
            <div className="flex flex-col gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold text-gray-900">VRN Search</h1>
                </div>
                <p className="text-gray-600 text-lg">
                  Search for detailed vehicle information using registration number
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
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
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
        
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
            disabled={vrnSearchLoading || !user?.id}
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
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-800 font-medium mb-1">
                  Low Credits
                </p>
                <p className="text-sm text-amber-700">
                  You have {user?.credits || 0} credits. New VRN searches cost 10 credits, but previously searched VRNs can be looked up for free from our cache.
                  <Button variant="link" className="p-0 h-auto text-amber-800 underline ml-1" onClick={() => window.location.href = '/topup'}>
                    Top up your credits
                  </Button>
                </p>
              </div>
            </div>
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
                <div className="space-y-4">
                  {/* Debug: Log vehicle data */}
                  {console.log('🚗 Vehicle Data to Display:', {
                    body_style: vehicleData.body_style,
                    body_shape: vehicleData.body_shape,
                    wheelbase_type: vehicleData.wheelbase_type,
                    colour: vehicleData.colour,
                    transmission: vehicleData.transmission,
                    doors: vehicleData.doors,
                    seats: vehicleData.seats,
                    fuel_tank_capacity: vehicleData.fuel_tank_capacity,
                    number_of_axles: vehicleData.number_of_axles,
                    cab_type: vehicleData.cab_type,
                    allData: vehicleData
                  })}
                  {/* Vehicle Image */}
                  {vehicleData.vehicle_image_url && (
                    <div className="flex justify-center mb-4 bg-gray-100 rounded-lg p-4">
                      <img 
                        src={vehicleData.vehicle_image_url} 
                        alt={`${vehicleData.make} ${vehicleData.model}`}
                        className="max-w-full max-h-96 h-auto rounded-lg shadow-md object-contain"
                        onError={(e) => {
                          console.error('Failed to load vehicle image:', vehicleData.vehicle_image_url);
                          // Hide image container if it fails to load
                          const container = (e.target as HTMLElement).parentElement;
                          if (container) {
                            container.style.display = 'none';
                          }
                        }}
                        onLoad={() => {
                          console.log('✅ Vehicle image loaded successfully');
                        }}
                      />
                    </div>
                  )}
                  {!vehicleData.vehicle_image_url && (
                    <div className="flex justify-center mb-4 bg-gray-100 rounded-lg p-8">
                      <div className="text-center text-gray-500">
                        <Car className="h-16 w-16 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">No vehicle image available</p>
                      </div>
                    </div>
                  )}
                  
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
                    {vehicleData.vin && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">VIN</p>
                        <p className="text-lg font-semibold font-mono">{vehicleData.vin}</p>
                      </div>
                    )}
                    {vehicleData.body_shape && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Body Shape</p>
                        <p className="text-lg font-semibold">{vehicleData.body_shape}</p>
                      </div>
                    )}
                    {vehicleData.body_style && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Body Style</p>
                        <p className="text-lg font-semibold">{vehicleData.body_style}</p>
                      </div>
                    )}
                    {vehicleData.colour && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Colour</p>
                        <p className="text-lg font-semibold">{vehicleData.colour}</p>
                      </div>
                    )}
                    {vehicleData.transmission && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Transmission</p>
                        <p className="text-lg font-semibold">{vehicleData.transmission}</p>
                      </div>
                    )}
                    {vehicleData.wheelbase_type && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Wheelbase Type</p>
                        <p className="text-lg font-semibold">{vehicleData.wheelbase_type}</p>
                      </div>
                    )}
                    {vehicleData.fuel_tank_capacity && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Fuel Tank Capacity</p>
                        <p className="text-lg font-semibold">{vehicleData.fuel_tank_capacity} Litres</p>
                      </div>
                    )}
                    {vehicleData.number_of_axles && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Number of Axles</p>
                        <p className="text-lg font-semibold">{vehicleData.number_of_axles}</p>
                      </div>
                    )}
                    {vehicleData.doors && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Number of Doors</p>
                        <p className="text-lg font-semibold">{vehicleData.doors}</p>
                      </div>
                    )}
                    {vehicleData.seats && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Number of Seats</p>
                        <p className="text-lg font-semibold">{vehicleData.seats}</p>
                      </div>
                    )}
                    {vehicleData.payload_volume && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Payload Volume</p>
                        <p className="text-lg font-semibold">{vehicleData.payload_volume}</p>
                      </div>
                    )}
                    {vehicleData.cab_type && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Cab Type</p>
                        <p className="text-lg font-semibold">{vehicleData.cab_type}</p>
                      </div>
                    )}
                    {vehicleData.platform_name && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Platform Name</p>
                        <p className="text-lg font-semibold">{vehicleData.platform_name}</p>
                      </div>
                    )}
                    {vehicleData.platform_is_shared !== undefined && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Platform Shared Across Models</p>
                        <p className="text-lg font-semibold">{vehicleData.platform_is_shared ? 'Yes' : 'No'}</p>
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
      </div>
    </DashboardLayout>
  );
};

export default VrnSearch;
