import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Clock, Filter, ArrowUp, Briefcase, Calendar, Users, MoreVertical, MapPin, Phone, Car, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { JobService } from "@/services/jobService";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

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
}

const History = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [acceptedJobs, setAcceptedJobs] = useState<AcceptedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    active: 0,
    completed: 0,
    scheduled: 0,
    total: 0
  });
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      fetchAcceptedJobs();
    }
  }, [user?.id]);

  const fetchAcceptedJobs = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      console.log('🔵 History: Fetching jobs for user:', { userId: user.id, email: user.email });
      
      // Get technician ID first
      let technicianId = null;
      const { data: techData1, error: techError1 } = await supabase
        .from('technicians')
        .select('id, name, user_id, contact_email')
        .eq('user_id', user.id)
        .single();
      
      console.log('🔵 History: Technician lookup by user_id result:', { techData1, techError1 });
      
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

      console.log('🔵 History: Final technician ID:', technicianId);

      if (!technicianId) {
        console.log('🔴 History: No technician found for user');
        return;
      }

      // Fetch all accepted jobs for this technician
      console.log('🔵 History: Fetching job assignments for technician ID:', technicianId);
      
      const { data, error } = await supabase
        .from('job_assignments')
        .select(`
          *,
          MasterCustomer (
            id,
            full_name,
            mobile,
            location,
            postcode,
            appointment_date,
            time_slot,
            status,
            quote_price,
            service_type,
            glass_type,
            vehicle_reg,
            brand,
            model,
            year
          )
        `)
        .eq('technician_id', technicianId)
        .order('assigned_at', { ascending: false });

      console.log('🔵 History: Job assignments query result:', { data, error, count: data?.length });

      if (error) {
        console.error('🔴 History: Error fetching accepted jobs:', error);
        toast({
          title: "Error",
          description: "Failed to fetch your job history.",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        console.log('🟢 History: Raw job assignments data:', data);
        console.log('🔵 History: First assignment sample:', data[0]);
        
        // If no data, try a simpler query for debugging
        if (data.length === 0) {
          console.log('🔵 History: No data returned, trying simple query...');
          const { data: simpleData, error: simpleError } = await supabase
            .from('job_assignments')
            .select('*')
            .eq('technician_id', technicianId);
          
          console.log('🔵 History: Simple query result:', { simpleData, simpleError, count: simpleData?.length });
          
          // If simple query also fails, use server endpoint
          if (!simpleData || simpleData.length === 0) {
            console.log('🔵 History: Client queries blocked by RLS, using server endpoint...');
            try {
              const response = await fetch('/api/technician/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ technicianId })
              });
              const serverResult = await response.json();
              console.log('🔵 History: Server endpoint result:', serverResult);
              
              if (serverResult.success && serverResult.data) {
                // Use server data
                const serverJobs = serverResult.data.map((assignment: any) => ({
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
                  vehicle_info: `${assignment.MasterCustomer.year || ''} ${assignment.MasterCustomer.brand || ''} ${assignment.MasterCustomer.model || ''}`.trim()
                }));
                
                setAcceptedJobs(serverJobs);
                
                // Calculate stats
                const active = serverJobs.filter((j: any) => j.status === 'assigned' || j.status === 'in_progress').length;
                const completed = serverJobs.filter((j: any) => j.status === 'completed').length;
                const scheduled = serverJobs.filter((j: any) => j.status === 'assigned').length;
                
                setStats({
                  active,
                  completed,
                  scheduled,
                  total: serverJobs.length
                });
                
                return;
              }
            } catch (serverError) {
              console.error('🔴 History: Server endpoint failed:', serverError);
            }
          }
        }
        
        const jobs = data.map(assignment => ({
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
          vehicle_info: `${assignment.MasterCustomer.year || ''} ${assignment.MasterCustomer.brand || ''} ${assignment.MasterCustomer.model || ''}`.trim()
        }));

        setAcceptedJobs(jobs);
        
        // Calculate stats
        const active = jobs.filter(j => j.status === 'assigned' || j.status === 'in_progress').length;
        const completed = jobs.filter(j => j.status === 'completed').length;
        const scheduled = jobs.filter(j => j.status === 'assigned').length;
        
        setStats({
          active,
          completed,
          scheduled,
          total: jobs.length
        });
      }
    } catch (error) {
      console.error('Error in fetchAcceptedJobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const jobStats = [
    {
      title: "Active Jobs",
      value: stats.active.toString(),
      change: `${stats.active} active`,
      trend: "up",
      icon: Briefcase,
    },
    {
      title: "Completed Jobs",
      value: stats.completed.toString(),
      change: `${stats.completed} done`,
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
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-[#135084]">Jobs Dashboard</h1>
            <p className="text-gray-500 mt-1">Manage and track all jobs</p>
          </div>
          <Button className="bg-[#135084] hover:bg-[#135084]/90">
            <Plus className="h-5 w-5 mr-2" />
            New Job
          </Button>
        </div>

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
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full md:w-64 border-[#3d99be] focus:ring-[#3d99be]"
                />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px] border-[#3d99be]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="border-[#3d99be] text-[#3d99be]">
                  <Filter className="h-4 w-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Jobs List */}
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
          ) : acceptedJobs.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Jobs Yet</h3>
                <p className="text-gray-600">
                  You haven't accepted any jobs yet. Visit the Jobs tab to start accepting exclusive jobs.
                </p>
              </CardContent>
            </Card>
          ) : (
            acceptedJobs
              .filter(job => {
                const matchesSearch = searchTerm === "" || 
                  job.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  job.vehicle_reg?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  job.location?.toLowerCase().includes(searchTerm.toLowerCase());
                
                const matchesFilter = filterStatus === "all" || job.status === filterStatus;
                
                return matchesSearch && matchesFilter;
              })
              .map(job => {
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

                const formatPrice = (price: number | null | undefined) => {
                  if (price == null) return 'Quote Required';
                  return `£${price.toFixed(2)}`;
                };

                return (
                  <Card key={job.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-[#3d99be]">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="flex-1 space-y-4">
                          {/* Header */}
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-lg text-[#3d99be] flex items-center gap-2">
                                <User className="w-5 h-5" />
                                {job.customer_name}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={`text-xs ${getStatusColor(job.status)}`}>
                                  {job.status.replace('_', ' ')}
                                </Badge>
                                {job.service_type && (
                                  <Badge variant="outline" className="text-xs">
                                    {job.service_type}
                                  </Badge>
                                )}
                                {job.glass_type && (
                                  <Badge variant="outline" className="text-xs">
                                    {job.glass_type}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg text-green-600">
                                {formatPrice(job.quote_price)}
                              </p>
                              <p className="text-xs text-gray-500">
                                Accepted {new Date(job.assigned_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          {/* Details Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span className="text-sm">
                                  {job.appointment_date ? new Date(job.appointment_date).toLocaleDateString() : 'Date TBD'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <span className="text-sm">{job.time_slot || 'Time TBD'}</span>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              {job.location && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-gray-500" />
                                  <span className="text-sm text-gray-600 truncate">{job.location}</span>
                                </div>
                              )}
                              {job.customer_phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="w-4 h-4 text-gray-500" />
                                  <a href={`tel:${job.customer_phone}`} className="text-sm text-blue-600 hover:underline">
                                    {job.customer_phone}
                                  </a>
                                </div>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              {job.vehicle_info && (
                                <div className="flex items-center gap-2">
                                  <Car className="w-4 h-4 text-gray-500" />
                                  <span className="text-sm text-gray-600">{job.vehicle_info}</span>
                                </div>
                              )}
                              {job.vehicle_reg && (
                                <div className="text-sm">
                                  <span className="font-medium">Reg: </span>
                                  <span className="text-gray-600">{job.vehicle_reg}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col md:flex-row items-end md:items-center gap-4">
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-5 w-5 text-gray-500" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default History; 