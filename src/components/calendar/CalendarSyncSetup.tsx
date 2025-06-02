import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Calendar, Check, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { googleCalendarService } from '@/services/googleCalendarService';
import { supabase } from '@/integrations/supabase/client';

interface CalendarSyncSetupProps {
  technicianId: string;
}

export function CalendarSyncSetup({ technicianId }: CalendarSyncSetupProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');

  useEffect(() => {
    checkExistingConnection();
  }, [technicianId]);

  const checkExistingConnection = async () => {
    try {
      // Check if technician has existing Google Calendar tokens
      const { data, error } = await supabase
        .from('technician_calendar_configs')
        .select('*')
        .eq('technician_id', technicianId)
        .single();

      if (data && !error) {
        setIsConnected(true);
        setSyncStatus('connected');
      }
    } catch (err) {
      console.error('Error checking calendar connection:', err);
    }
  };

  const handleConnectCalendar = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Generate OAuth URL and redirect user
      const authUrl = googleCalendarService.generateAuthUrl(technicianId);
      
      // Store the current state for when user returns
      localStorage.setItem('calendar_auth_state', technicianId);
      
      // Redirect to Google OAuth
      window.location.href = authUrl;
    } catch (err) {
      setError('Failed to initiate calendar connection. Please try again.');
      console.error('Calendar connection error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnectCalendar = async () => {
    setIsLoading(true);
    try {
      // Remove calendar configuration from database
      await supabase
        .from('technician_calendar_configs')
        .delete()
        .eq('technician_id', technicianId);

      setIsConnected(false);
      setSyncStatus('disconnected');
    } catch (err) {
      setError('Failed to disconnect calendar. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestSync = async () => {
    setIsLoading(true);
    try {
      // Create a test event to verify sync is working
      const testEvent = {
        summary: 'Calendar Sync Test - WindscreenCompare',
        description: 'This is a test event to verify calendar synchronization is working correctly.',
        start: {
          dateTime: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
          timeZone: 'Europe/London'
        },
        end: {
          dateTime: new Date(Date.now() + 120000).toISOString(), // 2 minutes from now
          timeZone: 'Europe/London'
        }
      };

      // Get technician's calendar config
      const { data: config } = await supabase
        .from('technician_calendar_configs')
        .select('*')
        .eq('technician_id', technicianId)
        .single();

      if (config) {
        await googleCalendarService.createCalendarEvent(config, testEvent);
        alert('Test event created successfully! Check your Google Calendar.');
      }
    } catch (err) {
      setError('Failed to create test event. Please check your calendar connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-xl">Google Calendar Sync</CardTitle>
            <p className="text-sm text-gray-600">Connect your personal Google Calendar for automatic job scheduling</p>
          </div>
          <Badge variant={isConnected ? 'default' : 'secondary'} className="ml-auto">
            {isConnected ? 'Connected' : 'Not Connected'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!isConnected ? (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Benefits of Calendar Sync:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Jobs automatically appear in your personal calendar</li>
                <li>• Two-way sync: changes in either calendar update both</li>
                <li>• Never miss an appointment again</li>
                <li>• Keep your personal and work schedules in sync</li>
                <li>• Get mobile notifications for upcoming jobs</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Setup Process:</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs">1</span>
                  <span>Click "Connect Google Calendar" below</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs">2</span>
                  <span>Sign in to your Google account</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs">3</span>
                  <span>Grant calendar access permissions</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs">4</span>
                  <span>Return here to complete setup</span>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleConnectCalendar}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Connecting...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <ExternalLink className="w-4 h-4" />
                  <span>Connect Google Calendar</span>
                </div>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Check className="w-5 h-5 text-green-600" />
                <h4 className="font-medium text-green-900">Calendar Successfully Connected!</h4>
              </div>
              <p className="text-sm text-green-800">
                Your Google Calendar is now synced with WindscreenCompare. New jobs will automatically 
                appear in your calendar, and any changes you make will sync both ways.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button 
                onClick={handleTestSync}
                disabled={isLoading}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Test Sync</span>
              </Button>

              <Button 
                onClick={handleDisconnectCalendar}
                disabled={isLoading}
                variant="destructive"
                className="flex items-center space-x-2"
              >
                <AlertCircle className="w-4 h-4" />
                <span>Disconnect</span>
              </Button>
            </div>

            <div className="text-xs text-gray-500 space-y-1">
              <p>• Sync typically occurs within 1-2 minutes</p>
              <p>• You can disconnect anytime without affecting existing events</p>
              <p>• Only work-related events are synced to maintain privacy</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 