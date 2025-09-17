import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, PoundSterling, MapPin, Car, Info, Calendar, Phone, Shield, AlertCircle, CheckCircle2, Loader2, Zap } from "lucide-react";

export interface JobData {
  id: string;
  quote_id?: string;
  full_name: string;
  email?: string;
  mobile?: string;
  vehicle_reg: string;
  brand?: string;
  model?: string;
  year?: string;
  colour?: string;
  type?: string;
  style?: string;
  door?: string;
  quote_price?: number;
  status?: string;
  appointment_date?: string;
  time_slot?: string;
  location?: string;
  postcode?: string;
  incident_date?: string;
  insurance_provider?: string;
  policy_number?: string;
  policy_excess?: string;
  policy_expiry?: string;
  selected_windows?: any[];
  window_damage?: any[];
  window_spec?: any[];
  argic_code?: string;
  payment_option?: string;
  service_type?: string;
  glass_type?: string;
  technician_id?: string;
  technician_name?: string;
  duration?: string;
  otr_price?: number;
  adas_calibration?: string;
  delivery_type?: string;
  glass_color?: any;
  timeline?: string;
  damage_images?: string[];
  created_at?: string;
  updated_at?: string;
}

interface JobCardProps {
  job: JobData;
  onAccept: (job: JobData) => void;
  isAccepted?: boolean;
  isAccepting?: boolean;
  showCredits?: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({ 
  job, 
  onAccept, 
  isAccepted = false, 
  isAccepting = false,
  showCredits = false
}) => {
  // Helper function to safely parse JSON fields from Supabase
  const parseJsonField = (field: any): any[] => {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    if (typeof field === 'string') {
      try {
        const parsed = JSON.parse(field);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  // Helper function to extract glass codes from selected_windows array structure
  const extractGlassCodesFromWindows = (selectedWindows: any[]): string[] => {
    const codes: string[] = [];
    selectedWindows.forEach(window => {
      if (Array.isArray(window)) {
        // Handle nested arrays like [["jqvmap1_ws"]]
        window.forEach(item => {
          if (typeof item === 'string') {
            codes.push(item);
          }
        });
      } else if (typeof window === 'string') {
        codes.push(window);
      }
    });
    return codes;
  };

  // Helper function to extract damage info from window_damage array structure
  const extractDamageInfo = (windowDamage: any[]): Array<{code: string, damageType: string}> => {
    const damageInfo: Array<{code: string, damageType: string}> = [];
    windowDamage.forEach(damage => {
      if (typeof damage === 'object' && damage !== null) {
        // Handle objects like {"jqvmap1_ws":"Scratched"}
        Object.entries(damage).forEach(([code, damageType]) => {
          damageInfo.push({ code, damageType: damageType as string });
        });
      }
    });
    return damageInfo;
  };
  // Helper function to convert glass type codes to readable names
  const getGlassTypeName = (type: string): string => {
    if (!type) return '';
    
    // Handle glass codes that end with specific patterns
    if (type.includes('_ws') || type.toLowerCase().includes('windscreen')) {
      return 'Windscreen';
    }
    if (type.includes('_rw') || type.toLowerCase().includes('rear')) {
      return 'Rear Window';
    }
    if (type.includes('_df') || type.toLowerCase().includes('driver') && type.toLowerCase().includes('front')) {
      return "Driver's Front Window";
    }
    if (type.includes('_pf') || type.toLowerCase().includes('passenger') && type.toLowerCase().includes('front')) {
      return "Passenger's Front Window";
    }
    if (type.includes('_dr') || type.toLowerCase().includes('driver') && type.toLowerCase().includes('rear')) {
      return "Driver's Rear Window";
    }
    if (type.includes('_pr') || type.toLowerCase().includes('passenger') && type.toLowerCase().includes('rear')) {
      return "Passenger's Rear Window";
    }
    
    // Handle standard type names
    switch (type) {
      case 'Windscreen':
        return 'Windscreen';
      case 'rear-window':
        return 'Rear Window';
      case 'driver-front':
        return "Driver's Front Window";
      case 'passenger-front':
        return "Passenger's Front Window";
      case 'driver-rear':
        return "Driver's Rear Window";
      case 'passenger-rear':
        return "Passenger's Rear Window";
      default:
        return type;
    }
  };
  // Normalize Supabase window_spec which can be array of arrays of strings
  const getSpecStrings = (spec: any): string[] => {
    try {
      if (!spec) return [];
      const flattenDeep = (arr: any[]): any[] => arr.reduce((acc: any[], val: any) => (
        Array.isArray(val) ? acc.concat(flattenDeep(val)) : acc.concat(val)
      ), []);
      let items: any[] = Array.isArray(spec) ? flattenDeep(spec) : [spec];
      const mapped = items.map((it: any) => {
        if (typeof it === 'string') return it;
        if (typeof it === 'object' && it !== null) return it.label || it.name || it.value || '';
        return String(it ?? '');
      }).filter(Boolean);
      return [...new Set(mapped)];
    } catch {
      return [];
    }
  };
  const getVehicleDisplay = () => {
    const parts = [job.year, job.brand, job.model].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'Vehicle information not available';
  };

  const formatPrice = (price: number | null | undefined) => {
    if (price == null) return 'Quote Required';
    return `£${price.toFixed(2)}`;
  };

  const calculateCreditCost = (price: number | null | undefined) => {
    if (price == null) return 0;
    // Simply multiply the quoted price by 0.1 and round to nearest whole number
    return Math.round(price * 0.1);
  };

  const formatCredits = (price: number | null | undefined) => {
    if (price == null) return 'Credits Required';
    const credits = calculateCreditCost(price);
    return `${credits}`;
  };

  // Map spec strings to subtle color classes
  const getChipClasses = (label: string): string => {
    const l = (label || '').toLowerCase();
    // Glass type specific colors
    if (l === 'oee') return 'bg-green-100 text-green-800 border border-green-200';
    if (l === 'oem') return 'bg-blue-100 text-blue-800 border border-blue-200';
    // Other specifications
    if (l.includes('sensor') || l.includes('rain') || l.includes('camera')) return 'bg-blue-100 text-blue-800 border border-blue-200';
    if (l.includes('heated') || l.includes('heat')) return 'bg-amber-100 text-amber-800 border border-amber-200';
    if (l.includes('aerial') || l.includes('antenna')) return 'bg-purple-100 text-purple-800 border border-purple-200';
    if (l.includes('privacy') || l.includes('tint')) return 'bg-slate-200 text-slate-800 border border-slate-300';
    if (l.includes('acoustic') || l.includes('solar')) return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
    if (l.includes('adas') || l.includes('calibration')) return 'bg-rose-100 text-rose-800 border border-rose-200';
    return 'bg-gray-100 text-gray-800 border border-gray-200';
  };

  const getPriorityColor = (timeline?: string, appointmentDate?: string) => {
    if (!timeline) return 'bg-gray-100 text-gray-800';
    
    // Check if appointment is same day or next day
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const isUrgent = appointmentDate ? (() => {
      const apptDate = new Date(appointmentDate);
      const apptDateOnly = new Date(apptDate.getFullYear(), apptDate.getMonth(), apptDate.getDate());
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const tomorrowOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
      
      return apptDateOnly.getTime() === todayOnly.getTime() || apptDateOnly.getTime() === tomorrowOnly.getTime();
    })() : false;
    
    const timelineLower = timeline.toLowerCase();
    
    // Only show urgent/ASAP if appointment is today or tomorrow
    if ((timelineLower.includes('urgent') || timelineLower.includes('asap') || timelineLower.includes('today')) && isUrgent) {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    if (timelineLower.includes('tomorrow') || timelineLower.includes('soon')) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getStatusColor = (status?: string) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    const statusLower = status.toLowerCase();
    if (statusLower === 'quoted') return 'bg-blue-100 text-blue-800 border-blue-200';
    if (statusLower === 'assigned') return 'bg-purple-100 text-purple-800 border-purple-200';
    if (statusLower === 'in_progress') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (statusLower === 'completed') return 'bg-green-100 text-green-800 border-green-200';
    return 'bg-gray-100 text-gray-800';
  };

  const getUrgencyIcon = (timeline?: string, appointmentDate?: string) => {
    if (!timeline) return <Clock className="w-4 h-4 text-gray-500" />;
    
    // Check if appointment is same day or next day
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const isUrgent = appointmentDate ? (() => {
      const apptDate = new Date(appointmentDate);
      const apptDateOnly = new Date(apptDate.getFullYear(), apptDate.getMonth(), apptDate.getDate());
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const tomorrowOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
      
      return apptDateOnly.getTime() === todayOnly.getTime() || apptDateOnly.getTime() === tomorrowOnly.getTime();
    })() : false;
    
    const timelineLower = timeline.toLowerCase();
    
    // Only show urgent icon if appointment is today or tomorrow
    if ((timelineLower.includes('urgent') || timelineLower.includes('asap') || timelineLower.includes('today')) && isUrgent) {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
    if (timelineLower.includes('tomorrow') || timelineLower.includes('soon')) {
      return <Clock className="w-4 h-4 text-yellow-500" />;
    }
    return <Clock className="w-4 h-4 text-green-500" />;
  };

  return (
    <Card className="group relative overflow-hidden border border-gray-100/50 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 bg-white">
      {/* Priority Indicator */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${(() => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        
        const isUrgent = job.appointment_date ? (() => {
          const apptDate = new Date(job.appointment_date);
          const apptDateOnly = new Date(apptDate.getFullYear(), apptDate.getMonth(), apptDate.getDate());
          const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const tomorrowOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
          
          return apptDateOnly.getTime() === todayOnly.getTime() || apptDateOnly.getTime() === tomorrowOnly.getTime();
        })() : false;
        
        const timelineLower = job.timeline?.toLowerCase() || '';
        
        if ((timelineLower.includes('urgent') || timelineLower.includes('asap')) && isUrgent) {
          return 'bg-gradient-to-r from-red-400 to-pink-500';
        }
        if (timelineLower.includes('tomorrow')) {
          return 'bg-gradient-to-r from-amber-400 to-yellow-500';
        }
        return 'bg-gradient-to-r from-blue-400 to-indigo-500';
      })()}`}></div>
      
      <CardContent className="p-3 sm:p-4">
        {/* Mobile: Vertical Layout, Desktop: Horizontal Layout */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          
          {/* Top Section - Vehicle & Customer (Mobile: Full width, Desktop: Left) */}
          <div className="flex-1 min-w-0">
            {/* Vehicle Header */}
            <div className="flex items-center gap-2 sm:gap-3 mb-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Car className="w-5 h-5 sm:w-4 sm:h-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg sm:text-base font-bold text-gray-900 truncate group-hover:text-indigo-700 transition-colors">
                  {getVehicleDisplay()}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs font-semibold bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                    {job.vehicle_reg || 'No Reg'}
                  </Badge>
                  {job.timeline && (
                    <Badge className={`text-xs font-medium px-2 py-1 rounded-full ${getPriorityColor(job.timeline, job.appointment_date)}`}>
                      {job.timeline}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            {/* Customer & Location Info */}
            <div className="space-y-2 sm:space-y-2">
              {/* Customer */}
              <div className="flex items-center gap-2">
                <User className="w-3 h-3 text-gray-500 flex-shrink-0" />
                <span className="font-medium text-gray-900 truncate">{job.full_name}</span>
                {job.mobile && !isAccepted && (
                  <Phone className="w-3 h-3 text-gray-400" />
                )}
              </div>
              
              {/* Location */}
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3 text-gray-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-blue-600 truncate">
                    {/* Address first - highlighted */}
                    <span>{job.postcode || 'Address not specified'}</span>
                  </div>
                  {/* Postcode underneath - regular text */}
                  {job.location && (
                    <div className="text-sm text-gray-600 mt-0.5">
                      {job.location}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Date/Time */}
              {(job.appointment_date || job.time_slot) && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-gray-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    {job.appointment_date && new Date(job.appointment_date).toLocaleDateString('en-GB', { 
                      day: 'numeric', 
                      month: 'short',
                      year: 'numeric'
                    })}
                    {job.appointment_date && job.time_slot && ' • '}
                    {job.time_slot && (
                      <span className="font-semibold text-indigo-600">{job.time_slot}</span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Mobile: Full width sections, Desktop: Center - Damage */}
          <div className="flex-1 min-w-0 sm:max-w-xs">
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-3 sm:p-3 border border-red-100/50">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 sm:w-3 sm:h-3 text-red-600 flex-shrink-0" />
                {(() => {
                  const windowDamage = parseJsonField(job.window_damage);
                  const selectedWindows = parseJsonField(job.selected_windows);
                  
                  if (windowDamage.length > 0) {
                    const damageInfo = extractDamageInfo(windowDamage);
                    return (
                      <span className="text-base sm:text-sm font-bold text-gray-900">
                        {getGlassTypeName(damageInfo[0].code)} ({damageInfo[0].damageType})
                      </span>
                    );
                  } else if (selectedWindows.length > 0) {
                    const glassCodes = extractGlassCodesFromWindows(selectedWindows);
                    return (
                      <span className="text-base sm:text-sm font-bold text-gray-900">
                        {getGlassTypeName(glassCodes[0])}
                      </span>
                    );
                  } else if (job.service_type) {
                    return (
                      <span className="text-base sm:text-sm font-bold text-gray-900">
                        {job.service_type}
                      </span>
                    );
                  } else {
                    return (
                      <span className="text-base sm:text-sm font-bold text-gray-500 italic">
                        Service details not specified
                      </span>
                    );
                  }
                })()}
              </div>
              <div className="space-y-1">
                {/* Specification chips */}
                {(job.glass_type || job.window_spec || job.adas_calibration) && (
                  <div className="flex items-center gap-2 flex-wrap mt-2">
                    {job.glass_type && (
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${getChipClasses(job.glass_type)}`}>
                        {job.glass_type}
                      </span>
                    )}
                    {(() => {
                      const specs = getSpecStrings(job.window_spec);
                      return specs.map((s, i) => (
                        <span key={i} className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${getChipClasses(s)}`}>{s}</span>
                      ));
                    })()}
                    {job.adas_calibration && (
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${getChipClasses(job.adas_calibration)}`}>
                        {job.adas_calibration}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile: Full width Price & Action, Desktop: Right aligned */}
          <div className="flex flex-col gap-3 sm:min-w-[200px]">
            {/* Price - Always above button when showCredits is true */}
            {showCredits ? (
              <div className="bg-white border-2 border-[#2165ab] text-[#2165ab] px-4 py-3 sm:px-3 sm:py-2 rounded-xl shadow-md flex-shrink-0">
                <p className="text-xl sm:text-lg font-black text-center leading-tight">
                  {formatCredits(job.quote_price)}
                </p>
                <p className="text-sm sm:text-xs font-semibold text-center">Credits</p>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white px-4 py-3 sm:px-3 sm:py-2 rounded-xl shadow-md flex-shrink-0">
                <p className="text-xl sm:text-lg font-black text-center leading-tight">
                  {formatPrice(job.quote_price)}
                </p>
              </div>
            )}

            {/* Action Button - Full width */}
            <Button
              onClick={() => onAccept(job)}
              disabled={isAccepted || isAccepting}
              size="lg"
              className={`w-full font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 h-12 sm:h-10 px-6 sm:px-4 text-base sm:text-sm ${
                isAccepted 
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700' 
                  : showCredits
                  ? 'cta-primary'
                  : 'bg-[#2165ab] hover:bg-[#1a5294]'
              }`}
            >
              {isAccepting ? (
                <Loader2 className="w-5 h-5 sm:w-4 sm:h-4 animate-spin" />
              ) : isAccepted ? (
                <CheckCircle2 className="w-5 h-5 sm:w-4 sm:h-4" />
              ) : (
                <CheckCircle2 className="w-5 h-5 sm:w-4 sm:h-4" />
              )}
              <span className="ml-2 sm:ml-1">
                {isAccepting 
                  ? (showCredits ? 'Buying Lead...' : 'Accepting...') 
                  : isAccepted 
                  ? (showCredits ? 'Lead Purchased' : 'Accepted') 
                  : (showCredits ? 'Buy Lead' : 'Accept')
                }
              </span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
