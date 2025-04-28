import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BookingForm } from "@/components/booking/BookingForm";
import { ShoppingCart, X, Image as ImageIcon, Car, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "react-router-dom";
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
  vrn: string;
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
    return <Car className="w-10 h-10 text-[#135084]" />;
  } else if (type.includes('window') || type.includes('Window')) {
    return <Layers className="w-10 h-10 text-[#135084]" />;
  } else {
    // Default icon
    return <ImageIcon className="w-10 h-10 text-[#135084]" />;
  }
};

const PriceLookup = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const jobId = searchParams.get('jobId');
  const damageType = searchParams.get('damage');
  const vehicleInfo = searchParams.get('vrn');
  const isScheduleTab = location.search.includes('tab=schedule');
  const [vrn, setVrn] = useState("");
  const [availableDepots, setAvailableDepots] = useState<Depot[]>([
    { DepotCode: 'BIR', DepotName: 'Birmingham' },
    { DepotCode: 'CMB', DepotName: 'Cambridge' },
    { DepotCode: 'DUR', DepotName: 'Durham' },
    { DepotCode: 'GLA', DepotName: 'Glasgow' },
    { DepotCode: 'MAN', DepotName: 'Manchester' },
    { DepotCode: 'NOT', DepotName: 'Nottingham' },
    { DepotCode: 'PAR', DepotName: 'Park Royal' },
    { DepotCode: 'PLT', DepotName: 'Plate Glass' },
    { DepotCode: 'ROC', DepotName: 'Maidstone' },
    { DepotCode: 'WAL', DepotName: 'Walthamstow' }
  ]);
  const [selectedDepots, setSelectedDepots] = useState<string[]>([]);
  const [glassSelections, setGlassSelections] = useState<GlassSelection[]>([]);
  const [quotes, setQuotes] = useState<CompanyQuote[]>([]);
  const [showQuotes, setShowQuotes] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<CompanyQuote | null>(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const { toast } = useToast();
  const [vehicleDetails, setVehicleDetails] = useState<VehicleDetails>({
    make: '',
    model: '',
    year: '',
    vrn: ''
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [vrnValidForLookup, setVrnValidForLookup] = useState(false);

  // Add useEffect to get depots from API if needed
  // Currently we're using the hardcoded list
  // useEffect(() => {
  //   const fetchDepots = async () => {
  //     try {
  //       const { depots } = await getDepots();
  //       if (depots && depots.length > 0) {
  //         setAvailableDepots(depots);
  //       }
  //     } catch (error) {
  //       console.error("Error fetching depots:", error);
  //     }
  //   };
  //   fetchDepots();
  // }, []);

  useEffect(() => {
    if (jobId && damageType && vehicleInfo) {
      // Set the initial vehicle and damage information
      setVrn(vehicleInfo);
      setGlassSelections([{
        type: damageType,
        quantity: 1
      }]);
      
      // Auto-fetch vehicle data when parameters are provided from URL
      console.log("Set initial values from URL parameters - will automatically fetch vehicle data");
    }
  }, [jobId, damageType, vehicleInfo]);

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
      console.log(`Fetching vehicle data for VRN: ${vrn.trim()}`);
      
      toast({
        title: "Loading...",
        description: "Retrieving vehicle information",
      });
      
      // Using the existing backend API endpoint which handles the external API call properly
      const response = await fetch(`/api/vehicle/${vrn.trim()}`);
      
      // Log response status for debugging
      console.log(`Vehicle API response status: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`Vehicle API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Vehicle data received:", data);
      
      // Process the API response
      let vehicleData: VehicleDetails;
      
      if (data?.Response?.DataItems?.VehicleRegistration) {
        // API original format
        const reg = data.Response.DataItems.VehicleRegistration;
        vehicleData = {
          make: reg.Make || "",
          model: reg.Model || "",
          year: reg.YearOfManufacture || "",
          bodyStyle: reg.BodyStyle || "",
          doors: reg.NumberOfDoors || "",
          fuel: reg.FuelType || "",
          transmission: reg.Transmission || "",
          vin: reg.Vin || "",
          // Master Auto Glass typically uses base code (first 4 digits)
          argicCode: reg.ArgicCode || "",
          vrn: vrn.trim() // Store the VRN we used for this lookup
        };
      } else if (data && data.make) {
        // Direct response format from our backend
        vehicleData = {
          make: data.make || "",
          model: data.model || "",
          year: data.year || "",
          bodyStyle: data.bodyStyle || data.body || "",
          doors: data.doors || "",
          variant: data.variant || "",
          fuel: data.fuel || data.fuelType || "",
          transmission: data.transmission || "",
          vin: data.vin || "",
          argicCode: data.argicCode || "",
          vrn: vrn.trim() // Store the VRN we used for this lookup
        };
      } else if (data?.Response?.StatusCode === 'KeyInvalid') {
        // Handle invalid VRN case
        throw new Error(`Invalid vehicle registration number: ${data.Response.StatusMessage || 'Please check the registration and try again'}`);
      } else {
        console.error("Could not find vehicle data in response:", data);
        throw new Error("Vehicle data not found in API response");
      }
      
      // Set vehicle details from the API response
      setVehicleDetails(vehicleData);
      
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
        description: "Vehicle data loaded successfully" 
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
        const apiHealthCheck = await fetch('/api/health');
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
      
      // Send request to API with detailed logging
      console.log(`Sending stock query with vehicle: ${vehicleDetails.make} ${vehicleDetails.model} ${vehicleDetails.year}`);
      console.log(`Glass features: ${JSON.stringify(features)}`);
      
      // Show loading toast for quotes
      toast({
        title: "Loading Glass Options",
        description: "Retrieving glass options for your vehicle across selected depots...",
      });

      // We'll fetch data for each selected depot and combine the results
      let allResults: any[] = [];
      const failedDepots: string[] = [];
      const successfulDepots: string[] = [];
      
      // Create an array of promises for each depot query
      const depotQueries = selectedDepots.map(async (depotCode) => {
        try {
          console.log(`Making API request to /api/glass/stock-query for depot: ${depotCode}`);
          const apiResponse = await fetch('/api/glass/stock-query', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              magCode: '',
              argicCode: vehicleArgic,
              model: `${vehicleDetails.make} ${vehicleDetails.model} ${vehicleDetails.year}`,
              depot: depotCode,
              features: {
                sensor: features.sensor,
                devapour: features.devapour,
                vinNotch: features.vinNotch,
                hrf: features.hrf,
                isOE: features.isOE
              }
            })
          });
          
          // Handle 404 or other error responses explicitly
          if (!apiResponse.ok) {
            const statusText = apiResponse.statusText || 'Unknown error';
            console.error(`API returned error ${apiResponse.status} (${statusText}) for depot ${depotCode}`);
            failedDepots.push(depotCode);
            return { 
              success: false, 
              depot: depotCode, 
              error: `API Error ${apiResponse.status}: ${statusText}` 
            };
          }
          
          const responseText = await apiResponse.text();
          console.log(`API Response Status for ${depotCode}: ${apiResponse.status}`);
          
          // Try to parse the response as JSON
          try {
            const result = JSON.parse(responseText);
            if (result.success && result.priceRecords && result.priceRecords.length > 0) {
              console.log(`Retrieved ${result.priceRecords.length} products from depot ${depotCode}`);
              // Add depot information to each price record
              const recordsWithDepot = result.priceRecords.map((record: any) => ({
                ...record,
                DepotCode: depotCode,
                DepotName: availableDepots.find(d => d.DepotCode === depotCode)?.DepotName || depotCode
              }));
              allResults = [...allResults, ...recordsWithDepot];
              successfulDepots.push(depotCode);
              return { success: true, depot: depotCode };
            } else {
              console.log(`No products found at depot ${depotCode}`);
              failedDepots.push(depotCode);
              return { success: false, depot: depotCode };
            }
          } catch (jsonError) {
            console.error(`Failed to parse API response for depot ${depotCode}:`, jsonError);
            failedDepots.push(depotCode);
            return { success: false, depot: depotCode, error: jsonError };
          }
        } catch (error) {
          console.error(`Error during API call for depot ${depotCode}:`, error);
          failedDepots.push(depotCode);
          return { success: false, depot: depotCode, error };
        }
      });
      
      // Wait for all depot queries to complete
      const results = await Promise.all(depotQueries);
      
      // Check if all depot queries failed with the same error (e.g., all 404s)
      const allFailed = results.every(result => !result.success);
      
      // Log errors for debugging
      console.log("Query results:", results);
      
      // Check specifically for 404 errors which indicate endpoint is missing
      const failedWith404 = results.filter(result => 
        result.error && typeof result.error === 'string' && result.error.includes('404')
      );
      
      console.log(`All failed: ${allFailed}, Failed with 404: ${failedWith404.length}/${results.length}`);
      
      // If most requests failed with 404, assume API endpoint is not available
      if (allFailed && failedWith404.length > 0) {
        // Special error message for missing API endpoint
        toast({
          title: "API Endpoint Not Found",
          description: "Using mock data for demonstration purposes. In production, connect to a proper API endpoint.",
          variant: "default",
        });
        
        // Generate mock data for demonstration
        const mockData = generateMockDataForDepots(selectedDepots, vehicleDetails);
        
        setQuotes(mockData);
        setShowQuotes(true);
        setLoading(false);
        return true;
      }
      
      if (allResults.length > 0) {
        console.log(`Retrieved a total of ${allResults.length} products from all depots`);
        
        // Convert the combined API price records to quotes
        const apiQuotes: CompanyQuote[] = allResults.map((record: any, index: number) => {
          // Determine if it's OEM or OEE based on price/description
          const isOEM = record.Description?.includes('OEM') || 
                        record.PriceInfo?.includes('OEM') || 
                        record.MagCode?.includes('-OE') ||
                        record.Price > 150;
                          
          // Create an appropriate quote label
          let label = isOEM ? 'OEM' : 'OEE';
          
          // Add glass type based on selections
          const glassTypes = glassSelections.map(s => {
            let name = s.type;
            if (s.type === 'Windscreen') name = "Windscreen (Front)";
            if (s.type === 'rear-window') name = "Rear Window";
            if (s.type === 'driver-front') name = "Driver's Front Window";
            if (s.type === 'passenger-front') name = "Passenger's Front Window";
            if (s.type === 'driver-rear') name = "Driver's Rear Window";
            if (s.type === 'passenger-rear') name = "Passenger's Rear Window";
            return `${name} x${s.quantity}`;
          });
          
          // Create the company description combining the product details
          const company = record.Description ? 
            `${label} ${record.Description}` : 
            `${label} ${record.Make || vehicleDetails.make} ${glassTypes.join(', ')}`;
          
          // Create the features array with more details
          const featuresList = [];
          if (record.Description) featuresList.push(record.Description);
          if (record.PriceInfo) featuresList.push(record.PriceInfo);
          
          // Add depot information
          featuresList.push(`Depot: ${record.DepotName}`);
          
          // Filter out any unwanted tags before creating the quote
          const filteredFeatures = featuresList.filter(feature => 
            !feature.includes('Aftermarket') && 
            !feature.includes('Limited Stock') &&
            feature.trim() !== ''
          );
          
          return {
            company,
            price: record.Price,
            estimatedTimeDelivery: record.Qty > 5 ? "1-2 days" : "3-5 days",
            estimatedTimePickup: `Available Qty: ${record.Qty}`,
            argicCode: record.ArgicCode,
            magCode: record.MagCode,
            availability: record.Qty > 0 ? "In Stock" : "Out of Stock",
            features: filteredFeatures,
            totalAvailable: record.Qty || 0,
            depotCode: record.DepotCode,
            depotName: record.DepotName
          };
        });
        
        setQuotes(apiQuotes);
        setShowQuotes(true);
        
        // Show a toast with information about successful and failed depot queries
        if (failedDepots.length > 0) {
          toast({
            title: "Partial Results",
            description: `Found ${apiQuotes.length} glass options from ${successfulDepots.length} depots. ${failedDepots.length} depots returned no results.`,
            variant: "default",
          });
        } else {
          toast({
            title: "Quote Request Successful",
            description: `Found ${apiQuotes.length} glass options across ${successfulDepots.length} depots`,
          });
        }
        
        return true;
      } else {
        // No results from any depot
        toast({
          title: "No Products Found",
          description: "No glass products found for your vehicle at any of the selected depots. Please check your details or try different depots.",
          variant: "destructive",
        });
        
        setLoading(false);
        return false;
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
    
    // Only proceed with API calls if we have an ARGIC code
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
    
    setIsConfirmationOpen(true);
  };

  // New function to check and display depot availability 
  const checkDepotAvailability = async (argicCode: string, depotCode?: string) => {
    try {
      console.log(`Checking depot availability for ARGIC code: ${argicCode}`);
      
      // Use the specific depot from the quote if provided, otherwise use the first selected depot
      const depotToCheck = depotCode || selectedDepots[0] || '';
      
      // Call our new API endpoint with depot included
      const response = await fetch(`/api/glass-availability?argicCode=${argicCode}&quantity=1&depot=${encodeURIComponent(depotToCheck)}`);
      
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
  const generateMockDataForDepots = (depots: string[], vehicleInfo: VehicleDetails): CompanyQuote[] => {
    // Create mock data entries for each selected depot
    const mockQuotes: CompanyQuote[] = [];
    
    // If we have a real ARGIC code, use it - otherwise create a mock one
    const hasRealArgic = !!vehicleInfo.argicCode && !vehicleInfo.argicCode.startsWith('MOCK-');
    
    // Use the real ARGIC code if available, otherwise create a base mock one
    const baseArgicCode = hasRealArgic 
      ? vehicleInfo.argicCode 
      : `MOCK-${vehicleInfo.make.substring(0, 3)}-${vehicleInfo.model.substring(0, 3)}`;
    
    console.log(`Using ${hasRealArgic ? 'real' : 'mock'} ARGIC code: ${baseArgicCode}`);
    
    depots.forEach(depotCode => {
      const depotName = availableDepots.find(d => d.DepotCode === depotCode)?.DepotName || depotCode;
      
      // Create a few different glass options for each depot
      const glassTypes = ['Standard', 'Premium', 'OEM Quality'];
      
      glassTypes.forEach((type, index) => {
        const basePrice = 180 + (index * 60) + (Math.random() * 40);
        const qty = Math.floor(Math.random() * 15);
        
        // If we have a real ARGIC code, use a variant of it for different glass types
        // Otherwise use the mock format
        const argicCode = hasRealArgic 
          ? `${baseArgicCode}${index > 0 ? `-${index}` : ''}` 
          : `${baseArgicCode}-${index}`;
        
        mockQuotes.push({
          company: `${type} Glass - ${vehicleInfo.make} ${vehicleInfo.model}`,
          price: parseFloat(basePrice.toFixed(2)),
          estimatedTimeDelivery: qty > 5 ? "1-2 days" : "3-5 days",
          estimatedTimePickup: `Available Qty: ${qty}`,
          argicCode: argicCode,
          magCode: `MAG-${vehicleInfo.model.substring(0, 3)}-${index}`,
          availability: qty > 0 ? "In Stock" : "Out of Stock",
          features: [
            type === 'OEM Quality' ? 'Original Equipment Manufacturer' : '',
            `${vehicleInfo.make} ${vehicleInfo.model} (${vehicleInfo.year})`,
          ].filter(feature => feature !== ''), // Remove empty strings
          totalAvailable: qty,
          depotCode: depotCode,
          depotName: depotName
        });
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
            <SelectTrigger id={`type-${index}`} className="bg-white border-[#135084]/20">
              <SelectValue placeholder="Select glass type" />
            </SelectTrigger>
            <SelectContent className="bg-white/95 backdrop-blur-sm border-[#135084]/20 shadow-lg z-50">
              <SelectItem value="Windscreen" className="hover:bg-[#135084]/10">Windscreen (Front)</SelectItem>
              <SelectItem value="rear-window" className="hover:bg-[#135084]/10">Rear Window</SelectItem>
              <SelectItem value="driver-front" className="hover:bg-[#135084]/10">Driver's Front Window</SelectItem>
              <SelectItem value="passenger-front" className="hover:bg-[#135084]/10">Passenger's Front Window</SelectItem>
              <SelectItem value="driver-rear" className="hover:bg-[#135084]/10">Driver's Rear Window</SelectItem>
              <SelectItem value="passenger-rear" className="hover:bg-[#135084]/10">Passenger's Rear Window</SelectItem>
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
      <div className="space-y-8">
        {isScheduleTab ? (
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[#135084] to-[#135084]/70 bg-clip-text text-transparent animate-fadeIn">
                Schedule Professional Service
              </h1>
              <p className="mt-3 text-gray-600 text-lg animate-fadeIn delay-100">
                Book an appointment with our certified technicians for your vehicle glass needs
              </p>
            </div>
            <div className="bg-gradient-to-br from-white to-[#135084]/5 rounded-2xl shadow-xl p-8 animate-fadeIn delay-200">
              <BookingForm />
            </div>
          </div>
        ) : (
          <div className="animate-fadeIn">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-[#135084]">Glass Order Quote</h1>
              <p className="mt-2 text-gray-600">Get instant quotes for your vehicle glass needs</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="overflow-hidden bg-gradient-to-br from-white to-[#135084]/5 border-[#135084]/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="border-b border-[#135084]/10 bg-gradient-to-r from-[#135084]/5 to-[#135084]/10 p-6">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-[#135084] to-[#135084]/70 bg-clip-text text-transparent flex items-center gap-3">
                      <ShoppingCart className="w-7 h-7 text-[#135084]" />
                      Order Details
                    </CardTitle>
                    <p className="text-sm text-gray-500 font-medium">
                      Powered by{" "}
                      <span className="text-[#135084] font-semibold">
                        Master Auto Glass
                      </span>
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <form onSubmit={handleQuoteSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        Vehicle Registration Number (VRN)
                        <span className="text-[#135084] text-xs">(Required)</span>
                      </label>
                      <Input
                        type="text"
                        value={vrn}
                        onChange={(e) => setVrn(e.target.value.toUpperCase())}
                        placeholder="e.g., AB12 CDE"
                        className="w-full input-focus border-[#135084]/20 transition-all duration-200"
                      />
                    </div>

                    {/* Vehicle Details Display */}
                    {vehicleDetails.make && (
                      <div className="p-4 bg-[#135084]/5 rounded-lg">
                        <h3 className="font-medium text-[#135084] mb-2">Vehicle Details</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="font-medium">Make:</span> {vehicleDetails.make}
                          </div>
                          <div>
                            <span className="font-medium">Model:</span> {vehicleDetails.model}
                          </div>
                          {vehicleDetails.variant && (
                            <div>
                              <span className="font-medium">Variant:</span> {vehicleDetails.variant}
                            </div>
                          )}
                          {vehicleDetails.bodyStyle && (
                            <div>
                              <span className="font-medium">Body:</span> {vehicleDetails.bodyStyle}
                            </div>
                          )}
                          {vehicleDetails.doors && (
                            <div>
                              <span className="font-medium">Doors:</span> {vehicleDetails.doors}
                            </div>
                          )}
                          {vehicleDetails.year && (
                            <div>
                              <span className="font-medium">Year:</span> {vehicleDetails.year}
                            </div>
                          )}
                          {vehicleDetails.fuel && (
                            <div>
                              <span className="font-medium">Fuel:</span> {vehicleDetails.fuel}
                            </div>
                          )}
                          {vehicleDetails.transmission && (
                            <div>
                              <span className="font-medium">Trans:</span> {vehicleDetails.transmission}
                            </div>
                          )}
                          {vehicleDetails.argicCode && (
                            <div className="col-span-2">
                              <span className="font-medium">Argic Code:</span> {vehicleDetails.argicCode}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        Depots
                        <span className="text-[#135084] text-xs">(Select at least one)</span>
                        {selectedDepots.length > 0 && (
                          <span className="bg-[#135084] text-white text-xs px-2 py-0.5 rounded-full">
                            {selectedDepots.length} selected
                          </span>
                        )}
                      </label>
                      <div className="space-y-2 max-h-60 overflow-y-auto p-2 border rounded-md border-[#135084]/20">
                        {availableDepots.map((depot) => (
                          <div key={depot.DepotCode} className="flex items-center space-x-2 p-1 hover:bg-[#135084]/5 rounded">
                            <Checkbox 
                              id={`depot-${depot.DepotCode}`}
                              checked={selectedDepots.includes(depot.DepotCode)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedDepots(prev => [...prev, depot.DepotCode]);
                                } else {
                                  setSelectedDepots(prev => prev.filter(d => d !== depot.DepotCode));
                                }
                              }}
                            />
                            <Label htmlFor={`depot-${depot.DepotCode}`} className="cursor-pointer flex-grow">
                              {depot.DepotName}
                            </Label>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-500">
                          Select multiple depots to check availability across locations
                        </p>
                        <Button 
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => selectedDepots.length === availableDepots.length 
                            ? setSelectedDepots([]) 
                            : setSelectedDepots(availableDepots.map(d => d.DepotCode))}
                          className="text-xs"
                        >
                          {selectedDepots.length === availableDepots.length ? "Deselect All" : "Select All"}
                        </Button>
                      </div>
                      </div>
                      
                    <div className="space-y-4">
                          <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-gray-700">Glass Selections</label>
                            <Button
                              type="button"
                          variant="outline"
                          onClick={addGlassSelection}
                          className="text-[#135084] border-[#135084] hover:bg-[#135084]/10"
                        >
                          Add Glass
                            </Button>
                          </div>
                          
                      {glassSelections.map((selection, index) => renderGlassSelectionCard(selection, index))}

                      {glassSelections.length === 0 && (
                        <div className="text-center p-6 border border-dashed border-[#135084]/20 rounded-lg">
                          <p className="text-gray-500">Click 'Add Glass' to start your quote</p>
                        </div>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-[#135084] hover:bg-[#FFC107] text-white shadow-xl hover:shadow-2xl transition-all duration-300 text-lg py-6"
                    >
                      Get Quote
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {showQuotes && (
                <Card className="overflow-hidden bg-gradient-to-br from-white to-[#135084]/5 border-[#135084]/20 shadow-xl animate-fadeIn">
                  <CardHeader className="border-b border-[#135084]/10 bg-gradient-to-r from-[#135084]/5 to-[#135084]/10 p-6">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-2xl font-bold bg-gradient-to-r from-[#135084] to-[#135084]/70 bg-clip-text text-transparent flex items-center gap-3">
                        <ShoppingCart className="w-7 h-7 text-[#135084]" />
                        Available Options
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setSortOrder(current => current === 'asc' ? 'desc' : 'asc')}
                        className="w-10 h-10 bg-white border-[#135084]/20 hover:bg-[#135084]/5"
                      >
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {sortQuotes(quotes).map((quote, index) => (
                        <div
                          key={index}
                          className="p-6 rounded-xl border border-[#135084]/10 hover:border-[#135084]/30 transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <div className="bg-[#135084]/10 rounded-lg p-2 w-16 h-16 flex items-center justify-center">
                                {getGlassTypeIcon(quote, glassSelections[0])}
                              </div>
                            <h3 className="font-semibold text-xl text-gray-900">{quote.company}</h3>
                            </div>
                            <div className="text-right">
                              <span className="text-2xl font-bold text-[#135084]">
                                £{quote.price.toFixed(2)}
                              </span>
                              {quote.totalAvailable !== undefined && (
                                <div className={`text-sm font-medium ${quote.totalAvailable > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                  {quote.totalAvailable > 10 
                                    ? 'In Stock' 
                                    : quote.totalAvailable > 0 
                                      ? `${quote.totalAvailable} in stock` 
                                      : 'Out of Stock'}
                            </div>
                              )}
                          </div>
                          </div>
                          
                          {/* Enhanced glass details */}
                          <div className="mb-4 space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>{quote.estimatedTimePickup}</span>
                              {quote.depotName && (
                                <span className="bg-[#135084]/10 text-[#135084] px-2 py-0.5 rounded-full text-xs ml-auto">
                                  Depot: {quote.depotName}
                                </span>
                              )}
                            </div>
                            
                            {quote.features && quote.features.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {quote.features.map((feature, i) => (
                                  <span key={i} className="text-xs bg-[#135084]/10 text-[#135084] px-2 py-0.5 rounded-full">
                                    {feature}
                                  </span>
                                ))}
                              </div>
                            )}
                            
                            <div className="flex items-center gap-2 text-sm">
                            {quote.argicCode && (
                                <div className="flex items-center gap-1 text-gray-600">
                                  <span className="font-medium">ARGIC:</span>
                                <span>{quote.argicCode}</span>
                                </div>
                              )}
                              
                              {quote.magCode && (
                                <div className="flex items-center gap-1 text-gray-600">
                                  <span className="font-medium">MAG:</span>
                                  <span>{quote.magCode}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                            <span>Vehicle:</span>
                            <span>{`${vehicleDetails.make} ${vehicleDetails.model} (${vehicleDetails.year})`}</span>
                          </div>
                        
                          <Button 
                            className="w-full bg-[#135084] hover:bg-[#0e3b61] text-white shadow-xl hover:shadow-2xl transition-all duration-300"
                            onClick={() => handleQuoteSelection(quote)}
                          >
                            Select This Option
                          </Button>
                        </div>
                      ))}
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
                        <div className="bg-[#135084]/5 rounded-lg divide-y divide-[#135084]/10">
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
                                  {selection.type === 'sunroof' && 'Sunroof'}
                                  {selection.type === 'quarter-glass' && 'Quarter Glass'}
                                </p>
                              </div>
                              <span className="text-[#135084] font-medium">
                                Quantity: {selection.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Summary</h3>
                        <div className="bg-[#135084]/5 p-4 rounded-lg space-y-3">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="bg-[#135084]/10 rounded-lg p-2 w-16 h-16 flex items-center justify-center">
                              {getGlassTypeIcon(selectedQuote, glassSelections[0])}
                            </div>
                            <span className="text-[#135084] font-semibold text-lg">{selectedQuote.company}</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <p className="font-medium">Glass Type:</p>
                            <span className="text-[#135084] font-semibold">{selectedQuote.company}</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <p className="font-medium">Vehicle Registration:</p>
                            <span className="text-[#135084] font-semibold">{vrn}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="font-medium">Selected Depots:</p>
                            <span className="text-[#135084] font-semibold">
                              {selectedDepots.length > 0 
                                ? selectedDepots.map(depot => availableDepots.find(d => d.DepotCode === depot)?.DepotName || depot).join(', ')
                                : "None selected"}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <p className="font-medium">Product Depot:</p>
                            <span className="text-[#135084] font-semibold">
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
                            <span className="text-[#135084] font-semibold">{selectedQuote.estimatedTimeDelivery}</span>
                          </div>
                          
                          {/* Display product codes */}
                          {(selectedQuote.argicCode || selectedQuote.magCode) && (
                            <div className="border-t border-[#135084]/10 pt-3 mt-3">
                              <p className="font-medium mb-2">Product Codes:</p>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                {selectedQuote.argicCode && (
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium">ARGIC:</span>
                                    <span>{selectedQuote.argicCode}</span>
                                  </div>
                                )}
                                {selectedQuote.magCode && (
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium">MAG:</span>
                                    <span>{selectedQuote.magCode}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Display features if available */}
                          {selectedQuote.features && selectedQuote.features.length > 0 && (
                            <div className="border-t border-[#135084]/10 pt-3 mt-3">
                              <p className="font-medium mb-2">Features:</p>
                              <div className="flex flex-wrap gap-1">
                                {selectedQuote.features.map((feature, i) => (
                                  <span key={i} className="text-xs bg-[#135084]/10 text-[#135084] px-2 py-0.5 rounded-full">
                                    {feature}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Add depot information if available */}
                          {selectedQuote.availableDepots && selectedQuote.availableDepots.length > 0 && (
                            <div className="mt-4 border-t border-[#135084]/10 pt-4">
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
                          
                          <div className="flex justify-between items-center pt-3 border-t border-[#135084]/10">
                            <p className="font-semibold text-lg">Total Price:</p>
                            <span className="text-[#135084] font-bold text-lg">£{selectedQuote.price.toFixed(2)}</span>
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
              <AlertDialogCancel className="border-[#135084]/20 hover:bg-[#135084]/5">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmOrder}
                className="bg-[#135084] hover:bg-[#0e3b61] text-white"
              >
                Confirm Order
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-500 font-medium">
            Powered by{" "}
            <span className="text-[#135084] font-semibold">
              Master Auto Glass
            </span>
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PriceLookup;