import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { User, Calendar as CalendarIcon, Clock, MapPin, Car, Phone, Play, CheckCircle2, Navigation, RefreshCw, TrendingUp, Activity, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { JobService } from "@/services/jobService";

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  location?: string;
  customer_name?: string;
  customer_phone?: string;
  vehicle_info?: string;
  status: string;
  job_assignment_id: string;
  job_assignments: {
    job_id: string;
    MasterCustomer: {
      quote_price?: number;
      vehicle_reg?: string;
      service_type?: string;
      glass_type?: string;
    };
  };
}

const Calendar = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Debug: Track component mounting
  useEffect(() => {
    console.log('🟢 Calendar component mounted, user:', user?.email);
    return () => {
      console.log('🔴 Calendar component unmounting');
    };
  }, []);

  useEffect(() => {
    console.log('🔵 Calendar fetchCalendarEvents triggered, user:', user?.email, 'date:', date?.toDateString());
    if (user?.id) {
      fetchCalendarEvents();
    }
  }, [user?.id, date]);

  const fetchCalendarEvents = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Get technician ID first (same logic as History)
      console.log('🔵 Calendar: Fetching events for user:', { userId: user.id, email: user.email });
      
      let technicianId = null;
      const { data: techData1, error: techError1 } = await supabase
        .from('technicians')
        .select('id, name, user_id, contact_email')
        .eq('user_id', user.id)
        .single();
      
      console.log('🔵 Calendar: Technician lookup by user_id result:', { techData1, techError1 });
      
      if (techData1) {
        technicianId = techData1.id;
      } else {
        // Try by email for Google OAuth users
        const { data: techData2, error: techError2 } = await supabase
          .from('technicians')
          .select('id, name, user_id, contact_email')
          .eq('contact_email', user.email)
          .single();
        
        console.log('🔵 Calendar: Technician lookup by email result:', { techData2, techError2 });
        
        if (techData2) {
          technicianId = techData2.id;
        }
      }

      console.log('🔵 Calendar: Final technician ID:', technicianId);

      if (!technicianId) {
        console.log('🔴 Calendar: No technician found for user');
        setCalendarEvents([]);
        return;
      }
      
      // Get events for the selected date or current month
      const selectedDate = date || new Date();
      const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

      const { data, error } = await JobService.getCalendarEvents(
        technicianId,
        startOfMonth.toISOString().split('T')[0],
        endOfMonth.toISOString().split('T')[0]
      );

      if (error) {
        console.error('Error fetching calendar events:', error);
        toast({
          title: "Error",
          description: "Failed to fetch calendar events.",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        console.log('Calendar events:', data);
        setCalendarEvents(data);
      }
    } catch (error) {
      console.error('Error in fetchCalendarEvents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "scheduled":
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

  const updateEventStatus = async (eventId: string, newStatus: 'scheduled' | 'in_progress' | 'completed' | 'cancelled') => {
    try {
      const { success, error } = await JobService.updateEventStatus(eventId, newStatus);

      if (!success) {
        console.error('Error updating event status:', error);
        toast({
          title: "Error",
          description: "Failed to update job status.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Status Updated",
        description: `Job status updated to ${newStatus.replace('_', ' ')}.`,
      });

      // Refresh events
      fetchCalendarEvents();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Filter events for selected date
  const selectedDateEvents = date 
    ? calendarEvents.filter(event => {
        const eventDate = new Date(event.start_date);
        return eventDate.toDateString() === date.toDateString();
      })
    : calendarEvents;

  // Calculate daily stats
  const getDailyStats = () => {
    const totalJobs = selectedDateEvents.length;
    const completedJobs = selectedDateEvents.filter(e => e.status === 'completed').length;
    const inProgressJobs = selectedDateEvents.filter(e => e.status === 'in_progress').length;
    const scheduledJobs = selectedDateEvents.filter(e => e.status === 'scheduled').length;
    const totalValue = selectedDateEvents.reduce((sum, event) => 
      sum + (event.job_assignments?.MasterCustomer?.quote_price || 0), 0
    );
    
    return { totalJobs, completedJobs, inProgressJobs, scheduledJobs, totalValue };
  };

  const stats = getDailyStats();

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Enhanced Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 rounded-b-2xl">
          <div className="px-6 py-8">
            <div className="flex flex-col gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold text-gray-900">My Calendar</h1>
                </div>
                <p className="text-gray-600 text-lg">
                  Manage your scheduled jobs and appointments
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  onClick={fetchCalendarEvents} 
                  variant="outline" 
                  size="sm"
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Loading...' : 'Refresh'}
                </Button>
                <Badge variant="secondary" className="hidden sm:flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  {calendarEvents.length} Total Jobs
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-6">

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Today's Jobs</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.totalJobs}</p>
                </div>
                <div className="p-2 bg-blue-200 rounded-full">
                  <CalendarIcon className="w-5 h-5 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Completed</p>
                  <p className="text-2xl font-bold text-green-900">{stats.completedJobs}</p>
                </div>
                <div className="p-2 bg-green-200 rounded-full">
                  <CheckCircle2 className="w-5 h-5 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-600">In Progress</p>
                  <p className="text-2xl font-bold text-amber-900">{stats.inProgressJobs}</p>
                </div>
                <div className="p-2 bg-amber-200 rounded-full">
                  <Zap className="w-5 h-5 text-amber-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Day Value</p>
                  <p className="text-2xl font-bold text-purple-900">£{stats.totalValue.toFixed(0)}</p>
                </div>
                <div className="p-2 bg-purple-200 rounded-full">
                  <TrendingUp className="w-5 h-5 text-purple-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Modern Calendar */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-blue-600" />
                  Select Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CalendarComponent 
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="mx-auto rounded-lg border-0 shadow-sm"
                  classNames={{
                    months: "space-y-4",
                    month: "space-y-4",
                    caption: "flex justify-center pt-1 relative items-center",
                    caption_label: "text-sm font-medium",
                    nav: "space-x-1 flex items-center",
                    nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex",
                    head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                    row: "flex w-full mt-2",
                    cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                    day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-blue-100 rounded-md transition-colors",
                    day_selected: "bg-transparent text-blue-600 border-2 border-blue-600 hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700",
                    day_today: "bg-blue-100 text-blue-900 font-semibold",
                    day_outside: "text-muted-foreground opacity-50",
                    day_disabled: "text-muted-foreground opacity-50",
                    day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                    day_hidden: "invisible",
                  }}
                />
                
                {/* Quick Date Navigation */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDate(new Date())}
                    className="text-xs"
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      setDate(tomorrow);
                    }}
                    className="text-xs"
                  >
                    Tomorrow
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Enhanced Jobs Timeline */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <CalendarIcon className="w-6 h-6" />
                    {date?.toLocaleDateString('en-GB', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </CardTitle>
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    {selectedDateEvents.length} Job{selectedDateEvents.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="bg-gray-200 rounded-xl h-40 w-full"></div>
                      </div>
                    ))}
                  </div>
                ) : selectedDateEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CalendarIcon className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Jobs Today</h3>
                    <p className="text-gray-600 mb-6">
                      You have a free day! Use this time to catch up or take on more jobs.
                    </p>
                    <Button 
                      onClick={() => window.location.href = '/job-swipe'}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Find New Jobs
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedDateEvents
                      .sort((a, b) => a.start_time.localeCompare(b.start_time))
                      .map((event, index) => {
                        const jobData = event.job_assignments?.MasterCustomer;
                        const formatPrice = (price: number | null | undefined) => {
                          if (price == null) return 'Quote Required';
                          return `£${price.toFixed(2)}`;
                        };

                        const getStatusIcon = (status: string) => {
                          switch (status.toLowerCase()) {
                            case 'scheduled':
                              return <Clock className="w-5 h-5 text-blue-600" />;
                            case 'in_progress':
                              return <Play className="w-5 h-5 text-amber-600" />;
                            case 'completed':
                              return <CheckCircle2 className="w-5 h-5 text-green-600" />;
                            default:
                              return <CalendarIcon className="w-5 h-5 text-gray-600" />;
                          }
                        };

                        return (
                          <Card key={event.id} className={`group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 ${
                            event.status === 'completed' ? 'border-l-green-500 bg-green-50/30' :
                            event.status === 'in_progress' ? 'border-l-amber-500 bg-amber-50/30' :
                            'border-l-blue-500 bg-blue-50/30'
                          }`}>
                            <CardContent className="p-5">
                              <div className="flex items-start justify-between gap-4">
                                {/* Left: Job Info */}
                                <div className="flex-1 space-y-3">
                                  {/* Header with Status Icon */}
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-white shadow-sm">
                                      {getStatusIcon(event.status)}
                                    </div>
                                    <div className="flex-1">
                                      <h3 className="font-bold text-lg text-gray-900 leading-tight">
                                        {event.customer_name}
                                      </h3>
                                      <p className="text-sm text-gray-600">
                                        {event.start_time} - {event.end_time}
                                      </p>
                                    </div>
                                    <Badge className={`${getStatusColor(event.status)} font-medium`}>
                                      {event.status.replace('_', ' ')}
                                    </Badge>
                                  </div>

                                  {/* Vehicle & Service Info */}
                                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                          <Car className="w-4 h-4 text-gray-500" />
                                          <span className="text-sm font-medium text-gray-900">
                                            {jobData?.vehicle_reg || 'No Registration'}
                                          </span>
                                        </div>
                                        {event.location && (
                                          <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-gray-500" />
                                            <span className="text-sm text-gray-600 truncate">{event.location}</span>
                                          </div>
                                        )}
                                      </div>
                                      <div className="space-y-2">
                                        {event.customer_phone && (
                                          <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-gray-500" />
                                            <a 
                                              href={`tel:${event.customer_phone}`}
                                              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                            >
                                              {event.customer_phone}
                                            </a>
                                          </div>
                                        )}
                                        {jobData?.service_type && (
                                          <div className="text-sm">
                                            <span className="font-medium text-gray-700">{jobData.service_type}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex flex-wrap gap-2">
                                    {event.status === 'scheduled' && (
                                      <Button
                                        onClick={() => updateEventStatus(event.id, 'in_progress')}
                                        size="sm"
                                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md"
                                      >
                                        <Play className="w-4 h-4 mr-2" />
                                        Start Job
                                      </Button>
                                    )}
                                    {event.status === 'in_progress' && (
                                      <Button
                                        onClick={() => updateEventStatus(event.id, 'completed')}
                                        size="sm"
                                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-md"
                                      >
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Complete Job
                                      </Button>
                                    )}
                                    <Button
                                      onClick={() => {
                                        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location || '')}`;
                                        window.open(mapsUrl, '_blank');
                                      }}
                                      variant="outline"
                                      size="sm"
                                      className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                    >
                                      <Navigation className="w-4 h-4 mr-2" />
                                      Navigate
                                    </Button>
                                    {event.customer_phone && (
                                      <Button
                                        onClick={() => window.open(`tel:${event.customer_phone}`, '_self')}
                                        variant="outline"
                                        size="sm"
                                        className="border-green-200 text-green-700 hover:bg-green-50"
                                      >
                                        <Phone className="w-4 h-4 mr-2" />
                                        Call
                                      </Button>
                                    )}
                                  </div>
                                </div>

                                {/* Right: Price */}
                                <div className="text-right">
                                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-3 rounded-xl shadow-lg">
                                    <p className="text-lg font-bold">
                                      {formatPrice(jobData?.quote_price)}
                                    </p>
                                    <p className="text-xs opacity-90">Job Value</p>
                                  </div>
                                </div>
                              </div>

                              {/* Description */}
                              {event.description && (
                                <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                  <p className="text-sm text-gray-700">{event.description}</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
};

export default Calendar; 