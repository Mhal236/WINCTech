import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BookingForm } from "@/components/booking/BookingForm";
import { ShoppingCart } from "lucide-react";
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

interface CompanyQuote {
  company: string;
  price: number;
  estimatedTimeDelivery: string;
  estimatedTimePickup: string;
  argicCode?: string;
}

interface GlassSelection {
  type: string;
  quantity: number;
}

interface VehicleDetails {
  make: string;
  model: string;
  year: string;
}

const PriceLookup = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const jobId = searchParams.get('jobId');
  const damageType = searchParams.get('damage');
  const vehicleInfo = searchParams.get('vrn');
  const isScheduleTab = location.search.includes('tab=schedule');
  const [vrn, setVrn] = useState("");
  const [glassSelections, setGlassSelections] = useState<GlassSelection[]>([]);
  const [quotes, setQuotes] = useState<CompanyQuote[]>([]);
  const [showQuotes, setShowQuotes] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<CompanyQuote | null>(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const { toast } = useToast();
  const [vehicleDetails, setVehicleDetails] = useState<VehicleDetails>({
    make: '',
    model: '',
    year: ''
  });

  useEffect(() => {
    if (jobId && damageType && vehicleInfo) {
      // Set the initial vehicle and damage information
      setVrn(vehicleInfo);
      setGlassSelections([{
        type: damageType,
        quantity: 1
      }]);
      
      // Trigger vehicle data fetch
      fetchVehicleData();
    }
  }, [jobId, damageType, vehicleInfo]);

  const fetchVehicleData = async () => {
    if (!vrn.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter a valid registration number.",
        variant: "destructive",
      });
      return;
    }
    try {
      console.log(`Fetching vehicle data for VRN: ${vrn.trim()}`);
      
      // Use secure server endpoint that handles the API call
      const response = await fetch(`/api/vehicle/${vrn.trim()}`);
      
      // Log response status for debugging
      console.log(`Vehicle API response status: ${response.status}`);
      
      // Check if response is JSON or text to better handle errors
      const contentType = response.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");
      
      if (!response.ok) {
        let errorMessage = "Unknown error";
        
        try {
          if (isJson) {
            const errorData = await response.json();
            console.error("API error response:", errorData);
            errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
          } else {
            errorMessage = await response.text();
            console.error("API error text:", errorMessage);
          }
        } catch (e) {
          errorMessage = `Failed to parse error (${response.status})`;
        }
        
        throw new Error(`API request failed: ${errorMessage}`);
      }
      
      if (!isJson) {
        console.warn("API did not return JSON content");
        const text = await response.text();
        console.log("API response text:", text);
        throw new Error("Vehicle API did not return JSON data");
      }
      
      const data = await response.json();
      console.log("Vehicle data received:", data);
      
      // Try to handle different response formats
      let vehicleData;
      
      if (data && data.make) {
        // Direct format
        vehicleData = data;
      } else if (data?.Response?.DataItems?.VehicleRegistration) {
        // API original format
        const reg = data.Response.DataItems.VehicleRegistration;
        vehicleData = {
          make: reg.Make || "",
          model: reg.Model || "",
          year: reg.YearOfManufacture || ""
        };
      } else {
        console.error("Could not find vehicle data in response:", data);
        throw new Error("Vehicle data not found in API response");
      }
      
      setVehicleDetails(vehicleData);
      toast({ title: "Vehicle data loaded successfully" });
    } catch (error: any) {
      console.error("Vehicle data fetch error:", error);
      toast({
        title: "Error fetching vehicle data",
        description: error.message || "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const handleQuoteSelection = (quote: CompanyQuote) => {
    setSelectedQuote(quote);
    setIsConfirmationOpen(true);
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

  const addGlassSelection = () => {
    setGlassSelections(prev => [...prev, { type: "", quantity: 1 }]);
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

  const removeGlassSelection = (index: number) => {
    setGlassSelections(prev => prev.filter((_, i) => i !== index));
  };

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vrn.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid VRN.",
        variant: "destructive",
      });
      return;
    }

    if (!vehicleDetails.make || !vehicleDetails.model || !vehicleDetails.year) {
      await fetchVehicleData();
    }

    if (
      !vrn.trim() ||
      glassSelections.length === 0 ||
      glassSelections.some(s => !s.type) ||
      !vehicleDetails.make ||
      !vehicleDetails.model ||
      !vehicleDetails.year
    ) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const baseQuotes: CompanyQuote[] = [
      {
        company: "Windscreen (Sensor)",
        price: 79.99,
        estimatedTimeDelivery: "2-3 days",
        estimatedTimePickup: "Pickup: Same Day ",
        argicCode: "2448AGNMV1B"
      },
      {
        company: "Windscreen (Sensor)",
        price: 99.99,
        estimatedTimeDelivery: "2-3 days",
        estimatedTimePickup: "Delivery: Next Day",
        argicCode: "2448AGNMV1B"
      }
    ];

    const totalQuantity = glassSelections.reduce((sum, selection) => sum + selection.quantity, 0);

    const mockQuotes = baseQuotes.map(quote => ({
      ...quote,
      price: quote.price * totalQuantity
    }));

    setQuotes(mockQuotes);
    setShowQuotes(true);
    
    toast({
      title: "Quote Request Submitted",
      description: "Here are your available options",
    });
  };

  const [sortBy, setSortBy] = useState<'price'>('price');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const sortQuotes = (quotes: CompanyQuote[]) => {
    return [...quotes].sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1;
      return (a.price - b.price) * multiplier;
    });
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
                      <span className="text-[#ffc107] font-semibold">
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
                        onBlur={fetchVehicleData}
                        placeholder="e.g., AB12 CDE"
                        className="w-full input-focus border-[#135084]/20 transition-all duration-200"
                      />
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
                      
                      {glassSelections.map((selection, index) => (
                        <div key={index} className="space-y-4 p-4 border border-[#135084]/20 rounded-lg bg-white/50">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium text-[#135084]">Glass Selection {index + 1}</h4>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => removeGlassSelection(index)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              Remove
                            </Button>
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <Select 
                                value={selection.type}
                                onValueChange={(value) => updateGlassSelection(index, 'type', value)}
                              >
                                <SelectTrigger className="w-full bg-white input-focus border-[#135084]/20">
                                  <SelectValue placeholder="Select window location" />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                  <SelectItem value="Windscreen">Windscreen (Front)</SelectItem>
                                  <SelectItem value="rear-window">Rear Window</SelectItem>
                                  <SelectItem value="driver-front">Driver's Front Window</SelectItem>
                                  <SelectItem value="passenger-front">Passenger's Front Window</SelectItem>
                                  <SelectItem value="driver-rear">Driver's Rear Window</SelectItem>
                                  <SelectItem value="passenger-rear">Passenger's Rear Window</SelectItem>
                                  <SelectItem value="sunroof">Sunroof</SelectItem>
                                  <SelectItem value="quarter-glass">Quarter Glass</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Input
                                type="number"
                                min="1"
                                value={selection.quantity}
                                onChange={(e) => updateGlassSelection(index, 'quantity', parseInt(e.target.value) || 1)}
                                placeholder="Quantity"
                                className="w-full input-focus border-[#135084]/20"
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      {glassSelections.length === 0 && (
                        <div className="text-center p-6 border border-dashed border-[#135084]/20 rounded-lg">
                          <p className="text-gray-500">Click 'Add Glass' to start your quote</p>
                        </div>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-[#135084] hover:bg-[#0e3b61] text-white shadow-xl hover:shadow-2xl transition-all duration-300 text-lg py-6"
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
                            <h3 className="font-semibold text-xl text-gray-900">{quote.company}</h3>
                            <div className="text-right">
                              <span className="text-2xl font-bold text-[#135084]">
                                £{quote.price.toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                            <span>{quote.estimatedTimePickup}</span>
                            {quote.argicCode && (
                              <>
                                <span>ARGIC:</span>
                                <span>{quote.argicCode}</span>
                              </>
                            )}
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
              <AlertDialogDescription className="text-gray-600 space-y-6">
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
                          <div className="flex justify-between items-center">
                            <p className="font-medium">Glass Type:</p>
                            <span className="text-[#135084] font-semibold">{selectedQuote.company}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="font-medium">Vehicle Registration:</p>
                            <span className="text-[#135084] font-semibold">{vrn}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="font-medium">Estimated Delivery:</p>
                            <span className="text-[#135084] font-semibold">{selectedQuote.estimatedTimeDelivery}</span>
                          </div>
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
            <span className="text-[#ffc107] font-semibold">
              Master Auto Glass
            </span>
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PriceLookup;