import React from 'react';
import { useSwipeable } from 'react-swipeable';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { JobData } from './JobCard';
import { MapPin, Phone, Car, X, Heart, Calendar, Clock, Star, Zap, DollarSign, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';

interface SwipeableJobCardProps {
  job: JobData;
  onSwipeLeft: (job: JobData) => void;
  onSwipeRight: (job: JobData) => void;
  onCardLeftScreen: (job: JobData) => void;
  isVisible: boolean;
  isAccepted?: boolean;
}

export const SwipeableJobCard: React.FC<SwipeableJobCardProps> = ({
  job,
  onSwipeLeft,
  onSwipeRight,
  onCardLeftScreen,
  isVisible,
  isAccepted = false
}) => {
  if (!isVisible) return null;

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
    
    // Front windows
    if (type.includes('_df') || type.includes('_vf') || (type.toLowerCase().includes('driver') && type.toLowerCase().includes('front'))) {
      return "Driver's Front Window";
    }
    if (type.includes('_pf') || (type.toLowerCase().includes('passenger') && type.toLowerCase().includes('front'))) {
      return "Passenger's Front Window";
    }
    
    // Rear windows
    if (type.includes('_dr') || type.includes('_vr') || (type.toLowerCase().includes('driver') && type.toLowerCase().includes('rear'))) {
      return "Driver's Rear Window";
    }
    if (type.includes('_pr') || (type.toLowerCase().includes('passenger') && type.toLowerCase().includes('rear'))) {
      return "Passenger's Rear Window";
    }
    
    // Door windows
    if (type.includes('_dd') || type.includes('_dg')) {
      return "Driver's Door Window";
    }
    if (type.includes('_pd') || type.includes('_vg')) {
      return "Passenger's Door Window";
    }
    
    // Quarter glass/windows
    if (type.includes('_qr')) {
      return "Quarter Glass (Rear)";
    }
    if (type.includes('_qg')) {
      return "Quarter Glass";
    }
    
    // Vent/Partition windows
    if (type.includes('_vp')) {
      return "Vent/Partition Glass";
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

  // Motion values
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-8, 0, 8]);
  const leftOpacity = useTransform(x, [-140, -60], [1, 0]);
  const rightOpacity = useTransform(x, [60, 140], [0, 1]);

  const swipeHandlers = useSwipeable({
    onSwiping: (data: any) => {
      if (data && (data.dir === 'Left' || data.dir === 'Right')) {
        const signedX = data.dir === 'Left' ? -data.absX : data.absX;
        x.set(signedX);
      }
    },
    onSwipedLeft: () => {
      animate(x, -800, { duration: 0.25 });
      setTimeout(() => {
        onSwipeLeft(job);
        onCardLeftScreen(job);
        x.set(0);
      }, 250);
    },
    onSwipedRight: () => {
      animate(x, 800, { duration: 0.25 });
      setTimeout(() => {
        onSwipeRight(job);
        onCardLeftScreen(job);
        x.set(0);
      }, 250);
    },
    onTouchEndOrOnMouseUp: () => {
      // If the swipe didn't complete (didn't trigger onSwipedLeft/Right), 
      // animate back to center
      const currentX = x.get();
      if (Math.abs(currentX) > 0 && Math.abs(currentX) < 200) {
        animate(x, 0, { 
          duration: 0.3,
          type: "spring",
          stiffness: 300,
          damping: 30
        });
      }
    },
    delta: 40,
    preventScrollOnSwipe: true,
    trackMouse: true
  });

  const initials = (job.full_name || '?')
    .split(' ')
    .filter(Boolean)
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Helper function to count total windows affected in the job
  const countWindows = (): number => {
    const windowDamage = parseJsonField(job.window_damage);
    const selectedWindows = parseJsonField(job.selected_windows);
    
    if (windowDamage.length > 0) {
      const damageInfo = extractDamageInfo(windowDamage);
      return damageInfo.length;
    } else if (selectedWindows.length > 0) {
      const glassCodes = extractGlassCodesFromWindows(selectedWindows);
      return glassCodes.length;
    }
    
    return 1; // Default to 1 window if no specific data available
  };

  // Helper function to get pricing for exclusive jobs
  const getExclusiveJobPrice = (): number => {
    const windowCount = countWindows();
    return windowCount > 1 ? 170 : 140;
  };

  // Determine if this is an exclusive job (paid status)
  const isExclusiveJob = job.status === 'paid' || job.status === 'paid - full';

  // Get the display price - use exclusive pricing for exclusive jobs, otherwise use quote_price
  const displayPrice = isExclusiveJob ? getExclusiveJobPrice() : job.quote_price;
  const prettyPrice = typeof displayPrice === 'number' ? displayPrice.toFixed(2) : displayPrice;

  // Get urgency level for better visual hierarchy
  const getUrgencyLevel = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (!job.appointment_date) return 'normal';
    
    const apptDate = new Date(job.appointment_date);
    const apptDateOnly = new Date(apptDate.getFullYear(), apptDate.getMonth(), apptDate.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const tomorrowOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
    
    if (apptDateOnly.getTime() === todayOnly.getTime()) return 'urgent';
    if (apptDateOnly.getTime() === tomorrowOnly.getTime()) return 'soon';
    return 'normal';
  };

  const urgencyLevel = getUrgencyLevel();
  const vehicleTitle = [job.year, job.brand, job.model].filter(Boolean).join(' ') || 'Vehicle';
  const carX = useTransform(x, [-200, 0, 200], [-6, 0, 6]);
  const carR = useTransform(x, [-200, 0, 200], [-5, 0, 5]);

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
      // Deduplicate while preserving order
      return [...new Set(mapped)];
    } catch {
      return [];
    }
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

  return (
    <div className="relative w-full h-full" style={{ touchAction: 'pan-x' }} {...swipeHandlers}>
      {/* Subtle swipe indicators */}
      <motion.div className="pointer-events-none absolute inset-0 flex items-center justify-between px-4 z-20">
        <motion.div 
          style={{ opacity: leftOpacity }} 
          className="text-gray-400/80"
        >
          <X className="w-8 h-8" strokeWidth={2.5} />
        </motion.div>
        <motion.div 
          style={{ opacity: rightOpacity }} 
          className="text-gray-400/80"
        >
          <CheckCircle className="w-8 h-8" strokeWidth={2.5} />
        </motion.div>
      </motion.div>

      <motion.div 
        style={{ x, rotate }} 
        className="w-full h-full"
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="group w-full h-full bg-white rounded-3xl border-2 border-gray-200 hover:border-blue-300 shadow-lg hover:shadow-xl ring-1 ring-gray-100/50 hover:ring-blue-200/50 transition-all duration-300 ease-out overflow-hidden flex flex-col backdrop-blur-sm relative before:absolute before:inset-0 before:rounded-3xl before:bg-gradient-to-br before:from-white/20 before:to-transparent before:pointer-events-none">
          
          {/* Header */}
          <div className="relative px-6 pt-8 pb-6 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40 border-b border-gray-200/60">
            
            <div className="relative z-10">
              {/* Compact header with better space utilization */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <motion.div 
                      style={{ x: carX, rotate: carR }} 
                      whileHover={{ scale: 1.06 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      className="p-2 rounded-lg border border-gray-200 bg-gray-50 text-[#2165ab] hover:bg-gray-100 hover:shadow-sm transition-colors"
                    >
                      <Car className="w-4 h-4" />
                    </motion.div>
                    <h2 className="text-lg font-black text-gray-900 leading-tight">{vehicleTitle}</h2>
                  </div>
                  {/* Secondary info: registration and urgency indicator */}
                  <div className="flex items-center gap-2 text-xs text-gray-600 font-medium leading-tight">
                    <span className="font-bold text-gray-800">{job.vehicle_reg || 'N/A'}</span>
                    {urgencyLevel !== 'normal' && (
                      <div className={`px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${
                        urgencyLevel === 'urgent' 
                          ? 'bg-red-50 text-red-700 border border-red-200' 
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        <AlertTriangle className="w-3 h-3" />
                        {urgencyLevel === 'urgent' ? 'Today' : 'Tomorrow'}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Compact price display */}
                <div className="text-right ml-3 flex-shrink-0">
                  <motion.div 
                    whileHover={{ scale: 1.02 }} 
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                    className="rounded-2xl p-4 bg-gradient-to-br from-[#2165ab] to-[#1a4d8f] text-white shadow-lg ring-2 ring-[#2165ab]/30 ring-offset-2 ring-offset-white/50 border border-[#2165ab]/20"
                  >
                    <div className="text-3xl sm:text-2xl font-extrabold tracking-tight tabular-nums">
                      £{prettyPrice}
                    </div>
                  
                  </motion.div>
                </div>
              </div>
              
              {/* Compact location with better text wrapping */}
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 text-sm leading-tight">{job.postcode || 'Location TBD'}</div>
                    {job.location && (
                      <div className="text-xs text-gray-600 leading-tight mt-0.5 break-words">{job.location}</div>
                    )}
                  </div>
                  {job.mobile && (
                    <div className="flex-shrink-0">
                      {!isAccepted ? (
                        <div className="flex items-center gap-1 text-gray-400 text-xs bg-gray-100 px-2 py-1 rounded-full">
                          <Phone className="w-2.5 h-2.5" />
                          <span>After accept</span>
                        </div>
                      ) : (
                        <a href={`tel:${job.mobile}`} className="flex items-center gap-1 text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-full transition-colors">
                          <Phone className="w-3 h-3" />
                          <span className="text-xs font-medium">{job.mobile}</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Compact Content sections */}
          <div className="flex-1 px-6 py-3 space-y-3 overflow-y-auto">
            
            {/* Compact Job Details card with better information display */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-gray-900 text-sm">Job Details</span>
                </div>
                
                {/* Appointment time compactly displayed */}
                {(job.appointment_date || job.time_slot) && (
                  <div className="text-right">
                    <div className="text-xs font-semibold text-gray-700">
                      {job.appointment_date && new Date(job.appointment_date).toLocaleDateString('en-GB', { 
                        weekday: 'short', 
                        day: 'numeric', 
                        month: 'short' 
                      })}
                    </div>
                    {job.time_slot && (
                      <div className="text-sm font-semibold text-gray-900">{job.time_slot}</div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Compact damage information */}
              <div className="space-y-2">
                {(() => {
                  const windowDamage = parseJsonField(job.window_damage);
                  const selectedWindows = parseJsonField(job.selected_windows);
                  
                  if (windowDamage.length > 0) {
                    const damageInfo = extractDamageInfo(windowDamage);
                    return damageInfo.map((damage, index) => (
                      <div key={index} className="flex items-start gap-2 bg-white rounded-lg p-2.5 border border-gray-200">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0 mt-1.5"></div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 text-sm leading-tight">
                            {getGlassTypeName(damage.code)} ({damage.damageType})
                          </div>
                        </div>
                      </div>
                    ));
                  } else if (selectedWindows.length > 0) {
                    const glassCodes = extractGlassCodesFromWindows(selectedWindows);
                    return glassCodes.map((code, index) => (
                      <div key={index} className="flex items-start gap-2 bg-white rounded-lg p-2.5 border border-gray-200">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0 mt-1.5"></div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 text-sm leading-tight">
                            {getGlassTypeName(code)}
                          </div>
                        </div>
                      </div>
                    ));
                  } else {
                    return null;
                  }
                })() || (job.service_type ? (
                  <div className="flex items-start gap-2 bg-white rounded-lg p-2.5 border border-gray-200">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0 mt-1.5"></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm leading-tight break-words">{job.service_type}</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                    <div className="w-2 h-2 bg-gray-400 rounded-full flex-shrink-0 mt-1.5"></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-gray-600 italic text-sm">Service details not specified</div>
                    </div>
                  </div>
                ))}
                
                {/* Specifications chips */}
                {(job.glass_type || job.window_spec || job.adas_calibration) && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="flex items-center gap-2 flex-wrap">
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
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Compact Action buttons */}
          <div className="px-6 pb-5 pt-3 bg-gradient-to-t from-gray-50/80 to-white/90 backdrop-blur-sm border-t border-gray-200/40">
            <div className="flex gap-3">
              <button
                onClick={() => {
                  onSwipeLeft(job);
                  onCardLeftScreen(job);
                }}
                className="flex-1 bg-white/80 backdrop-blur-sm border-2 border-gray-200 text-gray-700 hover:bg-red-50 hover:border-red-200 hover:text-red-700 py-3 rounded-2xl font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <X className="w-4 h-4" strokeWidth={2.5} />
                <span className="text-sm">Pass</span>
              </button>
              <button
                onClick={() => {
                  onSwipeRight(job);
                  onCardLeftScreen(job);
                }}
                className="flex-[2] bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white py-3 rounded-2xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] border-2 border-emerald-400/50"
              >
                <CheckCircle className="w-4 h-4" strokeWidth={2.5} />
                <span className="text-sm">Accept Job</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            
            <div className="mt-3 text-center text-xs text-gray-400 font-medium">
              Swipe left to pass • right to accept
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};