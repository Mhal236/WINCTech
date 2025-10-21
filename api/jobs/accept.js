// Vercel serverless function for accepting/purchasing jobs
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    console.log('🔵 Job accept request received:', req.body);
    
    // Get Supabase credentials
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration');
      return res.status(500).json({ 
        success: false, 
        error: 'Server configuration error' 
      });
    }

    // Dynamically import Supabase client
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { jobId, technicianId, technicianName } = req.body || {};
    
    if (!jobId || !technicianId || !technicianName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: jobId, technicianId, technicianName' 
      });
    }

    // Check how many technicians have already purchased this lead
    const { data: existingAssignments, error: existingErr } = await supabase
      .from('job_assignments')
      .select('id, technician_id')
      .eq('job_id', jobId);

    if (existingErr) {
      return res.status(500).json({ success: false, error: existingErr.message });
    }
    
    // Check if this technician has already purchased this lead
    const hasAlreadyPurchased = existingAssignments?.some(a => a.technician_id === technicianId);
    if (hasAlreadyPurchased) {
      return res.status(409).json({ 
        success: false, 
        error: 'You have already purchased this lead' 
      });
    }
    
    // Check if 3 technicians have already purchased this lead
    if (existingAssignments && existingAssignments.length >= 3) {
      return res.status(409).json({ 
        success: false, 
        error: 'This lead is no longer available (maximum 3 purchases reached)' 
      });
    }

    // Insert assignment
    const { data: assignment, error: insertErr } = await supabase
      .from('job_assignments')
      .insert({ job_id: jobId, technician_id: technicianId, status: 'assigned' })
      .select()
      .single();

    if (insertErr || !assignment) {
      return res.status(500).json({ 
        success: false, 
        error: insertErr?.message || 'Failed to create assignment' 
      });
    }

    // Get job details to calculate credit cost
    const { data: jobData, error: jobFetchErr } = await supabase
      .from('MasterCustomer')
      .select('quote_price, status')
      .eq('id', jobId)
      .single();

    if (jobFetchErr || !jobData) {
      await supabase.from('job_assignments').delete().eq('id', assignment.id);
      return res.status(500).json({ success: false, error: 'Failed to fetch job details' });
    }

    // Calculate credit cost for job board leads (quoted status jobs)
    let creditCost = 0;
    let shouldDeductCredits = jobData.status === 'quoted';
    
    if (shouldDeductCredits && jobData.quote_price) {
      creditCost = Math.round(jobData.quote_price * 0.1); // 10% of job value
    }

    // Deduct credits if needed
    if (shouldDeductCredits && creditCost > 0) {
      const { data: techData, error: techFetchErr } = await supabase
        .from('technicians')
        .select('credits')
        .eq('id', technicianId)
        .single();

      if (techFetchErr || !techData) {
        await supabase.from('job_assignments').delete().eq('id', assignment.id);
        return res.status(500).json({ success: false, error: 'Failed to fetch technician credits' });
      }

      const currentCredits = techData.credits || 0;
      if (currentCredits < creditCost) {
        await supabase.from('job_assignments').delete().eq('id', assignment.id);
        return res.status(400).json({ 
          success: false, 
          error: `Insufficient credits. Need ${creditCost} credits, have ${currentCredits}` 
        });
      }

      const newCredits = currentCredits - creditCost;

      // Update credits
      const { error: creditUpdateErr } = await supabase
        .from('technicians')
        .update({ credits: newCredits })
        .eq('id', technicianId);

      if (creditUpdateErr) {
        console.error('Failed to deduct credits:', creditUpdateErr);
        await supabase.from('job_assignments').delete().eq('id', assignment.id);
        return res.status(500).json({ success: false, error: 'Failed to deduct credits' });
      }

      console.log(`✅ Deducted ${creditCost} credits from technician ${technicianId}. New balance: ${newCredits}`);
    }

    return res.json({ 
      success: true, 
      assignmentId: assignment.id, 
      creditsDeducted: shouldDeductCredits ? creditCost : 0 
    });
  } catch (error) {
    console.error('Error in /api/jobs/accept:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

