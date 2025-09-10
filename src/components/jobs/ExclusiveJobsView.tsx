import React, { useState, useEffect } from 'react';
import { SwipeableJobCard } from './SwipeableJobCard';
import { JobData } from './JobCard';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { JobService } from '@/services/jobService';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExclusiveJobsViewProps {
  onJobAccepted?: (job: JobData) => void;
}

export const ExclusiveJobsView: React.FC<ExclusiveJobsViewProps> = ({ onJobAccepted }) => {
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [lastAction, setLastAction] = useState<'accepted' | 'passed' | null>(null);
  const { user } = useAuth();

  console.log('🎯 ExclusiveJobsView component mounted/rendered');

  useEffect(() => {
    fetchExclusiveJobs();
  }, []);

  const fetchExclusiveJobs = async () => {
    try {
      console.log('🔵 Starting fetchExclusiveJobs...');
      setLoading(true);
      
      // Test direct database query first
      console.log('🔵 Testing direct database query...');
      const { data: directData, error: directError } = await supabase
        .from('MasterCustomer')
        .select('*')
        .eq('status', 'quoted')
        .not('quote_price', 'is', null)
        .gt('quote_price', 200)
        .limit(5);
      
      console.log('🔵 Direct query result:', { directData, directError, count: directData?.length });
      
      // Now try the service
      console.log('🔵 Calling JobService.getAvailableJobs...');
      const { data, error } = await JobService.getAvailableJobs();

      console.log('🔵 JobService result:', { hasData: !!data, error, dataLength: data?.length });

      if (error) {
        console.error('🔴 Error fetching jobs:', error);
        toast({
          title: "Error",
          description: "Failed to fetch exclusive jobs. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        console.log('🟢 Raw job data from service:', data);
        console.log('🔵 Number of jobs returned:', data.length);
        
        // Filter for exclusive jobs (high-value jobs)
        const exclusiveJobs = data.filter(job => {
          const isValid = job.status === 'quoted' && 
            job.quote_price != null && 
            job.quote_price >= 200;
          console.log(`🔵 Job ${job.full_name}: status=${job.status}, price=${job.quote_price}, valid=${isValid}`);
          return isValid;
        });
        
        console.log('🟢 Filtered exclusive jobs:', exclusiveJobs);
        console.log('🔵 Number of exclusive jobs:', exclusiveJobs.length);
        setJobs(exclusiveJobs);
        setCurrentJobIndex(0);
      } else {
        console.log('🔴 No data returned from JobService.getAvailableJobs()');
      }
    } catch (error) {
      console.error('🔴 Exception in fetchExclusiveJobs:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching exclusive jobs.",
        variant: "destructive",
      });
    } finally {
      console.log('🔵 Setting loading to false');
      setLoading(false);
    }
  };

  const handleSwipeLeft = async (job: JobData) => {
    console.log('Passed on job:', job.full_name);
    setLastAction('passed');
    
    // Move to next job after a short delay
    setTimeout(() => {
      setCurrentJobIndex(prev => prev + 1);
      setLastAction(null);
    }, 200);
  };

  const handleSwipeRight = async (job: JobData) => {
    if (!user || !user.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to accept jobs.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    setLastAction('accepted');

    try {
      // Check if user is a technician - try both user_id and direct lookup by email
      let technicianData = null;
      let techError = null;
      
      // First try with user_id
      const { data: techData1, error: techError1 } = await supabase
        .from('technicians')
        .select('id, name, user_id')
        .eq('user_id', user.id)
        .single();
      
      if (techData1 && !techError1) {
        technicianData = techData1;
      } else {
        // If that fails, try looking up by email (for Google OAuth users)
        const { data: techData2, error: techError2 } = await supabase
          .from('technicians')
          .select('id, name, user_id, contact_email')
          .eq('contact_email', user.email)
          .single();
        
        if (techData2 && !techError2) {
          technicianData = techData2;
        } else {
          techError = techError1 || techError2;
        }
      }

      if (techError || !technicianData) {
        toast({
          title: "Access Denied",
          description: "Only verified technicians can accept jobs.",
          variant: "destructive",
        });
        return;
      }

      // Accept the job using the service
      console.log('🔵 Calling JobService.acceptJob with:', { jobId: job.id, technicianId: technicianData.id, technicianName: technicianData.name });
      
      const { success, error: acceptError, assignmentId } = await JobService.acceptJob(
        job.id,
        technicianData.id,
        technicianData.name
      );

      console.log('🔵 JobService.acceptJob result:', { success, acceptError, assignmentId });

      if (!success || !assignmentId) {
        console.error('🔴 Job acceptance failed:', acceptError);
        toast({
          title: "Assignment Failed",
          description: acceptError?.message || acceptError || "Failed to assign the job. It may have been taken by another technician.",
          variant: "destructive",
        });
        return;
      }

      // Create calendar event
      const { success: calendarSuccess } = await JobService.createCalendarEvent(
        assignmentId,
        job,
        technicianData.id
      );

      if (!calendarSuccess) {
        console.warn('Calendar event creation failed, but job was assigned successfully');
      }

      toast({
        title: "Job Accepted! 🎉",
        description: `You've successfully accepted the job for ${job.full_name}. It has been added to your calendar.`,
        variant: "default",
      });

      // Call parent callback
      onJobAccepted?.(job);

      // Move to next job after success animation
      setTimeout(() => {
        setCurrentJobIndex(prev => prev + 1);
        setLastAction(null);
      }, 500);

    } catch (error) {
      console.error('Error accepting job:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while accepting the job.",
        variant: "destructive",
      });
      setLastAction(null);
    } finally {
      setProcessing(false);
    }
  };

  const handleCardLeftScreen = (job: JobData) => {
    console.log('Card left screen:', job.full_name);
    // The card has finished its animation and left the screen
  };

  console.log('ExclusiveJobsView render - loading:', loading, 'jobs.length:', jobs.length, 'currentJobIndex:', currentJobIndex);

  if (loading) {
    console.log('Showing loading state');
    return (
      <div className="flex flex-col items-center justify-center py-12 min-h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Loading exclusive jobs...</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    console.log('Showing no jobs state');
    return (
      <div className="flex flex-col items-center justify-center py-12 min-h-[500px]">
        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Exclusive Jobs Available</h3>
        <p className="text-gray-600 text-center max-w-md mb-4">
          No exclusive jobs (£200+) are currently available. Check back later for new opportunities.
        </p>
        <Button onClick={fetchExclusiveJobs} variant="outline" className="mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Jobs
        </Button>
      </div>
    );
  }

  if (currentJobIndex >= jobs.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 min-h-[500px]">
        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">All Jobs Reviewed</h3>
        <p className="text-gray-600 text-center max-w-md mb-4">
          You've gone through all {jobs.length} exclusive jobs. Great work!
        </p>
        <Button onClick={fetchExclusiveJobs} variant="outline" className="mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Check for New Jobs
        </Button>
      </div>
    );
  }

  const currentJob = jobs[currentJobIndex];
  console.log('Rendering job card - currentJob:', currentJob);

  if (!currentJob) {
    console.log('No current job found, currentJobIndex:', currentJobIndex, 'jobs.length:', jobs.length);
    return (
      <div className="flex flex-col items-center justify-center py-12 min-h-[500px]">
        <p className="text-gray-600">No job data available</p>
        <Button onClick={fetchExclusiveJobs} variant="outline" className="mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Jobs
        </Button>
      </div>
    );
  }

  console.log('🎨 About to render card for job:', currentJob.full_name, 'ID:', currentJob.id);

  return (
    <div className="flex flex-col w-full h-full max-w-sm mx-auto px-3 sm:px-4 pb-safe">
      {/* Progress indicator */}
      <div className="mb-3 sm:mb-4 text-center w-full flex-shrink-0">
        <div className="text-xs sm:text-sm text-gray-500 mb-2">
          Job {currentJobIndex + 1} of {jobs.length}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
          <div 
            className="bg-blue-600 h-1.5 sm:h-2 rounded-full transition-all duration-100 ease-linear"
            style={{ width: `${((currentJobIndex + 1) / jobs.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Beautiful Swipeable Card */}
      <div className="relative w-full flex-1 min-h-0">
        <div className="relative w-full h-full max-h-[calc(100vh-200px)] min-h-[500px]">
          <SwipeableJobCard
            key={currentJob.id}
            job={currentJob}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
            onCardLeftScreen={handleCardLeftScreen}
            isVisible={true}
          />

          {/* Action feedback overlay */}
          <AnimatePresence>
            {lastAction && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
              >
                <div className={`rounded-full p-4 sm:p-6 ${
                  lastAction === 'accepted' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-red-500 text-white'
                }`}>
                  {lastAction === 'accepted' ? (
                    <CheckCircle className="w-8 h-8 sm:w-12 sm:h-12" />
                  ) : (
                    <XCircle className="w-8 h-8 sm:w-12 sm:h-12" />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Processing overlay */}
          {processing && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg z-10">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p className="text-sm">Processing...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-3 sm:mt-4 text-center text-xs sm:text-sm text-gray-500 px-2 flex-shrink-0">
        <p className="leading-tight">
          Swipe left to pass • Swipe right to accept
        </p>
      </div>
    </div>
  );
};
