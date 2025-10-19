import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { JobsGrid, JobType } from "@/components/jobs/InstantLeadsGrid";
import { JobData } from "@/components/jobs/InstantLeadCard";
import { useNavigate } from "react-router-dom";
import { SlidePageTransition } from "@/components/PageTransition";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Briefcase, Star, DollarSign, TrendingUp, ChevronDown, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const InstantLeads = () => {
  const navigate = useNavigate();
  const [selectedJobType, setSelectedJobType] = useState<JobType>('exclusive');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleJobAccepted = (job: JobData) => {
    // Job has been accepted and added to calendar
    console.log('📍 handleJobAccepted called, navigating to jobs page');
    toast({
      title: "Lead Purchased!",
      description: `Lead for ${job.full_name} has been added to your Jobs → Leads tab.`,
    });
    
    // Navigate to jobs management page with leads tab selected
    setTimeout(() => {
      console.log('🔄 Navigating to /jobs with leads tab');
      navigate('/jobs', { state: { tab: 'leads', leadId: job.id } });
    }, 500);
  };

  const handleJobTypeChange = (value: JobType) => {
    setSelectedJobType(value);
    setIsDropdownOpen(false);
  };

  const getJobTypeInfo = (jobType: JobType) => {
    switch (jobType) {
      case 'exclusive':
        return {
          icon: Star,
          label: 'Exclusive Leads',
          description: 'Premium lead opportunities',
          color: 'yellow'
        };
      case 'board':
        return {
          icon: Briefcase,
          label: 'Buy Leads',
          description: 'Purchase job leads',
          color: 'blue'
        };
      case 'bids':
        return {
          icon: TrendingUp,
          label: 'Buy Jobs',
          description: 'Bid on available jobs',
          color: 'green'
        };
    }
  };

  return (
    <DashboardLayout>
      <SlidePageTransition>
        <>
          <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-0 -left-4 w-96 h-96 bg-[#0FB8C1]/5 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-700" />
            </div>

            {/* Modern Header */}
            <div className="relative backdrop-blur-xl bg-white/80 border border-gray-200/50 shadow-sm rounded-3xl m-4">
              <div className="px-6 py-10">
                <div className="max-w-7xl mx-auto">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <div className="w-1 h-10 bg-gradient-to-b from-[#0FB8C1] via-[#0FB8C1]/70 to-transparent rounded-full" />
                        <h1 className="text-4xl font-light tracking-tight text-gray-900">
                          Instant Leads<span className="text-[#0FB8C1] font-normal">.</span>
                        </h1>
                      </div>
                      <p className="text-gray-600 text-base font-light ml-5 tracking-wide">
                        Buy leads and jobs instantly with credits
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-8 space-y-8 relative z-10 max-w-7xl mx-auto">
              <div>
                <div>
                
                {/* Futuristic Job Type Selector - Desktop */}
                <div className="hidden sm:block w-full">
                  <div className="relative">
                    {/* Glassmorphism container */}
                    <div className="relative bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-2xl p-1.5 shadow-xl shadow-gray-900/5">
                      {/* Animated background slider */}
                      <div 
                        className={cn(
                          "absolute top-1.5 h-[calc(100%-12px)] rounded-xl transition-all duration-500 ease-out",
                          "bg-gradient-to-br from-blue-500 via-blue-400 to-blue-500 shadow-lg",
                          selectedJobType === 'exclusive' && "left-1.5 w-[calc(33.333%-4px)]",
                          selectedJobType === 'board' && "left-[calc(33.333%+1px)] w-[calc(33.333%-4px)]",
                          selectedJobType === 'bids' && "left-[calc(66.666%+1px)] w-[calc(33.333%-4px)]"
                        )}
                      />
                      
                      {/* Subtle glow effect */}
                      <div 
                        className={cn(
                          "absolute top-1.5 h-[calc(100%-12px)] rounded-xl transition-all duration-500 ease-out blur-sm opacity-20",
                          selectedJobType === 'exclusive' && "left-1.5 w-[calc(33.333%-4px)] bg-blue-400",
                          selectedJobType === 'board' && "left-[calc(33.333%+1px)] w-[calc(33.333%-4px)] bg-blue-400",
                          selectedJobType === 'bids' && "left-[calc(66.666%+1px)] w-[calc(33.333%-4px)] bg-blue-400"
                        )}
                      />
                      
                      {/* Toggle buttons */}
                      <div className="relative grid grid-cols-3 gap-0">
                        <button
                          onClick={() => handleJobTypeChange('exclusive')}
                          className={cn(
                            "relative z-20 flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-500",
                            "group hover:scale-[1.01] active:scale-[0.99]",
                            selectedJobType === 'exclusive'
                              ? "text-white"
                              : "text-gray-600 hover:text-gray-800"
                          )}
                        >
                          <Star className={cn(
                            "w-3.5 h-3.5 mb-1 transition-all duration-500",
                            selectedJobType === 'exclusive' 
                              ? "text-white drop-shadow-sm" 
                              : "text-gray-400 group-hover:text-blue-400"
                          )} />
                          <span className={cn(
                            "text-xs font-medium tracking-wider transition-all duration-500",
                            selectedJobType === 'exclusive' 
                              ? "text-white/95 font-semibold" 
                              : "text-gray-600 group-hover:text-gray-800"
                          )}>
                            EXCLUSIVE
                          </span>
                          <div className={cn(
                            "text-[10px] mt-0.5 transition-all duration-500",
                            selectedJobType === 'exclusive' 
                              ? "text-white/70" 
                              : "text-gray-400 group-hover:text-gray-500"
                          )}>
                            Premium
                          </div>
                        </button>
                        
                        <button
                          onClick={() => handleJobTypeChange('board')}
                          className={cn(
                            "relative z-20 flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-500",
                            "group hover:scale-[1.01] active:scale-[0.99]",
                            selectedJobType === 'board'
                              ? "text-white"
                              : "text-gray-600 hover:text-gray-800"
                          )}
                        >
                          <Briefcase className={cn(
                            "w-3.5 h-3.5 mb-1 transition-all duration-500",
                            selectedJobType === 'board' 
                              ? "text-white drop-shadow-sm" 
                              : "text-gray-400 group-hover:text-blue-400"
                          )} />
                          <span className={cn(
                            "text-xs font-medium tracking-wider transition-all duration-500",
                            selectedJobType === 'board' 
                              ? "text-white/95 font-semibold" 
                              : "text-gray-600 group-hover:text-gray-800"
                          )}>
                            BUY LEADS
                          </span>
                          <div className={cn(
                            "text-[10px] mt-0.5 transition-all duration-500",
                            selectedJobType === 'board' 
                              ? "text-white/70" 
                              : "text-gray-400 group-hover:text-gray-500"
                          )}>
                            Purchase
                          </div>
                        </button>
                        
                        <button
                          onClick={() => handleJobTypeChange('bids')}
                          className={cn(
                            "relative z-20 flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-500",
                            "group hover:scale-[1.01] active:scale-[0.99]",
                            selectedJobType === 'bids'
                              ? "text-white"
                              : "text-gray-600 hover:text-gray-800"
                          )}
                        >
                          <TrendingUp className={cn(
                            "w-3.5 h-3.5 mb-1 transition-all duration-500",
                            selectedJobType === 'bids' 
                              ? "text-white drop-shadow-sm" 
                              : "text-gray-400 group-hover:text-blue-400"
                          )} />
                          <span className={cn(
                            "text-xs font-medium tracking-wider transition-all duration-500",
                            selectedJobType === 'bids' 
                              ? "text-white/95 font-semibold" 
                              : "text-gray-600 group-hover:text-gray-800"
                          )}>
                            BUY JOBS
                          </span>
                          <div className={cn(
                            "text-[10px] mt-0.5 transition-all duration-500",
                            selectedJobType === 'bids' 
                              ? "text-white/70" 
                              : "text-gray-400 group-hover:text-gray-500"
                          )}>
                            Bidding
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Custom Mobile Dropdown */}
                <div className="sm:hidden w-full relative">
                  {/* Dropdown Trigger */}
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full h-16 px-4 bg-white border-2 border-gray-200 rounded-xl shadow-sm hover:border-gray-300 focus:border-blue-500 focus:outline-none transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {(() => {
                          const info = getJobTypeInfo(selectedJobType);
                          const IconComponent = info.icon;
                          return (
                            <>
                              <IconComponent className="w-5 h-5 text-gray-600" />
                              <div className="text-left">
                                <div className="font-semibold text-gray-900">{info.label}</div>
                                <div className="text-sm text-gray-500">{info.description}</div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                      <ChevronDown className={cn(
                        "w-5 h-5 text-gray-400 transition-transform duration-200",
                        isDropdownOpen && "rotate-180"
                      )} />
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <>
                      {/* Backdrop */}
                      <div 
                        className="fixed inset-0 z-40"
                        onClick={() => setIsDropdownOpen(false)}
                      />
                      
                      {/* Dropdown Content */}
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                        <div className="py-2">
                          {(['exclusive', 'board', 'bids'] as JobType[]).map((jobType) => {
                            const info = getJobTypeInfo(jobType);
                            const IconComponent = info.icon;
                            const isSelected = selectedJobType === jobType;
                            
                            return (
                              <button
                                key={jobType}
                                onClick={() => handleJobTypeChange(jobType)}
                                className={cn(
                                  "w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150",
                                  "flex items-center gap-3",
                                  isSelected && "bg-gray-50"
                                )}
                              >
                                <IconComponent className="w-5 h-5 text-gray-600" />
                                <div className="flex-1">
                                  <div className={cn(
                                    "font-semibold",
                                    isSelected ? "text-gray-900" : "text-gray-700"
                                  )}>
                                    {info.label}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {info.description}
                                  </div>
                                </div>
                                {isSelected && (
                                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <JobsGrid onJobAccepted={handleJobAccepted} jobType={selectedJobType} />
          </div>
        </>
      </SlidePageTransition>
    </DashboardLayout>
  );
};

export default InstantLeads;

