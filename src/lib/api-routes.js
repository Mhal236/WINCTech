import express from 'express';
import * as GlassApiService from './glass-api-service.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env files
dotenv.config();

/**
 * Create and configure the API router
 * @returns {express.Router} Configured Express router with all API endpoints
 */
export function createApiRouter() {
  const router = express.Router();
  
  // Configure middleware
  router.use(express.json());
  router.use(express.urlencoded({ extended: true }));
  
  // Enable CORS
  router.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Helper: get Supabase admin client
  function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRole) {
      return { error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in server environment' };
    }
    const client = createClient(url, serviceRole, {
      auth: { persistSession: false }
    });
    return { client };
  }

  // Example API endpoint
  router.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'API server is running'
    });
  });

  // Test endpoint for the direct-test
  router.get('/api/direct-test', (req, res) => {
    res.json({
      status: 'ok',
      message: 'Direct test endpoint reached successfully',
      headers: req.headers,
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString()
    });
  });

  // Vehicle data API endpoint
  router.get('/api/vehicle/:vrn', async (req, res) => {
    try {
      const vrn = req.params.vrn;
      if (!vrn) {
        return res.status(400).json({
          success: false,
          error: "Vehicle registration number (VRN) is required"
        });
      }

      console.log(`Handling vehicle data request for VRN: ${vrn}`);
      
      // Get API key from environment with multiple fallbacks
      const apiKey = process.env.VEHICLE_API_KEY;
      // Use the VITE prefixed environment variable
      const apiUrl = process.env.VITE_VEHICLE_API_URL;
      
      if (!apiKey || !apiUrl) {
        console.error('Missing API key or URL in environment variables');
        console.log('Available environment variables:', Object.keys(process.env).filter(key => 
          key.includes('VEHICLE') || key.includes('API')).join(', '));
        return res.status(500).json({
          success: false,
          error: "Missing API configuration. Check server environment."
        });
      }
      
      // Log partial API key for debugging
      const keyLength = apiKey.length;
      const maskedKey = keyLength > 8 
        ? `${apiKey.substring(0, 4)}...${apiKey.substring(keyLength-4)}`
        : '****';
      console.log(`Using API key: ${maskedKey}`);
      
      // Construct the full URL with query parameters - use lowercase key_vrm
      const url = `${apiUrl}?v=2&api_nullitems=1&auth_apikey=${apiKey}&key_vrm=${vrn}`;
      
      console.log(`Making vehicle API request to: ${apiUrl}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Vehicle API error:', data);
        const statusCode = response.status || 500;
        return res.status(statusCode).json({
          success: false,
          error: data.Message || 'Error retrieving vehicle data'
        });
      }
      
      // Extract the relevant vehicle data
      if (data?.Response?.DataItems?.VehicleRegistration) {
        const vehicleReg = data.Response.DataItems.VehicleRegistration;
        
        const vehicleData = {
          make: vehicleReg.Make || '',
          model: vehicleReg.Model || '',
          year: vehicleReg.YearOfManufacture || '',
          color: vehicleReg.Colour || '',
          fuelType: vehicleReg.FuelType || '',
          transmission: vehicleReg.Transmission || '',
          engineCapacity: vehicleReg.EngineCapacity || '',
          // Include the full response data for debugging
          fullData: data
        };
        
        return res.json(vehicleData);
      } else {
        console.error('Could not find vehicle registration data in the response');
        return res.status(404).json({
          success: false,
          error: 'Vehicle data not found',
          rawResponse: data
        });
      }
    } catch (error) {
      console.error('Error in vehicle data endpoint:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: "Failed to retrieve vehicle data"
      });
    }
  });

  // Glass API HelloWorld test endpoint
  router.get('/api/glass/hello-world', async (req, res) => {
    try {
      const result = await GlassApiService.helloWorld();
      res.json(result);
    } catch (error) {
      console.error('Error in hello-world endpoint:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: "Failed to perform HelloWorld test"
      });
    }
  });

  // Glass API get makes endpoint
  router.get('/api/glass/makes', async (req, res) => {
    try {
      const result = await GlassApiService.getMakes();
      res.json(result);
    } catch (error) {
      console.error('Error getting makes:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: "Failed to get vehicle makes"
      });
    }
  });

  // Glass API get models endpoint
  router.get('/api/glass/models/:make', async (req, res) => {
    try {
      const { make } = req.params;
      if (!make) {
        return res.status(400).json({
          success: false,
          error: "Make parameter is required"
        });
      }
      
      const result = await GlassApiService.getModels(make);
      res.json(result);
    } catch (error) {
      console.error('Error getting models:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: "Failed to get vehicle models"
      });
    }
  });

  // Glass API get stock list endpoint
  router.get('/api/glass/stock', async (req, res) => {
    try {
      const { make, model, year, modelType } = req.query;
      
      if (!make || !model || !year) {
        return res.status(400).json({
          success: false,
          error: "Make, model, and year parameters are required"
        });
      }
      
      const result = await GlassApiService.getStockList(
        make, 
        model, 
        modelType || "", 
        parseInt(year)
      );
      res.json(result);
    } catch (error) {
      console.error('Error getting stock list:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: "Failed to get stock list"
      });
    }
  });

  // =============================
  // Jobs: Secure endpoints
  // =============================

  // Accept job (service role)
  router.post('/api/jobs/accept', async (req, res) => {
    try {
      const { client, error: clientErr } = getSupabaseAdmin();
      if (clientErr) return res.status(500).json({ success: false, error: clientErr });

      const { jobId, technicianId, technicianName } = req.body || {};
      if (!jobId || !technicianId || !technicianName) {
        return res.status(400).json({ success: false, error: 'Missing required fields: jobId, technicianId, technicianName' });
      }

      // Prevent double assignment
      const { data: existingAssign, error: existingErr } = await client
        .from('job_assignments')
        .select('id')
        .eq('job_id', jobId)
        .maybeSingle();

      if (existingErr) {
        return res.status(500).json({ success: false, error: existingErr.message });
      }
      if (existingAssign) {
        return res.status(409).json({ success: false, error: 'Job already assigned' });
      }

      // Insert assignment
      const { data: assignment, error: insertErr } = await client
        .from('job_assignments')
        .insert({ job_id: jobId, technician_id: technicianId, status: 'assigned' })
        .select()
        .single();

      if (insertErr || !assignment) {
        return res.status(500).json({ success: false, error: insertErr?.message || 'Failed to create assignment' });
      }

      // Update MasterCustomer
      const { error: updateErr } = await client
        .from('MasterCustomer')
        .update({ status: 'assigned', technician_id: technicianId, technician_name: technicianName })
        .eq('id', jobId);

      if (updateErr) {
        // Rollback assignment
        await client.from('job_assignments').delete().eq('id', assignment.id);
        return res.status(500).json({ success: false, error: updateErr.message });
      }

      return res.json({ success: true, assignmentId: assignment.id });
    } catch (error) {
      console.error('Error in /api/jobs/accept:', error);
      return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Create calendar event (service role)
  router.post('/api/jobs/create-event', async (req, res) => {
    try {
      const { client, error: clientErr } = getSupabaseAdmin();
      if (clientErr) return res.status(500).json({ success: false, error: clientErr });

      const {
        assignmentId,
        job,
        technicianId
      } = req.body || {};

      if (!assignmentId || !job || !technicianId) {
        return res.status(400).json({ success: false, error: 'Missing required fields: assignmentId, job, technicianId' });
      }

      const eventDate = job.appointment_date || new Date().toISOString().split('T')[0];
      const startTime = (job.time_slot?.split('-')[0] || '09:00').trim();
      const duration = job.duration || '2 hours';
      
      // Calculate end time
      const getEnd = (start, dur) => {
        try {
          const [h, m] = start.split(':').map(Number);
          let hours = 2;
          if (dur.includes('hour')) hours = parseInt(dur.match(/\d+/)?.[0] || '2');
          else if (dur.includes('minute')) hours = (parseInt(dur.match(/\d+/)?.[0] || '120')) / 60;
          const endH = h + Math.floor(hours);
          const endMtotal = m + (hours % 1) * 60;
          const finalM = Math.round(endMtotal % 60);
          const extraH = Math.floor(endMtotal / 60);
          const finalH = endH + extraH;
          return `${finalH.toString().padStart(2,'0')}:${finalM.toString().padStart(2,'0')}`;
        } catch { return '17:00'; }
      };

      const endTime = getEnd(startTime, duration);
      const vehicleInfo = [job.year, job.brand, job.model].filter(Boolean).join(' ') || 'Vehicle information not available';
      const location = `${job.location || ''} ${job.postcode || ''}`.trim();

      // Check if technician has Google Calendar configured
      let googleCalendarEventId = null;
      try {
        const { data: calendarConfig, error: configError } = await client
          .from('technician_calendar_configs')
          .select('*')
          .eq('technician_id', technicianId)
          .eq('sync_enabled', true)
          .single();

        if (calendarConfig && !configError) {
          // Import Google Calendar service
          const { googleCalendarService } = require('../../services/googleCalendarService');
          
          // Create Google Calendar event
          const startDateTime = new Date(`${eventDate}T${startTime}:00`);
          const endDateTime = new Date(`${eventDate}T${endTime}:00`);
          
          const calendarEvent = {
            summary: `${job.service_type || 'Windscreen Service'} - ${job.full_name}`,
            description: `Vehicle: ${vehicleInfo}\nService: ${job.service_type || 'Windscreen Service'}\nGlass Type: ${job.glass_type || 'Standard'}\nCustomer: ${job.full_name}\nPhone: ${job.mobile || 'N/A'}\n\nJob ID: ${job.id}`,
            start: {
              dateTime: startDateTime.toISOString(),
              timeZone: 'Europe/London'
            },
            end: {
              dateTime: endDateTime.toISOString(),
              timeZone: 'Europe/London'
            },
            location: location,
            attendees: job.email ? [{ email: job.email }] : []
          };

          try {
            googleCalendarEventId = await googleCalendarService.createCalendarEvent(calendarConfig, calendarEvent);
            console.log('✅ Successfully created Google Calendar event:', googleCalendarEventId);
          } catch (googleError) {
            console.warn('⚠️ Failed to create Google Calendar event, but proceeding with local calendar:', googleError.message);
          }
        }
      } catch (calendarError) {
        console.warn('⚠️ Calendar sync check failed, proceeding with local calendar only:', calendarError.message);
      }

      // Create local calendar event
      const { error } = await client
        .from('calendar_events')
        .insert({
          job_assignment_id: assignmentId,
          technician_id: technicianId,
          title: `${job.service_type || 'Windscreen Service'} - ${job.full_name}`,
          description: `Vehicle: ${vehicleInfo}\nService: ${job.service_type || 'Windscreen Service'}\nGlass Type: ${job.glass_type || 'Standard'}\nCustomer: ${job.full_name}\nPhone: ${job.mobile || 'N/A'}`,
          start_date: eventDate,
          start_time: startTime,
          end_date: eventDate,
          end_time: endTime,
          location,
          customer_name: job.full_name,
          customer_phone: job.mobile,
          vehicle_info: vehicleInfo,
          status: 'scheduled',
          google_calendar_event_id: googleCalendarEventId
        });

      if (error) return res.status(500).json({ success: false, error: error.message });
      
      const message = googleCalendarEventId 
        ? 'Calendar event created successfully and synced to Google Calendar'
        : 'Calendar event created successfully (Google Calendar sync not configured)';
        
      return res.json({ success: true, message, googleCalendarEventId });
    } catch (error) {
      console.error('Error in /api/jobs/create-event:', error);
      return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Add more API routes from your api-server.js file here

  return router;
} 