import { google } from 'googleapis';

interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: string;
  attendees?: Array<{ email: string }>;
}

interface TechnicianCalendarConfig {
  technicianId: string;
  accessToken: string;
  refreshToken: string;
  calendarId: string; // Usually 'primary' for main calendar
}

class GoogleCalendarService {
  private oauth2Client: any;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  /**
   * Generate OAuth URL for technician to authorize calendar access
   */
  generateAuthUrl(technicianId: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: technicianId, // Pass technician ID in state
      prompt: 'consent' // Force consent to get refresh token
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokens(code: string): Promise<{ accessToken: string; refreshToken: string }> {
    const { tokens } = await this.oauth2Client.getToken(code);
    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token
    };
  }

  /**
   * Set credentials for API calls
   */
  private setCredentials(config: TechnicianCalendarConfig) {
    this.oauth2Client.setCredentials({
      access_token: config.accessToken,
      refresh_token: config.refreshToken
    });
  }

  /**
   * Create event in technician's Google Calendar
   */
  async createCalendarEvent(config: TechnicianCalendarConfig, event: CalendarEvent): Promise<string> {
    this.setCredentials(config);
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    try {
      const response = await calendar.events.insert({
        calendarId: config.calendarId,
        requestBody: event
      });

      return response.data.id!;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }

  /**
   * Update event in technician's Google Calendar
   */
  async updateCalendarEvent(
    config: TechnicianCalendarConfig, 
    eventId: string, 
    event: Partial<CalendarEvent>
  ): Promise<void> {
    this.setCredentials(config);
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    try {
      await calendar.events.update({
        calendarId: config.calendarId,
        eventId,
        requestBody: event
      });
    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw error;
    }
  }

  /**
   * Delete event from technician's Google Calendar
   */
  async deleteCalendarEvent(config: TechnicianCalendarConfig, eventId: string): Promise<void> {
    this.setCredentials(config);
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    try {
      await calendar.events.delete({
        calendarId: config.calendarId,
        eventId
      });
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      throw error;
    }
  }

  /**
   * Get events from technician's Google Calendar
   */
  async getCalendarEvents(
    config: TechnicianCalendarConfig,
    timeMin?: string,
    timeMax?: string
  ): Promise<CalendarEvent[]> {
    this.setCredentials(config);
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    try {
      const response = await calendar.events.list({
        calendarId: config.calendarId,
        timeMin: timeMin || new Date().toISOString(),
        timeMax: timeMax,
        singleEvents: true,
        orderBy: 'startTime'
      });

      return response.data.items?.map(item => ({
        id: item.id,
        summary: item.summary || '',
        description: item.description,
        start: item.start!,
        end: item.end!,
        location: item.location,
        attendees: item.attendees
      })) || [];
    } catch (error) {
      console.error('Error getting calendar events:', error);
      throw error;
    }
  }

  /**
   * Set up webhook for calendar changes
   */
  async setupCalendarWebhook(config: TechnicianCalendarConfig, webhookUrl: string): Promise<string> {
    this.setCredentials(config);
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    try {
      const response = await calendar.events.watch({
        calendarId: config.calendarId,
        requestBody: {
          id: `${config.technicianId}-${Date.now()}`,
          type: 'web_hook',
          address: webhookUrl,
          token: config.technicianId // Use technician ID as token for identification
        }
      });

      return response.data.resourceId!;
    } catch (error) {
      console.error('Error setting up calendar webhook:', error);
      throw error;
    }
  }

  /**
   * Convert app booking to Google Calendar event format
   */
  formatBookingAsCalendarEvent(booking: any): CalendarEvent {
    const startDateTime = new Date(`${booking.scheduled_date}T${booking.scheduled_time}`);
    const endDateTime = new Date(startDateTime.getTime() + (2 * 60 * 60 * 1000)); // 2 hour default duration

    return {
      summary: `${booking.service_type} - ${booking.customer_name}`,
      description: `
        Customer: ${booking.customer_name}
        Phone: ${booking.phone}
        Email: ${booking.email}
        Vehicle: ${booking.vehicle_make} ${booking.vehicle_model} (${booking.vehicle_year})
        VRN: ${booking.vehicleRegistration}
        Glass Type: ${booking.glass_type}
        Service: ${booking.service_type}
        
        Job ID: ${booking.id}
      `.trim(),
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'Europe/London'
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'Europe/London'
      },
      location: booking.postcode,
      attendees: [
        { email: booking.email }
      ]
    };
  }
}

export const googleCalendarService = new GoogleCalendarService();
export type { CalendarEvent, TechnicianCalendarConfig }; 