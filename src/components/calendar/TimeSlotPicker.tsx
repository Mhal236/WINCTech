import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface TimeSlot {
  startTime: string;
  endTime: string;
  isBooked: boolean;
  display: string;
}

interface TimeSlotPickerProps {
  selectedDate: Date;
  selectedTime?: string;
  onTimeSelect: (time: string) => void;
}

export const TimeSlotPicker = ({ selectedDate, selectedTime, onTimeSelect }: TimeSlotPickerProps) => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Generate 2-hour time slots (8 AM to 8 PM)
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startHour = 8; // 8 AM
    const endHour = 20; // 8 PM
    const slotDuration = 2; // 2 hours

    for (let hour = startHour; hour < endHour; hour += slotDuration) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + slotDuration).toString().padStart(2, '0')}:00`;
      
      // Format display time (e.g., "8:00 AM - 10:00 AM")
      const formatTime = (h: number) => {
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
        return `${displayHour}:00 ${ampm}`;
      };
      
      slots.push({
        startTime,
        endTime,
        isBooked: false,
        display: `${formatTime(hour)} - ${formatTime(hour + slotDuration)}`
      });
    }

    return slots;
  };

  useEffect(() => {
    if (selectedDate && user?.id) {
      checkAvailability();
    }
  }, [selectedDate, user?.id]);

  const checkAvailability = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Get technician ID
      let technicianId = null;
      const { data: techData1 } = await supabase
        .from('technicians')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (techData1) {
        technicianId = techData1.id;
      } else {
        const { data: techData2 } = await supabase
          .from('technicians')
          .select('id')
          .eq('contact_email', user.email)
          .single();
        
        if (techData2) {
          technicianId = techData2.id;
        }
      }

      if (!technicianId) {
        setTimeSlots(generateTimeSlots());
        setLoading(false);
        return;
      }

      // Format selected date to YYYY-MM-DD
      const dateStr = selectedDate.toISOString().split('T')[0];

      // Fetch appointments from leads table for this date
      const { data: appointments, error } = await supabase
        .from('leads')
        .select('id, appointment_date, time_slot, status')
        .eq('assigned_technician_id', technicianId)
        .eq('appointment_date', dateStr)
        .in('status', ['assigned', 'contacted']);

      if (error) {
        console.error('Error fetching appointments:', error);
      }

      // Generate slots and mark booked ones
      const slots = generateTimeSlots();
      
      if (appointments && appointments.length > 0) {
        appointments.forEach(apt => {
          const aptTime = apt.time_slot;
          if (aptTime) {
            // Find which slot this appointment falls into
            slots.forEach(slot => {
              // Convert times to compare
              const slotStartMinutes = parseInt(slot.startTime.split(':')[0]) * 60;
              const slotEndMinutes = parseInt(slot.endTime.split(':')[0]) * 60;
              const aptStartMinutes = parseInt(aptTime.split(':')[0]) * 60 + parseInt(aptTime.split(':')[1]);
              
              // If appointment time falls within this slot, mark as booked
              if (aptStartMinutes >= slotStartMinutes && aptStartMinutes < slotEndMinutes) {
                slot.isBooked = true;
              }
            });
          }
        });
      }

      setTimeSlots(slots);
    } catch (error) {
      console.error('Error checking availability:', error);
      setTimeSlots(generateTimeSlots());
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Select Time Slot
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Select Time Slot (2-hour blocks)
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          {selectedDate.toLocaleDateString('en-GB', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {timeSlots.map((slot) => {
            const isSelected = selectedTime === slot.startTime;
            
            return (
              <Button
                key={slot.startTime}
                variant={isSelected ? "default" : "outline"}
                className={cn(
                  "h-auto py-4 flex flex-col items-start justify-start relative",
                  slot.isBooked && "opacity-50 cursor-not-allowed",
                  isSelected && "bg-blue-600 text-white hover:bg-blue-700"
                )}
                disabled={slot.isBooked}
                onClick={() => !slot.isBooked && onTimeSelect(slot.startTime)}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold text-sm">{slot.display}</span>
                  {slot.isBooked ? (
                    <Badge variant="destructive" className="ml-2 text-xs">
                      <XCircle className="h-3 w-3 mr-1" />
                      Booked
                    </Badge>
                  ) : isSelected ? (
                    <CheckCircle className="h-4 w-4 ml-2" />
                  ) : (
                    <Badge variant="secondary" className="ml-2 text-xs bg-green-100 text-green-700">
                      Available
                    </Badge>
                  )}
                </div>
              </Button>
            );
          })}
        </div>

        {timeSlots.every(slot => slot.isBooked) && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
            <p className="text-sm text-amber-800 font-medium">
              All time slots are booked for this date. Please select another date.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

