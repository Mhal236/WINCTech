import express from 'express';
import * as GlassApiService from './glass-api-service.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Load environment variables from .env files
dotenv.config();

/**
 * Create and setup the API middleware for Vite
 * @param {import('vite').ViteDevServer} server - The Vite server instance
 */
export function setupApiMiddleware(server) {
  const app = express();
  
  // Configure middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Enable CORS
  app.use((req, res, next) => {
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
      return { error: 'Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in server env' };
    }
    const client = createClient(url, serviceRole, { auth: { persistSession: false } });
    return { client };
  }

  // Initialize Stripe
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2024-06-20',
  });

  // Example API endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'API server is running'
    });
  });

  // Test endpoint
  app.get('/api/direct-test', (req, res) => {
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
  app.get('/api/vehicle/:vrn', async (req, res) => {
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
      
      // Log partial API key for debugging (only first 4 and last 4 characters)
      const keyLength = apiKey.length;
      const maskedKey = keyLength > 8 
        ? `${apiKey.substring(0, 4)}...${apiKey.substring(keyLength-4)}`
        : '****';
      console.log(`Using API key: ${maskedKey}`);
      
      // Construct the full URL with query parameters
      const url = `${apiUrl}?v=2&api_nullitems=1&auth_apikey=${apiKey}&key_vrm=${vrn}`;
      
      console.log(`Making vehicle API request to: ${apiUrl}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error('Vehicle API error:', response.status, response.statusText);
        return res.status(500).json({
          success: false,
          error: `Error retrieving vehicle data: ${response.status} ${response.statusText}`
        });
      }
      
      const data = await response.json();
      
      // Debug log the response structure
      console.log('API Response structure:', Object.keys(data));
      if (data.Response) {
        console.log('Response contains:', Object.keys(data.Response));
        if (data.Response.DataItems) {
          console.log('DataItems contains:', Object.keys(data.Response.DataItems));
        }
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
        console.log('Raw response data (partial):', JSON.stringify(data).substring(0, 500));
        return res.status(404).json({
          success: false,
          error: 'Vehicle data not found',
          rawResponse: data
        });
      }
    } catch (error) {
      console.error('Error in vehicle data endpoint:', error);
      return res.status(500).json({
        success: false,
        error: error.message || String(error),
        message: "Failed to retrieve vehicle data"
      });
    }
  });

  // Glass API HelloWorld test endpoint
  app.get('/api/glass/hello-world', async (req, res) => {
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
  app.get('/api/glass/makes', async (req, res) => {
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

  // =============================
  // Jobs: Secure endpoints (service role)
  // =============================
  app.post('/api/jobs/accept', async (req, res) => {
    try {
      const admin = getSupabaseAdmin();
      if (admin.error) return res.status(500).json({ success: false, error: admin.error });
      const supabase = admin.client;

      const { jobId, technicianId, technicianName } = req.body || {};
      if (!jobId || !technicianId || !technicianName) {
        return res.status(400).json({ success: false, error: 'Missing required fields: jobId, technicianId, technicianName' });
        }

      // Prevent double assignment
      const { data: existingAssign, error: existingErr } = await supabase
        .from('job_assignments')
        .select('id')
        .eq('job_id', jobId)
        .maybeSingle();

      if (existingErr) return res.status(500).json({ success: false, error: existingErr.message });
      if (existingAssign) return res.status(409).json({ success: false, error: 'Job already assigned' });

      // Insert assignment
      const { data: assignment, error: insertErr } = await supabase
        .from('job_assignments')
        .insert({ job_id: jobId, technician_id: technicianId, status: 'assigned' })
        .select()
        .single();

      if (insertErr || !assignment) {
        return res.status(500).json({ success: false, error: insertErr?.message || 'Failed to create assignment' });
      }

      // Update MasterCustomer
      const { error: updateErr } = await supabase
        .from('MasterCustomer')
        .update({ status: 'assigned', technician_id: technicianId, technician_name: technicianName })
        .eq('id', jobId);

      if (updateErr) {
        await supabase.from('job_assignments').delete().eq('id', assignment.id);
        return res.status(500).json({ success: false, error: updateErr.message });
      }

      return res.json({ success: true, assignmentId: assignment.id });
    } catch (error) {
      console.error('Error in /api/jobs/accept:', error);
      return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Unassign job (service role)
  app.post('/api/jobs/unassign', async (req, res) => {
    try {
      const admin = getSupabaseAdmin();
      if (admin.error) return res.status(500).json({ success: false, error: admin.error });
      const supabase = admin.client;

      const { jobId, technicianId } = req.body || {};
      if (!jobId || !technicianId) {
        return res.status(400).json({ success: false, error: 'Missing required fields: jobId, technicianId' });
      }

      // Verify the assignment exists and belongs to this technician
      const { data: assignment, error: assignmentError } = await supabase
        .from('job_assignments')
        .select('id, status')
        .eq('job_id', jobId)
        .eq('technician_id', technicianId)
        .single();

      if (assignmentError || !assignment) {
        return res.status(404).json({ success: false, error: 'Assignment not found or does not belong to this technician' });
      }

      // Don't allow unassigning completed jobs
      if (assignment.status === 'completed') {
        return res.status(400).json({ success: false, error: 'Cannot unassign completed jobs' });
      }

      // Delete the job assignment
      const { error: deleteError } = await supabase
        .from('job_assignments')
        .delete()
        .eq('id', assignment.id);

      if (deleteError) {
        return res.status(500).json({ success: false, error: deleteError.message });
      }

      // Update MasterCustomer back to quoted status
      const { error: updateError } = await supabase
        .from('MasterCustomer')
        .update({ 
          status: 'quoted', 
          technician_id: null, 
          technician_name: null 
        })
        .eq('id', jobId);

      if (updateError) {
        console.error('Failed to update MasterCustomer status after unassignment:', updateError);
        // Don't fail the request since the assignment was already deleted
      }

      // Delete any associated calendar events
      const { error: calendarDeleteError } = await supabase
        .from('calendar_events')
        .delete()
        .eq('job_assignment_id', assignment.id);

      if (calendarDeleteError) {
        console.error('Failed to delete calendar events:', calendarDeleteError);
        // Don't fail the request since the main unassignment was successful
      }

      return res.json({ success: true, message: 'Job unassigned successfully' });
    } catch (error) {
      console.error('Error in /api/jobs/unassign:', error);
      return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post('/api/jobs/create-event', async (req, res) => {
    try {
      const admin = getSupabaseAdmin();
      if (admin.error) return res.status(500).json({ success: false, error: admin.error });
      const supabase = admin.client;

      const { assignmentId, job, technicianId } = req.body || {};
      if (!assignmentId || !job || !technicianId) {
        return res.status(400).json({ success: false, error: 'Missing required fields: assignmentId, job, technicianId' });
      }

      const eventDate = job.appointment_date || new Date().toISOString().split('T')[0];
      const startTime = (job.time_slot?.split('-')[0] || '09:00').trim();

      // Calculate end time
      const getEnd = (start, dur) => {
        try {
          const [h, m] = start.split(':').map(Number);
          let hours = 2;
          if (dur?.includes('hour')) hours = parseInt(dur.match(/\d+/)?.[0] || '2');
          else if (dur?.includes('minute')) hours = (parseInt(dur.match(/\d+/)?.[0] || '120')) / 60;
          const endH = h + Math.floor(hours);
          const endMtotal = m + (hours % 1) * 60;
          const finalM = Math.round(endMtotal % 60);
          const extraH = Math.floor(endMtotal / 60);
          const finalH = endH + extraH;
          return `${finalH.toString().padStart(2,'0')}:${finalM.toString().padStart(2,'0')}`;
        } catch { return '17:00'; }
      };

      const endTime = getEnd(startTime, job.duration || '2 hours');
      const vehicleInfo = [job.year, job.brand, job.model].filter(Boolean).join(' ') || 'Vehicle information not available';
      const location = `${job.location || ''} ${job.postcode || ''}`.trim();

      // Check if technician has Google Calendar configured
      let googleCalendarEventId = null;
      try {
        const { data: calendarConfig, error: configError } = await supabase
          .from('technician_calendar_configs')
          .select('*')
          .eq('technician_id', technicianId)
          .eq('sync_enabled', true)
          .single();

        if (calendarConfig && !configError) {
          // Import Google Calendar service
          const { googleCalendarService } = require('../services/googleCalendarService');
          
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
      const { error } = await supabase
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

  // Get technician's accepted jobs (service role)
  app.post('/api/technician/jobs', async (req, res) => {
    try {
      const admin = getSupabaseAdmin();
      if (admin.error) return res.status(500).json({ success: false, error: admin.error });
      const supabase = admin.client;

      const { technicianId } = req.body || {};
      if (!technicianId) {
        return res.status(400).json({ success: false, error: 'Missing technicianId' });
      }

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

      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.json({ success: true, data });
    } catch (error) {
      console.error('Error in /api/technician/jobs:', error);
      return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // =============================
  // Stripe Payment Endpoints
  // =============================

  // Create payment intent
  app.post('/api/stripe/create-payment-intent', async (req, res) => {
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ error: 'Stripe secret key not configured' });
      }

      const { amount, credits, currency = 'gbp', description } = req.body;

      if (!amount || !credits || amount < 100) { // Minimum £1.00
        return res.status(400).json({ error: 'Invalid amount or credits' });
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount), // Amount in pence
        currency,
        description: description || `Purchase ${credits} credits`,
        metadata: {
          credits: credits.toString(),
          type: 'credit_purchase'
        }
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ error: error.message || 'Failed to create payment intent' });
    }
  });

  // Confirm payment and add credits to user account
  app.post('/api/stripe/confirm-payment', async (req, res) => {
    try {
      const admin = getSupabaseAdmin();
      if (admin.error) return res.status(500).json({ success: false, error: admin.error });
      const supabase = admin.client;

      const { paymentIntentId, technicianId } = req.body;

      if (!paymentIntentId || !technicianId) {
        return res.status(400).json({ success: false, error: 'Missing paymentIntentId or technicianId' });
      }

      // Retrieve payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ 
          success: false, 
          error: 'Payment not completed successfully' 
        });
      }

      const credits = parseInt(paymentIntent.metadata.credits);
      if (isNaN(credits) || credits <= 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid credits in payment metadata' 
        });
      }

      // Check if this payment has already been processed
      const { data: existingTransaction, error: checkError } = await supabase
        .from('credit_transactions')
        .select('id')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .single();

      if (existingTransaction) {
        return res.status(409).json({ 
          success: false, 
          error: 'Payment already processed' 
        });
      }

      // Get current user credits
      const { data: userData, error: userError } = await supabase
        .from('technicians')
        .select('credits')
        .eq('id', technicianId)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to fetch user data' 
        });
      }

      const currentCredits = userData?.credits || 0;
      const newCredits = currentCredits + credits;

      // Update user credits and create transaction record
      const { error: updateError } = await supabase
        .from('technicians')
        .update({ credits: newCredits })
        .eq('id', technicianId);

      if (updateError) {
        console.error('Error updating user credits:', updateError);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to update user credits' 
        });
      }

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert({
          technician_id: technicianId,
          type: 'purchase',
          credits: credits,
          amount: paymentIntent.amount / 100, // Convert pence to pounds
          currency: paymentIntent.currency.toUpperCase(),
          stripe_payment_intent_id: paymentIntentId,
          description: `Purchased ${credits} credits`,
          status: 'completed'
        });

      if (transactionError) {
        console.error('Error creating transaction record:', transactionError);
        // Don't fail the request since credits were already added
      }

      res.json({ 
        success: true, 
        credits: newCredits,
        creditsAdded: credits 
      });
    } catch (error) {
      console.error('Error confirming payment:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to confirm payment' 
      });
    }
  });

  // Get payment status
  app.get('/api/stripe/payment-status/:paymentIntentId', async (req, res) => {
    try {
      const { paymentIntentId } = req.params;
      
      if (!paymentIntentId) {
        return res.status(400).json({ error: 'Payment intent ID required' });
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      res.json({
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        credits: paymentIntent.metadata.credits
      });
    } catch (error) {
      console.error('Error fetching payment status:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch payment status' });
    }
  });

  // Apply the Express app as middleware to Vite's server
  server.middlewares.use(app);
  
  console.log('API middleware has been set up successfully');
} 