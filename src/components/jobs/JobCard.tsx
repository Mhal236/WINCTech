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
                <span className="text-base sm:text-sm font-bold text-gray-900">Damage</span>
              </div>
              <div className="space-y-1">
                {job.window_damage && job.window_damage.length > 0 ? (
                  job.window_damage.slice(0, 2).map((damage: any, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0"></div>
                      <span className="text-xs text-gray-800 truncate">
                        {damage.window_type || 'Window'}: {damage.damage_type || damage.type || 'Damage'}
                      </span>
                    </div>
                  ))
                ) : job.selected_windows && job.selected_windows.length > 0 ? (
                  job.selected_windows.slice(0, 2).map((window: any, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full flex-shrink-0"></div>
                      <span className="text-xs text-gray-800 truncate">
                        {window.window_type || window.type || 'Window'}
                      </span>
                    </div>
                  ))
                ) : job.glass_type ? (
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                    <span className="text-xs text-gray-800 truncate">{job.glass_type}</span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-600 italic">Details not specified</span>
                )}
                {job.service_type && (
                  <div className="text-xs text-red-700 font-semibold mt-1 truncate">
                    {job.service_type}
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
                  ? 'bg-gradient-to-r from-orange-300 to-orange-400 hover:from-orange-400 hover:to-orange-500'
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
