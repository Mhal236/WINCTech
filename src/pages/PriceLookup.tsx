import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BookingForm } from "@/components/booking/BookingForm";
import { ShoppingCart, X, Image as ImageIcon, Car, Layers, LogOut, ArrowLeft, Search, WifiIcon as WifiOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getGlassApiCredentials, getStockList, getMakes, getModels, PriceRecord, checkAvailability, getDepots, searchStockByArgic, testApiConnection } from "@/utils/glassApiService";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { MAGAuthProvider, useMAGAuth } from "@/contexts/MAGAuthContext";
import { MAGLoginForm } from "@/components/auth/MAGLoginForm";
import { PageTransition, ModalPageTransition } from "@/components/PageTransition";
import { cn } from "@/lib/utils";
import { GlassOrderChoice } from "@/components/glass/GlassOrderChoice";
import { DistributorService } from "@/services/distributorService";

// Add interface for glass features
interface GlassFeatures {
  sensor: boolean;
  devapour: boolean;
  vinNotch: boolean;
  hrf: boolean;
  isOE: boolean;
}

interface CompanyQuote {
  company: string;
  price: number;
  estimatedTimeDelivery: string;
  estimatedTimePickup: string;
  argicCode?: string;
  magCode?: string;
  availability?: string;
  features?: string[];
  availableDepots?: any[];
  totalAvailable?: number;
  depotCode?: string;
  depotName?: string;
  supplierCompany?: string;
}

interface GlassSelection {
  type: string;
  quantity: number;
  features?: GlassFeatures;
}

interface VehicleDetails {
  make: string;
  model: string;
  year: string;
  bodyStyle?: string;
  doors?: string;
  variant?: string;
  fuel?: string;
  transmission?: string;
  startYear?: string;
  endYear?: string;
  vin?: string;
  argicCode?: string;
  shortArgicCode?: string;
  glassOptions?: { fullCode: string; shortCode: string }[];
  vrn: string;
  vehicle_image_url?: string;
}

// Add depot interface to the imports
interface Depot {
  DepotCode: string;
  DepotName: string;
}

// Add a helper function to render the appropriate icon for the glass type
const getGlassTypeIcon = (quote: CompanyQuote, selection: GlassSelection) => {
  // Check if we can determine the glass type from the quote or selection
  const type = selection?.type || '';
  
  if (type.includes('Windscreen')) {
    return <Car className="w-10 h-10 text-[#145484]" />;
  } else if (type.includes('window') || type.includes('Window')) {
    return <Layers className="w-10 h-10 text-[#145484]" />;
  } else {
    // Default icon
    return <ImageIcon className="w-10 h-10 text-[#145484]" />;
  }
};

const PriceLookupContent = () => {
  const { magUser, logoutMAG, loginWithMAG } = useMAGAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [selectedProvider, setSelectedProvider] = useState<'mag' | 'pughs' | 'guest' | null>(null);
  const [showSupplierSelection, setShowSupplierSelection] = useState(true);
  const [showOrderChoice, setShowOrderChoice] = useState(false);
  const [proceedToOrder, setProceedToOrder] = useState(false);
  const [glassTypeFilter, setGlassTypeFilter] = useState<string>('all');
  const [showTradeOnly, setShowTradeOnly] = useState(false);
  const [windscreenAttributes, setWindscreenAttributes] = useState({
    rainSensor: false,
    heatedScreen: false,
    camera: false,
    adas: false,
    hud: false
  });

  const handleProviderSwitch = (provider: 'mag' | 'pughs') => {
    if (provider !== selectedProvider) {
      setSelectedProvider(provider);
      // Log out current user when switching providers
      logoutMAG();
    }
  };

  const handleSupplierSelect = (supplier: 'mag' | 'pughs' | 'guest') => {
    setSelectedProvider(supplier);
    setShowSupplierSelection(false);
    // For guest or if already logged in with MAG/Pughs, show the choice immediately
    if (supplier === 'guest' || (magUser && magUser.isAuthenticated)) {
      setShowOrderChoice(true);
    }
  };

  const handleProceedToOrder = () => {
    setProceedToOrder(true);
    setShowOrderChoice(false);
  };

  const handleBackToSupplierSelection = () => {
    setShowOrderChoice(false);
    setShowSupplierSelection(true);
    setSelectedProvider(null);
    setProceedToOrder(false);
  };
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const jobId = searchParams.get('jobId');
  const damageType = searchParams.get('damage');
  const vehicleInfo = searchParams.get('vrn');
  const isScheduleTab = location.search.includes('tab=schedule');
  
  // New URL params from VRN search
  const urlVrn = searchParams.get('vrn');
  const urlMake = searchParams.get('make');
  const urlModel = searchParams.get('model');
  const urlYear = searchParams.get('year');
  const urlBodyStyle = searchParams.get('bodyStyle');
  const urlVehicleImage = searchParams.get('vehicleImage');
  const urlSelectedWindows = searchParams.get('selectedWindows');
  const [vrn, setVrn] = useState<string>("");
  const [availableDepots, setAvailableDepots] = useState<Depot[]>([]);
  const [selectedDepots, setSelectedDepots] = useState<string[]>([]);
  const [glassSelections, setGlassSelections] = useState<GlassSelection[]>([]);
  const [quotes, setQuotes] = useState<CompanyQuote[]>([]);
  const [showQuotes, setShowQuotes] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<CompanyQuote | null>(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const { toast } = useToast();
  const [vehicleDetails, setVehicleDetails] = useState<VehicleDetails>({
    make: "",
    model: "",
    year: "",
    vrn: ""
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [vrnValidForLookup, setVrnValidForLookup] = useState(false);

  // Define the API URLs using environment variables 
  const RAILWAY_API_URL = import.meta.env.VITE_API_URL_PRODUCTION || 'https://function-bun-production-7f7b.up.railway.app';
  const LOCAL_API_URL = import.meta.env.VITE_API_URL_LOCAL || 'http://localhost:3000';
  
  // Use local server based on environment variable or default to true for development
  const USE_LOCAL_SERVER = import.meta.env.VITE_USE_LOCAL_SERVER === 'false' ? false : true;
  
  // Debug environment variables (only in development)
  if (import.meta.env.DEV) {
    console.log('Environment Variables:');
    console.log('- VITE_API_URL_PRODUCTION:', import.meta.env.VITE_API_URL_PRODUCTION);
    console.log('- VITE_API_URL_LOCAL:', import.meta.env.VITE_API_URL_LOCAL);
    console.log('- VITE_USE_LOCAL_SERVER:', import.meta.env.VITE_USE_LOCAL_SERVER);
    console.log('- Using API URL:', USE_LOCAL_SERVER ? LOCAL_API_URL : RAILWAY_API_URL);
  }
  
  // Utility function to get the appropriate API URL
  const getApiUrl = (endpoint: string): string => {
    const url = USE_LOCAL_SERVER ? `${LOCAL_API_URL}${endpoint}` : `${RAILWAY_API_URL}${endpoint}`;
    console.log(`API Request to: ${url}`);
    return url;
  };

  // New helper function to directly query our stock-query API
  const queryStockApi = async (argicCode: string, model: string, depot: string, features: any) => {
    try {
      console.log(`Querying stock API directly for ARGIC: ${argicCode}, Model: ${model}, Depot: ${depot}`);
      
      const response = await fetch(getApiUrl('/api/stock-query'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          argicCode,
          model,
          depot,
          features,
          vrn: vehicleDetails.vrn // Pass the VRN to make ARGIC codes unique per vehicle
        })
      });
      
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Stock API response:", data);
      
      return data;
    } catch (error) {
      console.error("Error querying stock API:", error);
      throw error;
    }
  };

  // Fetch depots from Supabase based on selected provider
  useEffect(() => {
    const fetchDepots = async () => {
      try {
        console.log('Fetching depots for provider:', selectedProvider);
        
        // Fetch from Supabase based on provider
        let result;
        if (selectedProvider === 'mag') {
          result = await DistributorService.getMasterAutoGlassLocations();
        } else if (selectedProvider === 'pughs') {
          result = await DistributorService.getCharlesPughLocations();
        } else {
          // For guest mode, show Master Auto Glass locations by default
          result = await DistributorService.getMasterAutoGlassLocations();
        }

        if (result.success && result.locations && result.locations.length > 0) {
          // Map to Depot format (DepotCode and DepotName)
          const depots = result.locations.map(loc => ({
            DepotCode: loc.DepotCode,
            DepotName: loc.DepotName
          }));
          setAvailableDepots(depots);
          console.log(`Loaded ${depots.length} depots from Supabase:`, depots);
        } else {
          console.error('No depots found in Supabase');
          toast({
            title: "Error",
            description: "Could not load depot locations",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error fetching depots from Supabase:", error);
        toast({
          title: "Error",
          description: "Failed to load depot locations",
          variant: "destructive"
        });
      }
    };
    
    if (selectedProvider) {
      fetchDepots();
    }
  }, [selectedProvider]);

  // Add a separate useEffect to auto-fetch data when the component mounts with URL parameters
  useEffect(() => {
    // If VRN is provided via URL params, set it and trigger auto-fetch
    if (vehicleInfo && vehicleInfo.trim().length > 0) {
      setVrn(vehicleInfo);
      console.log("Set VRN from URL parameter:", vehicleInfo);
      
      // Add a short delay to ensure state is updated before fetching
      const timer = setTimeout(() => {
        console.log("Auto-fetching vehicle data for VRN:", vehicleInfo);
        fetchVehicleData();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [vehicleInfo]); // Only run when vehicleInfo changes
  
  // If damage type is provided, set up the glass selection
  useEffect(() => {
    if (damageType) {
      setGlassSelections([{
        type: damageType,
        quantity: 1,
        features: {
          sensor: false,
          devapour: false,
          vinNotch: false,
          hrf: false,
          isOE: false
        }
      }]);
    }
  }, [damageType]);

  // Handle URL parameters from VRN search
  useEffect(() => {
    if (urlVrn && urlMake && urlModel && urlYear) {
      console.log('Auto-populating from VRN search params:', { urlVrn, urlMake, urlModel, urlYear, urlBodyStyle });
      
      // Skip supplier selection when coming from VRN search
      setShowSupplierSelection(false);
      setSelectedProvider('mag'); // Default to MAG
      
      // Set VRN
      setVrn(urlVrn);
      
      // Set vehicle details
      setVehicleDetails({
        make: urlMake,
        model: urlModel,
        year: urlYear,
        bodyStyle: urlBodyStyle || '',
        vrn: urlVrn,
        vehicle_image_url: urlVehicleImage || ''
      });

      // Auto-select Park Royal depot (London) for convenience
      setSelectedDepots(['PAR']);

      // Parse and set selected windows if provided
      if (urlSelectedWindows) {
        try {
          const windowIds = JSON.parse(urlSelectedWindows);
          console.log('Selected windows from VRN search:', windowIds);
          
          // Store for later use when fetching glass
          // For now we'll just log them
        } catch (error) {
          console.error('Error parsing selected windows:', error);
        }
      }

      // Show a toast and auto-trigger search
      toast({
        title: "Searching Glass Options",
        description: `Finding glass for ${urlMake} ${urlModel} (${urlYear})`,
      });
      
      // Auto-trigger glass search after short delay
      setTimeout(() => {
        fetchGlassOptions();
      }, 800);
    }
  }, [urlVrn, urlMake, urlModel, urlYear, urlBodyStyle, urlSelectedWindows]);

  // Auto-select London depot (Park Royal) on component mount
  useEffect(() => {
    if (selectedDepots.length === 0 && availableDepots.length > 0) {
      // Default to Park Royal (London)
      setSelectedDepots(['PAR']);
    }
  }, [availableDepots]);

  // Add useEffect to automatically fetch vehicle data when VRN changes
  useEffect(() => {
    // Validate VRN format - UK plates are typically 7-8 characters
    // This is a simple validation, could be made more robust
    const isValidVRN = vrn.trim().length >= 6;
    
    setVrnValidForLookup(isValidVRN);
    
    // If VRN is valid and different from what we've already loaded, fetch vehicle data
    if (isValidVRN && !loading && vrn.trim() !== vehicleDetails.vrn) {
      const timer = setTimeout(() => {
        fetchVehicleData();
      }, 1000); // Add a debounce delay
      
      return () => clearTimeout(timer);
    }
  }, [vrn]);

  const fetchVehicleData = async (): Promise<boolean> => {
    if (!vrn.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter a valid registration number.",
        variant: "destructive",
      });
      return false;
    }
    
    setLoading(true);
    
    try {
      console.log(`\n===== Starting vehicle data fetch for VRN: ${vrn.trim()} =====`);
      
      toast({
        title: "Loading...",
        description: "Retrieving vehicle information",
      });
      
      // Try the API server to get vehicle and ARGIC details
      try {
        console.log(`Step 1: Fetching vehicle data from API server for VRN: ${vrn.trim()}`);
        const response = await fetch(getApiUrl(`/api/vehicle/glass/${vrn.trim()}`));
        console.log(`Vehicle API response status: ${response.status}`);
        
        if (response.ok) {
          const apiResponse = await response.json();
          console.log("Vehicle data received:", apiResponse);
          
          // Check if we received a successful response with data
          if (apiResponse.success && apiResponse.data) {
            // Extract the data from our API response
            const data = apiResponse.data;
            
            // Create vehicle data object from the response
            const vehicleData: VehicleDetails = {
              make: data.make || "",
              model: data.model || "",
              year: data.year || "",
              bodyStyle: data.bodyStyle || "",
              doors: data.doors || "",
              variant: data.variant || "",
              fuel: data.fuel || "",
              transmission: data.transmission || "",
              vin: data.vin || "",
              vrn: vrn.trim(),
              // Get the ARGIC codes directly from our API response
              argicCode: data.argicCode || "",
              shortArgicCode: data.shortArgicCode || "",
              glassOptions: data.glassOptions || [],
              vehicle_image_url: data.vehicle_image_url || ""
            };
            
            console.log(`Vehicle Data from API:
            - Make: ${vehicleData.make}
            - Model: ${vehicleData.model}
            - Year: ${vehicleData.year}
            - ARGIC: ${vehicleData.argicCode}
            - Short ARGIC: ${vehicleData.shortArgicCode}
            - Options: ${vehicleData.glassOptions?.length || 0}`);
            
            // Set vehicle details from the API response
            setVehicleDetails(vehicleData);
            
            // Store VRN in sessionStorage for cross-component use
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('current_vrn', vrn.trim());
            }
            
            // Set glass type to Windscreen by default if no selections exist
            if (glassSelections.length === 0) {
              setGlassSelections([{
                type: "Windscreen",
                quantity: 1,
                features: {
                  sensor: false,
                  devapour: false,
                  vinNotch: false,
                  hrf: false,
                  isOE: false
                }
              }]);
            }
            
            toast({
              title: "Success", 
              description: `Vehicle data loaded with ARGIC code: ${vehicleData.shortArgicCode || vehicleData.argicCode?.substring(0, 4) || ""}`
            });
            
            setLoading(false);
            
            // After successful vehicle lookup, if we have depot selected, automatically fetch glass options
            if (selectedDepots.length > 0 && vehicleData.make && vehicleData.model) {
              // Short delay before fetching glass options to ensure UI updates first
              setTimeout(() => {
                fetchGlassOptions();
              }, 500);
            }
            
            return true;
          } else {
            throw new Error("Vehicle data not found in API response");
          }
        } else {
          throw new Error(`API request failed with status ${response.status}`);
        }
      } catch (apiError) {
        console.error("API error:", apiError);
        throw apiError; // Rethrow to be caught by the outer catch
      }
    } catch (error) {
      console.error("Error fetching vehicle data:", error);
      setLoading(false);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch vehicle data",
        variant: "destructive",
      });
      
      return false;
    }
  };

  // Extract glass options fetching logic into a separate function
  const fetchGlassOptions = async (): Promise<boolean> => {
    if (!vehicleDetails.make || !vehicleDetails.model || !vehicleDetails.year) {
      console.log("Cannot fetch glass options: Vehicle details not available");
      return false;
    }
    
    if (selectedDepots.length === 0) {
      console.log("Cannot fetch glass options: No depots selected");
      toast({
        title: "Depot Required",
        description: "Please select at least one depot before getting a quote",
        variant: "destructive",
      });
      return false;
    }
    
    if (glassSelections.length === 0 || glassSelections.some(s => !s.type)) {
      console.log("Cannot fetch glass options: Glass selections incomplete");
      return false;
    }
    
    setLoading(true);
    
    try {
      // First test API connectivity
      console.log("Testing API connectivity before making quote request...");
      try {
        const apiHealthCheck = await fetch(getApiUrl('/api/health'));
        if (!apiHealthCheck.ok) {
          throw new Error(`API server not responding: ${apiHealthCheck.status}`);
        }
        console.log("API server is responding:", await apiHealthCheck.json());
      } catch (error) {
        console.error("API connectivity check failed:", error);
        toast({
          title: "API Server Error",
          description: "Cannot connect to the API server. Please try again later.",
          variant: "destructive",
        });
        setLoading(false);
        return false;
      }

      // Continue with querying Glass API
      console.log("Querying Master Auto Glass API for product information");
      
      // Get features from the first glass selection
      const features = glassSelections[0]?.features || {
        sensor: false,
        devapour: false,
        vinNotch: false,
        hrf: false,
        isOE: false
      };
      
      // The vehicle ARGIC we got from lookup, if available
      const vehicleArgic = vehicleDetails.argicCode || ""; // Don't default to a specific ARGIC code
      console.log(`Using vehicle ARGIC: ${vehicleArgic}`);
      console.log(`Using depots: ${selectedDepots.join(', ')}`);
      
      // Show loading toast for quotes
      toast({
        title: "Loading Glass Options",
        description: "Retrieving glass options for your vehicle across selected depots...",
      });

      // Use our new direct API query function instead of the existing logic
      try {
        console.log(`Attempting to use direct API query for glass options`);
        
        let allApiQuotes: CompanyQuote[] = [];
        let apiCallSucceeded = false;
        
        // Query each depot directly
        for (const depotCode of selectedDepots) {
          try {
            const depotName = availableDepots.find(d => d.DepotCode === depotCode)?.DepotName || depotCode;
            
            // Debug the ARGIC code
            console.log("DEBUG - ARGIC code before API call:", vehicleDetails.argicCode);
            console.log("DEBUG - Full vehicle details:", JSON.stringify(vehicleDetails));
            
            console.log(`Making direct API call to stock-query for depot ${depotCode} with ARGIC ${vehicleDetails.argicCode}`);
            
            // Prepare the request payload
            const requestPayload = {
              make: vehicleDetails.make,
              model: vehicleDetails.model,
              year: vehicleDetails.year,
              modelType: vehicleDetails.bodyStyle || '',
              depot: depotCode,
              features: glassSelections.length > 0 && glassSelections[0].features ? {
                sensor: glassSelections[0].features.sensor,
                devapour: glassSelections[0].features.devapour,
                vinNotch: glassSelections[0].features.vinNotch,
                hrf: glassSelections[0].features.hrf,
                isOE: glassSelections[0].features.isOE
              } : {
                sensor: false,
                devapour: false,
                vinNotch: false,
                hrf: false,
                isOE: false
              },
              vrn: vehicleDetails.vrn  // Add VRN directly to the initial payload
            };
            
            console.log("DEBUG - API request payload with VRN:", JSON.stringify(requestPayload));
            
            const apiResponse = await fetch(getApiUrl('/api/stock-query'), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ...requestPayload
              })
            });
            
            if (apiResponse.ok) {
              const apiResult = await apiResponse.json();
              console.log(`API response for depot ${depotCode}:`, apiResult);
              
              if (apiResult.success && apiResult.priceRecords && apiResult.priceRecords.length > 0) {
                // Convert the price records to our quote format
                const depotQuotes = apiResult.priceRecords.map((record: any) => {
                  // Determine if it's OEM or OEE based on price/description
                  const isOEM = record.Description?.includes('OEM') || 
                                record.PriceInfo?.includes('OEM') || 
                                record.Price > 250;
                  
                  // Create an appropriate quote label
                  let label = isOEM ? 'OEM' : 'OEE';
                  
                  // Create the company description
                  const company = record.Description || 
                    `${label} ${vehicleDetails.make} ${vehicleDetails.model} Glass`;
                  
                  // Create the features array
                  const featuresList = [];
                  
                  // Add PriceInfo as a feature if available
                  if (record.PriceInfo) {
                    featuresList.push(record.PriceInfo);
                  }
                  
                  // Add Description as a feature if available and different from company name
                  if (record.Description && record.Description !== company) {
                    featuresList.push(record.Description);
                  }
                  
                  // Add the vehicle info
                  featuresList.push(`${vehicleDetails.make} ${vehicleDetails.model} (${vehicleDetails.year})`);
                  
                  console.log(`Adding quote with ARGIC: ${record.ArgicCode}`);
                  
                  return {
                    company,
                    price: record.Price,
                    estimatedTimeDelivery: "Next Day",
                    estimatedTimePickup: record.Qty > 10 ? "Same-day pickup available" : `Available Qty: ${record.Qty}`,
                    argicCode: record.ArgicCode,
                    magCode: record.MagCode,
                    availability: record.Qty > 0 ? "In Stock" : "Out of Stock",
                    features: featuresList,
                    totalAvailable: record.Qty || 0,
                    depotCode: depotCode,
                    depotName: depotName
                  };
                });
                
                allApiQuotes = [...allApiQuotes, ...depotQuotes];
                apiCallSucceeded = true;
                console.log(`Added ${depotQuotes.length} quotes from depot ${depotCode}`);
              }
            } else {
              console.error(`API call failed for depot ${depotCode}: ${apiResponse.status} ${apiResponse.statusText}`);
            }
          } catch (depotError) {
            console.error(`Error querying depot ${depotCode}:`, depotError);
          }
        }
        
        if (allApiQuotes.length > 0) {
          // Limit results and create supplier options
          let finalQuotes: CompanyQuote[] = [];
          
          console.log("Processing quotes, selectedProvider:", selectedProvider);
          console.log("Total API quotes received:", allApiQuotes.length);
          
          if (selectedProvider === 'guest') {
            // Guest mode: Show 1 from MAG and 1 from Pughs
            const magQuote = {
              ...allApiQuotes[0],
              supplierCompany: 'Master Auto Glass'
            };
            
            const pughsQuote = {
              ...allApiQuotes[0],
              supplierCompany: 'Charles Pugh',
              price: allApiQuotes[0].price * 1.05, // Slightly different price for Pughs
            };
            
            finalQuotes = [magQuote, pughsQuote];
            console.log("Guest mode: Created 1 MAG + 1 Pughs quote");
          } else {
            // Logged in mode: Show only 1 result from selected supplier
            finalQuotes = [{
              ...allApiQuotes[0],
              supplierCompany: selectedProvider === 'mag' ? 'Master Auto Glass' : 'Charles Pugh'
            }];
            console.log("Logged in mode: Showing 1 result from", selectedProvider);
          }
          
          setQuotes(finalQuotes);
          setShowQuotes(true);
          toast({
            title: "Quote Request Successful",
            description: `Found ${finalQuotes.length} glass options`,
          });
          setLoading(false);
          return true;
        } else {
          // API call succeeded but returned no results, or failed entirely
          console.log("No results from API, falling back to mock data");
          
          toast({
            title: apiCallSucceeded ? "No Products Found" : "API Connection Issue",
            description: "Using sample data for demonstration purposes",
            variant: "default",
          });
          
          const mockData = await generateMockDataForDepots(selectedDepots, vehicleDetails);
          setQuotes(mockData);
          setShowQuotes(true);
          setLoading(false);
          return true;
        }
      } catch (directApiError) {
        console.error("Error using direct API query:", directApiError);
        // Continue with the original logic as fallback
      }
    } catch (error) {
      console.error("Error during API calls:", error);
      toast({
        title: "API Error",
        description: "Failed to connect to glass supplier. Please try again later.",
        variant: "destructive",
      });
      
      setLoading(false);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update handleQuoteSubmit to use the new fetchGlassOptions function
  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Get Quote button clicked - starting API process");
    
    if (!vrn.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid VRN.",
        variant: "destructive",
      });
      return;
    }

    if (selectedDepots.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one depot.",
        variant: "destructive",
      });
      return;
    }
    
    // Still check if vehicle data is loaded, in case auto-fetch didn't work
    if (!vehicleDetails.make || !vehicleDetails.model || !vehicleDetails.year) {
      console.log("Vehicle data not loaded yet, fetching as fallback...");
      toast({
        title: "Loading...",
        description: "Retrieving vehicle information...",
      });
      
      const vehicleSuccess = await fetchVehicleData();
      if (!vehicleSuccess) {
        // If vehicle lookup failed, stop here
        return;
      }
    }
    
    // Now fetch glass options if vehicle data is loaded
    await fetchGlassOptions();
  };

  const handleQuoteSelection = async (quote: CompanyQuote) => {
    console.log("Quote selected:", quote);
    setSelectedQuote(quote);
    
    // Add item to cart
    const vehicleInfo = vehicleDetails ? `${vehicleDetails.make} ${vehicleDetails.model} (${vehicleDetails.year})` : '';
    const glassTypes = glassSelections.map(sel => {
      if (sel.type === 'Windscreen') return 'Windscreen (Front)';
      if (sel.type === 'rear-window') return 'Rear Window';
      if (sel.type === 'driver-front') return "Driver's Front Window";
      if (sel.type === 'passenger-front') return "Passenger's Front Window";
      if (sel.type === 'driver-rear') return "Driver's Rear Window";
      if (sel.type === 'passenger-rear') return "Passenger's Rear Window";
      return sel.type;
    }).join(', ');
    
    const totalQuantity = glassSelections.reduce((sum, sel) => sum + sel.quantity, 0);
    
    addItem({
      id: `${quote.argicCode || quote.magCode}-${Date.now()}`,
      partNumber: quote.argicCode || quote.magCode || 'N/A',
      description: `${glassTypes} - ${vehicleInfo}`,
      unitPrice: quote.price,
      quantity: totalQuantity,
      supplier: quote.company,
      vehicleInfo: `${vrn} - ${vehicleInfo}`,
    });
    
    toast({
      title: "Added to Cart",
      description: `${quote.company} glass parts added to your cart. Click the cart icon to checkout.`,
    });
    
    // Only proceed with API calls if we have an ARGIC code (for availability check)
    if (quote.argicCode) {
      try {
        console.log(`Checking availability for ARGIC code: ${quote.argicCode}`);
        
        // First, get extra product details by searching directly with the ARGIC code
        const { priceRecords } = await searchStockByArgic(quote.argicCode);
        console.log("Additional product details:", priceRecords);
        
        if (priceRecords.length > 0) {
          // Update the selected quote with any additional information
          setSelectedQuote(prev => {
            if (prev) {
              return {
                ...prev,
                estimatedTimePickup: `Available Qty: ${priceRecords[0].Qty}`
              };
            }
            return prev;
          });
        }
        
        // Check if the product is available
        const { isAvailable, error } = await checkAvailability(quote.argicCode);
        console.log(`Availability check result: ${isAvailable}`, error ? `Error: ${error}` : '');
        
        // Get depot information
        console.log("Fetching depot information...");
        const { depots, error: depotsError } = await getDepots();
        
        if (depotsError) {
          console.error("Error fetching depots:", depotsError);
        } else {
          console.log(`Retrieved ${depots.length} depots:`, depots);
        }

        // NEW CODE: Check product availability at different depots
        // Use the depot from the quote if available
        await checkDepotAvailability(quote.argicCode, quote.depotCode);
        
        // If product is not available, show a warning
        if (!isAvailable) {
          toast({
            title: "Availability Warning",
            description: "This item may have limited availability. Please contact customer service to confirm.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error checking product details:", error);
      }
    }
  };

  // New function to check and display depot availability 
  const checkDepotAvailability = async (argicCode: string, depotCode?: string) => {
    try {
      console.log(`Checking depot availability for ARGIC code: ${argicCode}`);
      
      // Use the specific depot from the quote if provided, otherwise use the first selected depot
      const depotToCheck = depotCode || selectedDepots[0] || '';
      
      // Call our new API endpoint with depot included
      const response = await fetch(getApiUrl(`/api/glass-availability?argicCode=${argicCode}&quantity=1&depot=${encodeURIComponent(depotToCheck)}`));
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Depot availability data:", data);
      
      if (data.success) {
        // If we have availability data, update the selected quote
        if (data.depots && data.depots.length > 0) {
          setSelectedQuote(prev => {
            if (prev) {
              return {
                ...prev,
                // Add depot availability information to the quote
                availableDepots: data.depots,
                totalAvailable: data.totalAvailable
              };
            }
            return prev;
          });
          
          // Show a message if we have availability at multiple depots
          if (data.depots.length > 1) {
            toast({
              title: "Multiple Locations Available",
              description: `This item is available at ${data.depots.length} locations with a total of ${data.totalAvailable} units in stock.`,
            });
          }
        } else {
          // Show a warning if no depots have the item
          toast({
            title: "Limited Availability",
            description: "This item is not currently in stock at any depot.",
            variant: "destructive",
          });
        }
      } else {
        // Show an error message if the API call failed
        console.error("API error:", data.error);
        toast({
          title: "Error Checking Availability",
          description: data.error || "Failed to check depot availability",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error checking depot availability:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to check depot availability",
        variant: "destructive",
      });
    }
  };

  const handleConfirmOrder = () => {
    if (selectedQuote) {
      toast({
        title: "Order Confirmed",
        description: `Your ${selectedQuote.company} order has been confirmed. We'll contact you shortly with next steps.`,
      });
    }
    setIsConfirmationOpen(false);
    setSelectedQuote(null);
  };

  // Helper function to generate mock data for demonstration purposes when API is unavailable
  const generateMockDataForDepots = async (depots: string[], vehicleInfo: VehicleDetails): Promise<CompanyQuote[]> => {
    // Create mock data entries for each selected depot
    const mockQuotes: CompanyQuote[] = [];
    
    // Always use the real ARGIC code from vehicle info if available
    // This is crucial for correct display
    let realArgicCode = vehicleInfo.argicCode || "";
    
    console.log("MOCK DATA GENERATION - Using ARGIC code:", realArgicCode);
    console.log("Vehicle Info:", JSON.stringify(vehicleInfo));
    
    // If we still don't have a real ARGIC code after all, create a fallback mock
    if (!realArgicCode) {
      realArgicCode = `${vehicleInfo.make.substring(0, 3).toUpperCase()}${vehicleInfo.model.substring(0, 3).toUpperCase()}${vehicleInfo.year.substring(2)}`;
      console.log(`Created fallback mock ARGIC code: ${realArgicCode}`);
    }
    
    // Only use first depot
    const depotCode = depots[0];
    const depotName = availableDepots.find(d => d.DepotCode === depotCode)?.DepotName || depotCode;
    
    // Create exactly 2 options: 1 from MAG and 1 from Pughs
    const suppliers = [
      { name: 'Master Auto Glass', priceMultiplier: 1.0 },
      { name: 'Charles Pugh', priceMultiplier: 1.05 }
    ];
    
    suppliers.forEach((supplier, index) => {
      const basePrice = 215 + (Math.random() * 50);
      const qty = 12 + Math.floor(Math.random() * 10); // Always good stock (12-22)
      
      mockQuotes.push({
        company: `OEM Glass - ${vehicleInfo.make} ${vehicleInfo.model}`,
        price: parseFloat((basePrice * supplier.priceMultiplier).toFixed(2)),
        estimatedTimeDelivery: "Next Day",
        estimatedTimePickup: qty > 15 ? "Same-day pickup available" : `Available Qty: ${qty}`,
        argicCode: realArgicCode,
        magCode: `MAG-${realArgicCode.substring(0, 8)}`,
        availability: "In Stock",
        features: [
          'Original Equipment Manufacturer',
          `${vehicleInfo.make} ${vehicleInfo.model} (${vehicleInfo.year})`,
          `ARGIC: ${realArgicCode}`,
        ],
        totalAvailable: qty,
        depotCode: depotCode,
        depotName: depotName,
        supplierCompany: supplier.name
      });
    });
    
    return mockQuotes;
  };

  const addGlassSelection = () => {
    setGlassSelections(prev => [...prev, { 
      type: "", 
      quantity: 1,
      features: {
        sensor: false,
        devapour: false,
        vinNotch: false,
        hrf: false,
        isOE: false
      }
    }]);
  };

  const updateGlassSelection = (index: number, field: keyof GlassSelection, value: string | number) => {
    setGlassSelections(prev => {
      const newSelections = [...prev];
      newSelections[index] = {
        ...newSelections[index],
        [field]: value
      };
      return newSelections;
    });
  };

  const updateGlassFeature = (index: number, feature: keyof GlassFeatures, value: boolean) => {
    setGlassSelections(prev => {
      const newSelections = [...prev];
      if (!newSelections[index].features) {
        newSelections[index].features = {
          sensor: false,
          devapour: false,
          vinNotch: false,
          hrf: false,
          isOE: false
        };
      }
      
      if (newSelections[index].features) {
        newSelections[index].features[feature] = value;
      }
      
      return newSelections;
    });
  };

  const removeGlassSelection = (index: number) => {
    setGlassSelections(prev => prev.filter((_, i) => i !== index));
  };

  const [sortBy, setSortBy] = useState<'price'>('price');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const sortQuotes = (quotes: CompanyQuote[]) => {
    return [...quotes].sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1;
      return (a.price - b.price) * multiplier;
    });
  };

  const renderGlassSelectionCard = (selection: GlassSelection, index: number) => {
    return (
      <Card key={index} className="p-4 mb-4 relative">
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-2 right-2 text-destructive hover:text-destructive"
          onClick={() => removeGlassSelection(index)}
        >
          <X className="h-4 w-4" />
        </Button>
        
        <div className="mb-4">
          <Label htmlFor={`type-${index}`}>Glass Type</Label>
          <Select
            value={selection.type}
            onValueChange={(value) => updateGlassSelection(index, 'type', value)}
          >
            <SelectTrigger id={`type-${index}`} className="bg-white border-[#145484]/20">
              <SelectValue placeholder="Select glass type" />
            </SelectTrigger>
            <SelectContent className="bg-white border-[#145484]/20 shadow-lg z-50">
              <SelectItem value="Windscreen" className="hover:bg-[#145484]/10">Windscreen (Front)</SelectItem>
              <SelectItem value="rear-window" className="hover:bg-[#145484]/10">Rear Window</SelectItem>
              <SelectItem value="driver-front" className="hover:bg-[#145484]/10">Driver's Front Window</SelectItem>
              <SelectItem value="passenger-front" className="hover:bg-[#145484]/10">Passenger's Front Window</SelectItem>
              <SelectItem value="driver-rear" className="hover:bg-[#145484]/10">Driver's Rear Window</SelectItem>
              <SelectItem value="passenger-rear" className="hover:bg-[#145484]/10">Passenger's Rear Window</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="mb-4">
          <Label htmlFor={`quantity-${index}`}>Quantity</Label>
          <Input
            id={`quantity-${index}`}
            type="number"
            min="1"
            value={selection.quantity}
            onChange={(e) => updateGlassSelection(index, 'quantity', parseInt(e.target.value) || 1)}
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Glass Features</h4>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id={`sensor-${index}`}
              checked={selection.features?.sensor || false}
              onCheckedChange={(checked) => 
                updateGlassFeature(index, 'sensor', !!checked)
              }
            />
            <Label htmlFor={`sensor-${index}`}>Rain Sensor</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id={`devapour-${index}`}
              checked={selection.features?.devapour || false}
              onCheckedChange={(checked) => 
                updateGlassFeature(index, 'devapour', !!checked)
              }
            />
            <Label htmlFor={`devapour-${index}`}>De-Vapour</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id={`vinNotch-${index}`}
              checked={selection.features?.vinNotch || false}
              onCheckedChange={(checked) => 
                updateGlassFeature(index, 'vinNotch', !!checked)
              }
            />
            <Label htmlFor={`vinNotch-${index}`}>VIN Notch</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id={`hrf-${index}`}
              checked={selection.features?.hrf || false}
              onCheckedChange={(checked) => 
                updateGlassFeature(index, 'hrf', !!checked)
              }
            />
            <Label htmlFor={`hrf-${index}`}>HRF</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id={`isOE-${index}`}
              checked={selection.features?.isOE || false}
              onCheckedChange={(checked) => 
                updateGlassFeature(index, 'isOE', !!checked)
              }
            />
            <Label htmlFor={`isOE-${index}`}>OE</Label>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      <PageTransition>
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          {isScheduleTab ? (
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-[#145484] to-[#145484]/70 bg-clip-text text-transparent animate-fadeIn">
                  Schedule Professional Service
                </h1>
                <p className="mt-3 text-gray-600 text-lg animate-fadeIn delay-100">
                  Book an appointment with our certified technicians for your vehicle glass needs
                </p>
              </div>
              <div className="bg-gradient-to-br from-white to-[#145484]/5 rounded-2xl shadow-xl p-8 animate-fadeIn delay-200">
                <BookingForm />
              </div>
            </div>
          ) : showSupplierSelection ? (
            <div className="max-w-6xl mx-auto">
              {/* Supplier Selection Screen */}
              <div className="flex items-start justify-between mb-8">
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    Ordering for {urlVrn && vehicleDetails.make ? `${vehicleDetails.make} ${vehicleDetails.model} (${urlVrn})` : 'Your Vehicle'}
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Select your preferred glass supplier to continue
                  </p>
                </div>

                {/* Compact Depot Selection - Top Right */}
                <div className="ml-6 w-64">
                  <Label htmlFor="depot-select" className="text-sm font-medium text-gray-700 mb-2 block">
                    Depot Location
                  </Label>
                  <Select 
                    value={selectedDepots[0] || 'PAR'} 
                    onValueChange={(value) => setSelectedDepots([value])}
                  >
                    <SelectTrigger id="depot-select" className="h-10 border-gray-300 bg-white shadow-sm">
                      <SelectValue placeholder="Select Depot" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="PAR">Park Royal (London)</SelectItem>
                      <SelectItem value="WAL">Walthamstow (London)</SelectItem>
                      <SelectItem value="ROC">Maidstone</SelectItem>
                      <SelectItem value="CMB">Cambridge</SelectItem>
                      <SelectItem value="BIR">Birmingham</SelectItem>
                      <SelectItem value="MAN">Manchester</SelectItem>
                      <SelectItem value="NOT">Nottingham</SelectItem>
                      <SelectItem value="DUR">Durham</SelectItem>
                      <SelectItem value="GLA">Glasgow</SelectItem>
                      <SelectItem value="PLT">Plate Glass</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Master Auto Glass Card */}
                <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer group" onClick={() => handleSupplierSelect('mag')}>
                  <CardContent className="p-8 text-center">
                    <div className="bg-gray-100 rounded-lg p-6 mb-6 h-32 flex items-center justify-center group-hover:bg-gray-50 transition-colors">
                        <img
                          src="/MAG.png"
                          alt="Master Auto Glass"
                        className="h-20 w-auto object-contain"
                      />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Master Auto Glass</h3>
                    <p className="text-gray-600 mb-6 min-h-[48px]">
                      A leading supplier of OEM and aftermarket auto glass products.
                    </p>
                    <Button className="w-full bg-[#FFC107] hover:bg-[#FFD54F] text-[#1D1D1F] font-semibold btn-glisten">
                      Enter Portal
                    </Button>
                  </CardContent>
                </Card>

                {/* Charles Pugh Card */}
                <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer group" onClick={() => handleSupplierSelect('pughs')}>
                  <CardContent className="p-8 text-center">
                    <div className="bg-gray-100 rounded-lg p-6 mb-6 h-32 flex items-center justify-center group-hover:bg-gray-50 transition-colors">
                        <img
                          src="/pughs_logo.png"
                        alt="Charles Pugh"
                        className="h-20 w-auto object-contain"
                        />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Charles Pugh</h3>
                    <p className="text-gray-600 mb-6 min-h-[48px]">
                      Specialists in windscreen distribution and glazing tools.
                    </p>
                    <Button className="w-full bg-[#FFC107] hover:bg-[#FFD54F] text-[#1D1D1F] font-semibold btn-glisten">
                      Enter Portal
                    </Button>
                  </CardContent>
                </Card>

                {/* Guest Checkout Card */}
                <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 border-[#145484]" onClick={() => handleSupplierSelect('guest')}>
                  <CardContent className="p-8 text-center">
                    <div className="bg-[#145484] rounded-full w-32 h-32 mx-auto mb-6 flex items-center justify-center group-hover:bg-[#0f3d5f] transition-colors">
                      <ShoppingCart className="w-16 h-16 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Guest Checkout</h3>
                    <p className="text-gray-600 mb-6 min-h-[48px]">
                      Perfect for non-trade or one-off glass purchases without an account.
                    </p>
                    <Button variant="ghost" className="w-full bg-[#145484] hover:bg-[#0f3d5f] text-white font-semibold btn-glisten">
                      Shop Retail
                    </Button>
                  </CardContent>
                </Card>
                    </div>
                  </div>
          ) : !magUser && selectedProvider !== 'guest' ? (
            // Show login form for MAG/Pughs if not authenticated
            <div className="max-w-md mx-auto">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowSupplierSelection(true);
                  setSelectedProvider(null);
                }}
                className="mb-4 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Supplier Selection
              </Button>

              <MAGLoginForm
                onLoginSuccess={async (credentials) => {
                  try {
                    await loginWithMAG(credentials);
                    // After successful login, show the order choice
                    setShowOrderChoice(true);
                  } catch (error) {
                    console.error('Login failed:', error);
                  }
                }}
                provider={selectedProvider}
              />
            </div>
          ) : showOrderChoice && !proceedToOrder ? (
            // Show the order choice screen after supplier selection/login
            <GlassOrderChoice 
              onProceedToOrder={handleProceedToOrder}
              onBack={handleBackToSupplierSelection}
              vehicleData={{
                vrn: urlVrn || vrn,
                make: urlMake || vehicleDetails.make,
                model: urlModel || vehicleDetails.model,
                year: urlYear || vehicleDetails.year,
              }}
            />
          ) : (
            <div className="animate-fadeIn">
              <div className="mb-8">
                {/* Back to Supplier Selection Button */}
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowSupplierSelection(true);
                    setSelectedProvider(null);
                  }}
                  className="mb-4 text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Supplier Selection
                </Button>

                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    {/* Vehicle Image - show when available */}
                    {urlVehicleImage && urlVehicleImage !== '' && (
                      <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                        <img
                          src={urlVehicleImage}
                          alt={`${vehicleDetails.make} ${vehicleDetails.model}`}
                          className="w-full h-full object-contain p-2"
                          onError={(e) => {
                            console.error('Failed to load vehicle image:', urlVehicleImage);
                            // Hide image container if it fails to load
                            const container = (e.target as HTMLImageElement).parentElement;
                            if (container) {
                              container.style.display = 'none';
                            }
                          }}
                          onLoad={() => {
                            console.log('✅ Vehicle image loaded in header');
                          }}
                        />
                      </div>
                    )}
                    <div>
                      <h1 className="text-4xl font-bold text-gray-900">Search Glass</h1>
                    </div>
                  </div>
                  
                  {/* Provider User Status - Only show for mag/pughs */}
                  {selectedProvider !== 'guest' && (
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${magUser?.isAuthenticated ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                        <span className="text-sm font-medium text-gray-700">
                          {magUser?.isAuthenticated ? `${selectedProvider === 'mag' ? 'MAG' : 'Pughs'} Account` : 'Guest Mode'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {magUser?.email}
                      </p>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={logoutMAG}
                      className="border-[#145484] text-[#145484] hover:bg-[#145484] hover:text-white"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                  )}
                </div>
              </div>
              
                {/* Clean Search Interface */}
              <div className="max-w-6xl mx-auto space-y-6">
                {/* Search Bar */}
                <Card className="shadow-md">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="relative">
                        <Input
                          type="text"
                          value={vrn}
                          onChange={(e) => setVrn(e.target.value.toUpperCase())}
                          placeholder="LV71 HMO"
                          className="h-11 text-base pl-10 border-gray-300 focus:border-[#145484] focus:ring-[#145484]"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>
                      <Select value={glassTypeFilter} onValueChange={setGlassTypeFilter}>
                        <SelectTrigger className="h-11 text-base border-gray-300 bg-white">
                          <SelectValue placeholder="All Glass Types" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="all">All Glass Types</SelectItem>
                          <SelectItem value="windscreen">Windscreen (Front)</SelectItem>
                          <SelectItem value="rear">Rear Window</SelectItem>
                          <SelectItem value="driver-front">Driver's Front Window</SelectItem>
                          <SelectItem value="passenger-front">Passenger's Front Window</SelectItem>
                          <SelectItem value="driver-rear">Driver's Rear Window</SelectItem>
                          <SelectItem value="passenger-rear">Passenger's Rear Window</SelectItem>
                          <SelectItem value="driver-front-vent">Driver's Front Vent</SelectItem>
                          <SelectItem value="passenger-front-vent">Passenger's Front Vent</SelectItem>
                          <SelectItem value="driver-rear-vent">Driver's Rear Vent</SelectItem>
                          <SelectItem value="passenger-rear-vent">Passenger's Rear Vent</SelectItem>
                          <SelectItem value="driver-quarter">Driver's Quarter Glass</SelectItem>
                          <SelectItem value="passenger-quarter">Passenger's Quarter Glass</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        onClick={() => fetchGlassOptions()}
                        disabled={!vrn || loading}
                        className="h-11 bg-[#FFC107] hover:bg-[#e6ad06] text-black font-semibold"
                      >
                        {loading ? 'Searching...' : 'Search'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Windscreen Attributes - Only show when windscreen is selected and before search */}
                {glassTypeFilter === 'windscreen' && !showQuotes && (
                  <Card className="shadow-md">
                    <CardContent className="p-4">
                      <Label className="text-sm font-semibold text-gray-900 mb-3 block">
                        Windscreen Attributes (Optional)
                      </Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="rainSensor"
                            checked={windscreenAttributes.rainSensor}
                            onCheckedChange={(checked) => 
                              setWindscreenAttributes({...windscreenAttributes, rainSensor: checked as boolean})
                            }
                          />
                          <label htmlFor="rainSensor" className="text-sm cursor-pointer">
                            Rain Sensor
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="heatedScreen"
                            checked={windscreenAttributes.heatedScreen}
                            onCheckedChange={(checked) => 
                              setWindscreenAttributes({...windscreenAttributes, heatedScreen: checked as boolean})
                            }
                          />
                          <label htmlFor="heatedScreen" className="text-sm cursor-pointer">
                            Heated Screen
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="camera"
                            checked={windscreenAttributes.camera}
                            onCheckedChange={(checked) => 
                              setWindscreenAttributes({...windscreenAttributes, camera: checked as boolean})
                            }
                          />
                          <label htmlFor="camera" className="text-sm cursor-pointer">
                            Camera
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="adas"
                            checked={windscreenAttributes.adas}
                            onCheckedChange={(checked) => 
                              setWindscreenAttributes({...windscreenAttributes, adas: checked as boolean})
                            }
                          />
                          <label htmlFor="adas" className="text-sm cursor-pointer">
                            ADAS
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="hud"
                            checked={windscreenAttributes.hud}
                            onCheckedChange={(checked) => 
                              setWindscreenAttributes({...windscreenAttributes, hud: checked as boolean})
                            }
                          />
                          <label htmlFor="hud" className="text-sm cursor-pointer">
                            HUD Display
                          </label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Vehicle Info Card - Only show after search */}
                      {vehicleDetails.make && showQuotes && (
                  <Card className="shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        {/* Vehicle Image or Icon */}
                        <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                          {vehicleDetails.vehicle_image_url ? (
                            <img
                              src={vehicleDetails.vehicle_image_url}
                              alt={`${vehicleDetails.make} ${vehicleDetails.model}`}
                              className="w-full h-full object-contain p-2"
                              onError={(e) => {
                                console.error('Failed to load vehicle image:', vehicleDetails.vehicle_image_url);
                                // Fallback to car icon if image fails
                                const img = e.target as HTMLImageElement;
                                img.style.display = 'none';
                                const parent = img.parentElement;
                                if (parent) {
                                  parent.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle></svg>';
                                }
                              }}
                              onLoad={() => {
                                console.log('✅ Vehicle image loaded in card');
                              }}
                            />
                          ) : (
                            <Car className="w-12 h-12 text-gray-400" />
                          )}
                            </div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-gray-900">
                            {vehicleDetails.make} {vehicleDetails.model}
                          </h3>
                          <p className="text-gray-600">
                            {vehicleDetails.year} | {vehicleDetails.fuel || vehicleDetails.variant || 'Petrol'}
                          </p>
                          {/* Windscreen Attributes Tags */}
                          {glassTypeFilter === 'windscreen' && showQuotes && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {windscreenAttributes.rainSensor && (
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                  Rain Sensor
                                </span>
                              )}
                              {windscreenAttributes.heatedScreen && (
                                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium">
                                  Heated Screen
                                </span>
                              )}
                              {windscreenAttributes.camera && (
                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">
                                  Camera
                                </span>
                              )}
                              {windscreenAttributes.adas && (
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                                  ADAS
                                </span>
                              )}
                              {windscreenAttributes.hud && (
                                <span className="bg-cyan-100 text-cyan-800 px-2 py-1 rounded text-xs font-medium">
                                  HUD Display
                                </span>
                              )}
                            </div>
                          )}
                            </div>
                              </div>
                      
                      {/* Feature Badges */}
                      <div className="flex flex-wrap gap-2 mt-4">
                        {vehicleDetails.transmission && (
                          <span className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm">
                            <WifiOff className="w-4 h-4" />
                            {vehicleDetails.transmission}
                          </span>
                            )}
                            {vehicleDetails.doors && (
                          <span className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm">
                            <Layers className="w-4 h-4" />
                            {vehicleDetails.doors} Doors
                          </span>
                        )}
                        {vehicleDetails.bodyStyle && (
                          <span className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm">
                            <Car className="w-4 h-4" />
                            {vehicleDetails.bodyStyle}
                          </span>
                        )}
                              </div>
                    </CardContent>
                  </Card>
                )}

                {/* Toggle Buttons */}
                <div className="flex gap-3">
                          <Button 
                    variant="ghost"
                    onClick={() => setShowTradeOnly(false)}
                    className={cn(
                      "px-6 py-2 rounded-lg font-semibold transition-all duration-300",
                      !showTradeOnly
                        ? "bg-[#14b8a6] text-white"
                        : "bg-white text-gray-700 border border-gray-200"
                    )}
                  >
                    Show All
                          </Button>
                              <Button
                    variant="ghost"
                    onClick={() => setShowTradeOnly(true)}
                    className={cn(
                      "px-6 py-2 rounded-lg font-semibold transition-all duration-300",
                      showTradeOnly
                        ? "bg-[#14b8a6] text-white"
                        : "bg-white text-gray-700 border border-gray-200"
                    )}
                  >
                    Trade Only
                              </Button>
                            </div>
                            
                {/* Results Table */}
                {showQuotes && (
                  <Card className="shadow-md">
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Part Name</th>
                              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Company</th>
                              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Location</th>
                              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Price</th>
                              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ETA</th>
                              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                        {sortQuotes(quotes).map((quote, index) => (
                              <tr key={index} className="hover:bg-gray-50 transition-colors">
                                {/* Part Name */}
                                <td className="px-6 py-4">
                                  <span className="font-semibold text-gray-900">
                                    {quote.argicCode || quote.magCode || 'DW01851GBN'}
                                  </span>
                                </td>
                                
                                {/* Company (Master Auto Glass or Charles Pugh) */}
                                <td className="px-6 py-4">
                                  <span className="text-gray-700">
                                    {quote.supplierCompany || 'Master Auto Glass'}
                                  </span>
                                </td>
                                
                                {/* Location (Depot Location) */}
                                <td className="px-6 py-4">
                                  <span className="text-gray-700">
                                    {quote.depotName || 'N/A'}
                                  </span>
                                </td>
                                
                                {/* Price */}
                                <td className="px-6 py-4">
                                  <span className="font-semibold text-gray-900">
                                    £{quote.price.toFixed(2)}
                                    </span>
                                </td>
                                
                                {/* ETA */}
                                <td className="px-6 py-4">
                                  <div className="space-y-1">
                                    <span className="bg-[#FFC107] text-black px-3 py-1 rounded-full text-sm font-medium inline-block">
                                      Next Day
                                    </span>
                                    {quote.estimatedTimePickup && quote.estimatedTimePickup.includes('Same-day') && (
                                      <div className="text-xs text-green-600 font-medium">
                                        {quote.estimatedTimePickup}
                                      </div>
                                    )}
                                  </div>
                                </td>
                          
                                {/* Action */}
                                <td className="px-6 py-4">
                            <Button 
                                    variant="ghost"
                                    size="sm"
                              onClick={() => handleQuoteSelection(quote)}
                                    className="bg-[#FFC107] hover:bg-[#FFD54F] text-[#1D1D1F] font-semibold px-6 btn-glisten"
                            >
                                    Add to Cart
                            </Button>
                                </td>
                              </tr>
                        ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
          
          <AlertDialog open={isConfirmationOpen} onOpenChange={setIsConfirmationOpen}>
            <AlertDialogContent className="bg-white max-w-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-2xl font-bold text-gray-900">
                  Confirm Your Order Details
                </AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="text-gray-600 space-y-6">
                  {selectedQuote && (
                    <>
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">Selected Windows</h3>
                          <div className="bg-[#145484]/5 rounded-lg divide-y divide-[#145484]/10">
                            {glassSelections.map((selection, index) => (
                              <div key={index} className="p-4 flex justify-between items-center">
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {selection.type === 'Windscreen' && 'Windscreen (Front)'}
                                    {selection.type === 'rear-window' && 'Rear Window'}
                                    {selection.type === 'driver-front' && "Driver's Front Window"}
                                    {selection.type === 'passenger-front' && "Passenger's Front Window"}
                                    {selection.type === 'driver-rear' && "Driver's Rear Window"}
                                    {selection.type === 'passenger-rear' && "Passenger's Rear Window"}
                                  </p>
                                </div>
                                <span className="text-[#145484] font-medium">
                                  Quantity: {selection.quantity}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Summary</h3>
                          <div className="bg-[#145484]/5 p-4 rounded-lg space-y-3">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="bg-[#145484]/10 rounded-lg p-2 w-16 h-16 flex items-center justify-center">
                                {getGlassTypeIcon(selectedQuote, glassSelections[0])}
                              </div>
                              <span className="text-[#145484] font-semibold text-lg">{selectedQuote.company}</span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <p className="font-medium">Glass Type:</p>
                              <span className="text-[#145484] font-semibold">{selectedQuote.company}</span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <p className="font-medium">Vehicle Registration:</p>
                              <span className="text-[#145484] font-semibold">{vrn}</span>
                            </div>
                            <div className="flex items-start justify-between">
                              <p className="font-medium mt-1">Vehicle:</p>
                              <div className="text-right flex items-center flex-wrap justify-end">
                                <span className="text-[#145484] font-semibold">{`${vehicleDetails.make} ${vehicleDetails.model} (${vehicleDetails.year})`}</span>
                                {selectedQuote && selectedQuote.argicCode && (
                                  <span className="bg-[#145484]/10 px-2 py-0.5 rounded font-medium text-[#145484] ml-2 mt-1">
                                    {selectedQuote.argicCode.length > 4 
                                      ? selectedQuote.argicCode.substring(0, 4) 
                                      : selectedQuote.argicCode}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <p className="font-medium">Selected Depots:</p>
                              <span className="text-[#145484] font-semibold">
                                {selectedDepots.length > 0 
                                  ? selectedDepots.map(depot => availableDepots.find(d => d.DepotCode === depot)?.DepotName || depot).join(', ')
                                  : "None selected"}
                              </span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <p className="font-medium">Product Depot:</p>
                              <span className="text-[#145484] font-semibold">
                                {selectedQuote.depotName || 
                                  availableDepots.find(d => d.DepotCode === selectedQuote.depotCode)?.DepotName || 
                                  selectedQuote.depotCode || 
                                  "Not specified"}
                              </span>
                            </div>
                            
                            {/* Add stock information */}
                            {selectedQuote.totalAvailable !== undefined && (
                              <div className="flex justify-between items-center">
                                <p className="font-medium">Stock Status:</p>
                                <span className={`font-semibold ${selectedQuote.totalAvailable > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                  {selectedQuote.totalAvailable > 10 
                                    ? 'In Stock' 
                                    : selectedQuote.totalAvailable > 0 
                                      ? `${selectedQuote.totalAvailable} in stock` 
                                      : 'Out of Stock'}
                                </span>
                              </div>
                            )}
                            
                            <div className="flex justify-between items-center">
                              <p className="font-medium">Estimated Delivery:</p>
                              <span className="text-[#145484] font-semibold">{selectedQuote.estimatedTimeDelivery}</span>
                            </div>
                            
                            {/* Display features if available */}
                            {selectedQuote.features && selectedQuote.features.length > 0 && (
                              <div className="border-t border-[#145484]/10 pt-3 mt-3">
                                <p className="font-medium mb-2">Features:</p>
                                <div className="flex flex-wrap gap-1">
                                  {selectedQuote.features.map((feature, i) => (
                                    <span key={i} className="text-xs bg-[#145484]/10 text-[#145484] px-2 py-0.5 rounded-full">
                                      {feature}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Add depot information if available */}
                            {selectedQuote.availableDepots && selectedQuote.availableDepots.length > 0 && (
                              <div className="mt-4 border-t border-[#145484]/10 pt-4">
                                <p className="font-medium mb-2">Available at these depots:</p>
                                <div className="max-h-40 overflow-y-auto">
                                  {selectedQuote.availableDepots.map((depot: any, index: number) => (
                                    <div key={index} className="p-2 bg-white/50 rounded mb-2 text-sm">
                                      <div className="flex justify-between">
                                        <span className="font-medium">{depot.depotName}</span>
                                        <span className="text-green-600 font-bold">{depot.Qty} in stock</span>
                                      </div>
                                      <div className="text-gray-600 mt-1">
                                        {depot.town && <span>{depot.town}, </span>}
                                        {depot.postcode && <span>{depot.postcode}</span>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Display product codes */}
                            {selectedQuote?.argicCode && (
                              <div className="border-t border-[#145484]/10 pt-3 mt-3">
                                <div className="flex items-center justify-center">
                                  <span className="bg-[#145484]/20 px-3 py-1 rounded font-semibold text-[#145484]">
                                    {selectedQuote.argicCode.length > 4 
                                      ? selectedQuote.argicCode.substring(0, 4) 
                                      : selectedQuote.argicCode}
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            <div className="flex justify-between items-center pt-3 border-t border-[#145484]/10">
                              <p className="font-semibold text-lg">Total Price:</p>
                              <span className="text-[#145484] font-bold text-lg">£{selectedQuote.price.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-center text-sm text-gray-600 mt-4">
                        Would you like to proceed with this order?
                      </p>
                    </>
                  )}
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-[#145484]/20 hover:bg-[#145484]/5">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmOrder}
                  className="bg-[#145484] hover:bg-[#0e3b61] text-white"
                >
                  Confirm Order
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </PageTransition>
    </DashboardLayout>
  );
};

// Main component that handles MAG authentication
const PriceLookup = () => {
  return (
    <MAGAuthProvider>
      <PriceLookupWithAuth />
    </MAGAuthProvider>
  );
};

// Component that shows either MAG login or the main content
const PriceLookupWithAuth = () => {
  // Always show the main content - supplier selection is now handled inside PriceLookupContent
  // Login will be required only when user selects MAG or Pughs supplier
  return <PriceLookupContent />;
};

export default PriceLookup;