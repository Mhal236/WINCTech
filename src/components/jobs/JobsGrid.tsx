import React, { useState, useEffect } from 'react';
import { JobCard, JobData } from './JobCard';
import { ExclusiveJobsView } from './ExclusiveJobsView';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { JobService } from '@/services/jobService';
import { supabase } from '@/lib/supabase';
import { Car, Search, Filter, SortAsc, SortDesc, RefreshCw, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export type JobType = 'exclusive' | 'board' | 'bids';

interface JobsGridProps {
  onJobAccepted?: (job: JobData) => void;
  jobType?: JobType;
}

type SortOption = 'price-asc' | 'price-desc' | 'timeline' | 'location' | 'newest';
type ViewMode = 'grid' | 'list';

export const JobsGrid: React.FC<JobsGridProps> = ({ onJobAccepted, jobType = 'board' }) => {
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobData[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingJobId, setAcceptingJobId] = useState<string | null>(null);
  const [acceptedJobs, setAcceptedJobs] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [priceFilter, setPriceFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [purchaseCounts, setPurchaseCounts] = useState<Map<string, number>>(new Map());
  const jobsPerPage = 5; // Limited to 5 jobs at a time
  const { user, refreshUser } = useAuth();

  // Debug: Track component mounting and unmounting
  useEffect(() => {
    console.log('🟢 JobsGrid component mounted, jobType:', jobType);
    return () => {
      console.log('🔴 JobsGrid component unmounting');
    };
  }, []);

  // Fetch jobs from MasterCustomer table
  useEffect(() => {
    console.log('🔵 JobsGrid fetchJobs triggered, jobType:', jobType);
    fetchJobs();
  }, [jobType]);

  // Auto-refresh jobs every 30 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing jobs after 30 minutes...');
      fetchJobs();
      setLastRefresh(new Date());
    }, 30 * 60 * 1000); // 30 minutes in milliseconds

    return () => clearInterval(interval);
  }, [jobType]);

  const fetchPurchaseCounts = async (jobIds: string[]) => {
    if (jobIds.length === 0) return;
    
    try {
      // Fetch purchase counts for all jobs
      const { data, error } = await supabase
        .from('job_assignments')
        .select('job_id')
        .in('job_id', jobIds);

      if (error) {
        console.error('Error fetching purchase counts:', error);
        return;
      }

      if (data) {
        // Count purchases per job
        const counts = new Map<string, number>();
        data.forEach(assignment => {
          const currentCount = counts.get(assignment.job_id) || 0;
          counts.set(assignment.job_id, currentCount + 1);
        });
        setPurchaseCounts(counts);
      }
    } catch (error) {
      console.error('Error in fetchPurchaseCounts:', error);
    }
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await JobService.getAvailableJobs();

      if (error) {
        console.error('Error fetching jobs:', error);
        toast({
          title: "Error",
          description: "Failed to fetch jobs. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        console.log('Fetched jobs:', data);
        // Filter to ensure only quoted but unpaid jobs are displayed for job board
        let filteredJobs = data.filter(job => 
          job.status === 'quoted' && 
          job.quote_price != null && 
          job.quote_price > 0
        );

        // Apply job type filtering
        switch (jobType) {
          case 'exclusive':
            // Exclusive jobs are now handled by ExclusiveJobsView component
            // This filtering is kept for backward compatibility but shouldn't be used
            filteredJobs = filteredJobs.filter(job => job.quote_price >= 200);
            break;
          case 'board':
            // Regular job board - quoted but unpaid jobs only
            // Jobs with 'paid' status are handled by exclusive jobs view
            break;
          case 'bids':
            // For bid jobs, we might want jobs that are still in bidding phase
            // For now, we'll show jobs with lower prices that might need competitive bidding
            filteredJobs = filteredJobs.filter(job => job.quote_price < 200);
            break;
          default:
            // Default to board view
            break;
        }

        console.log(`Filtered ${jobType} jobs:`, filteredJobs);
        setJobs(filteredJobs);
        setFilteredJobs(filteredJobs);
        
        // Fetch purchase counts for board jobs (leads)
        if (jobType === 'board' && filteredJobs.length > 0) {
          const jobIds = filteredJobs.map(job => job.id);
          await fetchPurchaseCounts(jobIds);
        }
      }
    } catch (error) {
      console.error('Error in fetchJobs:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching jobs.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  };

  // Filter and sort jobs
  useEffect(() => {
    let filtered = [...jobs];

    // For board jobs (leads), filter out leads with 3 purchases
    if (jobType === 'board') {
      filtered = filtered.filter(job => {
        const purchaseCount = purchaseCounts.get(job.id) || 0;
        return purchaseCount < 3;
      });
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      console.log('🔍 Searching for:', searchLower, 'in', jobs.length, 'jobs');
      
      filtered = filtered.filter(job => {
        const matches = 
          job.full_name?.toLowerCase().includes(searchLower) ||
          job.vehicle_reg?.toLowerCase().includes(searchLower) ||
          job.brand?.toLowerCase().includes(searchLower) ||
          job.model?.toLowerCase().includes(searchLower) ||
          job.location?.toLowerCase().includes(searchLower) ||
          job.postcode?.toLowerCase().includes(searchLower) ||
          job.service_type?.toLowerCase().includes(searchLower) ||
          job.glass_type?.toLowerCase().includes(searchLower) ||
          job.email?.toLowerCase().includes(searchLower) ||
          job.mobile?.includes(searchTerm) ||
          // Search in selected_windows and window_damage arrays
          (job.selected_windows && JSON.stringify(job.selected_windows).toLowerCase().includes(searchLower)) ||
          (job.window_damage && JSON.stringify(job.window_damage).toLowerCase().includes(searchLower));
        
        return matches;
      });
      
      console.log('🔍 Search results:', filtered.length, 'jobs found');
    }

    // Apply price filter
    if (priceFilter !== 'all') {
      switch (priceFilter) {
        case 'under-100':
          filtered = filtered.filter(job => job.quote_price && job.quote_price < 100);
          break;
        case '100-200':
          filtered = filtered.filter(job => job.quote_price && job.quote_price >= 100 && job.quote_price < 200);
          break;
        case '200-300':
          filtered = filtered.filter(job => job.quote_price && job.quote_price >= 200 && job.quote_price < 300);
          break;
        case 'over-300':
          filtered = filtered.filter(job => job.quote_price && job.quote_price >= 300);
          break;
      }
    }

    // Apply sorting
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => (a.quote_price || 0) - (b.quote_price || 0));
        break;
      case 'price-desc':
        filtered.sort((a, b) => (b.quote_price || 0) - (a.quote_price || 0));
        break;
      case 'timeline':
        filtered.sort((a, b) => {
          const getUrgencyScore = (timeline?: string) => {
            if (!timeline) return 0;
            const lower = timeline.toLowerCase();
            if (lower.includes('urgent') || lower.includes('asap') || lower.includes('today')) return 3;
            if (lower.includes('tomorrow') || lower.includes('soon')) return 2;
            return 1;
          };
          return getUrgencyScore(b.timeline) - getUrgencyScore(a.timeline);
        });
        break;
      case 'location':
        filtered.sort((a, b) => (a.location || '').localeCompare(b.location || ''));
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
        break;
    }

    setFilteredJobs(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [jobs, searchTerm, sortBy, priceFilter, purchaseCounts, jobType]);

  const handleAcceptJob = async (job: JobData) => {
    if (!user || !user.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to accept jobs.",
        variant: "destructive",
      });
      return;
    }

    // Check if 3 technicians have already purchased this lead
    if (jobType === 'board') {
      const purchaseCount = purchaseCounts.get(job.id) || 0;
      if (purchaseCount >= 3) {
        toast({
          title: "Lead Unavailable",
          description: "This lead is no longer available (maximum 3 purchases reached).",
          variant: "destructive",
        });
        return;
      }
    }

    // Check if user is a technician - try both user_id and direct lookup by email
    let technicianData = null;
    let techError = null;
    
    // First try with user_id - include credits in selection
    const { data: techData1, error: techError1 } = await supabase
      .from('technicians')
      .select('id, name, user_id, credits')
      .eq('user_id', user.id)
      .single();
    
    if (techData1 && !techError1) {
      technicianData = techData1;
    } else {
      // If that fails, try looking up by email (for Google OAuth users)
      const { data: techData2, error: techError2 } = await supabase
        .from('technicians')
        .select('id, name, user_id, contact_email, credits')
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

    // Check if this is a credit job and if technician has enough credits
    if (jobType === 'board') {
      const creditCost = Math.round((job.quote_price || 0) * 0.1);
      if ((technicianData.credits || 0) < creditCost) {
        toast({
          title: "Insufficient Credits",
          description: `You need ${creditCost} credits to purchase this lead. You currently have ${technicianData.credits || 0} credits.`,
          variant: "destructive",
        });
        return;
      }
    }

    try {
      setAcceptingJobId(job.id);

      // Accept the job using the service
      const { success, error: acceptError, assignmentId } = await JobService.acceptJob(
        job.id,
        technicianData.id,
        technicianData.name
      );

      if (!success || !assignmentId) {
        toast({
          title: "Assignment Failed",
          description: "Failed to assign the job. It may have been taken by another technician.",
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

      // Note: Credit deduction is handled by the API server in JobService.acceptJob()
      // No need to deduct credits here as it's already done server-side

      // Refresh user data to update credits display in UI
      if (jobType === 'board') {
        await refreshUser();
        console.log('🔄 Refreshed user data after credit deduction');
      }

      // Update local state
      setAcceptedJobs(prev => new Set([...prev, job.id]));
      
      const actionText = jobType === 'board' ? 'purchased the lead for' : 'accepted the job for';
      toast({
        title: jobType === 'board' ? "Lead Purchased!" : "Job Accepted!",
        description: `You have successfully ${actionText} ${job.full_name}. It has been added to your calendar.`,
        variant: "default",
      });

      // Refresh jobs list to remove accepted job
      fetchJobs();

      // Call parent callback
      onJobAccepted?.(job);

    } catch (error) {
      console.error('Error accepting job:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while accepting the job.",
        variant: "destructive",
      });
    } finally {
      setAcceptingJobId(null);
    }
  };

  const renderFiltersAndControls = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by customer, vehicle, location, service type, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg">
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="timeline">By Urgency</SelectItem>
              <SelectItem value="price-desc">{jobType === 'board' ? 'Credits: High to Low' : 'Price: High to Low'}</SelectItem>
              <SelectItem value="price-asc">{jobType === 'board' ? 'Credits: Low to High' : 'Price: Low to High'}</SelectItem>
              <SelectItem value="location">By Location</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priceFilter} onValueChange={setPriceFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg">
              <SelectItem value="all">{jobType === 'board' ? 'All Credits' : 'All Prices'}</SelectItem>
              <SelectItem value="under-100">{jobType === 'board' ? 'Under 10 Credits' : 'Under £100'}</SelectItem>
              <SelectItem value="100-200">{jobType === 'board' ? '10 - 20 Credits' : '£100 - £200'}</SelectItem>
              <SelectItem value="200-300">{jobType === 'board' ? '20 - 30 Credits' : '£200 - £300'}</SelectItem>
              <SelectItem value="over-300">{jobType === 'board' ? 'Over 30 Credits' : 'Over £300'}</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          <Button onClick={fetchJobs} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Active filters */}
      <div className="flex flex-wrap gap-2 mt-3">
        {searchTerm && (
          <Badge variant="secondary" className="flex items-center gap-1">
            Search: "{searchTerm}"
            <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-red-600">×</button>
          </Badge>
        )}
        {priceFilter !== 'all' && (
          <Badge variant="secondary" className="flex items-center gap-1">
            {jobType === 'board' ? 'Credits:' : 'Price:'} {priceFilter}
            <button onClick={() => setPriceFilter('all')} className="ml-1 hover:text-red-600">×</button>
          </Badge>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        {renderFiltersAndControls()}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg h-80 w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="p-6">
        {renderFiltersAndControls()}
        <div className="flex flex-col items-center justify-center py-16">
          <Car className="w-20 h-20 text-gray-300 mb-6" />
          <h3 className="text-xl font-bold text-gray-900 mb-3">No Available Jobs</h3>
          <p className="text-gray-600 text-center max-w-md mb-6">
            There are currently no quoted jobs available for assignment. 
            Check back later or contact your administrator.
          </p>
          <Button 
            onClick={fetchJobs} 
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Jobs
          </Button>
        </div>
      </div>
    );
  }

  if (filteredJobs.length === 0 && (searchTerm || priceFilter !== 'all')) {
    return (
      <div className="p-6">
        {renderFiltersAndControls()}
        <div className="flex flex-col items-center justify-center py-16">
          <Filter className="w-20 h-20 text-gray-300 mb-6" />
          <h3 className="text-xl font-bold text-gray-900 mb-3">No Jobs Match Your Filters</h3>
          <p className="text-gray-600 text-center max-w-md mb-6">
            Try adjusting your search terms or filters to see more results.
          </p>
          <Button 
            onClick={() => {
              setSearchTerm('');
              setPriceFilter('all');
            }} 
            variant="outline"
          >
            Clear All Filters
          </Button>
        </div>
      </div>
    );
  }

  const getJobTypeTitle = () => {
    switch (jobType) {
      case 'exclusive':
        return 'Exclusive Jobs';
      case 'board':
        return 'Job Board';
      case 'bids':
        return 'Job Bids';
      default:
        return 'Available Jobs';
    }
  };

  const getJobTypeDescription = () => {
    switch (jobType) {
      case 'exclusive':
        return 'Premium jobs exclusively available to you';
      case 'board':
        return '';
      case 'bids':
        return 'Jobs open for competitive bidding';
      default:
        return 'Jobs available for assignment';
    }
  };

  // Render exclusive jobs with swipe interface
  if (jobType === 'exclusive') {
    console.log('JobsGrid: Rendering exclusive jobs view for jobType:', jobType);
    return (
      <div className="w-full h-full flex flex-col">
        <div className="hidden sm:block mt-8 sm:mt-12 md:mt-16 mb-6 sm:mb-8 md:mb-10 text-center px-3 sm:px-4 md:px-6 flex-shrink-0">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">{getJobTypeTitle()}</h2>
          <p className="text-xs sm:text-sm md:text-base text-gray-600 leading-tight">{getJobTypeDescription()}</p>
        </div>
        <div className="flex-1 min-h-0">
          <ExclusiveJobsView onJobAccepted={onJobAccepted} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        {renderFiltersAndControls()}
        
        {/* Header with stats */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{getJobTypeTitle()}</h2>
              <p className="text-gray-600">
                Showing {filteredJobs.length} of {jobs.length} job{jobs.length !== 1 ? 's' : ''} - {getJobTypeDescription()}
              </p>
            </div>
            {jobType !== 'board' && (
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="px-3 py-1">
                  Total Value: £{filteredJobs.reduce((sum, job) => sum + (job.quote_price || 0), 0).toFixed(2)}
                </Badge>
              </div>
            )}
          </div>
        </div>
        
        {/* Jobs List - Mobile Optimized Cards */}
        <div className="space-y-4 sm:space-y-3 max-w-7xl mx-auto px-4 sm:px-0">
          {(() => {
            const startIndex = (currentPage - 1) * jobsPerPage;
            const endIndex = startIndex + jobsPerPage;
            const currentJobs = filteredJobs.slice(startIndex, endIndex);
            
            return currentJobs.map((job) => (
              <div key={job.id} className="w-full max-w-md mx-auto sm:max-w-none">
                <JobCard
                  job={job}
                  onAccept={handleAcceptJob}
                  isAccepted={acceptedJobs.has(job.id)}
                  isAccepting={acceptingJobId === job.id}
                  showCredits={jobType === 'board'}
                  purchaseCount={purchaseCounts.get(job.id) || 0}
                />
              </div>
            ));
          })()}
        </div>

        {/* Mobile-Friendly Pagination Controls */}
        {filteredJobs.length > jobsPerPage && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-8 px-4 gap-4">
            <div className="text-sm text-gray-600 text-center sm:text-left">
              Showing {Math.min((currentPage - 1) * jobsPerPage + 1, filteredJobs.length)} to{' '}
              {Math.min(currentPage * jobsPerPage, filteredJobs.length)} of {filteredJobs.length} jobs
            </div>
            
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-2 border-[#145484] text-[#145484] hover:bg-[#145484] hover:text-white disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-transparent disabled:hover:text-gray-400 h-10 px-4 sm:h-8 sm:px-3"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Prev</span>
              </Button>
              
              <div className="flex items-center gap-1">
                {(() => {
                  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
                  const pages = [];
                  const showPages = 5;
                  const startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
                  const endPage = Math.min(totalPages, startPage + showPages - 1);
                  
                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <Button
                        key={i}
                        variant={i === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(i)}
                        className={`w-10 h-10 sm:w-10 sm:h-8 ${i === currentPage ? 'bg-[#145484] hover:bg-[#1a5294]' : 'border-[#145484] text-[#145484] hover:bg-[#145484] hover:text-white'}`}
                      >
                        {i}
                      </Button>
                    );
                  }
                  return pages;
                })()}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredJobs.length / jobsPerPage)))}
                disabled={currentPage >= Math.ceil(filteredJobs.length / jobsPerPage)}
                className="flex items-center gap-2 border-[#145484] text-[#145484] hover:bg-[#145484] hover:text-white disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-transparent disabled:hover:text-gray-400 h-10 px-4 sm:h-8 sm:px-3"
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">Next</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
