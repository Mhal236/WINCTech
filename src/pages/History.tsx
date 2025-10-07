import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Clock, Filter, ArrowUp, Briefcase, Calendar, Users, MoreVertical, MapPin, Phone, Car, User, UserX, AlertTriangle, Zap, Target, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { JobService } from "@/services/jobService";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface AcceptedJob {
  id: string;
  customer_name: string;
  customer_phone?: string;
  location?: string;
  appointment_date: string;
  time_slot?: string;
  status: string;
  quote_price?: number;
  vehicle_info?: string;
  service_type?: string;
  glass_type?: string;
  vehicle_reg?: string;
  brand?: string;
  model?: string;
  year?: string;
  assigned_at: string;
  completed_at?: string;
  job_type?: 'job_lead' | 'exclusive' | 'unknown';
}

const History = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [acceptedJobs, setAcceptedJobs] = useState<AcceptedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [unassigningJobId, setUnassigningJobId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedJob, setSelectedJob] = useState<AcceptedJob | null>(null);
  const [isJobDetailsOpen, setIsJobDetailsOpen] = useState(false);
  const [stats, setStats] = useState({
    active: 0,
    completed: 0,
    scheduled: 0,
    total: 0,
    jobLeads: 0,
    exclusive: 0
  });
  const { user } = useAuth();
  const navigate = useNavigate();

  // Handle view in calendar
  const handleViewInCalendar = (job: AcceptedJob) => {
    // Navigate to calendar page with the job's appointment date
    if (job.appointment_date) {
      const appointmentDate = new Date(job.appointment_date);
      const year = appointmentDate.getFullYear();
      const month = appointmentDate.getMonth();
      
      // Navigate to calendar page with query params to highlight the specific date
      navigate(`/calendar?date=${job.appointment_date}&jobId=${job.id}`);
    } else {
      // If no appointment date, just go to calendar
      navigate('/calendar');
    }
    
    toast({
      title: "Opening Calendar",
      description: `Navigating to calendar${job.appointment_date ? ` for ${job.appointment_date}` : ''}`,
    });
  };

  // Handle job card click to show details
  const handleJobClick = (job: AcceptedJob) => {
    setSelectedJob(job);
    setIsJobDetailsOpen(true);
  };

  // Filter jobs based on active tab and search/filter criteria
  const getFilteredJobs = () => {
    let filtered = acceptedJobs;

    // Filter by tab
    if (activeTab === 'job_leads') {
      filtered = filtered.filter(job => job.job_type === 'job_lead');
    } else if (activeTab === 'exclusive') {
      filtered = filtered.filter(job => job.job_type === 'exclusive');
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(job => 
        job.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.vehicle_reg?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter(job => job.status === filterStatus);
    }

    return filtered;
  };

  const filteredJobs = getFilteredJobs();

  useEffect(() => {
    if (user?.id) {
      fetchAcceptedJobs();
    }
  }, [user?.id]);

  const fetchAcceptedJobs = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      console.log('History: Fetching jobs for user:', { userId: user.id, email: user.email });
      
      // Get technician ID first
      let technicianId = null;
      const { data: techData1, error: techError1 } = await supabase
        .from('technicians')
        .select('id, name, user_id, contact_email')
        .eq('user_id', user.id)
        .single();
      
      console.log('History: Technician lookup by user_id result:', { techData1, techError1 });
      
      if (techData1) {
        technicianId = techData1.id;
      } else {
        // Try by email for Google OAuth users
        const { data: techData2, error: techError2 } = await supabase
          .from('technicians')
          .select('id, name, user_id, contact_email')
          .eq('contact_email', user.email)
          .single();
        
        console.log('🔵 History: Technician lookup by email result:', { techData2, techError2 });
        
        if (techData2) {
          technicianId = techData2.id;
        }
      }

      console.log('History: Final technician ID:', technicianId);

      if (!technicianId) {
        console.log('History: No technician found for user');
        return;
      }

      // Use server endpoint to fetch jobs
      try {
        const response = await fetch('/api/technician/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ technicianId })
        });
        const serverResult = await response.json();
        console.log('🔵 History: Server endpoint result:', serverResult);
        
        if (serverResult.success && serverResult.data) {
          // Use server data and categorize jobs
          const serverJobs = serverResult.data.map((assignment: any) => {
            // Categorize job type based on quote price or other criteria
            // Higher value jobs (>£400) are likely exclusive, lower are job leads
            const price = assignment.MasterCustomer.quote_price || 0;
            const jobType = price >= 400 ? 'exclusive' : 'job_lead';
            
            return {
              id: assignment.MasterCustomer.id,
              customer_name: assignment.MasterCustomer.full_name,
              customer_phone: assignment.MasterCustomer.mobile,
              location: assignment.MasterCustomer.location,
              appointment_date: assignment.MasterCustomer.appointment_date,
              time_slot: assignment.MasterCustomer.time_slot,
              status: assignment.status,
              quote_price: assignment.MasterCustomer.quote_price,
              service_type: assignment.MasterCustomer.service_type,
              glass_type: assignment.MasterCustomer.glass_type,
              vehicle_reg: assignment.MasterCustomer.vehicle_reg,
              brand: assignment.MasterCustomer.brand,
              model: assignment.MasterCustomer.model,
              year: assignment.MasterCustomer.year,
              assigned_at: assignment.assigned_at,
              completed_at: assignment.completed_at,
              vehicle_info: `${assignment.MasterCustomer.year || ''} ${assignment.MasterCustomer.brand || ''} ${assignment.MasterCustomer.model || ''}`.trim(),
              job_type: jobType
            };
          });
          
          setAcceptedJobs(serverJobs);
          
          // Calculate stats
          const active = serverJobs.filter((j: any) => j.status === 'assigned' || j.status === 'in_progress').length;
          const completed = serverJobs.filter((j: any) => j.status === 'completed').length;
          const scheduled = serverJobs.filter((j: any) => j.status === 'assigned').length;
          const jobLeads = serverJobs.filter((j: any) => j.job_type === 'job_lead').length;
          const exclusive = serverJobs.filter((j: any) => j.job_type === 'exclusive').length;
          
          setStats({
            active,
            completed,
            scheduled,
            total: serverJobs.length,
            jobLeads,
            exclusive
          });
        }
      } catch (serverError) {
        console.error('🔴 History: Server endpoint failed:', serverError);
      }
    } catch (error) {
      console.error('🔴 History: Error fetching accepted jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignJob = async (job: AcceptedJob) => {
    if (!user?.id) return;

    try {
      setUnassigningJobId(job.id);
      
      // Get technician ID
      const { data: techData } = await supabase
        .from('technicians')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!techData) {
        toast({
          title: "Error",
          description: "Could not find technician profile",
          variant: "destructive",
        });
        return;
      }

      const result = await JobService.unassignJob(job.id, techData.id);
      
      if (result.success) {
        toast({
          title: "Job Unassigned",
          description: `${job.customer_name}'s job has been unassigned and returned to the job pool.`,
        });
        
        // Refresh the jobs list
        fetchAcceptedJobs();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to unassign job",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error unassigning job:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setUnassigningJobId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "assigned":
        return "bg-blue-100 text-blue-600 border-blue-200";
      case "in_progress":
        return "bg-yellow-100 text-yellow-600 border-yellow-200";
      case "completed":
        return "bg-green-100 text-green-600 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-600 border-red-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const jobStats = [
    {
      title: "Active Jobs",
      value: stats.active.toString(),
      change: `${stats.active} in progress`,
      trend: "up",
      icon: Briefcase,
    },
    {
      title: "Completed",
      value: stats.completed.toString(),
      change: `${stats.completed} finished`,
      trend: "up",
      icon: Clock,
    },
    {
      title: "Scheduled",
      value: stats.scheduled.toString(),
      change: `${stats.scheduled} upcoming`,
      trend: "up",
      icon: Calendar,
    },
    {
      title: "Total Accepted",
      value: stats.total.toString(),
      change: `${stats.total} total`,
      trend: "neutral",
      icon: Users,
    },
  ];

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Enhanced Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 rounded-b-2xl">
          <div className="px-6 py-8">
            <div className="flex flex-col gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold text-gray-900">Jobs Dashboard</h1>
                </div>
                <p className="text-gray-600 text-lg">
                  Manage and track all jobs
                </p>
              </div>
              <Button className="bg-[#135084] hover:bg-[#135084]/90 w-fit">
                <Plus className="h-5 w-5 mr-2" />
                New Job
              </Button>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-8">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {jobStats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                    <h3 className="text-2xl font-bold mt-2">{stat.value}</h3>
                  </div>
                  <div className={`p-2 rounded-lg ${stat.trend === "up" ? "bg-blue-100" : "bg-gray-100"}`}>
                    <stat.icon className={`w-5 h-5 ${stat.trend === "up" ? "text-blue-600" : "text-gray-600"}`} />
                  </div>
                </div>
                <div className="flex items-center mt-4">
                  {stat.trend === "up" && <ArrowUp className="w-4 h-4 text-blue-600" />}
                  <span className={`text-sm ml-1 ${stat.trend === "up" ? "text-blue-600" : "text-gray-600"}`}>
                    {stat.change}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters and Search */}
        <Card className="border-[#3d99be]/20">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 flex gap-4">
                <Input
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px] bg-white border-gray-200 shadow-sm">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md">
                    <SelectItem value="all" className="hover:bg-gray-50">All Status</SelectItem>
                    <SelectItem value="assigned" className="hover:bg-gray-50">Assigned</SelectItem>
                    <SelectItem value="in_progress" className="hover:bg-gray-50">In Progress</SelectItem>
                    <SelectItem value="completed" className="hover:bg-gray-50">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Job Type Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              All Jobs ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="job_leads" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Job Leads ({stats.jobLeads})
            </TabsTrigger>
            <TabsTrigger value="exclusive" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Exclusive ({stats.exclusive})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4 mt-6">
            <div className="grid gap-4">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredJobs.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Jobs Found</h3>
                    <p className="text-gray-600">
                      You haven't accepted any jobs yet. Visit the Jobs tab to start accepting jobs.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredJobs.map(job => (
                  <Card 
                    key={job.id} 
                    className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-[#3d99be] cursor-pointer"
                    onClick={() => handleJobClick(job)}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="flex-1 space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-lg text-[#3d99be] flex items-center gap-2">
                                {job.job_type === 'exclusive' ? (
                                  <Zap className="w-5 h-5 text-[#FFC107]" />
                                ) : (
                                  <Target className="w-5 h-5 text-[#135084]" />
                                )}
                                {job.customer_name}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={`text-xs ${getStatusColor(job.status)}`}>
                                  {job.status}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {job.job_type === 'exclusive' ? 'Exclusive Job' : 'Job Lead'}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-[#3d99be]">
                                £{job.quote_price?.toFixed(2) || '0.00'}
                              </p>
                            </div>
                          </div>

                          {/* Job Details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {job.appointment_date && (
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span><strong>Date:</strong> {job.appointment_date}</span>
                              </div>
                            )}
                            {job.location && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-gray-400" />
                                <span><strong>Location:</strong> {job.location}</span>
                              </div>
                            )}
                            {job.vehicle_info && (
                              <div className="flex items-center gap-2">
                                <Car className="h-4 w-4 text-gray-400" />
                                <span><strong>Vehicle:</strong> {job.vehicle_info}</span>
                              </div>
                            )}
                            {job.customer_phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-gray-400" />
                                <span><strong>Phone:</strong> {job.customer_phone}</span>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex justify-between items-center pt-4 border-t">
                            <div className="text-xs text-gray-500">
                              Accepted: {new Date(job.assigned_at).toLocaleDateString()}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg rounded-md min-w-[160px]">
                                <DropdownMenuItem onClick={() => handleViewInCalendar(job)} className="hover:bg-gray-50 focus:bg-gray-50">
                                  <Calendar className="h-4 w-4 mr-2" />
                                  View in Calendar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-gray-200" />
                                {job.status !== 'completed' && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="hover:bg-red-50 focus:bg-red-50 text-red-600">
                                        <UserX className="h-4 w-4 mr-2" />
                                        Unassign Job
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Unassign Job?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to unassign this job? It will be returned to the available jobs pool.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleUnassignJob(job)}
                                          disabled={unassigningJobId === job.id}
                                        >
                                          {unassigningJobId === job.id ? "Unassigning..." : "Unassign"}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="job_leads" className="space-y-4 mt-6">
            <div className="grid gap-4">
              {filteredJobs.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Job Leads</h3>
                    <p className="text-gray-600">
                      No job leads accepted yet. Job leads are typically lower-value repairs (under £400).
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredJobs.map(job => (
                  <Card 
                    key={job.id} 
                    className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-[#135084] cursor-pointer"
                    onClick={() => handleJobClick(job)}
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg text-[#135084] flex items-center gap-2">
                            <Target className="w-5 h-5" />
                            {job.customer_name}
                          </h3>
                          <p className="text-sm text-gray-600">£{job.quote_price?.toFixed(2)} • Job Lead</p>
                        </div>
                        <Badge className={`text-xs ${getStatusColor(job.status)}`}>
                          {job.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="exclusive" className="space-y-4 mt-6">
            <div className="grid gap-4">
              {filteredJobs.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Zap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Exclusive Jobs</h3>
                    <p className="text-gray-600">
                      No exclusive jobs accepted yet. Exclusive jobs are high-value opportunities (£400+).
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredJobs.map(job => (
                  <Card 
                    key={job.id} 
                    className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-[#FFC107] cursor-pointer"
                    onClick={() => handleJobClick(job)}
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg text-[#FFC107] flex items-center gap-2">
                            <Zap className="w-5 h-5" />
                            {job.customer_name}
                          </h3>
                          <p className="text-sm text-gray-600">£{(() => {
                            // Helper function to count total windows affected in the job
                            const countWindows = (): number => {
                              try {
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

                                const windowDamage = parseJsonField(job.window_damage);
                                const selectedWindows = parseJsonField(job.selected_windows);
                                
                                if (windowDamage.length > 0) {
                                  // Count unique window damage entries
                                  let count = 0;
                                  windowDamage.forEach(damage => {
                                    if (typeof damage === 'object' && damage !== null) {
                                      count += Object.keys(damage).length;
                                    }
                                  });
                                  return count;
                                } else if (selectedWindows.length > 0) {
                                  // Count glass codes from selected windows
                                  let codes: string[] = [];
                                  selectedWindows.forEach(window => {
                                    if (Array.isArray(window)) {
                                      window.forEach(item => {
                                        if (typeof item === 'string') {
                                          codes.push(item);
                                        }
                                      });
                                    } else if (typeof window === 'string') {
                                      codes.push(window);
                                    }
                                  });
                                  return codes.length;
                                }
                                
                                return 1;
                              } catch {
                                return 1;
                              }
                            };

                            // Determine if this is an exclusive job and get pricing
                            if (job.job_type === 'exclusive') {
                              const windowCount = countWindows();
                              const exclusivePrice = windowCount > 1 ? 170 : 140;
                              return exclusivePrice.toFixed(2);
                            }
                            
                            return job.quote_price?.toFixed(2) || '0.00';
                          })()} • Exclusive</p>
                        </div>
                        <Badge className={`text-xs ${getStatusColor(job.status)}`}>
                          {job.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Job Details Modal */}
        {selectedJob && (
          <Dialog open={isJobDetailsOpen} onOpenChange={setIsJobDetailsOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedJob.job_type === 'exclusive' ? (
                    <Zap className="h-5 w-5 text-[#FFC107]" />
                  ) : (
                    <Target className="h-5 w-5 text-[#135084]" />
                  )}
                  {selectedJob.customer_name}
                  <Badge className={`text-xs ml-2 ${getStatusColor(selectedJob.status)}`}>
                    {selectedJob.status}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Job Type and Price */}
                <div className="bg-amber-50 border border-[#FFC107] rounded-lg p-4">
                  <div className={selectedJob.job_type === 'exclusive' ? "flex justify-between items-center" : ""}>
                    <div>
                      <h4 className="font-semibold text-[#1D1D1F]">
                        {selectedJob.job_type === 'exclusive' ? 'Exclusive Job' : 'Job Lead'}
                      </h4>
                      <p className="text-sm text-[#1D1D1F]/80">
                        {selectedJob.job_type === 'exclusive' 
                          ? 'High-value windscreen repair opportunity' 
                          : 'Standard windscreen repair job'}
                      </p>
                    </div>
                    {selectedJob.job_type === 'exclusive' && (
                      <div className="text-right">
                        <p className="text-2xl font-bold text-[#FFC107]">
                          £{(() => {
                            // Helper function to count windows for the selected job
                            const countWindows = (): number => {
                              try {
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

                                const windowDamage = parseJsonField(selectedJob.window_damage);
                                const selectedWindows = parseJsonField(selectedJob.selected_windows);
                                
                                if (windowDamage.length > 0) {
                                  let count = 0;
                                  windowDamage.forEach(damage => {
                                    if (typeof damage === 'object' && damage !== null) {
                                      count += Object.keys(damage).length;
                                    }
                                  });
                                  return count;
                                } else if (selectedWindows.length > 0) {
                                  let codes: string[] = [];
                                  selectedWindows.forEach(window => {
                                    if (Array.isArray(window)) {
                                      window.forEach(item => {
                                        if (typeof item === 'string') {
                                          codes.push(item);
                                        }
                                      });
                                    } else if (typeof window === 'string') {
                                      codes.push(window);
                                    }
                                  });
                                  return codes.length;
                                }
                                
                                return 1;
                              } catch {
                                return 1;
                              }
                            };

                            const windowCount = countWindows();
                            const exclusivePrice = windowCount > 1 ? 170 : 140;
                            return exclusivePrice.toFixed(2);
                          })()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Customer Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-gray-500">Full Name</label>
                        <p className="text-sm font-medium">{selectedJob.customer_name}</p>
                      </div>
                      {selectedJob.customer_phone && (
                        <div>
                          <label className="text-xs font-medium text-gray-500">Phone</label>
                          <p className="text-sm">{selectedJob.customer_phone}</p>
                        </div>
                      )}
                      {selectedJob.location && (
                        <div>
                          <label className="text-xs font-medium text-gray-500">Location</label>
                          <p className="text-sm">{selectedJob.location}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Car className="h-4 w-4" />
                        Vehicle Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedJob.vehicle_reg && (
                        <div>
                          <label className="text-xs font-medium text-gray-500">Registration</label>
                          <p className="text-sm font-medium">{selectedJob.vehicle_reg}</p>
                        </div>
                      )}
                      {selectedJob.vehicle_info && (
                        <div>
                          <label className="text-xs font-medium text-gray-500">Vehicle</label>
                          <p className="text-sm">{selectedJob.vehicle_info}</p>
                        </div>
                      )}
                      {selectedJob.service_type && (
                        <div>
                          <label className="text-xs font-medium text-gray-500">Service Type</label>
                          <p className="text-sm">{selectedJob.service_type}</p>
                        </div>
                      )}
                      {selectedJob.glass_type && (
                        <div>
                          <label className="text-xs font-medium text-gray-500">Glass Type</label>
                          <p className="text-sm">{selectedJob.glass_type}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Job Details */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Job Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedJob.service_type && (
                      <div>
                        <label className="text-xs font-medium text-gray-500">Service Type</label>
                        <p className="text-sm font-medium">{selectedJob.service_type}</p>
                      </div>
                    )}
                    {selectedJob.glass_type && (
                      <div>
                        <label className="text-xs font-medium text-gray-500">Glass Type</label>
                        <p className="text-sm">{selectedJob.glass_type}</p>
                      </div>
                    )}
                    {selectedJob.adas_calibration && (
                      <div>
                        <label className="text-xs font-medium text-gray-500">ADAS Calibration</label>
                        <p className="text-sm">{selectedJob.adas_calibration}</p>
                      </div>
                    )}
                    {selectedJob.delivery_type && (
                      <div>
                        <label className="text-xs font-medium text-gray-500">Delivery Type</label>
                        <p className="text-sm">{selectedJob.delivery_type}</p>
                      </div>
                    )}
                    {selectedJob.timeline && (
                      <div>
                        <label className="text-xs font-medium text-gray-500">Timeline</label>
                        <p className="text-sm">{selectedJob.timeline}</p>
                      </div>
                    )}
                    {selectedJob.duration && (
                      <div>
                        <label className="text-xs font-medium text-gray-500">Duration</label>
                        <p className="text-sm">{selectedJob.duration}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Window/Damage Details */}
                {(() => {
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

                  const windowDamage = parseJsonField(selectedJob.window_damage);
                  const selectedWindows = parseJsonField(selectedJob.selected_windows);
                  const windowSpec = parseJsonField(selectedJob.window_spec);
                  
                  const getGlassTypeName = (type: string): string => {
                    if (!type) return '';
                    if (type.includes('_ws') || type.toLowerCase().includes('windscreen')) return 'Windscreen';
                    if (type.includes('_rw') || type.toLowerCase().includes('rear')) return 'Rear Window';
                    if (type.includes('_df')) return "Driver's Front Window";
                    if (type.includes('_pf')) return "Passenger's Front Window";
                    if (type.includes('_dr')) return "Driver's Rear Window";
                    if (type.includes('_pr')) return "Passenger's Rear Window";
                    return type;
                  };

                  const extractGlassCodesFromWindows = (selectedWindows: any[]): string[] => {
                    const codes: string[] = [];
                    selectedWindows.forEach(window => {
                      if (Array.isArray(window)) {
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

                  const extractDamageInfo = (windowDamage: any[]): Array<{code: string, damageType: string}> => {
                    const damageInfo: Array<{code: string, damageType: string}> = [];
                    windowDamage.forEach(damage => {
                      if (typeof damage === 'object' && damage !== null) {
                        Object.entries(damage).forEach(([code, damageType]) => {
                          damageInfo.push({ code, damageType: damageType as string });
                        });
                      }
                    });
                    return damageInfo;
                  };

                  if (windowDamage.length > 0 || selectedWindows.length > 0 || windowSpec.length > 0) {
                    return (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Car className="h-4 w-4" />
                            Window Details
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {windowDamage.length > 0 && (
                            <div>
                              <label className="text-xs font-medium text-gray-500 mb-2 block">Damage Information</label>
                              <div className="space-y-2">
                                {extractDamageInfo(windowDamage).map((damage, index) => (
                                  <div key={index} className="flex items-center gap-2 bg-red-50 rounded-lg p-2.5 border border-red-200">
                                    <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                                    <div className="flex-1">
                                      <span className="font-semibold text-red-900 text-sm">
                                        {getGlassTypeName(damage.code)}
                                      </span>
                                      <span className="text-red-700 text-sm ml-2">
                                        ({damage.damageType})
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {selectedWindows.length > 0 && (
                            <div>
                              <label className="text-xs font-medium text-gray-500 mb-2 block">Selected Windows</label>
                              <div className="space-y-2">
                                {extractGlassCodesFromWindows(selectedWindows).map((code, index) => (
                                  <div key={index} className="flex items-center gap-2 bg-blue-50 rounded-lg p-2.5 border border-blue-200">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                                    <div className="flex-1">
                                      <span className="font-semibold text-blue-900 text-sm">
                                        {getGlassTypeName(code)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {windowSpec.length > 0 && (
                            <div>
                              <label className="text-xs font-medium text-gray-500 mb-2 block">Specifications</label>
                              <div className="flex flex-wrap gap-2">
                                {windowSpec.flat().filter(Boolean).map((spec, index) => (
                                  <span key={index} className="inline-block px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full border">
                                    {typeof spec === 'string' ? spec : spec?.label || spec?.name || spec?.value || ''}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  }
                  return null;
                })()}

                {/* Appointment Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Appointment Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedJob.appointment_date && (
                      <div>
                        <label className="text-xs font-medium text-gray-500">Date</label>
                        <p className="text-sm font-medium">{selectedJob.appointment_date}</p>
                      </div>
                    )}
                    {selectedJob.time_slot && (
                      <div>
                        <label className="text-xs font-medium text-gray-500">Time Slot</label>
                        <p className="text-sm">{selectedJob.time_slot}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-medium text-gray-500">Accepted On</label>
                      <p className="text-sm">{new Date(selectedJob.assigned_at).toLocaleDateString()}</p>
                    </div>
                    {selectedJob.completed_at && (
                      <div>
                        <label className="text-xs font-medium text-gray-500">Completed On</label>
                        <p className="text-sm">{new Date(selectedJob.completed_at).toLocaleDateString()}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => handleViewInCalendar(selectedJob)}
                    className="flex-1"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    View in Calendar
                  </Button>
                  {selectedJob.status !== 'completed' && (
                    <Button 
                      variant="destructive"
                      onClick={() => {
                        setIsJobDetailsOpen(false);
                        handleUnassignJob(selectedJob);
                      }}
                      disabled={unassigningJobId === selectedJob.id}
                      className="flex-1"
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      {unassigningJobId === selectedJob.id ? "Unassigning..." : "Unassign Job"}
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
      </div>
    </DashboardLayout>
  );
};

export default History;