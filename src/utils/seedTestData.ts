import { supabase } from '@/lib/supabase';

export interface TestJobData {
  id?: string;
  full_name: string;
  email: string;
  mobile: string;
  location: string;
  postcode: string;
  vehicle_reg: string;
  year: number;
  brand: string;
  model: string;
  service_type: string;
  glass_type: string;
  quote_price: number;
  status: 'quoted' | 'paid';
  created_at?: string;
}

export interface TestTechnicianData {
  id?: string;
  name: string;
  contact_email: string;
  user_id?: string;
  phone?: string;
  location?: string;
  status: 'active' | 'inactive';
  created_at?: string;
}

/**
 * Create test technician record for tech@windscreencompare.com
 */
export async function createTestTechnician(userId: string): Promise<{ success: boolean; error?: any; technicianId?: string }> {
  try {
    // Check if technician already exists
    const { data: existingTech } = await supabase
      .from('technicians')
      .select('id')
      .eq('contact_email', 'tech@windscreencompare.com')
      .single();

    if (existingTech) {
      console.log('✅ Technician record already exists:', existingTech.id);
      return { success: true, technicianId: existingTech.id };
    }

    const testTechnician: TestTechnicianData = {
      name: 'Test Technician',
      contact_email: 'tech@windscreencompare.com',
      user_id: userId,
      phone: '+44 7123 456789',
      location: 'London, UK',
      status: 'active',
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('technicians')
      .insert([testTechnician])
      .select('id')
      .single();

    if (error) {
      console.error('❌ Error creating test technician:', error);
      return { success: false, error };
    }

    console.log('✅ Created test technician:', data.id);
    return { success: true, technicianId: data.id };
  } catch (error) {
    console.error('❌ Exception creating test technician:', error);
    return { success: false, error };
  }
}

/**
 * Create test job data for testing the Jobs page
 */
export async function createTestJobs(): Promise<{ success: boolean; error?: any; jobsCreated?: number }> {
  try {
    // Check if test jobs already exist
    const { data: existingJobs } = await supabase
      .from('MasterCustomer')
      .select('id')
      .eq('email', 'test.customer@example.com');

    if (existingJobs && existingJobs.length > 0) {
      console.log('✅ Test jobs already exist:', existingJobs.length, 'jobs');
      return { success: true, jobsCreated: existingJobs.length };
    }

    const testJobs: TestJobData[] = [
      {
        full_name: 'John Smith',
        email: 'test.customer@example.com',
        mobile: '+44 7700 900123',
        location: '123 High Street, London',
        postcode: 'SW1A 1AA',
        vehicle_reg: 'AB12 CDE',
        year: 2020,
        brand: 'BMW',
        model: '3 Series',
        service_type: 'Windscreen Replacement',
        glass_type: 'Standard',
        quote_price: 299.99,
        status: 'quoted',
        created_at: new Date().toISOString()
      },
      {
        full_name: 'Emma Thompson',
        email: 'test.customer2@example.com',
        mobile: '+44 7700 900124',
        location: '456 Baker Street, London',
        postcode: 'NW1 6XE',
        vehicle_reg: 'FG34 HIJ',
        year: 2019,
        brand: 'Audi',
        model: 'A4',
        service_type: 'Windscreen Repair',
        glass_type: 'Standard',
        quote_price: 89.99,
        status: 'quoted',
        created_at: new Date(Date.now() - 86400000).toISOString() // 1 day ago
      },
      {
        full_name: 'David Wilson',
        email: 'test.customer3@example.com',
        mobile: '+44 7700 900125',
        location: '789 Oxford Street, London',
        postcode: 'W1C 1DX',
        vehicle_reg: 'KL56 MNO',
        year: 2021,
        brand: 'Mercedes',
        model: 'C-Class',
        service_type: 'Side Window Replacement',
        glass_type: 'Heated',
        quote_price: 199.99,
        status: 'quoted',
        created_at: new Date(Date.now() - 172800000).toISOString() // 2 days ago
      },
      {
        full_name: 'Sarah Parker',
        email: 'test.exclusive@example.com',
        mobile: '+44 7700 900126',
        location: '321 Regent Street, London',
        postcode: 'W1B 3HH',
        vehicle_reg: 'PQ78 RST',
        year: 2022,
        brand: 'Range Rover',
        model: 'Evoque',
        service_type: 'Windscreen Replacement',
        glass_type: 'Rain Sensor',
        quote_price: 449.99,
        status: 'paid', // This will be an exclusive job
        created_at: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      },
      {
        full_name: 'Michael Brown',
        email: 'test.exclusive2@example.com',
        mobile: '+44 7700 900127',
        location: '654 Piccadilly, London',
        postcode: 'W1J 0DS',
        vehicle_reg: 'UV90 WXY',
        year: 2023,
        brand: 'Tesla',
        model: 'Model 3',
        service_type: 'Windscreen Replacement',
        glass_type: 'Camera Calibration',
        quote_price: 599.99,
        status: 'paid', // This will be an exclusive job
        created_at: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
      }
    ];

    const { data, error } = await supabase
      .from('MasterCustomer')
      .insert(testJobs)
      .select('id');

    if (error) {
      console.error('❌ Error creating test jobs:', error);
      return { success: false, error };
    }

    console.log('✅ Created test jobs:', data?.length || 0, 'jobs');
    return { success: true, jobsCreated: data?.length || 0 };
  } catch (error) {
    console.error('❌ Exception creating test jobs:', error);
    return { success: false, error };
  }
}

/**
 * Create test calendar events for the technician
 */
export async function createTestCalendarEvents(technicianId: string): Promise<{ success: boolean; error?: any; eventsCreated?: number }> {
  try {
    // Check if test events already exist
    const { data: existingEvents } = await supabase
      .from('calendar_events')
      .select('id')
      .eq('technician_id', technicianId);

    if (existingEvents && existingEvents.length > 0) {
      console.log('✅ Test calendar events already exist:', existingEvents.length, 'events');
      return { success: true, eventsCreated: existingEvents.length };
    }

    // Create some job assignments first (needed for calendar events)
    const { data: jobs } = await supabase
      .from('MasterCustomer')
      .select('id')
      .eq('status', 'paid')
      .limit(2);

    if (!jobs || jobs.length === 0) {
      console.log('⚠️ No jobs available to create calendar events');
      return { success: true, eventsCreated: 0 };
    }

    // Create job assignments
    const assignments = jobs.map(job => ({
      job_id: job.id,
      technician_id: technicianId,
      assigned_at: new Date().toISOString(),
      status: 'assigned' as const
    }));

    const { data: assignmentData, error: assignmentError } = await supabase
      .from('job_assignments')
      .insert(assignments)
      .select('id');

    if (assignmentError || !assignmentData) {
      console.error('❌ Error creating job assignments:', assignmentError);
      return { success: false, error: assignmentError };
    }

    // Create calendar events
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const testEvents = [
      {
        job_assignment_id: assignmentData[0].id,
        technician_id: technicianId,
        title: 'Windscreen Replacement - Sarah Parker',
        description: 'Range Rover Evoque windscreen replacement with rain sensor calibration',
        start_date: today.toISOString().split('T')[0],
        start_time: '09:00',
        end_date: today.toISOString().split('T')[0],
        end_time: '11:00',
        location: '321 Regent Street, London W1B 3HH',
        customer_name: 'Sarah Parker',
        customer_phone: '+44 7700 900126',
        vehicle_info: '2022 Range Rover Evoque',
        status: 'scheduled'
      },
      {
        job_assignment_id: assignmentData[1].id,
        technician_id: technicianId,
        title: 'Windscreen Replacement - Michael Brown',
        description: 'Tesla Model 3 windscreen replacement with camera calibration',
        start_date: tomorrow.toISOString().split('T')[0],
        start_time: '14:00',
        end_date: tomorrow.toISOString().split('T')[0],
        end_time: '16:00',
        location: '654 Piccadilly, London W1J 0DS',
        customer_name: 'Michael Brown',
        customer_phone: '+44 7700 900127',
        vehicle_info: '2023 Tesla Model 3',
        status: 'scheduled'
      }
    ];

    const { data: eventData, error: eventError } = await supabase
      .from('calendar_events')
      .insert(testEvents)
      .select('id');

    if (eventError) {
      console.error('❌ Error creating test calendar events:', eventError);
      return { success: false, error: eventError };
    }

    console.log('✅ Created test calendar events:', eventData?.length || 0, 'events');
    return { success: true, eventsCreated: eventData?.length || 0 };
  } catch (error) {
    console.error('❌ Exception creating test calendar events:', error);
    return { success: false, error };
  }
}

/**
 * Initialize all test data for tech@windscreencompare.com
 */
export async function initializeTestData(userId: string): Promise<{ success: boolean; summary: string }> {
  try {
    console.log('🔄 Initializing test data for user:', userId);

    // 1. Create technician record
    const techResult = await createTestTechnician(userId);
    if (!techResult.success) {
      return { success: false, summary: `Failed to create technician: ${techResult.error}` };
    }

    // 2. Create test jobs
    const jobsResult = await createTestJobs();
    if (!jobsResult.success) {
      return { success: false, summary: `Failed to create jobs: ${jobsResult.error}` };
    }

    // 3. Create test calendar events
    const eventsResult = await createTestCalendarEvents(techResult.technicianId!);
    if (!eventsResult.success) {
      return { success: false, summary: `Failed to create calendar events: ${eventsResult.error}` };
    }

    const summary = [
      `✅ Technician: ${techResult.technicianId ? 'Created/Found' : 'Existing'}`,
      `✅ Jobs: ${jobsResult.jobsCreated || 0} available`,
      `✅ Calendar Events: ${eventsResult.eventsCreated || 0} scheduled`
    ].join('\n');

    console.log('🎉 Test data initialization complete:\n', summary);
    return { success: true, summary };

  } catch (error) {
    console.error('❌ Failed to initialize test data:', error);
    return { success: false, summary: `Initialization failed: ${error}` };
  }
}
