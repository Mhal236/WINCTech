// Vercel serverless function for fetching technician jobs
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Get Supabase credentials from environment
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      bodyReceived: !!req.body
    });

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration');
      return res.status(500).json({ 
        success: false, 
        error: 'Server configuration error',
        details: {
          hasSupabaseUrl: !!supabaseUrl,
          hasServiceKey: !!supabaseServiceKey
        }
      });
    }

    // Dynamically import Supabase client
    console.log('Importing Supabase client...');
    const { createClient } = await import('@supabase/supabase-js');
    console.log('Supabase client imported successfully');
    
    // Create Supabase client with service role key for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { technicianId } = req.body || {};
    
    if (!technicianId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing technicianId' 
      });
    }

    // Fetch job assignments with full MasterCustomer details
    const { data, error } = await supabase
      .from('job_assignments')
      .select(`
        *,
        MasterCustomer (
          id,
          quote_id,
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
          year,
          window_damage,
          selected_windows,
          window_spec,
          adas_calibration,
          delivery_type,
          timeline,
          duration,
          job_progress
        )
      `)
      .eq('technician_id', technicianId)
      .order('assigned_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error in /api/technician/jobs:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error
    });
  }
}

