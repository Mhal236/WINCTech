import { supabase } from '@/lib/supabase';
import { JobData } from '@/components/jobs/JobCard';

export interface JobAssignment {
  id: string;
  job_id: string;
  technician_id: string;
  assigned_at: string;
  status: 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  completed_at?: string;
}

export interface CalendarEvent {
  id: string;
  job_assignment_id: string;
  technician_id: string;
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
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  google_calendar_event_id?: string;
}

export class JobService {
  /**
   * Fetch available jobs (quoted status, not assigned, with valid pricing)
   */
  static async getAvailableJobs(): Promise<{ data: JobData[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('MasterCustomer')
        .select(`
          *,
          job_assignments!left (
            id,
            technician_id,
            status
          )
        `)
        .eq('status', 'quoted')
        .not('quote_price', 'is', null) // Exclude jobs without pricing
        .gt('quote_price', 0) // Ensure positive pricing
        .is('job_assignments.id', null) // Only jobs without assignments
        .order('created_at', { ascending: false });

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Accept a job via secure server endpoint
   */
  static async acceptJob(
    jobId: string, 
    technicianId: string,
    technicianName: string
  ): Promise<{ success: boolean; error?: any; assignmentId?: string }> {
    try {
      const response = await fetch('/api/jobs/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, technicianId, technicianName })
      });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        return { success: false, error: result?.error || 'Failed to accept job' };
      }
      return { success: true, assignmentId: result.assignmentId };
    } catch (error) {
      console.error('Error in acceptJob:', error);
      return { success: false, error };
    }
  }

  /**
   * Create calendar event for accepted job via secure server endpoint
   */
  static async createCalendarEvent(
    assignmentId: string,
    job: JobData,
    technicianId: string
  ): Promise<{ success: boolean; error?: any }> {
    try {
      const response = await fetch('/api/jobs/create-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId, job, technicianId })
      });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        return { success: false, error: result?.error || 'Failed to create calendar event' };
      }
      return { success: true };
    } catch (error) {
      console.error('Error in createCalendarEvent:', error);
      return { success: false, error };
    }
  }

  /**
   * Get calendar events for a technician
   */
  static async getCalendarEvents(
    technicianId: string,
    startDate?: string,
    endDate?: string
  ): Promise<{ data: CalendarEvent[] | null; error: any }> {
    try {
      let query = supabase
        .from('calendar_events')
        .select(`
          *,
          job_assignments (
            job_id,
            MasterCustomer (
              quote_price,
              vehicle_reg,
              service_type,
              glass_type
            )
          )
        `)
        .eq('technician_id', technicianId);

      if (startDate) {
        query = query.gte('start_date', startDate);
      }
      if (endDate) {
        query = query.lte('start_date', endDate);
      }

      const { data, error } = await query
        .order('start_date', { ascending: true })
        .order('start_time', { ascending: true });

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Update event status
   */
  static async updateEventStatus(
    eventId: string,
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  ): Promise<{ success: boolean; error?: any }> {
    try {
      // Update calendar event
      const { error: eventError } = await supabase
        .from('calendar_events')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', eventId);

      if (eventError) {
        return { success: false, error: eventError };
      }

      // Get the assignment ID to update job assignment status
      const { data: eventData, error: fetchError } = await supabase
        .from('calendar_events')
        .select('job_assignment_id')
        .eq('id', eventId)
        .single();

      if (fetchError || !eventData) {
        return { success: false, error: fetchError };
      }

      // Update job assignment status
      const { error: assignmentError } = await supabase
        .from('job_assignments')
        .update({ 
          status,
          completed_at: status === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', eventData.job_assignment_id);

      if (assignmentError) {
        return { success: false, error: assignmentError };
      }

      // Update MasterCustomer status if completed
      if (status === 'completed') {
        const { data: assignmentData } = await supabase
          .from('job_assignments')
          .select('job_id')
          .eq('id', eventData.job_assignment_id)
          .single();

        if (assignmentData) {
          await supabase
            .from('MasterCustomer')
            .update({ status: 'completed' })
            .eq('id', assignmentData.job_id);
        }
      }

      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }

  /**
   * Calculate end time based on start time and duration
   */
  private static calculateEndTime(startTime: string, duration: string): string {
    try {
      const [hours, minutes] = startTime.split(':').map(Number);
      
      // Parse duration (e.g., "2 hours", "90 minutes")
      let durationHours = 2; // default
      if (duration.includes('hour')) {
        durationHours = parseInt(duration.match(/\d+/)?.[0] || '2');
      } else if (duration.includes('minute')) {
        durationHours = parseInt(duration.match(/\d+/)?.[0] || '120') / 60;
      }
      
      const endHours = hours + Math.floor(durationHours);
      const endMinutes = minutes + ((durationHours % 1) * 60);
      
      // Handle minute overflow
      const finalMinutes = endMinutes % 60;
      const extraHours = Math.floor(endMinutes / 60);
      const finalHours = endHours + extraHours;
      
      return `${finalHours.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`;
    } catch {
      return '17:00'; // Default end time
    }
  }
}
