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

  const prettyPrice = typeof job.quote_price === 'number' ? job.quote_price.toFixed(2) : job.quote_price;

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

  return (
    <div className="relative w-full h-full" style={{ touchAction: 'pan-x' }} {...swipeHandlers}>
      {/* Enhanced Swipe indicators */}
      <motion.div className="pointer-events-none absolute inset-0 flex items-center justify-between px-6 z-20">
        <motion.div 
          style={{ opacity: leftOpacity }} 
          className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-3xl p-6 shadow-2xl border-4 border-white/30 backdrop-blur-sm"
        >
          <X className="w-12 h-12" strokeWidth={3} />
        </motion.div>
        <motion.div 
          style={{ opacity: rightOpacity }} 
          className="bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-3xl p-6 shadow-2xl border-4 border-white/30 backdrop-blur-sm"
        >
          <CheckCircle className="w-12 h-12" strokeWidth={3} />
        </motion.div>
      </motion.div>

      <motion.div 
        style={{ x, rotate }} 
        className="w-full h-full"
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="w-full h-full bg-white rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.12)] border border-gray-100/50 overflow-hidden flex flex-col backdrop-blur-sm">
          
          {/* Enhanced Hero section with better visual hierarchy */}
          <div className={`relative px-6 pt-8 pb-6 ${
            urgencyLevel === 'urgent' 
              ? 'bg-gradient-to-br from-red-50 via-orange-50 to-amber-50' 
              : urgencyLevel === 'soon'
              ? 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50'
              : 'bg-gradient-to-br from-slate-50 via-blue-50/60 to-indigo-50'
          }`}>
            
            {/* Animated background elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-200/20 to-indigo-200/15 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-purple-200/15 to-pink-200/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
            
            {/* Urgency indicator */}
            {urgencyLevel !== 'normal' && (
              <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                urgencyLevel === 'urgent' 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-amber-500 text-white'
              }`}>
                <AlertTriangle className="w-3 h-3" />
                {urgencyLevel === 'urgent' ? 'TODAY' : 'TOMORROW'}
              </div>
            )}
            
            <div className="relative z-10">
              {/* Compact header with better space utilization */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-black text-gray-900 mb-2 leading-tight">{job.full_name}</h2>
                  {/* Vehicle info with better wrapping */}
                  <div className="text-xs text-gray-600 font-medium leading-tight">
                    {job.brand || 'Unknown'} {job.model || 'Unknown'}
                    <br />
                    <span className="font-bold text-gray-800">{job.vehicle_reg || 'N/A'}</span>
                  </div>
                </div>
                
                {/* Compact price display */}
                <div className="text-right ml-3 flex-shrink-0">
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-white/50">
                    <div className="text-2xl font-black bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">
                      £{prettyPrice}
                    </div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Quote</div>
                  </div>
                </div>
              </div>
              
              {/* Compact location with better text wrapping */}
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-white/50">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
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
                        <a href={`tel:${job.mobile}`} className="flex items-center gap-1 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-full transition-colors">
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
            <div className="bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 rounded-xl p-4 border border-red-100/60 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 text-white flex items-center justify-center shadow-md">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-gray-900 text-sm">Job Details</span>
                </div>
                
                {/* Appointment time compactly displayed */}
                {(job.appointment_date || job.time_slot) && (
                  <div className="text-right">
                    <div className="text-xs font-bold text-orange-600">
                      {job.appointment_date && new Date(job.appointment_date).toLocaleDateString('en-GB', { 
                        weekday: 'short', 
                        day: 'numeric', 
                        month: 'short' 
                      })}
                    </div>
                    {job.time_slot && (
                      <div className="text-sm font-black text-red-600">{job.time_slot}</div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Compact damage information */}
              <div className="space-y-2">
                {job.window_damage && job.window_damage.length > 0 ? (
                  job.window_damage.map((damage: any, index: number) => (
                    <div key={index} className="flex items-start gap-2 bg-white/70 rounded-lg p-2.5 border border-red-100">
                      <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-1.5"></div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm leading-tight">
                          {damage.window_type || 'Window'}
                        </div>
                        <div className="text-xs text-gray-700 leading-tight break-words">
                          {damage.damage_type || damage.type || 'Damage'}
                          {damage.location && ` • ${damage.location}`}
                        </div>
                      </div>
                    </div>
                  ))
                ) : job.selected_windows && job.selected_windows.length > 0 ? (
                  job.selected_windows.map((window: any, index: number) => (
                    <div key={index} className="flex items-start gap-2 bg-white/70 rounded-lg p-2.5 border border-orange-100">
                      <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-1.5"></div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm leading-tight">
                          {window.window_type || window.type || 'Window'}
                        </div>
                        {window.damage_type && (
                          <div className="text-xs text-gray-700 leading-tight break-words">{window.damage_type}</div>
                        )}
                      </div>
                    </div>
                  ))
                ) : job.service_type ? (
                  <div className="flex items-start gap-2 bg-white/70 rounded-lg p-2.5 border border-blue-100">
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></div>
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
                )}
                
                {job.glass_type && (
                  <div className="mt-2 pt-2 border-t border-red-200">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-600">Glass Type:</span>
                      <span className="inline-block px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                        {job.glass_type}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Compact Action buttons */}
          <div className="px-6 pb-5 pt-3 bg-gradient-to-t from-gray-50/80 to-transparent">
            <div className="flex gap-3">
              <button
                onClick={() => {
                  onSwipeLeft(job);
                  onCardLeftScreen(job);
                }}
                className="flex-1 bg-white border-2 border-red-200 hover:border-red-300 hover:bg-red-50 text-red-600 hover:text-red-700 py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-sm hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <X className="w-4 h-4" strokeWidth={2.5} />
                <span className="text-sm">Pass</span>
              </button>
              <button
                onClick={() => {
                  onSwipeRight(job);
                  onCardLeftScreen(job);
                }}
                className="flex-[2] bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 hover:from-emerald-600 hover:via-green-700 hover:to-teal-700 text-white py-3 rounded-xl font-black transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <CheckCircle className="w-4 h-4" strokeWidth={2.5} />
                <span className="text-sm">Accept Job</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            
            <div className="mt-3 text-center text-xs text-gray-500 font-medium">
              👈 Swipe left to pass • Swipe right to accept 👉
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};