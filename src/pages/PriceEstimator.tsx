import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Coins, ChevronRight, Car, MapPin, CalendarIcon, User, Phone as PhoneIcon, Mail } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { PriceBreakdownModal } from "@/components/pricing/PriceBreakdownModal";
import { calculateDistanceAndCost, isValidPostcode } from "@/services/distanceService";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { TimeSlotPicker } from "@/components/calendar/TimeSlotPicker";

type GlassType = 'windscreen' | 'rear' | 'side' | 'quarter' | 'vent';
type ColourTint = 'clear' | 'tinted' | 'privacy' | 'heated';

interface GlassFeatures {
  glassType: GlassType | null;
  hasSensor: boolean | null;
  hasCamera: boolean | null;
  hasADAS: boolean | null;
  colourTint: ColourTint | null;
}

const PriceEstimator = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  
  // Get vehicle data from URL params if available
  const vrn = searchParams.get('vrn') || '';
  const make = searchParams.get('make') || '';
  const model = searchParams.get('model') || '';
  const year = searchParams.get('year') || '';
  
  const [features, setFeatures] = useState<GlassFeatures>({
    glassType: null,
    hasSensor: null,
    hasCamera: null,
    hasADAS: null,
    colourTint: null,
  });

  // Location state (postcodes)
  const [customerPostcode, setCustomerPostcode] = useState('');
  const [technicianPostcode, setTechnicianPostcode] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [calculatingPrice, setCalculatingPrice] = useState(false);
  const [creatingJob, setCreatingJob] = useState(false);
  
  // Pricing state
  const [glassCost, setGlassCost] = useState<number | null>(null);
  const [labourCost, setLabourCost] = useState<number>(100);
  const [travelCost, setTravelCost] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [totalEstimate, setTotalEstimate] = useState<number>(0);
  const [glassDescription, setGlassDescription] = useState<string>('');

  // Car diagram state
  const [selectedWindows, setSelectedWindows] = useState<Set<string>>(new Set());
  const [hoverTooltip, setHoverTooltip] = useState<{ x: number; y: number; label: string } | null>(null);

  // Customer information dialog state
  const [isCustomerInfoOpen, setIsCustomerInfoOpen] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState<Date | undefined>(undefined);
  const [appointmentTime, setAppointmentTime] = useState<string>('');
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: ''
  });

  // Window regions for tooltips
  const regions = [
    { id: 'jqvmap1_ws', label: 'Windscreen', type: 'windscreen' as GlassType },
    { id: 'jqvmap1_rw', label: 'Rear Window', type: 'rear' as GlassType },
    { id: 'jqvmap1_df', label: "Driver's Front Door", type: 'side' as GlassType },
    { id: 'jqvmap1_dg', label: "Passenger's Front Door", type: 'side' as GlassType },
    { id: 'jqvmap1_dr', label: "Driver's Rear Door", type: 'side' as GlassType },
    { id: 'jqvmap1_dd', label: "Passenger's Rear Door", type: 'side' as GlassType },
    { id: 'jqvmap1_vf', label: "Driver's Front Vent", type: 'vent' as GlassType },
    { id: 'jqvmap1_vg', label: "Passenger's Rear Vent", type: 'vent' as GlassType },
    { id: 'jqvmap1_vp', label: "Passenger's Front Vent", type: 'vent' as GlassType },
    { id: 'jqvmap1_vr', label: "Driver's Rear Vent", type: 'vent' as GlassType },
    { id: 'jqvmap1_qr', label: "Driver's Rear Quarter Glass", type: 'quarter' as GlassType },
    { id: 'jqvmap1_qg', label: "Passenger's Rear Quarter Glass", type: 'quarter' as GlassType },
  ];

  // Handle window selection - auto-detect glass type
  const handleWindowClick = (windowId: string) => {
    const region = regions.find(r => r.id === windowId);
    if (!region) return;

    setSelectedWindows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(windowId)) {
        newSet.delete(windowId);
        // If no windows selected, clear glass type
        if (newSet.size === 0) {
          setFeatures({ ...features, glassType: null });
        }
      } else {
        // Clear previous selections and select only this window
        newSet.clear();
        newSet.add(windowId);
        // Set the glass type based on selected window
        setFeatures({ ...features, glassType: region.type });
      }
      return newSet;
    });
  };

  // Handle mouse move for tooltip
  const handleMouseMove = (e: React.MouseEvent<SVGPathElement>, label: string) => {
    setHoverTooltip({
      x: e.clientX,
      y: e.clientY,
      label
    });
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!features.glassType) {
      toast({
        title: "Selection Required",
        description: "Please select a glass type to continue.",
        variant: "destructive",
      });
      return;
    }

    if (!features.colourTint) {
      toast({
        title: "Selection Required",
        description: "Please select a colour/tint option.",
        variant: "destructive",
      });
      return;
    }

    // For windscreens, validate feature selections
    if (features.glassType === 'windscreen') {
      if (features.hasSensor === null || features.hasCamera === null || features.hasADAS === null) {
        toast({
          title: "Selection Required",
          description: "Please answer all windscreen feature questions.",
          variant: "destructive",
        });
        return;
      }
    }

    // Validate postcodes
    if (!customerPostcode.trim()) {
      toast({
        title: "Postcode Required",
        description: "Please enter the customer's postcode.",
        variant: "destructive",
      });
      return;
    }

    if (!technicianPostcode.trim()) {
      toast({
        title: "Postcode Required",
        description: "Please enter your postcode.",
        variant: "destructive",
      });
      return;
    }

    // Validate postcode format
    if (!isValidPostcode(customerPostcode)) {
      toast({
        title: "Invalid Postcode",
        description: "Please enter a valid UK postcode format for the customer.",
        variant: "destructive",
      });
      return;
    }

    if (!isValidPostcode(technicianPostcode)) {
      toast({
        title: "Invalid Postcode",
        description: "Please enter a valid UK postcode format for your location.",
        variant: "destructive",
      });
      return;
    }

    // Show modal and start calculating
    setShowModal(true);
    setCalculatingPrice(true);

    try {
      // 1. Fetch technician's labour rate
      let fetchedLabourRate = 100; // Default
      if (user?.id) {
        const { data: techData } = await supabase
          .from('technicians')
          .select('labor_rate')
          .eq('id', user.id)
          .single();

        if (techData && techData.labor_rate) {
          fetchedLabourRate = techData.labor_rate;
        } else {
          // Try app_users as fallback
          const { data: userData } = await supabase
            .from('app_users')
            .select('labor_rate')
            .eq('id', user.id)
            .single();

          if (userData && userData.labor_rate) {
            fetchedLabourRate = userData.labor_rate;
          }
        }
      }
      setLabourCost(fetchedLabourRate);

      // 2. Calculate distance and travel cost
      const distanceResult = await calculateDistanceAndCost(
        technicianPostcode.trim(),
        customerPostcode.trim()
      );

      if (distanceResult.error || distanceResult.distance === null) {
        throw new Error(distanceResult.error || 'Failed to calculate distance');
      }

      setDistance(distanceResult.distance);
      setTravelCost(distanceResult.travelCost || 0);

      // 3. Get glass price - For now, use mock pricing based on glass type
      // TODO: Integrate with actual Glass API when ARGIC codes are mapped
      let mockGlassCost = 0;
      let description = '';

      switch (features.glassType) {
        case 'windscreen':
          mockGlassCost = 250;
          if (features.hasSensor) mockGlassCost += 50;
          if (features.hasCamera) mockGlassCost += 75;
          if (features.hasADAS) mockGlassCost += 100;
          description = `Windscreen${features.hasSensor ? ' with sensor' : ''}${features.hasCamera ? ' with camera' : ''}${features.hasADAS ? ' with ADAS' : ''}`;
          break;
        case 'rear':
          mockGlassCost = 180;
          description = 'Rear Window';
          break;
        case 'side':
          mockGlassCost = 120;
          description = 'Side Window';
          break;
        case 'quarter':
          mockGlassCost = 100;
          description = 'Quarter Glass';
          break;
        case 'vent':
          mockGlassCost = 80;
          description = 'Vent Window';
          break;
      }

      // Adjust for colour/tint
      if (features.colourTint === 'tinted') mockGlassCost += 20;
      if (features.colourTint === 'privacy') mockGlassCost += 40;
      if (features.colourTint === 'heated') mockGlassCost += 60;

      description += ` (${features.colourTint})`;

      setGlassCost(mockGlassCost);
      setGlassDescription(description);

      // 4. Calculate total
      const total = mockGlassCost + fetchedLabourRate + (distanceResult.travelCost || 0);
      setTotalEstimate(total);

    } catch (error) {
      console.error('Error calculating price:', error);
      toast({
        title: "Calculation Error",
        description: error instanceof Error ? error.message : "Failed to calculate price estimate",
        variant: "destructive",
      });
      setShowModal(false);
    } finally {
      setCalculatingPrice(false);
    }
  };

  const handleCreateJob = () => {
    // Close price breakdown modal and open customer info dialog
    setShowModal(false);
    setIsCustomerInfoOpen(true);
  };

  const handleCreateLead = async () => {
    // Validate mandatory fields
    if (!customerInfo.firstName.trim() || !customerInfo.lastName.trim() || !customerInfo.phone.trim()) {
      toast({
        title: "Required Information",
        description: "Please provide customer's first name, last name, and phone number.",
        variant: "destructive",
      });
      return;
    }

    if (!appointmentDate) {
      toast({
        title: "Appointment Date Required",
        description: "Please select an appointment date.",
        variant: "destructive",
      });
      return;
    }

    if (!appointmentTime) {
      toast({
        title: "Time Slot Required",
        description: "Please select a time slot for the appointment.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a lead.",
        variant: "destructive",
      });
      return;
    }

    setCreatingJob(true);

    try {
      // 1. Get technician ID
      let technicianId = null;
      const { data: techData1, error: techError1 } = await supabase
        .from('technicians')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (techData1) {
        technicianId = techData1.id;
      } else {
        // Try by email for Google OAuth users
        const { data: techData2, error: techError2 } = await supabase
          .from('technicians')
          .select('id')
          .eq('contact_email', user.email)
          .single();
        
        if (techData2) {
          technicianId = techData2.id;
        }
      }

      if (!technicianId) {
        throw new Error('Technician profile not found. Please ensure your profile is set up correctly.');
      }

      // Generate unique quote ID
      const generateQuoteId = () => {
        const timestamp = Date.now().toString(36).toUpperCase();
        const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
        return `WC-${timestamp}-${randomStr}`;
      };

      const quoteId = generateQuoteId();

      // 2. Create lead in leads table
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .insert([{
          quote_id: quoteId,
          name: `${customerInfo.firstName.trim()} ${customerInfo.lastName.trim()}`,
          first_name: customerInfo.firstName.trim(),
          last_name: customerInfo.lastName.trim(),
          full_name: `${customerInfo.firstName.trim()} ${customerInfo.lastName.trim()}`,
          phone: customerInfo.phone.trim(),
          email: customerInfo.email.trim() || null,
          address: customerInfo.address.trim() || null,
          postcode: customerPostcode.trim().toUpperCase(),
          vrn: vrn || null,
          make: make || null,
          model: model || null,
          year: year || null,
          glass_type: features.glassType || 'windscreen',
          glass_description: glassDescription || null,
          service_type: 'Glass Replacement',
          estimated_price: totalEstimate || 0,
          quote_price: totalEstimate || 0,
          credits_cost: 1,
          status: 'new',
          source: 'price_estimator',
          assigned_technician_id: null,
          appointment_date: format(appointmentDate, 'yyyy-MM-dd'),
          time_slot: appointmentTime,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (leadError || !leadData) {
        console.error('Lead creation error:', leadError);
        throw new Error('Failed to create lead');
      }

      // 3. Create lead_purchase record to make it appear in Jobs
      const { error: purchaseError } = await supabase
        .from('lead_purchases')
        .insert([{
          lead_id: leadData.id,
          technician_id: technicianId,
          purchased_at: new Date().toISOString(),
          credits_paid: 0, // No credits paid for self-created leads
          converted_to_job_id: null
        }]);

      if (purchaseError) {
        console.error('Lead purchase record creation error:', purchaseError);
        // Don't throw - the lead was created successfully
      }

      toast({
        title: "Lead Created Successfully!",
        description: `A new lead for ${customerInfo.firstName} ${customerInfo.lastName} has been created and added to your Jobs.`,
      });

      setIsCustomerInfoOpen(false);
      setCreatingJob(false);
      
      // Navigate to Jobs page to view the lead
      setTimeout(() => {
        navigate('/jobs', { state: { tab: 'leads' } });
      }, 1500);

    } catch (error) {
      console.error('Error creating lead:', error);
      toast({
        title: "Lead Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create lead",
        variant: "destructive",
      });
      setCreatingJob(false);
    }
  };

  const handleEditDetails = () => {
    setShowModal(false);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-[#0FB8C1]/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-700" />
        </div>

        {/* Modern Header */}
        <div className="relative backdrop-blur-xl bg-white/80 border border-gray-200/50 shadow-sm rounded-3xl m-4">
          <div className="px-6 py-10">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <div className="w-1 h-10 bg-gradient-to-b from-[#0FB8C1] via-[#0FB8C1]/70 to-transparent rounded-full" />
                    <h1 className="text-4xl font-light tracking-tight text-gray-900">
                      Price Estimator<span className="text-[#0FB8C1] font-normal">.</span>
                    </h1>
                  </div>
                  <p className="text-gray-600 text-base font-light ml-5 tracking-wide">
                    Get detailed pricing by specifying glass features
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-8 pb-20 max-w-4xl mx-auto relative z-10">
          {/* Vehicle Info Card (if available) */}
          {vrn && (
            <Card className="shadow-lg mb-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Car className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Vehicle</p>
                    <p className="text-lg font-bold text-gray-900">
                      {vrn} {make && model && `- ${make} ${model}`} {year && `(${year})`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Form Card */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Glass Specifications</CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Please provide details about the glass you need
              </p>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Car Diagram for Glass Selection */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold text-gray-900">
                  Select the glass you need
                </Label>
                <p className="text-sm text-gray-600">Click on the window you want to price</p>
                
                {/* Car SVG Diagram */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
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

                  {/* Selected Window Summary */}
                  {selectedWindows.size > 0 && (
                    <div className="mt-4 p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
                      <p className="text-sm font-semibold text-cyan-900">
                        Selected: {Array.from(selectedWindows).map(windowId => {
                          const region = regions.find(r => r.id === windowId);
                          return region?.label || windowId;
                        }).join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Windscreen Features (only shown if windscreen is selected) */}
              {features.glassType === 'windscreen' && (
                <div className="space-y-6 p-6 bg-blue-50 rounded-xl border border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-900">Windscreen Features</h3>
                  
                  {/* Rain Sensor */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium text-gray-900">
                      Does the windscreen have a rain sensor?
                    </Label>
                    <RadioGroup
                      value={features.hasSensor === null ? '' : String(features.hasSensor)}
                      onValueChange={(value) => setFeatures({ ...features, hasSensor: value === 'true' })}
                    >
                      <div className="flex gap-4">
                        <div
                          className={cn(
                            "flex-1 border-2 rounded-lg p-3 cursor-pointer transition-all",
                            features.hasSensor === true
                              ? "border-[#145484] bg-white"
                              : "border-gray-300 hover:border-gray-400"
                          )}
                          onClick={() => setFeatures({ ...features, hasSensor: true })}
                        >
                          <RadioGroupItem value="true" id="sensor-yes" className="sr-only" />
                          <Label htmlFor="sensor-yes" className="cursor-pointer text-center block font-semibold">
                            Yes
                          </Label>
                        </div>
                        <div
                          className={cn(
                            "flex-1 border-2 rounded-lg p-3 cursor-pointer transition-all",
                            features.hasSensor === false
                              ? "border-[#145484] bg-white"
                              : "border-gray-300 hover:border-gray-400"
                          )}
                          onClick={() => setFeatures({ ...features, hasSensor: false })}
                        >
                          <RadioGroupItem value="false" id="sensor-no" className="sr-only" />
                          <Label htmlFor="sensor-no" className="cursor-pointer text-center block font-semibold">
                            No
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Camera */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium text-gray-900">
                      Does the windscreen have a camera?
                    </Label>
                    <RadioGroup
                      value={features.hasCamera === null ? '' : String(features.hasCamera)}
                      onValueChange={(value) => setFeatures({ ...features, hasCamera: value === 'true' })}
                    >
                      <div className="flex gap-4">
                        <div
                          className={cn(
                            "flex-1 border-2 rounded-lg p-3 cursor-pointer transition-all",
                            features.hasCamera === true
                              ? "border-[#145484] bg-white"
                              : "border-gray-300 hover:border-gray-400"
                          )}
                          onClick={() => setFeatures({ ...features, hasCamera: true })}
                        >
                          <RadioGroupItem value="true" id="camera-yes" className="sr-only" />
                          <Label htmlFor="camera-yes" className="cursor-pointer text-center block font-semibold">
                            Yes
                          </Label>
                        </div>
                        <div
                          className={cn(
                            "flex-1 border-2 rounded-lg p-3 cursor-pointer transition-all",
                            features.hasCamera === false
                              ? "border-[#145484] bg-white"
                              : "border-gray-300 hover:border-gray-400"
                          )}
                          onClick={() => setFeatures({ ...features, hasCamera: false })}
                        >
                          <RadioGroupItem value="false" id="camera-no" className="sr-only" />
                          <Label htmlFor="camera-no" className="cursor-pointer text-center block font-semibold">
                            No
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* ADAS */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium text-gray-900">
                      Does the vehicle have ADAS (Advanced Driver Assistance Systems)?
                    </Label>
                    <p className="text-sm text-gray-600">
                      Examples: Lane departure warning, automatic braking, adaptive cruise control
                    </p>
                    <RadioGroup
                      value={features.hasADAS === null ? '' : String(features.hasADAS)}
                      onValueChange={(value) => setFeatures({ ...features, hasADAS: value === 'true' })}
                    >
                      <div className="flex gap-4">
                        <div
                          className={cn(
                            "flex-1 border-2 rounded-lg p-3 cursor-pointer transition-all",
                            features.hasADAS === true
                              ? "border-[#145484] bg-white"
                              : "border-gray-300 hover:border-gray-400"
                          )}
                          onClick={() => setFeatures({ ...features, hasADAS: true })}
                        >
                          <RadioGroupItem value="true" id="adas-yes" className="sr-only" />
                          <Label htmlFor="adas-yes" className="cursor-pointer text-center block font-semibold">
                            Yes
                          </Label>
                        </div>
                        <div
                          className={cn(
                            "flex-1 border-2 rounded-lg p-3 cursor-pointer transition-all",
                            features.hasADAS === false
                              ? "border-[#145484] bg-white"
                              : "border-gray-300 hover:border-gray-400"
                          )}
                          onClick={() => setFeatures({ ...features, hasADAS: false })}
                        >
                          <RadioGroupItem value="false" id="adas-no" className="sr-only" />
                          <Label htmlFor="adas-no" className="cursor-pointer text-center block font-semibold">
                            No
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              )}

              {/* Colour/Tint Selection (for all glass types) */}
              {features.glassType && (
                <div className="space-y-4">
                  <Label className="text-lg font-semibold text-gray-900">
                    What colour/tint is the glass?
                  </Label>
                  <RadioGroup
                    value={features.colourTint || ''}
                    onValueChange={(value) => setFeatures({ ...features, colourTint: value as ColourTint })}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { value: 'clear', label: 'Clear', description: 'Standard transparent glass' },
                        { value: 'tinted', label: 'Tinted', description: 'Lightly tinted glass' },
                        { value: 'privacy', label: 'Privacy Glass', description: 'Dark tinted glass' },
                        { value: 'heated', label: 'Heated', description: 'Glass with heating elements' },
                      ].map((option) => (
                        <div
                          key={option.value}
                          className={cn(
                            "relative border-2 rounded-xl p-4 cursor-pointer transition-all duration-200",
                            features.colourTint === option.value
                              ? "border-[#145484] bg-blue-50"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          )}
                          onClick={() => setFeatures({ ...features, colourTint: option.value as ColourTint })}
                        >
                          <RadioGroupItem value={option.value} id={`tint-${option.value}`} className="sr-only" />
                          <Label htmlFor={`tint-${option.value}`} className="cursor-pointer">
                            <div className="font-semibold text-gray-900 mb-1">{option.label}</div>
                            <div className="text-sm text-gray-600">{option.description}</div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* Location Fields */}
              {features.glassType && features.colourTint && (
                <div className="space-y-6 p-6 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Location Details</h3>
                  </div>
                  
                  {/* Customer Postcode */}
                  <div className="space-y-3">
                    <Label htmlFor="customerPostcode" className="text-base font-medium text-gray-900">
                      Customer Postcode
                    </Label>
                    <Input
                      id="customerPostcode"
                      type="text"
                      placeholder="e.g., SW1A 1AA"
                      value={customerPostcode}
                      onChange={(e) => setCustomerPostcode(e.target.value.toUpperCase())}
                      className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                      maxLength={8}
                    />
                    <p className="text-sm text-gray-600">
                      Customer's postcode for service location
                    </p>
                  </div>

                  {/* Technician Postcode */}
                  <div className="space-y-3">
                    <Label htmlFor="technicianPostcode" className="text-base font-medium text-gray-900">
                      Your Postcode
                    </Label>
                    <Input
                      id="technicianPostcode"
                      type="text"
                      placeholder="e.g., NW1 6XE"
                      value={technicianPostcode}
                      onChange={(e) => setTechnicianPostcode(e.target.value.toUpperCase())}
                      className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                      maxLength={8}
                    />
                    <p className="text-sm text-gray-600">
                      Your base postcode for travel calculation
                    </p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-6">
                <Button
                  variant="ghost"
                  onClick={handleSubmit}
                  className="w-full h-16 bg-[#FFC107] hover:bg-[#e6ad06] text-black text-xl font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                >
                  Get Price Estimate
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Price Breakdown Modal */}
      <PriceBreakdownModal
        open={showModal}
        onOpenChange={setShowModal}
        loading={calculatingPrice}
        glassCost={glassCost}
        glassDescription={glassDescription}
        labourCost={labourCost}
        travelCost={travelCost}
        distance={distance}
        totalEstimate={totalEstimate}
        onCreateJob={handleCreateJob}
        onEditDetails={handleEditDetails}
        creatingJob={creatingJob}
      />

      {/* Customer Information Dialog */}
      <Dialog open={isCustomerInfoOpen} onOpenChange={setIsCustomerInfoOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Customer & Appointment Details</DialogTitle>
            <DialogDescription>
              Please provide customer information and select an appointment date to create the lead.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Customer Name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  First Name *
                </Label>
                <Input
                  id="firstName"
                  value={customerInfo.firstName}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, firstName: e.target.value })}
                  placeholder="John"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Last Name *
                </Label>
                <Input
                  id="lastName"
                  value={customerInfo.lastName}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, lastName: e.target.value })}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <PhoneIcon className="h-4 w-4" />
                Phone Number *
              </Label>
              <Input
                id="phone"
                type="tel"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                placeholder="07123 456789"
                required
              />
            </div>

            {/* Email (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address (Optional)
              </Label>
              <Input
                id="email"
                type="email"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                placeholder="john.doe@example.com"
              />
            </div>

            {/* Address (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address (Optional)
              </Label>
              <Input
                id="address"
                value={customerInfo.address}
                onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                placeholder="123 Main Street, London"
              />
            </div>

            {/* Appointment Date */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Appointment Date *
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !appointmentDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {appointmentDate ? format(appointmentDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white" align="start">
                  <Calendar
                    mode="single"
                    selected={appointmentDate}
                    onSelect={(date) => {
                      setAppointmentDate(date);
                      setAppointmentTime(''); // Reset time when date changes
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Slot Picker - Only show when date is selected */}
            {appointmentDate && (
              <div className="mt-4">
                <TimeSlotPicker
                  selectedDate={appointmentDate}
                  selectedTime={appointmentTime}
                  onTimeSelect={setAppointmentTime}
                />
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              * Required fields
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsCustomerInfoOpen(false);
                setShowModal(true);
              }}
              disabled={creatingJob}
            >
              Back to Price
            </Button>
            <Button
              onClick={handleCreateLead}
              disabled={creatingJob}
              className="bg-[#FFC107] hover:bg-[#e6ad06] text-black"
            >
              {creatingJob ? "Creating Lead..." : "Create Lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default PriceEstimator;

