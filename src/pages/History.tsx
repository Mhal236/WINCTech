import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Clock, Filter, ArrowUp, Briefcase, Calendar, Users, MoreVertical, MapPin, Phone, Car, User, UserX, AlertTriangle, Zap, Target, Info, Package, CheckCircle, Link2, UserCheck } from "lucide-react";
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
import { useNavigate, useLocation } from "react-router-dom";
import { LinkOrderToJob } from "@/components/orders/LinkOrderToJob";
import { PageTransition } from "@/components/PageTransition";

interface AcceptedJob {
  id: string;
  quote_id?: string;
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
  window_damage?: any;
  selected_windows?: any;
  window_spec?: any;
  adas_calibration?: string;
  delivery_type?: string;
  timeline?: string;
  duration?: string;
}

const History = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [acceptedJobs, setAcceptedJobs] = useState<AcceptedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [unassigningJobId, setUnassigningJobId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("completed");
  const [selectedJob, setSelectedJob] = useState<AcceptedJob | null>(null);
  const [isJobDetailsOpen, setIsJobDetailsOpen] = useState(false);
  const [stats, setStats] = useState({
    active: 0,
    completed: 0,
    scheduled: 0,
    total: 0,
    jobLeads: 0,
    exclusive: 0,
    glassOrders: 0
  });
  const [glassOrders, setGlassOrders] = useState<any[]>([]);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrderJobId, setSelectedOrderJobId] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle navigation state to auto-select tab
  useEffect(() => {
    const state = location.state as { tab?: string } | null;
    if (state?.tab) {
      console.log('🔵 Setting active tab from navigation state:', state.tab);
      setActiveTab(state.tab);
      // Clear the state to avoid re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Helper function to check if a name looks like a glass code and sanitize it
  const getDisplayName = (name: string | undefined): string => {
    if (!name) return 'Customer Name Not Available';
    
    // Check if the name looks like a glass code (e.g., jqvmap1_dd, jqvmap1_ws, etc.)
    const glassCodePattern = /^[a-z]+[0-9]+_[a-z]+$/i;
    if (glassCodePattern.test(name.trim())) {
      return 'Customer Name Not Available';
    }
    
    return name;
  };

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

  // Handle link order to job
  const handleLinkOrderToJob = (orderId: string, currentJobId?: string | null) => {
    setSelectedOrderId(orderId);
    setSelectedOrderJobId(currentJobId || null);
    setShowLinkDialog(true);
  };

  // Refresh glass orders after linking
  const refreshGlassOrders = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('glass_orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setGlassOrders(data || []);
      setStats(prev => ({
        ...prev,
        glassOrders: data?.length || 0
      }));
    } catch (error) {
      console.error('Error refreshing glass orders:', error);
    }
  };

  // Handle job card click to show details
  const handleJobClick = (job: AcceptedJob) => {
    setSelectedJob(job);
    setIsJobDetailsOpen(true);
  };

  // Filter jobs based on active tab and search/filter criteria - ONLY completed and cancelled
  const getFilteredJobs = () => {
    let filtered = acceptedJobs.filter(job => 
      job.status === 'completed' || job.status === 'cancelled'
    );

    // Filter by tab
    if (activeTab === 'job_leads') {
      filtered = filtered.filter(job => job.job_type === 'job_lead');
    } else if (activeTab === 'exclusive') {
      filtered = filtered.filter(job => job.job_type === 'exclusive');
    } else if (activeTab === 'completed') {
      filtered = filtered.filter(job => job.status === 'completed');
    } else if (activeTab === 'cancelled') {
      filtered = filtered.filter(job => job.status === 'cancelled');
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
              quote_id: assignment.MasterCustomer.quote_id,
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
              job_type: jobType,
              window_damage: assignment.MasterCustomer.window_damage,
              selected_windows: assignment.MasterCustomer.selected_windows,
              window_spec: assignment.MasterCustomer.window_spec,
              adas_calibration: assignment.MasterCustomer.adas_calibration,
              delivery_type: assignment.MasterCustomer.delivery_type,
              timeline: assignment.MasterCustomer.timeline,
              duration: assignment.MasterCustomer.duration
            };
          });
          
          setAcceptedJobs(serverJobs);
          
          // Calculate stats - ONLY for completed and cancelled
          const completedCancelledJobs = serverJobs.filter((j: any) => j.status === 'completed' || j.status === 'cancelled');
          const completed = completedCancelledJobs.filter((j: any) => j.status === 'completed').length;
          const cancelled = completedCancelledJobs.filter((j: any) => j.status === 'cancelled').length;
          const jobLeads = completedCancelledJobs.filter((j: any) => j.job_type === 'job_lead').length;
          const exclusive = completedCancelledJobs.filter((j: any) => j.job_type === 'exclusive').length;
          
          // Fetch glass orders
          const { data: ordersData, error: ordersError } = await supabase
            .from('glass_orders')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          
          if (!ordersError && ordersData) {
            setGlassOrders(ordersData);
          }
          
          setStats({
            active: 0, // Not used in History
            completed,
            scheduled: cancelled, // Reusing for cancelled count
            glassOrders: ordersData?.length || 0,
            total: completedCancelledJobs.length,
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
      title: "Completed",
      value: stats.completed.toString(),
      change: `${stats.completed} finished`,
      trend: "up",
      icon: Clock,
    },
    {
      title: "Cancelled",
      value: stats.scheduled.toString(),
      change: `${stats.scheduled} cancelled`,
      trend: "neutral",
      icon: AlertTriangle,
    },
    {
      title: "Job Leads",
      value: stats.jobLeads.toString(),
      change: `${stats.jobLeads} leads`,
      trend: "neutral",
      icon: Target,
    },
    {
      title: "Exclusive",
      value: stats.exclusive.toString(),
      change: `${stats.exclusive} premium`,
      trend: "neutral",
      icon: Zap,
    },
  ];

  return (
    <DashboardLayout>
      <PageTransition>
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
                      History<span className="text-[#0FB8C1] font-normal">.</span>
                    </h1>
                  </div>
                  <p className="text-gray-600 text-base font-light ml-5 tracking-wide">
                    View completed and cancelled jobs
                  </p>
                </div>
                </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-8 space-y-8 relative z-10 max-w-7xl mx-auto">

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
        <Card className="border-[#145484]/20">
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
                    <SelectItem value="completed" className="hover:bg-gray-50">Completed</SelectItem>
                    <SelectItem value="cancelled" className="hover:bg-gray-50">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Job Type Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Completed ({stats.completed})
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Cancelled ({stats.scheduled})
            </TabsTrigger>
            <TabsTrigger value="job_leads" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Leads ({stats.jobLeads})
            </TabsTrigger>
            <TabsTrigger value="glass-orders" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Glass Orders ({stats.glassOrders})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="completed" className="space-y-4 mt-6 data-[state=active]:animate-fadeIn">
            <div className="grid gap-4">
              {filteredJobs.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Completed Jobs</h3>
                    <p className="text-gray-600">
                      No completed jobs to display yet.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredJobs.map(job => (
                  <Card 
                    key={job.id} 
                    className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500 cursor-pointer"
                    onClick={() => handleJobClick(job)}
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg text-green-700 flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            {getDisplayName(job.customer_name)}
                          </h3>
                          <p className="text-sm text-gray-600">£{job.quote_price?.toFixed(2)} • Completed</p>
                        </div>
                        <Badge className="text-xs bg-green-100 text-green-600 border-green-200">
                          Completed
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="cancelled" className="space-y-4 mt-6 data-[state=active]:animate-fadeIn">
            <div className="grid gap-4">
              {filteredJobs.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Cancelled Jobs</h3>
                    <p className="text-gray-600">
                      No cancelled jobs to display.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredJobs.map(job => (
                  <Card 
                    key={job.id} 
                    className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-red-500 cursor-pointer"
                    onClick={() => handleJobClick(job)}
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg text-red-700 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            {getDisplayName(job.customer_name)}
                          </h3>
                          <p className="text-sm text-gray-600">£{job.quote_price?.toFixed(2)} • Cancelled</p>
                        </div>
                        <Badge className="text-xs bg-red-100 text-red-600 border-red-200">
                          Cancelled
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="glass-orders" className="space-y-4 mt-6 data-[state=active]:animate-fadeIn">
            <div className="grid gap-4">
              {glassOrders.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Glass Orders</h3>
                    <p className="text-gray-600 mb-6">
                      You haven't placed any glass orders yet.
                    </p>
                    <Button onClick={() => navigate('/glass-order')} className="bg-[#0FB8C1] hover:bg-[#0d9da5]">
                      Order Glass Now
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                glassOrders.map((order) => (
                  <Card key={order.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-[#0FB8C1]">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-gray-900">{order.order_number}</h3>
                            <Badge className={`
                              ${order.order_status === 'delivered' ? 'bg-green-500' : ''}
                              ${order.order_status === 'processing' ? 'bg-blue-500' : ''}
                              ${order.order_status === 'shipped' ? 'bg-yellow-500' : ''}
                              ${order.order_status === 'cancelled' ? 'bg-red-500' : ''}
                            `}>
                              {order.order_status}
                            </Badge>
                            {order.job_id && order.customer_name ? (
                              <Badge className="bg-[#0FB8C1] text-white flex items-center gap-1">
                                <UserCheck className="w-3 h-3" />
                                Linked: {order.customer_name}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-gray-400 text-gray-600 flex items-center gap-1">
                                <Link2 className="w-3 h-3" />
                                Not Linked
                              </Badge>
                            )}
                          </div>
                          {order.vrn && (
                            <p className="text-sm text-gray-600">
                              <Car className="w-4 h-4 inline mr-1" />
                              {order.make} {order.model} {order.year && `(${order.year})`} - {order.vrn}
                            </p>
                          )}
                          <p className="text-sm text-gray-500 mt-1">
                            Ordered: {new Date(order.created_at).toLocaleDateString('en-GB', { 
                              day: '2-digit', 
                              month: 'short', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">£{Number(order.total_amount).toFixed(2)}</p>
                          <p className="text-sm text-gray-500">{order.items?.length || 0} item(s)</p>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="space-y-2 mb-4 bg-gray-50 rounded-lg p-4">
                        {order.items?.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{item.description}</p>
                              <p className="text-xs text-gray-600">Part: {item.partNumber} | Qty: {item.quantity}</p>
                            </div>
                            <p className="font-semibold text-gray-900">£{(item.unitPrice * item.quantity).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>

                      {/* Delivery Info and Actions */}
                      <div className="pt-4 border-t space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          {order.delivery_option === 'delivery' ? (
                            <>
                              <Package className="w-4 h-4" />
                              <span>Delivery: {order.delivery_address || '(Branch of your choice)'}</span>
                            </>
                          ) : (
                            <>
                              <MapPin className="w-4 h-4" />
                              <span>Collection: {order.collection_address}</span>
                            </>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => handleLinkOrderToJob(order.id, order.job_id)}
                            className="flex-1 border-[#0FB8C1] text-[#0FB8C1] hover:bg-[#0FB8C1] hover:text-white"
                          >
                            <Link2 className="w-4 h-4 mr-2" />
                            {order.job_id ? 'Change Job' : 'Assign to Job'}
                          </Button>
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/order-confirmation?orderId=${order.id}`)}
                            className="flex-1 border-gray-300 hover:bg-gray-50"
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="job_leads" className="space-y-4 mt-6 data-[state=active]:animate-fadeIn">
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
                    className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-[#145484] cursor-pointer"
                    onClick={() => handleJobClick(job)}
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg text-[#145484] flex items-center gap-2">
                            <Target className="w-5 h-5" />
                            {getDisplayName(job.customer_name)}
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

          <TabsContent value="exclusive" className="space-y-4 mt-6 data-[state=active]:animate-fadeIn">
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
                            {getDisplayName(job.customer_name)}
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
                <div className="flex items-start justify-between">
                  <DialogTitle className="flex items-center gap-2 flex-wrap">
                  {selectedJob.job_type === 'exclusive' ? (
                    <Zap className="h-5 w-5 text-[#FFC107]" />
                  ) : (
                    <Target className="h-5 w-5 text-[#145484]" />
                  )}
                  {getDisplayName(selectedJob.customer_name)}
                    <Badge className={`text-xs ${getStatusColor(selectedJob.status)}`}>
                    {selectedJob.status}
                  </Badge>
                </DialogTitle>
                  {selectedJob.quote_id && (
                    <Badge variant="outline" className="border-[#0FB8C1] text-[#0FB8C1] font-semibold text-sm px-3 py-1">
                      Quote: {selectedJob.quote_id}
                    </Badge>
                  )}
                </div>
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
                      <p className="text-sm">{new Date(selectedJob.assigned_at).toLocaleDateString('en-GB')}</p>
                    </div>
                    {selectedJob.completed_at && (
                      <div>
                        <label className="text-xs font-medium text-gray-500">Completed On</label>
                        <p className="text-sm">{new Date(selectedJob.completed_at).toLocaleDateString('en-GB')}</p>
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

      {/* Link Order Dialog */}
      {selectedOrderId && (
        <LinkOrderToJob
          open={showLinkDialog}
          onOpenChange={setShowLinkDialog}
          orderId={selectedOrderId}
          currentJobId={selectedOrderJobId}
          onSuccess={refreshGlassOrders}
        />
      )}
      </PageTransition>
    </DashboardLayout>
  );
};

export default History;