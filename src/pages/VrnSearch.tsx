import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Car, Check, CheckCircle, AlertCircle, Info, Coins, ChevronRight, ShoppingCart } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useState, useRef } from "react";
import { VehicleService, VehicleData } from "@/services/vehicleService";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

type SearchTab = 'vrn' | 'make-model';

const VrnSearch = () => {
  const { toast } = useToast();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SearchTab>('vrn');
  const [vrnSearchInput, setVrnSearchInput] = useState("");
  const [makeSearchInput, setMakeSearchInput] = useState("");
  const [modelSearchInput, setModelSearchInput] = useState("");
  const [yearSearchInput, setYearSearchInput] = useState("");
  const [searchedVrn, setSearchedVrn] = useState(""); // Store the VRN that was actually searched
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [vrnSearchLoading, setVrnSearchLoading] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  // Car diagram state
  const [showCarDiagram, setShowCarDiagram] = useState(false);
  const [selectedWindows, setSelectedWindows] = useState<Set<string>>(new Set());
  const [hoverTooltip, setHoverTooltip] = useState<{ x: number; y: number; label: string } | null>(null);

  // Window regions for tooltips
  const regions = [
    { id: 'jqvmap1_ws', label: 'Windscreen' },
    { id: 'jqvmap1_rw', label: 'Rear Window' },
    { id: 'jqvmap1_df', label: "Driver's Front Door" },
    { id: 'jqvmap1_dg', label: "Passenger's Front Door" },
    { id: 'jqvmap1_dr', label: "Driver's Rear Door" },
    { id: 'jqvmap1_dd', label: "Passenger's Rear Door" },
    { id: 'jqvmap1_vf', label: "Driver's Front Vent" },
    { id: 'jqvmap1_vg', label: "Passenger's Rear Vent" },
    { id: 'jqvmap1_vp', label: "Passenger's Front Vent" },
    { id: 'jqvmap1_vr', label: "Driver's Rear Vent" },
    { id: 'jqvmap1_qr', label: "Driver's Rear Quarter Glass" },
    { id: 'jqvmap1_qg', label: "Passenger's Rear Quarter Glass" },
  ];

  // Handle window selection
  const handleWindowClick = (windowId: string) => {
    setSelectedWindows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(windowId)) {
        newSet.delete(windowId);
      } else {
        newSet.add(windowId);
      }
      return newSet;
    });
  };

  // Handle mouse move for tooltip
  const handleMouseMove = (e: React.MouseEvent<SVGPathElement>, label: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverTooltip({
      x: e.clientX,
      y: e.clientY,
      label
    });
  };

  // Navigate to price lookup with selected data
  const handleContinueToOrder = () => {
    if (selectedWindows.size === 0) {
      toast({
        title: "No Glass Selected",
        description: "Please select at least one window to continue.",
        variant: "destructive",
      });
      return;
    }

    if (!vehicleData) return;

    const params = new URLSearchParams({
      vrn: searchedVrn,
      make: vehicleData.make,
      model: vehicleData.model,
      year: vehicleData.year || '',
      bodyStyle: vehicleData.body_style || vehicleData.body_type || '',
      vehicleImage: vehicleData.vehicle_image_url || '',
      selectedWindows: JSON.stringify(Array.from(selectedWindows))
    });

    navigate(`/glass-order?${params.toString()}`);
  };

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
        
        // Scroll to results on mobile to show error
        setTimeout(() => {
          if (resultsRef.current && window.innerWidth < 1024) {
            resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 300);
        return;
      }

      // Deduct credits regardless of cache status
      const creditCost = 1;
      
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
      const transactionDescription = result.cached 
        ? `VRN search for ${searchVrn} (from cache)` 
        : `VRN search for ${searchVrn}`;
        
      if (technicianData?.id) {
        // User has technician profile, use technician_id
        await supabase
          .from('credit_transactions')
          .insert({
            technician_id: technicianData.id,
            type: 'usage',
            credits: -creditCost,
            description: transactionDescription,
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
            description: `${transactionDescription} (Admin: ${user.email})`,
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
      
      const cacheStatus = result.cached ? " (from cache)" : "";
      toast({
        title: "VRN Search Complete",
        description: `Vehicle data found for ${searchVrn}${cacheStatus}. ${creditCost} credits deducted.`,
      });

      // Scroll to results on mobile after short delay
      setTimeout(() => {
        if (resultsRef.current && window.innerWidth < 1024) {
          resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
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
                  <h1 className="text-4xl font-bold text-gray-900">Vehicle Search</h1>
                </div>
                <p className="text-gray-600 text-lg">
                  Search for detailed vehicle information using multiple methods
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
        {/* Two Column Layout - Search on Left, Results on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
          {/* Left Column - Search Card */}
          <div className="lg:sticky lg:top-6 h-fit">
            <Card className="shadow-lg">
              <CardContent className="p-6">
          {/* Tab Buttons */}
          <div className="flex border-2 border-gray-200 rounded-full p-1 bg-white shadow-sm mb-6">
            <button
              onClick={() => setActiveTab('vrn')}
              className={cn(
                "flex-1 py-3 px-6 rounded-full font-semibold transition-all duration-300 text-sm sm:text-base",
                activeTab === 'vrn'
                  ? "bg-[#145484] text-white shadow-md"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              VRN
            </button>
            <button
              onClick={() => setActiveTab('make-model')}
              className={cn(
                "flex-1 py-3 px-6 rounded-full font-semibold transition-all duration-300 text-sm sm:text-base",
                activeTab === 'make-model'
                  ? "bg-[#145484] text-white shadow-md"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              Make & Model
            </button>
          </div>

          {/* Search Input Area */}
          <div className="space-y-4">
            {activeTab === 'vrn' && (
              <div className="space-y-4">
                <Input
                  placeholder="VRN"
                  className="h-14 text-lg border-gray-300 focus:border-[#145484] focus:ring-[#145484] text-center"
                  value={vrnSearchInput}
                  onChange={(e) => setVrnSearchInput(e.target.value.toUpperCase())}
                  maxLength={8}
                />
              </div>
            )}

            {activeTab === 'make-model' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    placeholder="Make (e.g., BMW)"
                    className="h-14 text-lg border-gray-300 focus:border-[#145484] focus:ring-[#145484]"
                    value={makeSearchInput}
                    onChange={(e) => setMakeSearchInput(e.target.value)}
                  />
                  <Input
                    placeholder="Model (e.g., 3 Series)"
                    className="h-14 text-lg border-gray-300 focus:border-[#145484] focus:ring-[#145484]"
                    value={modelSearchInput}
                    onChange={(e) => setModelSearchInput(e.target.value)}
                  />
                </div>
                <Input
                  placeholder="Year (e.g., 2020)"
                  className="h-14 text-lg border-gray-300 focus:border-[#145484] focus:ring-[#145484]"
                  value={yearSearchInput}
                  onChange={(e) => setYearSearchInput(e.target.value)}
                  type="number"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                />
                <p className="text-sm text-gray-500 text-center">
                  Search by vehicle make, model, and year
                </p>
              </div>
            )}

            {/* Search Button */}
            <Button
              variant="ghost"
              onClick={handleVrnSearch}
              disabled={vrnSearchLoading || !user?.id}
              className="w-full h-16 bg-[#FFC107] hover:bg-[#FFD54F] text-black text-xl font-bold rounded-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 btn-glisten"
            >
              {vrnSearchLoading ? (
                "Searching..."
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <span>Search</span>
                  <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
                    <Coins className="w-4 h-4" />
                    <span className="text-sm font-semibold">1 credit</span>
                  </div>
                  <ChevronRight className="w-6 h-6" />
                </div>
              )}
            </Button>
          </div>

                {/* Warnings */}
                {!user?.id && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                    <p className="text-xs text-yellow-800">
                      Please log in to use VRN search functionality.
                    </p>
                  </div>
                )}
                
                {user?.id && (user?.credits || 0) < 5 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-amber-800 font-medium mb-1">
                          Low Credits
                        </p>
                        <p className="text-xs text-amber-700">
                          You have {user?.credits || 0} credits. VRN searches cost 1 credit each.
                          <Button variant="link" className="p-0 h-auto text-amber-800 underline ml-1 text-xs" onClick={() => window.location.href = '/topup'}>
                            Top up
                          </Button>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Results */}
          <div ref={resultsRef} className="lg:min-h-screen">
        
        {vehicleData && (
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Car className="h-6 w-6 text-[#145484] mr-2" />
              <CardTitle className="text-lg font-semibold">
                Vehicle Information - {searchedVrn}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vehicleData.success ? (
                <div className="space-y-4">
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
                          Data retrieved from cache (faster response time)
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Buy Glass Button */}
                  <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                    <Button
                      variant="ghost"
                      onClick={() => setShowCarDiagram(!showCarDiagram)}
                      className="w-full h-14 bg-[#FFC107] hover:bg-[#e6ad06] text-black text-lg font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      {showCarDiagram ? 'Hide Glass Selection' : 'Buy Glass'}
                    </Button>
                    
                    {/* Price Estimator Button */}
                    <Button
                      variant="ghost"
                      onClick={() => {
                        const params = new URLSearchParams({
                          vrn: searchedVrn,
                          make: vehicleData.make,
                          model: vehicleData.model,
                          year: vehicleData.year || '',
                        });
                        navigate(`/price-estimator?${params.toString()}`);
                      }}
                      className="w-full h-14 bg-[#145484] hover:bg-[#0f3d5f] text-white text-lg font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <Coins className="w-5 h-5" />
                      Price Estimator
                    </Button>
                  </div>

                  {/* Interactive Car Diagram */}
                  {showCarDiagram && (
                    <div className="mt-6 space-y-4">
                      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Glass Parts</h3>
                        <p className="text-sm text-gray-600 mb-4">Click on the windows you need to replace</p>
                        
                        {/* Car SVG Diagram */}
                        <div className="relative w-full mx-auto" style={{ maxWidth: '529.5px' }}>
                          <div className="relative w-full bg-white rounded-lg p-4" style={{ paddingBottom: '75.54%' }}>
                            <div className="absolute inset-0 p-4">
                              <svg 
                                viewBox="0 0 529.5 400"
                                preserveAspectRatio="xMidYMid meet"
                                className="w-full h-full focus:outline-none"
                                aria-labelledby="carMapTitle carMapDesc" 
                                role="img"
                              >
                                <title id="carMapTitle">Car Window Map</title>
                                <desc id="carMapDesc">Interactive map of car windows for selection</desc>
                                <g 
                                  transform="scale(0.44125) translate(0, 125.75779036827196)"
                                  className="focus:outline-none"
                                >
                                  {/* Car body */}
                                  <path
                                    d="m4.12457,326.0398l0,-65.70975c0,-58.40867 21.86699,-181.06688 77.90115,-179.60666l19.13362,0l0,-7.30108c0,0 -1.36669,-8.7613 4.10006,-14.60217c5.46675,-5.84087 12.30018,-5.84087 12.30018,-5.84087l188.60278,0c0,0 8.20012,0 12.30018,7.30108c1.36669,2.92043 2.73337,5.84087 2.73337,8.7613l0,5.84087l456.4734,0l0,-21.90325c0,0 0,-1.46022 -2.73337,-14.60217c-2.73337,-13.14195 -17.76693,-30.66455 -12.30018,-33.58499c5.46675,-2.92043 25.96705,4.38065 41.0006,17.5226c15.03356,13.14195 20.5003,27.74412 20.5003,27.74412l187.23609,0c0,0 8.20012,-1.46022 12.30018,4.38065c4.10006,4.38065 4.10006,8.7613 4.10006,8.7613l0,13.14195l46.46735,0c0,0 34.16717,5.84087 76.53446,51.10759c42.36729,45.26672 45.10067,97.83452 45.10067,97.83452l0,102.21517l0,102.21517c0,0 -2.73337,52.5678 -45.10067,97.83452c-42.36729,45.26672 -76.53446,51.10759 -76.53446,51.10759l-46.46735,0l0,13.14195c0,0 0,4.38065 -4.10006,8.7613c-4.10006,4.38065 -12.30018,4.38065 -12.30018,4.38065l-187.23609,0c0,0 -5.46675,14.60217 -20.5003,27.74412c-15.03356,13.14195 -35.53386,20.44303 -41.0006,17.5226c-5.46675,-2.92043 8.20012,-20.44303 12.30018,-33.58499c2.73337,-13.14195 2.73337,-14.60217 2.73337,-14.60217l0,-21.90325l-456.4734,0l0,5.84087c0,2.92043 -1.36669,5.84087 -2.73337,8.7613c-2.73337,7.30108 -12.30018,7.30108 -12.30018,7.30108l-188.60278,0c0,0 -6.83343,0 -12.30018,-5.84087c-5.46675,-5.84087 -4.10006,-14.60217 -4.10006,-14.60217l0,-7.30108l-19.13362,0c-56.03416,1.46022 -77.90115,-121.19799 -77.90115,-179.60666l0,-65.70975l0,-2.92043z"
                                    stroke="rgba(129, 129, 129, 0.1)"
                                    strokeWidth="1"
                                    fill="#000000"
                                    id="jqvmap1_cr"
                                    className="jqvmap-region focus:outline-none"
                                  />
                                  {/* Windscreen */}
                                  <path
                                    d="m944.40511,112.84815c46.46735,59.86889 73.80109,134.33994 73.80109,213.19165c0,78.85171 -27.33374,151.86254 -73.80109,213.19165l-164.00242,-78.85171c13.66687,-40.88607 20.5003,-86.15279 20.5003,-134.33994c0,-48.18715 -6.83343,-93.45387 -20.5003,-134.33994l164.00242,-78.85171z"
                                    stroke="rgba(129, 129, 129, 0.1)"
                                    strokeWidth="1"
                                    fill={selectedWindows.has('jqvmap1_ws') ? '#0FB8C1' : '#ffffff'}
                                    id="jqvmap1_ws"
                                    className="jqvmap-region cursor-pointer hover:fill-[#CCF1F3] transition-colors duration-200 focus:outline-none"
                                    role="button"
                                    aria-label="Windscreen"
                                    tabIndex={0}
                                    onClick={() => handleWindowClick('jqvmap1_ws')}
                                    onKeyPress={(e) => e.key === 'Enter' && handleWindowClick('jqvmap1_ws')}
                                    onMouseMove={(e) => handleMouseMove(e, regions.find(r => r.id === 'jqvmap1_ws')?.label || '')}
                                    onMouseLeave={() => setHoverTooltip(null)}
                                  />
                                  {/* Front passenger vent */}
                                  <path
                                    d="m777.66931,98.24598c38.26723,0 76.53446,0 114.80169,0c-39.63392,32.12477 -84.73458,58.40867 -128.46856,83.23236c6.83343,-23.36347 12.30018,-49.64737 13.66687,-83.23236z"
                                    stroke="rgba(129, 129, 129, 0.1)"
                                    strokeWidth="1"
                                    fill={selectedWindows.has('jqvmap1_vp') ? '#0FB8C1' : '#ffffff'}
                                    id="jqvmap1_vp"
                                    className="jqvmap-region cursor-pointer hover:fill-[#CCF1F3] transition-colors duration-200 focus:outline-none"
                                    role="button"
                                    aria-label="Front passenger vent"
                                    tabIndex={0}
                                    onClick={() => handleWindowClick('jqvmap1_vp')}
                                    onKeyPress={(e) => e.key === 'Enter' && handleWindowClick('jqvmap1_vp')}
                                    onMouseMove={(e) => handleMouseMove(e, regions.find(r => r.id === 'jqvmap1_vp')?.label || '')}
                                    onMouseLeave={() => setHoverTooltip(null)}
                                  />
                                  {/* Front passenger door */}
                                  <path
                                    d="m552.16599,98.24598c69.70103,0 138.03537,0 207.7364,0c0,29.20434 -5.46675,56.94845 -13.66687,83.23236c-64.23428,0 -128.46856,0 -192.70284,0c-4.10006,-27.74412 -4.10006,-55.48824 0,-83.23236l-1.36669,0z"
                                    stroke="rgba(129, 129, 129, 0.1)"
                                    strokeWidth="1"
                                    fill={selectedWindows.has('jqvmap1_df') ? '#0FB8C1' : '#ffffff'}
                                    id="jqvmap1_df"
                                    className="jqvmap-region cursor-pointer hover:fill-[#CCF1F3] transition-colors duration-200 focus:outline-none"
                                    role="button"
                                    aria-label="Front passenger door"
                                    tabIndex={0}
                                    onClick={() => handleWindowClick('jqvmap1_df')}
                                    onKeyPress={(e) => e.key === 'Enter' && handleWindowClick('jqvmap1_df')}
                                    onMouseMove={(e) => handleMouseMove(e, regions.find(r => r.id === 'jqvmap1_df')?.label || '')}
                                    onMouseLeave={() => setHoverTooltip(null)}
                                  />
                                  {/* Rear passenger door */}
                                  <path
                                    d="m362.19652,98.24598l173.56923,0c-2.73337,29.20434 -2.73337,56.94845 0,83.23236c-57.40085,0 -112.06832,0 -170.83585,0c-4.10006,-21.90325 -6.83343,-55.48824 -4.10006,-83.23236l1.36669,0z"
                                    stroke="rgba(129, 129, 129, 0.1)"
                                    strokeWidth="1"
                                    fill={selectedWindows.has('jqvmap1_dr') ? '#0FB8C1' : '#ffffff'}
                                    id="jqvmap1_dr"
                                    className="jqvmap-region cursor-pointer hover:fill-[#CCF1F3] transition-colors duration-200 focus:outline-none"
                                    role="button"
                                    aria-label="Rear passenger door"
                                    tabIndex={0}
                                    onClick={() => handleWindowClick('jqvmap1_dr')}
                                    onKeyPress={(e) => e.key === 'Enter' && handleWindowClick('jqvmap1_dr')}
                                    onMouseMove={(e) => handleMouseMove(e, regions.find(r => r.id === 'jqvmap1_dr')?.label || '')}
                                    onMouseLeave={() => setHoverTooltip(null)}
                                  />
                                  {/* Rear passenger vent */}
                                  <path
                                    d="m280.19531,98.24598c21.86699,0 45.10067,0 66.96765,0c-2.73337,27.74412 0,58.40867 4.10006,83.23236c-9.56681,0 -23.23368,0 -32.80048,0c-16.40024,-27.74412 -28.70042,-55.48824 -38.26723,-83.23236z"
                                    stroke="rgba(129, 129, 129, 0.1)"
                                    strokeWidth="1"
                                    fill={selectedWindows.has('jqvmap1_vr') ? '#0FB8C1' : '#ffffff'}
                                    id="jqvmap1_vr"
                                    className="jqvmap-region cursor-pointer hover:fill-[#CCF1F3] transition-colors duration-200 focus:outline-none"
                                    role="button"
                                    aria-label="Rear passenger vent"
                                    tabIndex={0}
                                    onClick={() => handleWindowClick('jqvmap1_vr')}
                                    onKeyPress={(e) => e.key === 'Enter' && handleWindowClick('jqvmap1_vr')}
                                    onMouseMove={(e) => handleMouseMove(e, regions.find(r => r.id === 'jqvmap1_vr')?.label || '')}
                                    onMouseLeave={() => setHoverTooltip(null)}
                                  />
                                  {/* Rear passenger quarter */}
                                  <path
                                    d="m226.89453,181.47834c-21.86699,-17.5226 -46.46735,-43.8065 -71.06771,-83.23236c35.53386,0 71.06771,0 105.23489,0c10.93349,29.20434 23.23368,56.94845 39.63392,83.23236c-27.33374,0 -47.83404,0 -75.16778,0l1.36669,0z"
                                    stroke="rgba(129, 129, 129, 0.1)"
                                    strokeWidth="1"
                                    fill={selectedWindows.has('jqvmap1_qr') ? '#0FB8C1' : '#ffffff'}
                                    id="jqvmap1_qr"
                                    className="jqvmap-region cursor-pointer hover:fill-[#CCF1F3] transition-colors duration-200 focus:outline-none"
                                    role="button"
                                    aria-label="Rear passenger quarter"
                                    tabIndex={0}
                                    onClick={() => handleWindowClick('jqvmap1_qr')}
                                    onKeyPress={(e) => e.key === 'Enter' && handleWindowClick('jqvmap1_qr')}
                                    onMouseMove={(e) => handleMouseMove(e, regions.find(r => r.id === 'jqvmap1_qr')?.label || '')}
                                    onMouseLeave={() => setHoverTooltip(null)}
                                  />
                                  {/* Rear window */}
                                  <path
                                    d="m128.49307,534.8508l76.53446,-65.70975c0,0 -32.80048,-26.2839 -42.36729,-70.09041c-8.20012,-39.42585 -8.20012,-105.13561 0,-144.56146c9.56681,-45.26672 42.36729,-70.09041 42.36729,-70.09041l-76.53446,-65.70975c0,0 -39.63392,29.20434 -62.86759,70.09041c-31.4338,56.94845 -31.4338,221.95295 0,277.44119c21.86699,39.42585 62.86759,70.09041 62.86759,70.09041l0,-1.46022z"
                                    stroke="rgba(129, 129, 129, 0.1)"
                                    strokeWidth="1"
                                    fill={selectedWindows.has('jqvmap1_rw') ? '#0FB8C1' : '#ffffff'}
                                    id="jqvmap1_rw"
                                    className="jqvmap-region cursor-pointer hover:fill-[#CCF1F3] transition-colors duration-200 focus:outline-none"
                                    role="button"
                                    aria-label="Rear window"
                                    tabIndex={0}
                                    onClick={() => handleWindowClick('jqvmap1_rw')}
                                    onKeyPress={(e) => e.key === 'Enter' && handleWindowClick('jqvmap1_rw')}
                                    onMouseMove={(e) => handleMouseMove(e, regions.find(r => r.id === 'jqvmap1_rw')?.label || '')}
                                    onMouseLeave={() => setHoverTooltip(null)}
                                  />
                                  {/* Front driver vent */}
                                  <path
                                    d="m777.66931,553.83362c38.26723,0 76.53446,0 114.80169,0c-39.63392,-32.12477 -84.73458,-58.40867 -128.46856,-83.23236c6.83343,23.36347 12.30018,49.64737 13.66687,83.23236z"
                                    stroke="rgba(129, 129, 129, 0.1)"
                                    strokeWidth="1"
                                    fill={selectedWindows.has('jqvmap1_vf') ? '#0FB8C1' : '#ffffff'}
                                    id="jqvmap1_vf"
                                    className="jqvmap-region cursor-pointer hover:fill-[#CCF1F3] transition-colors duration-200 focus:outline-none"
                                    role="button"
                                    aria-label="Front driver vent"
                                    tabIndex={0}
                                    onClick={() => handleWindowClick('jqvmap1_vf')}
                                    onKeyPress={(e) => e.key === 'Enter' && handleWindowClick('jqvmap1_vf')}
                                    onMouseMove={(e) => handleMouseMove(e, regions.find(r => r.id === 'jqvmap1_vf')?.label || '')}
                                    onMouseLeave={() => setHoverTooltip(null)}
                                  />
                                  {/* Front driver door */}
                                  <path
                                    d="m552.16599,553.83362c69.70103,0 138.03537,0 207.7364,0c0,-29.20434 -5.46675,-56.94845 -13.66687,-83.23236c-64.23428,0 -128.46856,0 -192.70284,0c-4.10006,27.74412 -4.10006,55.48824 0,83.23236l-1.36669,0z"
                                    stroke="rgba(129, 129, 129, 0.1)"
                                    strokeWidth="1"
                                    fill={selectedWindows.has('jqvmap1_dg') ? '#0FB8C1' : '#ffffff'}
                                    id="jqvmap1_dg"
                                    className="jqvmap-region cursor-pointer hover:fill-[#CCF1F3] transition-colors duration-200 focus:outline-none"
                                    role="button"
                                    aria-label="Front driver door"
                                    tabIndex={0}
                                    onClick={() => handleWindowClick('jqvmap1_dg')}
                                    onKeyPress={(e) => e.key === 'Enter' && handleWindowClick('jqvmap1_dg')}
                                    onMouseMove={(e) => handleMouseMove(e, regions.find(r => r.id === 'jqvmap1_dg')?.label || '')}
                                    onMouseLeave={() => setHoverTooltip(null)}
                                  />
                                  {/* Rear driver door */}
                                  <path
                                    d="m362.19652,553.83362l173.56923,0c-2.73337,-29.20434 -2.73337,-56.94845 0,-83.23236c-57.40085,0 -112.06832,0 -170.83585,0c-4.10006,21.90325 -6.83343,55.48824 -4.10006,83.23236l1.36669,0z"
                                    stroke="rgba(129, 129, 129, 0.1)"
                                    strokeWidth="1"
                                    fill={selectedWindows.has('jqvmap1_dd') ? '#0FB8C1' : '#ffffff'}
                                    id="jqvmap1_dd"
                                    className="jqvmap-region cursor-pointer hover:fill-[#CCF1F3] transition-colors duration-200 focus:outline-none"
                                    role="button"
                                    aria-label="Rear driver door"
                                    tabIndex={0}
                                    onClick={() => handleWindowClick('jqvmap1_dd')}
                                    onKeyPress={(e) => e.key === 'Enter' && handleWindowClick('jqvmap1_dd')}
                                    onMouseMove={(e) => handleMouseMove(e, regions.find(r => r.id === 'jqvmap1_dd')?.label || '')}
                                    onMouseLeave={() => setHoverTooltip(null)}
                                  />
                                  {/* Rear driver vent */}
                                  <path
                                    d="m280.19531,553.83362c21.86699,0 45.10067,0 66.96765,0c-2.73337,-27.74412 0,-58.40867 4.10006,-83.23236c-9.56681,0 -23.23368,0 -32.80048,0c-16.40024,27.74412 -28.70042,55.48824 -38.26723,83.23236z"
                                    stroke="rgba(129, 129, 129, 0.1)"
                                    strokeWidth="1"
                                    fill={selectedWindows.has('jqvmap1_vg') ? '#0FB8C1' : '#ffffff'}
                                    id="jqvmap1_vg"
                                    className="jqvmap-region cursor-pointer hover:fill-[#CCF1F3] transition-colors duration-200 focus:outline-none"
                                    role="button"
                                    aria-label="Rear driver vent"
                                    tabIndex={0}
                                    onClick={() => handleWindowClick('jqvmap1_vg')}
                                    onKeyPress={(e) => e.key === 'Enter' && handleWindowClick('jqvmap1_vg')}
                                    onMouseMove={(e) => handleMouseMove(e, regions.find(r => r.id === 'jqvmap1_vg')?.label || '')}
                                    onMouseLeave={() => setHoverTooltip(null)}
                                  />
                                  {/* Rear driver quarter */}
                                  <path
                                    d="m226.89453,470.60126c-21.86699,17.5226 -46.46735,43.8065 -71.06771,83.23236c35.53386,0 71.06771,0 105.23489,0c10.93349,-29.20434 23.23368,-56.94845 39.63392,-83.23236c-27.33374,0 -47.83404,0 -75.16778,0l1.36669,0z"
                                    stroke="rgba(129, 129, 129, 0.1)"
                                    strokeWidth="1"
                                    fill={selectedWindows.has('jqvmap1_qg') ? '#0FB8C1' : '#ffffff'}
                                    id="jqvmap1_qg"
                                    className="jqvmap-region cursor-pointer hover:fill-[#CCF1F3] transition-colors duration-200 focus:outline-none"
                                    role="button"
                                    aria-label="Rear driver quarter"
                                    tabIndex={0}
                                    onClick={() => handleWindowClick('jqvmap1_qg')}
                                    onKeyPress={(e) => e.key === 'Enter' && handleWindowClick('jqvmap1_qg')}
                                    onMouseMove={(e) => handleMouseMove(e, regions.find(r => r.id === 'jqvmap1_qg')?.label || '')}
                                    onMouseLeave={() => setHoverTooltip(null)}
                                  />
                                </g>
                              </svg>
                            </div>
                          </div>
                          
                          {/* Tooltip */}
                          {hoverTooltip && (
                            <div
                              className="fixed z-50 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg pointer-events-none"
                              style={{
                                left: `${hoverTooltip.x + 10}px`,
                                top: `${hoverTooltip.y + 10}px`,
                              }}
                            >
                              {hoverTooltip.label}
                            </div>
                          )}
                        </div>

                        {/* Selected Windows Summary */}
                        {selectedWindows.size > 0 && (
                          <div className="mt-4 p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
                            <p className="text-sm font-semibold text-cyan-900 mb-2">
                              Selected: {selectedWindows.size} window{selectedWindows.size > 1 ? 's' : ''}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {Array.from(selectedWindows).map(windowId => {
                                const region = regions.find(r => r.id === windowId);
                                return (
                                  <span
                                    key={windowId}
                                    className="px-3 py-1 bg-cyan-100 text-cyan-900 text-xs font-medium rounded-full"
                                  >
                                    {region?.label || windowId}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Continue to Order Button */}
                        <Button
                          variant="ghost"
                          onClick={handleContinueToOrder}
                          disabled={selectedWindows.size === 0}
                          className="w-full h-14 mt-4 bg-[#FFC107] hover:bg-[#e6ad06] text-black text-lg font-bold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          Continue to Order
                          <ChevronRight className="w-5 h-5" />
                        </Button>
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
          <div className="text-center p-10 border-2 border-dashed border-gray-300 rounded-lg bg-white/50">
            <Car className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 text-lg font-medium">Search results will appear here</p>
            <p className="text-gray-400 text-sm mt-2">Enter a VRN or vehicle details to get started</p>
          </div>
        )}
          </div>
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
};

export default VrnSearch;
