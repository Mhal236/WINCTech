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

  useEffect(() => {
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

  return (
    <DashboardLayout>
      <div className="mobile-container py-6 sm:py-8">
        <div className="mobile-flex mobile-gap">
          {/* Left Column: Calendar Component */}
          <div className="md:w-1/3">
            <CalendarComponent 
              mode="single"
              selected={date}
              onSelect={setDate}
              className="mx-auto"
            />
          </div>

          {/* Right Column: Jobs Listing */}
          <div className="md:w-2/3">
            <Card>
              <CardHeader className="mobile-card">
                <CardTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#3d99be] animate-pulse"></span>
                  Jobs for {date?.toLocaleDateString()}
                </CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Button 
                    onClick={fetchCalendarEvents} 
                    variant="outline" 
                    size="sm"
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Refresh'}
                  </Button>
                  <span className="text-sm text-gray-600">
                    {selectedDateEvents.length} job{selectedDateEvents.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="mobile-card">
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="bg-gray-200 rounded-lg h-32 w-full"></div>
                      </div>
                    ))}
                  </div>
                ) : selectedDateEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Jobs Scheduled</h3>
                    <p className="text-gray-600">
                      No jobs are scheduled for {date?.toLocaleDateString()}.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:gap-4">
                    {selectedDateEvents.map(event => {
                      const jobData = event.job_assignments?.MasterCustomer;
                      const formatPrice = (price: number | null | undefined) => {
                        if (price == null) return 'Quote Required';
                        return `£${price.toFixed(2)}`;
                      };

                      return (
                        <Card key={event.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-[#135084]">
                          <CardContent className="mobile-card">
                            <div className="mobile-flex justify-between mobile-gap">
                              <div className="flex-1 space-y-3">
                                {/* Header */}
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h3 className="font-semibold text-base sm:text-lg text-[#3d99be]">
                                      {event.title}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="outline" className="text-xs">
                                        {jobData?.vehicle_reg || 'No Reg'}
                                      </Badge>
                                      <Badge className={`text-xs ${getStatusColor(event.status)}`}>
                                        {event.status}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium text-base sm:text-lg text-red-600">
                                      {formatPrice(jobData?.quote_price)}
                                    </p>
                                  </div>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <User className="w-4 h-4 text-gray-500" />
                                      <span className="text-sm">{event.customer_name}</span>
                                    </div>
                                    {event.customer_phone && (
                                      <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm text-gray-600">{event.customer_phone}</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-4 h-4 text-gray-500" />
                                      <span className="text-sm">
                                        {event.start_time} - {event.end_time}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <CalendarIcon className="w-4 h-4 text-gray-500" />
                                      <span className="text-sm">
                                        {new Date(event.start_date).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    {event.location && (
                                      <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm text-gray-600">{event.location}</span>
                                      </div>
                                    )}
                                    {event.vehicle_info && (
                                      <div className="flex items-center gap-2">
                                        <Car className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm text-gray-600">{event.vehicle_info}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Description */}
                                {event.description && (
                                  <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-700">{event.description}</p>
                                  </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-2 pt-2">
                                  {event.status === 'scheduled' && (
                                    <Button
                                      onClick={() => updateEventStatus(event.id, 'in_progress')}
                                      size="sm"
                                      className="bg-blue-600 hover:bg-blue-700"
                                    >
                                      Start Job
                                    </Button>
                                  )}
                                  {event.status === 'in_progress' && (
                                    <Button
                                      onClick={() => updateEventStatus(event.id, 'completed')}
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700"
                                    >
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
                                  >
                                    <MapPin className="w-4 h-4 mr-1" />
                                    Directions
                                  </Button>
                                </div>
                              </div>
                            </div>
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
    </DashboardLayout>
  );
};

export default Calendar; 