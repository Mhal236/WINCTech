import { googleCalendarService } from '@/services/googleCalendarService';
import { supabase } from '@/integrations/supabase/client';

/**
 * Handle OAuth callback from Google Calendar
 */
export async function handleCalendarOAuthCallback(code: string, state: string) {
  try {
    // Exchange code for tokens
    const { accessToken, refreshToken } = await googleCalendarService.getTokens(code);
    
    // Store tokens in database
    const { error } = await supabase
      .from('technician_calendar_configs')
      .upsert({
        technician_id: state, // state contains technician ID
        access_token: accessToken,
        refresh_token: refreshToken,
        calendar_id: 'primary',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      throw new Error('Failed to store calendar configuration');
    }

    // Set up webhook for calendar changes
    const webhookUrl = `${window.location.origin}/api/calendar/webhook`;
    const resourceId = await googleCalendarService.setupCalendarWebhook(
      {
        technicianId: state,
        accessToken,
        refreshToken,
        calendarId: 'primary'
      },
      webhookUrl
    );

    // Store webhook resource ID
    await supabase
      .from('technician_calendar_configs')
      .update({ webhook_resource_id: resourceId })
      .eq('technician_id', state);

    return { success: true };
  } catch (error) {
    console.error('Calendar OAuth callback error:', error);
    throw error;
  }
}

/**
 * Sync a booking to technician's Google Calendar
 */
export async function syncBookingToCalendar(bookingId: string, technicianId: string) {
  try {
    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error('Booking not found');
    }

    // Get technician's calendar config
    const { data: config, error: configError } = await supabase
      .from('technician_calendar_configs')
      .select('*')
      .eq('technician_id', technicianId)
      .single();

    if (configError || !config) {
      throw new Error('Calendar not configured for this technician');
    }

    // Format booking as calendar event
    const calendarEvent = googleCalendarService.formatBookingAsCalendarEvent(booking);

    // Create event in Google Calendar
    const googleEventId = await googleCalendarService.createCalendarEvent(config, calendarEvent);

    // Store the Google event ID in the booking record
    await supabase
      .from('quotes')
      .update({ google_calendar_event_id: googleEventId })
      .eq('id', bookingId);

    return { success: true, googleEventId };
  } catch (error) {
    console.error('Sync booking to calendar error:', error);
    throw error;
  }
}

/**
 * Update a booking in technician's Google Calendar
 */
export async function updateBookingInCalendar(bookingId: string, technicianId: string) {
  try {
    // Get booking details including Google event ID
    const { data: booking, error: bookingError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking || !booking.google_calendar_event_id) {
      throw new Error('Booking or Google event not found');
    }

    // Get technician's calendar config
    const { data: config, error: configError } = await supabase
      .from('technician_calendar_configs')
      .select('*')
      .eq('technician_id', technicianId)
      .single();

    if (configError || !config) {
      throw new Error('Calendar not configured for this technician');
    }

    // Format updated booking as calendar event
    const calendarEvent = googleCalendarService.formatBookingAsCalendarEvent(booking);

    // Update event in Google Calendar
    await googleCalendarService.updateCalendarEvent(
      config,
      booking.google_calendar_event_id,
      calendarEvent
    );

    return { success: true };
  } catch (error) {
    console.error('Update booking in calendar error:', error);
    throw error;
  }
}

/**
 * Remove a booking from technician's Google Calendar
 */
export async function removeBookingFromCalendar(bookingId: string, technicianId: string) {
  try {
    // Get booking details including Google event ID
    const { data: booking, error: bookingError } = await supabase
      .from('quotes')
      .select('google_calendar_event_id')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking || !booking.google_calendar_event_id) {
      return { success: true }; // Already removed or never existed
    }

    // Get technician's calendar config
    const { data: config, error: configError } = await supabase
      .from('technician_calendar_configs')
      .select('*')
      .eq('technician_id', technicianId)
      .single();

    if (configError || !config) {
      throw new Error('Calendar not configured for this technician');
    }

    // Delete event from Google Calendar
    await googleCalendarService.deleteCalendarEvent(config, booking.google_calendar_event_id);

    // Clear the Google event ID from booking record
    await supabase
      .from('quotes')
      .update({ google_calendar_event_id: null })
      .eq('id', bookingId);

    return { success: true };
  } catch (error) {
    console.error('Remove booking from calendar error:', error);
    throw error;
  }
}

/**
 * Handle webhook notifications from Google Calendar
 */
export async function handleCalendarWebhook(headers: any, body: any) {
  try {
    const technicianId = headers['x-goog-channel-token'];
    const resourceId = headers['x-goog-resource-id'];

    if (!technicianId) {
      throw new Error('Invalid webhook token');
    }

    // Get technician's calendar config
    const { data: config, error: configError } = await supabase
      .from('technician_calendar_configs')
      .select('*')
      .eq('technician_id', technicianId)
      .single();

    if (configError || !config) {
      throw new Error('Calendar config not found');
    }

    // Get recent events from Google Calendar
    const events = await googleCalendarService.getCalendarEvents(
      config,
      new Date().toISOString(), // From now
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Next 30 days
    );

    // Process events and update local calendar if needed
    // This is where you'd implement logic to handle external calendar changes
    console.log('Calendar webhook received for technician:', technicianId);
    console.log('Events:', events);

    return { success: true };
  } catch (error) {
    console.error('Calendar webhook error:', error);
    throw error;
  }
} 