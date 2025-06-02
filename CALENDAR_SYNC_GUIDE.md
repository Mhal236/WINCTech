# 📅 Google Calendar Sync Implementation Guide

## Overview
This guide explains multiple approaches to sync each technician's personal Google Calendar with your WindscreenCompare app, enabling bidirectional synchronization.

## ✅ What's Already Implemented

### 1. **Google Calendar API Service** (`src/services/googleCalendarService.ts`)
- ✅ OAuth2 authentication flow
- ✅ Create, update, delete events
- ✅ Real-time webhook notifications
- ✅ Event formatting for your business

### 2. **Calendar Sync UI** (`src/components/calendar/CalendarSyncSetup.tsx`)
- ✅ User-friendly setup component
- ✅ Connection status monitoring
- ✅ Test sync functionality
- ✅ Disconnect option

### 3. **API Integration** (`src/api/calendar.ts`)
- ✅ OAuth callback handling
- ✅ Sync booking operations
- ✅ Webhook processing

## 🚀 Implementation Approaches

### **Approach 1: Google Calendar API (Recommended)**

**Best For:** Professional businesses, reliable sync, full control

**Features:**
- ✅ Bidirectional sync (app ↔ Google Calendar)
- ✅ Real-time webhooks for instant updates
- ✅ Proper OAuth2 security
- ✅ Event conflict detection
- ✅ Bulk operations

**Setup Steps:**

#### 1. **Google Cloud Console Setup**
```bash
1. Go to Google Cloud Console (console.cloud.google.com)
2. Create new project or select existing
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - https://yourdomain.com/auth/google/callback
   - http://localhost:3000/auth/google/callback (for dev)
```

#### 2. **Environment Variables**
```bash
# Add to your .env file
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/google/callback
```

#### 3. **Database Schema**
```sql
-- Add to Supabase
CREATE TABLE technician_calendar_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  technician_id UUID REFERENCES technicians(id),
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  calendar_id TEXT DEFAULT 'primary',
  webhook_resource_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add to existing quotes table
ALTER TABLE quotes ADD COLUMN google_calendar_event_id TEXT;
```

#### 4. **Install Dependencies**
```bash
npm install googleapis @types/google.auth
```

#### 5. **Usage in Your App**
```tsx
import { CalendarSyncSetup } from '@/components/calendar/CalendarSyncSetup';

// In your technician profile/settings page
<CalendarSyncSetup technicianId={technician.id} />
```

### **Approach 2: CalDAV Integration**

**Best For:** Multi-platform support, open standards

```typescript
// Example CalDAV client setup
import { DAVClient } from 'tsdav';

const calendarService = {
  async syncWithCalDAV(username: string, password: string, serverUrl: string) {
    const client = new DAVClient({
      serverUrl,
      credentials: { username, password },
      authMethod: 'Basic',
      defaultAccountType: 'caldav'
    });

    await client.login();
    const calendars = await client.fetchCalendars();
    
    // Sync events bidirectionally
    return calendars;
  }
};
```

### **Approach 3: iCal/ICS File Sync**

**Best For:** Simple one-way sync, minimal setup

```typescript
// Generate iCal feed for technician
const generateTechnicianCalendar = (technicianId: string) => {
  const ical = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//WindscreenCompare//Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH

BEGIN:VEVENT
UID:${eventId}@windscreencompare.com
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${jobTitle}
DESCRIPTION:${jobDetails}
LOCATION:${jobLocation}
END:VEVENT

END:VCALENDAR`;

  return ical;
};

// Technicians can subscribe to: https://yourapp.com/calendar/technician/{id}.ics
```

### **Approach 4: Microsoft Graph API (for Outlook)**

**Best For:** Teams using Microsoft 365

```typescript
import { Client } from '@microsoft/microsoft-graph-client';

const outlookSync = {
  async createEvent(accessToken: string, event: any) {
    const graphClient = Client.init({
      authProvider: {
        getAccessToken: () => Promise.resolve(accessToken)
      }
    });

    return await graphClient.api('/me/events').post(event);
  }
};
```

## 🔄 Bidirectional Sync Implementation

### **App → Google Calendar**
```typescript
// When booking is created/updated in your app
export const syncBookingToGoogle = async (booking: any) => {
  const { technicianId, ...bookingData } = booking;
  
  // Get technician's calendar config
  const config = await getTechnicianCalendarConfig(technicianId);
  
  if (config) {
    // Create/update in Google Calendar
    await googleCalendarService.createCalendarEvent(config, bookingData);
  }
};
```

### **Google Calendar → App**
```typescript
// Webhook handler for Google Calendar changes
export const handleGoogleCalendarWebhook = async (req: Request) => {
  const technicianId = req.headers['x-goog-channel-token'];
  const events = await googleCalendarService.getCalendarEvents(config);
  
  // Process external calendar changes
  for (const event of events) {
    if (isWorkRelatedEvent(event)) {
      await updateLocalBooking(event);
    }
  }
};
```

## 🔧 Advanced Features

### **1. Conflict Detection**
```typescript
const detectConflicts = async (newBooking: Booking, technicianId: string) => {
  const existingEvents = await getOverlappingEvents(
    newBooking.startTime,
    newBooking.endTime,
    technicianId
  );
  
  return existingEvents.length > 0;
};
```

### **2. Automatic Scheduling**
```typescript
const findAvailableSlot = async (technicianId: string, duration: number) => {
  const calendar = await googleCalendarService.getCalendarEvents(config);
  const availableSlots = calculateAvailableSlots(calendar, duration);
  return availableSlots[0]; // Return first available slot
};
```

### **3. Reminder Notifications**
```typescript
const setupReminders = (event: CalendarEvent) => {
  return {
    ...event,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 60 }, // 1 hour before
        { method: 'popup', minutes: 15 }  // 15 minutes before
      ]
    }
  };
};
```

## 📱 Mobile Integration

### **iOS Calendar Sync**
```typescript
// Using EventKit framework via Capacitor
import { Calendar } from '@capacitor-community/calendar';

const iOSSync = {
  async addEvent(event: any) {
    await Calendar.createEvent({
      title: event.summary,
      startDate: new Date(event.start.dateTime),
      endDate: new Date(event.end.dateTime),
      location: event.location
    });
  }
};
```

### **Android Calendar Sync**
```typescript
// Using Android Calendar Provider
const androidSync = {
  async syncToSystemCalendar(events: any[]) {
    // Implementation using Android Calendar API
    // via Capacitor plugin
  }
};
```

## 🔒 Security & Privacy

### **Data Protection**
- ✅ Store only necessary calendar tokens
- ✅ Encrypt sensitive calendar data
- ✅ Implement token refresh logic
- ✅ Allow users to revoke access anytime

### **Privacy Controls**
```typescript
const privacySettings = {
  syncPersonalEvents: false,     // Only sync work events
  shareEventDetails: 'minimal', // Title only, no descriptions
  syncDirection: 'bidirectional' // or 'app-to-calendar-only'
};
```

## 🚀 Deployment Checklist

### **Before Going Live:**
- [ ] Set up Google Cloud Console project
- [ ] Configure OAuth redirect URIs for production
- [ ] Add environment variables to production
- [ ] Set up webhook endpoints with HTTPS
- [ ] Test with multiple technicians
- [ ] Implement error monitoring
- [ ] Create user documentation

### **Database Migrations:**
```sql
-- Run these in Supabase
CREATE TABLE technician_calendar_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  technician_id UUID REFERENCES technicians(id),
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  calendar_id TEXT DEFAULT 'primary',
  webhook_resource_id TEXT,
  sync_enabled BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE quotes ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS calendar_sync_status TEXT DEFAULT 'pending';

-- Indexes for performance
CREATE INDEX idx_technician_calendar_configs_technician_id ON technician_calendar_configs(technician_id);
CREATE INDEX idx_quotes_google_calendar_event_id ON quotes(google_calendar_event_id);
```

## 🎯 Usage Examples

### **Basic Setup in Technician Settings**
```tsx
import { CalendarSyncSetup } from '@/components/calendar/CalendarSyncSetup';

export function TechnicianSettings({ technician }) {
  return (
    <div className="space-y-6">
      <h2>Calendar Integration</h2>
      <CalendarSyncSetup technicianId={technician.id} />
    </div>
  );
}
```

### **Auto-sync New Bookings**
```tsx
// In your BookingForm component
const handleBookingSubmit = async (bookingData) => {
  // Create booking in database
  const booking = await createBooking(bookingData);
  
  // Auto-sync to technician's calendar if enabled
  if (booking.technician_id) {
    await syncBookingToCalendar(booking.id, booking.technician_id);
  }
};
```

### **Calendar View Integration**
```tsx
// Enhanced calendar component showing synced events
export function TechnicianCalendarView({ technicianId }) {
  const [events, setEvents] = useState([]);
  
  useEffect(() => {
    // Load events from both app database and Google Calendar
    loadSyncedEvents(technicianId).then(setEvents);
  }, [technicianId]);
  
  return (
    <Calendar
      events={events}
      onEventUpdate={async (event) => {
        await updateBookingInCalendar(event.id, technicianId);
      }}
    />
  );
}
```

## 📊 Benefits Summary

| Feature | Google Calendar API | CalDAV | iCal Feed | Manual Entry |
|---------|-------------------|---------|-----------|-------------|
| **Bidirectional Sync** | ✅ | ✅ | ❌ | ❌ |
| **Real-time Updates** | ✅ | ⚠️ | ❌ | ❌ |
| **Setup Complexity** | Medium | High | Low | None |
| **Platform Support** | All | Most | All | All |
| **Conflict Detection** | ✅ | ✅ | ❌ | Manual |
| **Mobile Notifications** | ✅ | ✅ | ✅ | Manual |

## 🔧 Troubleshooting

### **Common Issues:**
1. **OAuth Errors**: Check redirect URIs and client credentials
2. **Webhook Failures**: Ensure HTTPS and valid SSL certificates
3. **Token Expiry**: Implement automatic refresh token logic
4. **Sync Delays**: Use webhooks instead of polling

### **Testing:**
```bash
# Test OAuth flow locally
npm run dev
# Navigate to /technician/settings and test calendar connection

# Test webhook endpoint
curl -X POST https://yourapp.com/api/calendar/webhook \
  -H "X-Goog-Channel-Token: test-technician-id" \
  -H "X-Goog-Resource-Id: test-resource"
```

This implementation provides a robust, scalable solution for syncing technicians' personal calendars with your windscreen repair booking system! 🚀 