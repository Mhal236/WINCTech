import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, PoundSterling, MapPin, Car, Info, Calendar, Phone, Shield, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

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
}

export const JobCard: React.FC<JobCardProps> = ({ 
  job, 
  onAccept, 
  isAccepted = false, 
  isAccepting = false 
}) => {
  const getVehicleDisplay = () => {
    const parts = [job.year, job.brand, job.model].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'Vehicle information not available';
  };

  const formatPrice = (price: number | null | undefined) => {
    if (price == null) return 'Quote Required';
    return `£${price.toFixed(2)}`;
  };

  const getPriorityColor = (timeline?: string) => {
    if (!timeline) return 'bg-gray-100 text-gray-800';
    const timelineLower = timeline.toLowerCase();
    if (timelineLower.includes('urgent') || timelineLower.includes('asap') || timelineLower.includes('today')) {
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

  const getUrgencyIcon = (timeline?: string) => {
    if (!timeline) return <Clock className="w-4 h-4 text-gray-500" />;
    const timelineLower = timeline.toLowerCase();
    if (timelineLower.includes('urgent') || timelineLower.includes('asap') || timelineLower.includes('today')) {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
    if (timelineLower.includes('tomorrow') || timelineLower.includes('soon')) {
      return <Clock className="w-4 h-4 text-yellow-500" />;
    }
    return <Clock className="w-4 h-4 text-green-500" />;
  };

  return (
    <Card className="group relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-white to-gray-50">
      {/* Priority Indicator Strip */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${job.timeline?.toLowerCase().includes('urgent') || job.timeline?.toLowerCase().includes('asap') ? 'bg-gradient-to-r from-red-500 to-red-600' : job.timeline?.toLowerCase().includes('tomorrow') ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 'bg-gradient-to-r from-blue-500 to-blue-600'}`}></div>
      
      <CardHeader className="pb-4 pt-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Car className="w-5 h-5 text-gray-600" />
              <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                {getVehicleDisplay()}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                {job.vehicle_reg || 'No Reg'}
              </Badge>
              {job.status && (
                <Badge className={`text-xs font-medium border ${getStatusColor(job.status)}`}>
                  {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right ml-4">
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-2 rounded-lg shadow-sm">
              <p className="text-lg font-bold">
                {formatPrice(job.quote_price)}
              </p>
              {job.otr_price && job.otr_price !== job.quote_price && (
                <p className="text-xs opacity-90">
                  OTR: {formatPrice(job.otr_price)}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Customer Information */}
        <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            Customer Details
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">{job.full_name}</span>
              {job.mobile && (
                <a href={`tel:${job.mobile}`} className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors">
                  <Phone className="w-3 h-3" />
                  <span className="text-sm">{job.mobile}</span>
                </a>
              )}
            </div>
            
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
              <span className="text-sm text-gray-600 leading-relaxed">
                {job.location || 'Location not specified'}
                {job.postcode && (
                  <span className="ml-2 font-medium text-gray-800">{job.postcode}</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Job Details Grid */}
        <div className="grid grid-cols-2 gap-3">
          {job.timeline && (
            <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2">
                {getUrgencyIcon(job.timeline)}
                <div>
                  <p className="text-xs text-gray-500 font-medium">Timeline</p>
                  <Badge className={`text-xs font-medium mt-1 ${getPriorityColor(job.timeline)}`}>
                    {job.timeline}
                  </Badge>
                </div>
              </div>
            </div>
          )}
          
          {job.service_type && (
            <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">Service</p>
                  <p className="text-xs text-gray-700 font-semibold mt-1">{job.service_type}</p>
                </div>
              </div>
            </div>
          )}
          
          {job.glass_type && (
            <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-green-500" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">Glass Type</p>
                  <p className="text-xs text-gray-700 font-semibold mt-1">{job.glass_type}</p>
                </div>
              </div>
            </div>
          )}
          
          {job.appointment_date && (
            <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-500" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">Appointment</p>
                  <p className="text-xs text-gray-700 font-semibold mt-1">{job.appointment_date}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Insurance Information */}
        {job.insurance_provider && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-900">Insurance Details</span>
            </div>
            <div className="grid grid-cols-1 gap-2 text-xs text-blue-800">
              <div className="flex justify-between">
                <span className="font-medium">Provider:</span>
                <span>{job.insurance_provider}</span>
              </div>
              {job.policy_excess && (
                <div className="flex justify-between">
                  <span className="font-medium">Excess:</span>
                  <span className="font-semibold">£{job.policy_excess}</span>
                </div>
              )}
              {job.policy_number && (
                <div className="flex justify-between">
                  <span className="font-medium">Policy:</span>
                  <span className="font-mono text-xs">{job.policy_number}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <Button
            onClick={() => onAccept(job)}
            disabled={isAccepted || isAccepting}
            className={`w-full h-12 font-semibold text-sm transition-all duration-200 ${
              isAccepted 
                ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg' 
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {isAccepting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Accepting Job...
              </>
            ) : isAccepted ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Job Accepted
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Accept Job
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
