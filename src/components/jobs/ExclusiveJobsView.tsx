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
  const [acceptedJobs, setAcceptedJobs] = useState<Set<string>>(new Set());
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const { user } = useAuth();

  console.log('🎯 ExclusiveJobsView component mounted/rendered');

  useEffect(() => {
    fetchExclusiveJobs();
  }, []);

  // Auto-refresh jobs every 30 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing exclusive jobs after 30 minutes...');
      fetchExclusiveJobs();
      setLastRefresh(new Date());
    }, 30 * 60 * 1000); // 30 minutes in milliseconds

    return () => clearInterval(interval);
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
        .eq('status', 'paid') // Only show paid jobs in exclusive view
        .not('quote_price', 'is', null)
        .gt('quote_price', 0) // Remove price filter for paid jobs
        .limit(5);
      
      console.log('🔵 Direct query result:', { directData, directError, count: directData?.length });
      
      // Now try the service
      console.log('🔵 Calling JobService.getExclusiveJobs...');
      const { data, error } = await JobService.getExclusiveJobs();

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
        
        // Filter for exclusive jobs (paid jobs only)
        const exclusiveJobs = data.filter(job => {
          const isValid = job.status === 'paid' && 
            job.quote_price != null && 
            job.quote_price > 0;
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
      setLastRefresh(new Date());
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

      // Update local state to track accepted job
      setAcceptedJobs(prev => new Set([...prev, job.id]));

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
    <div className="flex flex-col items-center justify-center w-full h-full max-w-sm mx-auto px-3 sm:px-4 py-2 sm:py-8">
      {/* Centered Swipeable Card */}
      <div className="relative w-full max-h-[calc(100vh-120px)] sm:max-h-[calc(100vh-160px)] min-h-[500px] flex items-center justify-center">
        <div className="relative w-full h-full max-h-[600px]">
          <SwipeableJobCard
            key={currentJob.id}
            job={currentJob}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
            onCardLeftScreen={handleCardLeftScreen}
            isVisible={true}
            isAccepted={acceptedJobs.has(currentJob.id)}
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
                <div className={`rounded-full p-3 sm:p-4 border ${
                  lastAction === 'accepted' 
                    ? 'bg-green-50 text-green-700 border-green-200' 
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {lastAction === 'accepted' ? (
                    <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8" />
                  ) : (
                    <XCircle className="w-6 h-6 sm:w-8 sm:h-8" />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Processing overlay */}
          {processing && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-lg z-10">
              <div className="text-gray-800 text-center bg-white/80 backdrop-blur-sm rounded-md px-3 py-2 border border-gray-200">
                <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-gray-600 mx-auto mb-1"></div>
                <p className="text-xs">Processing...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 text-center text-xs sm:text-sm text-gray-500 px-2 flex-shrink-0">
        <p className="leading-tight">
         
        </p>
      </div>
    </div>
  );
};
