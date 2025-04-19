import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Car, Search, Check, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect } from "react";
import { SecureHeader, getDepots, checkGlassAvailability, PriceRecord, getStockList, getBranchAvailability, searchStock } from '@/utils/glassService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Glass = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [availableGlass, setAvailableGlass] = useState<PriceRecord[]>([]);
  const [credentials] = useState<SecureHeader>({
    Login: "Q-100",
    Password: "b048c57a",
    UserID: 1
  });
  const [availableDepots, setAvailableDepots] = useState<{code: string, name: string}[]>([]);
  const [selectedDepot, setSelectedDepot] = useState<string>("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [checkingEurocode, setCheckingEurocode] = useState("");
  const [eurocodeResults, setEurocodeResults] = useState<{depot: string, qty: number}[]>([]);

  // Fetch depots when component mounts
  useEffect(() => {
    const fetchAvailableDepots = async () => {
      try {
        setLoading(true);
        const result = await getDepots(credentials);
        if (result.depots && result.depots.length > 0) {
          setAvailableDepots(result.depots.map(depot => ({
            code: depot.DepotCode,
            name: depot.DepotName
          })));
          // Set first depot as default
          setSelectedDepot(result.depots[0].DepotCode);
        } else if (result.error) {
          toast({
            title: "Error fetching depots",
            description: result.error,
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch available depots",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableDepots();
  }, []);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Search Error",
        description: "Please enter a search term",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Search for glass with the provided term
      const result = await searchStock(searchTerm, selectedDepot, credentials);
      
      if (result.error) {
        toast({
          title: "Search Error",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      
      setAvailableGlass(result.priceRecords);
      
      if (result.priceRecords.length === 0) {
        toast({
          title: "No Results",
          description: "No glass products found matching your search",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Search Complete",
          description: `Found ${result.priceRecords.length} glass products`,
        });
      }
    } catch (error) {
      toast({
        title: "Search Error",
        description: "An error occurred during the search",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const searchByVehicle = async () => {
    if (!make || !model || !year) {
      toast({
        title: "Search Error",
        description: "Please enter vehicle make, model and year",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await getStockList(
        make,
        model,
        "", // modelType - empty for now
        parseInt(year),
        credentials
      );
      
      if (result.error) {
        toast({
          title: "Search Error",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      
      setAvailableGlass(result.priceRecords);
      
      if (result.priceRecords.length === 0) {
        toast({
          title: "No Results",
          description: "No glass products found for this vehicle",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Search Complete",
          description: `Found ${result.priceRecords.length} glass products for this vehicle`,
        });
      }
    } catch (error) {
      toast({
        title: "Search Error",
        description: "An error occurred during the vehicle search",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkAvailability = async (eurocodeId: string) => {
    if (!eurocodeId) return;
    
    setCheckingEurocode(eurocodeId);
    setEurocodeResults([]);
    setLoading(true);
    
    try {
      const result = await getBranchAvailability(eurocodeId, credentials);
      
      if (result.error) {
        toast({
          title: "Availability Check Failed",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      
      if (result.stockItems.length === 0) {
        toast({
          title: "Not Available",
          description: "This glass is not available at any depot",
          variant: "destructive",
        });
      } else {
        const depotResults = result.stockItems.map(item => ({
          depot: item._branch,
          qty: item._qty
        }));
        
        setEurocodeResults(depotResults);
        
        toast({
          title: "Availability Checked",
          description: `Available at ${depotResults.length} depots`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check glass availability",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDepotName = (depotCode: string): string => {
    const depot = availableDepots.find(d => d.code === depotCode);
    return depot ? depot.name : depotCode;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-semibold text-[#3d99be]">Glass Inventory</h1>
          {availableDepots.length > 0 && (
            <div className="w-full md:w-64">
              <Select 
                value={selectedDepot}
                onValueChange={setSelectedDepot}
              >
                <SelectTrigger className="w-full border-[#3d99be] focus:ring-[#3d99be]">
                  <SelectValue placeholder="Select depot" />
                </SelectTrigger>
                <SelectContent>
                  {availableDepots.map((depot) => (
                    <SelectItem key={depot.code} value={depot.code}>
                      {depot.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="search">Search by ARGIC Code</TabsTrigger>
            <TabsTrigger value="vehicle">Search by Vehicle</TabsTrigger>
          </TabsList>
          <TabsContent value="search" className="space-y-4">
            <div className="flex items-center gap-4 w-full">
              <Input
                placeholder="Enter ARGIC code or description..."
                className="w-full border-[#3d99be] focus:ring-[#3d99be]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button 
                variant="secondary" 
                className="bg-[#3d99be] hover:bg-[#2d7994] text-white"
                onClick={handleSearch}
                disabled={loading}
              >
                {loading ? "Searching..." : "Search"}
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="vehicle" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Make (e.g., Ford)"
                className="w-full border-[#3d99be] focus:ring-[#3d99be]"
                value={make}
                onChange={(e) => setMake(e.target.value)}
              />
              <Input
                placeholder="Model (e.g., Focus)"
                className="w-full border-[#3d99be] focus:ring-[#3d99be]"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
              <Input
                placeholder="Year (e.g., 2020)"
                className="w-full border-[#3d99be] focus:ring-[#3d99be]"
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
            <Button 
              className="w-full bg-[#3d99be] hover:bg-[#2d7994] text-white"
              onClick={searchByVehicle}
              disabled={loading}
            >
              {loading ? "Searching..." : "Search Vehicle Glass"}
            </Button>
          </TabsContent>
        </Tabs>

        {availableGlass.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-[#3d99be]">Available Glass Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {availableGlass.map((glass, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                    <Car className="h-6 w-6 text-[#3d99be] mr-2" />
                    <CardTitle className="text-lg font-semibold">{glass.Make}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="font-medium">{glass.Description}</p>
                      <p className="text-sm text-gray-500">ARGIC: {glass.ArgicCode}</p>
                      <div className="flex justify-between">
                        <p className="font-medium">£{glass.Price.toFixed(2)}</p>
                        <p className="text-sm text-gray-500">Qty: {glass.Qty}</p>
                      </div>
                      <Button 
                        className="w-full bg-[#F97316] hover:bg-[#EA580C]"
                        onClick={() => checkAvailability(glass.ArgicCode)}
                        disabled={checkingEurocode === glass.ArgicCode && loading}
                      >
                        {checkingEurocode === glass.ArgicCode && loading ? "Checking..." : "Check Availability"}
                      </Button>
                      
                      {checkingEurocode === glass.ArgicCode && eurocodeResults.length > 0 && (
                        <div className="mt-2 p-2 bg-gray-50 rounded-md">
                          <p className="text-sm font-medium mb-1">Available at:</p>
                          <ul className="space-y-1">
                            {eurocodeResults.map((result, i) => (
                              <li key={i} className="text-sm flex items-center">
                                <Check className="h-4 w-4 text-green-500 mr-1" />
                                {getDepotName(result.depot)} ({result.qty})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {checkingEurocode === glass.ArgicCode && eurocodeResults.length === 0 && !loading && (
                        <div className="mt-2 p-2 bg-red-50 rounded-md">
                          <p className="text-sm flex items-center text-red-500">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            Not available at any depot
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {availableGlass.length === 0 && !loading && (
          <div className="text-center p-10 border border-dashed rounded-lg">
            <p className="text-gray-500">No glass products found. Please search to see results.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Glass;