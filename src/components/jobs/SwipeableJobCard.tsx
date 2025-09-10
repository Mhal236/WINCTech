import React from 'react';
import { useSwipeable } from 'react-swipeable';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { JobData } from './JobCard';
import { MapPin, Phone, Car, X, Heart, Calendar, Clock, Star } from 'lucide-react';

interface SwipeableJobCardProps {
  job: JobData;
  onSwipeLeft: (job: JobData) => void;
  onSwipeRight: (job: JobData) => void;
  onCardLeftScreen: (job: JobData) => void;
  isVisible: boolean;
}

export const SwipeableJobCard: React.FC<SwipeableJobCardProps> = ({
  job,
  onSwipeLeft,
  onSwipeRight,
  onCardLeftScreen,
  isVisible
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

  return (
    <div className="relative w-full h-full" style={{ touchAction: 'pan-x' }} {...swipeHandlers}>
      {/* Swipe indicators */}
      <motion.div className="pointer-events-none absolute inset-0 flex items-center justify-between px-6 z-20">
        <motion.div 
          style={{ opacity: leftOpacity }} 
          className="bg-red-500 text-white rounded-full p-4 shadow-2xl"
        >
          <X className="w-8 h-8" />
        </motion.div>
        <motion.div 
          style={{ opacity: rightOpacity }} 
          className="bg-green-500 text-white rounded-full p-4 shadow-2xl"
        >
          <Heart className="w-8 h-8" />
        </motion.div>
      </motion.div>

      <motion.div 
        style={{ x, rotate }} 
        className="w-full h-full"
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="w-full h-full bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-gray-100 overflow-hidden flex flex-col">
          
          {/* Hero section */}
          <div className="relative bg-gradient-to-br from-slate-50 to-blue-50 px-6 pt-8 pb-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-200/20 rounded-full blur-2xl" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                    {initials}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{job.full_name}</h2>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm text-gray-600">Premium Job</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-3xl font-black text-green-600">£{prettyPrice}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Quoted</div>
                </div>
              </div>
              
              {/* Contact row */}
              <div className="flex items-center justify-between text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="truncate max-w-[200px]">{job.location || 'Location TBD'}</span>
                </div>
                {job.mobile && (
                  <a href={`tel:${job.mobile}`} className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
                    <Phone className="w-4 h-4" />
                    <span>{job.mobile}</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Content sections */}
          <div className="flex-1 px-6 py-4 space-y-4 overflow-y-auto">
            
            {/* Schedule card */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-4 border border-orange-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <span className="font-semibold text-gray-900">Appointment</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-gray-500 text-xs mb-1">Date</div>
                  <div className="font-medium text-gray-900">{job.appointment_date || 'TBD'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">Time</div>
                  <div className="font-medium text-gray-900">{job.time_slot || 'TBD'}</div>
                </div>
              </div>
            </div>

            {/* Vehicle card */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-4 border border-blue-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center">
                  <Car className="w-4 h-4" />
                </div>
                <span className="font-semibold text-gray-900">Vehicle Details</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-gray-500 text-xs mb-1">Make & Model</div>
                  <div className="font-medium text-gray-900">{job.brand || 'Unknown'} {job.model || 'Unknown'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">Year & Reg</div>
                  <div className="font-medium text-gray-900">{job.year || 'Unknown'} • {job.vehicle_reg || 'N/A'}</div>
                </div>
              </div>
              
              {job.glass_type && (
                <div className="mt-3 pt-3 border-t border-blue-100">
                  <div className="text-gray-500 text-xs mb-1">Glass Type</div>
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {job.glass_type}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="px-6 pb-6 pt-4 bg-gray-50/50">
            <div className="flex gap-4">
              <button
                onClick={() => {
                  onSwipeLeft(job);
                  onCardLeftScreen(job);
                }}
                className="flex-1 bg-white border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 text-gray-700 hover:text-red-700 py-4 rounded-2xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
              >
                <X className="w-5 h-5" />
                Pass
              </button>
              <button
                onClick={() => {
                  onSwipeRight(job);
                  onCardLeftScreen(job);
                }}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 rounded-2xl font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg transform hover:scale-105"
              >
                <Heart className="w-5 h-5" />
                Accept Job
              </button>
            </div>
            
            <div className="mt-3 text-center text-xs text-gray-400">
              Swipe left to pass • Swipe right to accept
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};