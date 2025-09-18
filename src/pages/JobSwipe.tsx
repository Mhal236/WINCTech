import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { JobsGrid, JobType } from "@/components/jobs/JobsGrid";
import { JobData } from "@/components/jobs/JobCard";
import { useNavigate } from "react-router-dom";
import { SlidePageTransition } from "@/components/PageTransition";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Briefcase, Star, DollarSign, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const JobSwipe = () => {
  const navigate = useNavigate();
  const [selectedJobType, setSelectedJobType] = useState<JobType>('board');

  const handleJobAccepted = (job: JobData) => {
    // Job has been accepted and added to calendar
    toast({
      title: "Job Accepted!",
      description: `Job for ${job.full_name} has been added to your calendar.`,
    });
    
    // Optionally navigate to calendar or stay on jobs page
    // navigate('/calendar');
  };

  const handleJobTypeChange = (value: JobType) => {
    setSelectedJobType(value);
  };

  const getJobTypeIcon = (jobType: JobType) => {
    switch (jobType) {
      case 'exclusive':
        return <Star className="w-5 h-5 text-yellow-500" />;
      case 'board':
        return <Briefcase className="w-5 h-5 text-blue-500" />;
      case 'bids':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      default:
        return <Briefcase className="w-5 h-5 text-gray-500" />;
    }
  };

  const getJobTypeDescription = (jobType: JobType) => {
    switch (jobType) {
      case 'exclusive':
        return 'Premium high-value jobs reserved for top technicians';
      case 'board':
        return '';
      case 'bids':
        return 'Competitive bidding opportunities';
      default:
        return 'Available jobs for assignment';
    }
  };

  return (
    <DashboardLayout>
      <SlidePageTransition>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          {/* Enhanced Header */}
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-6 py-8">
              <div className="hidden sm:flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                   
                    <h1 className="text-4xl font-bold text-gray-900">Jobs</h1>
                  </div>
                  <p className="text-gray-600 text-lg">
                    Find and accept windscreen repair jobs in your area
                  </p>
                </div>
                
                {/* Job Type Selector */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center gap-3">
                    <label htmlFor="job-type-select" className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                      Job Type:
                    </label>
                    <Select value={selectedJobType} onValueChange={handleJobTypeChange}>
                      <SelectTrigger id="job-type-select" className="w-[200px] bg-white border-2 border-gray-200 hover:border-blue-300">
                        <SelectValue placeholder="Select job type" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg">
                        <SelectItem value="exclusive" className="flex items-center gap-2">
                          <div className="flex items-center gap-2 w-full">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span>Exclusive Jobs</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="board" className="flex items-center gap-2">
                          <div className="flex items-center gap-2 w-full">
                            <Briefcase className="w-4 h-4 text-blue-500" />
                            <span>Buy Leads</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="bids" className="flex items-center gap-2">
                          <div className="flex items-center gap-2 w-full">
                            <TrendingUp className="w-4 h-4 text-green-500" />
                            <span>Buy Jobs</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              {/* Mobile-only Job Type Selector */}
              <div className="sm:hidden px-6 py-4">
                <div className="flex items-center gap-3">
                  <label htmlFor="job-type-select-mobile" className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                    Job Type:
                  </label>
                  <Select value={selectedJobType} onValueChange={handleJobTypeChange}>
                    <SelectTrigger id="job-type-select-mobile" className="w-[200px] bg-white border-2 border-gray-200 hover:border-blue-300">
                      <SelectValue placeholder="Select job type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg">
                      <SelectItem value="exclusive" className="flex items-center gap-2">
                        <div className="flex items-center gap-2 w-full">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span>Exclusive Jobs</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="board" className="flex items-center gap-2">
                        <div className="flex items-center gap-2 w-full">
                          <Briefcase className="w-4 h-4 text-blue-500" />
                          <span>Job Board</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="bids" className="flex items-center gap-2">
                        <div className="flex items-center gap-2 w-full">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          <span>Job Bids</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Job Type Info Card */}
             
            </div>
          </div>
          
          <JobsGrid onJobAccepted={handleJobAccepted} jobType={selectedJobType} />
        </div>
      </SlidePageTransition>
    </DashboardLayout>
  );
};

export default JobSwipe; 