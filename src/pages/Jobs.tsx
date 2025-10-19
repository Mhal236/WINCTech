import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Plus, Clock, Briefcase, Calendar, MoreVertical, MapPin, Phone, Car, UserX, Target, ArrowRight, CheckCircle, Upload, Image as ImageIcon, User, Mail, Info, Coins, Search, Filter, RefreshCw, Package, AlertCircle, Edit2, Save, X, ArrowUpDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { JobService } from "@/services/jobService";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { PageTransition } from "@/components/PageTransition";

interface Lead {
  id: string;
  quote_id?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  phone: string;
  email?: string;
  address?: string;
  postcode?: string;
  vrn?: string;
  make?: string;
  model?: string;
  year?: string;
  glass_type?: string;
  glass_description?: string;
  service_type?: string;
  selected_windows?: string[];
  argic_code?: string;
  window_damage?: any;
  window_spec?: any;
  estimated_price?: number;
  quote_price?: number;
  credits_cost?: number;
  appointment_date?: string;
  appointment_time?: string;
  time_slot?: string;
  status: string;
  source?: string;
  assigned_technician_id?: string;
  created_at: string;
  updated_at?: string;
  converted_to_job_id?: string;
  notes?: string;
}

interface AcceptedJob {
  id: string;
  quote_id?: string;
  customer_name: string;
  customer_phone?: string;
  location?: string;
  appointment_date: string;
  time_slot?: string;
  status: string;
  quote_price?: number;
  vehicle_info?: string;
  service_type?: string;
  glass_type?: string;
  vehicle_reg?: string;
  brand?: string;
  model?: string;
  year?: string;
  assigned_at: string;
  completed_at?: string;
  job_type?: 'job_lead' | 'exclusive' | 'unknown';
  window_damage?: any;
  selected_windows?: any;
  window_spec?: any;
  adas_calibration?: string;
  delivery_type?: string;
  timeline?: string;
  duration?: string;
  job_progress?: string;
}

const Jobs = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [acceptedJobs, setAcceptedJobs] = useState<AcceptedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [unassigningJobId, setUnassigningJobId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("leads");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLeadDetailsOpen, setIsLeadDetailsOpen] = useState(false);
  const [isMovingToActive, setIsMovingToActive] = useState(false);
  const [leadsSearchTerm, setLeadsSearchTerm] = useState("");
  const [stats, setStats] = useState({
    leads: 0,
    active: 0,
    total: 0
  });
  const [isEditingCustomerInfo, setIsEditingCustomerInfo] = useState(false);
  const [isEditingAppointment, setIsEditingAppointment] = useState(false);
  const [isSavingEdits, setIsSavingEdits] = useState(false);
  const [editedLead, setEditedLead] = useState<Partial<Lead>>({});
  const [leadsSortBy, setLeadsSortBy] = useState<'date_bought' | 'appointment_date'>('date_bought');
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Helper function to convert glass codes to readable names
  const getGlassDisplayName = (code: string): string => {
    if (!code) return 'Unknown Window';
    
    const glassNames: Record<string, string> = {
      // Front Windscreen variations
      'jqvmap1_ws': 'Front Windscreen',
      'windscreen': 'Front Windscreen',
      'front_windscreen': 'Front Windscreen',
      'ws': 'Front Windscreen',
      
      // Rear Windscreen variations
      'jqvmap1_rw': 'Rear Windscreen',
      'rear_windscreen': 'Rear Windscreen',
      'rear': 'Rear Windscreen',
      'rw': 'Rear Windscreen',
      'backlight': 'Rear Windscreen',
      
      // Sunroof variations
      'jqvmap1_sr': 'Sunroof',
      'sunroof': 'Sunroof',
      'sr': 'Sunroof',
      'roof': 'Sunroof',
      
      // Door Glass variations
      'jqvmap1_fl': 'Front Left Door Glass',
      'front_left_door': 'Front Left Door Glass',
      'front_left': 'Front Left Door Glass',
      'fl': 'Front Left Door Glass',
      
      'jqvmap1_fr': 'Front Right Door Glass',
      'front_right_door': 'Front Right Door Glass',
      'front_right': 'Front Right Door Glass',
      'fr': 'Front Right Door Glass',
      
      'jqvmap1_rl': 'Rear Left Door Glass',
      'rear_left_door': 'Rear Left Door Glass',
      'rear_left': 'Rear Left Door Glass',
      'rl': 'Rear Left Door Glass',
      
      'jqvmap1_rr': 'Rear Right Door Glass',
      'rear_right_door': 'Rear Right Door Glass',
      'rear_right': 'Rear Right Door Glass',
      'rr': 'Rear Right Door Glass',
      
      // Quarter Glass variations
      'jqvmap1_qg': 'Quarter Glass',
      'quarter_glass': 'Quarter Glass',
      'qg': 'Quarter Glass',
      
      // Side Window variations
      'side_window': 'Side Window',
      'side': 'Side Window',
    };
    
    // Try exact match first (case-insensitive)
    const lowerCode = code.toLowerCase();
    if (glassNames[lowerCode]) {
      return glassNames[lowerCode];
    }
    
    // If no exact match, format the code nicely by splitting on underscores and capitalizing
    return code.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Handle navigation state to auto-select tab
  useEffect(() => {
    const state = location.state as { tab?: string; leadId?: string } | null;
    if (state?.tab) {
      console.log('🔵 Setting active tab from navigation state:', state.tab);
      setActiveTab(state.tab);
      // Clear the state to avoid re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const getDisplayName = (name: string | undefined): string => {
    if (!name) return 'Customer Name Not Available';
    const glassCodePattern = /^[a-z]+[0-9]+_[a-z]+$/i;
    if (glassCodePattern.test(name.trim())) {
      return 'Customer Name Not Available';
    }
    return name;
  };

  // Helper to calculate job progress percentage
  const getJobProgress = (jobProgress: string | undefined): { percentage: number; stage: string } => {
    const stages = ['assigned', 'glass_ordered', 'glass_received', 'in_progress', 'completed'];
    const currentIndex = stages.indexOf(jobProgress || 'assigned');
    const percentage = ((currentIndex + 1) / stages.length) * 100;
    
    const stageNames: Record<string, string> = {
      'assigned': 'Assigned',
      'glass_ordered': 'Glass Ordered',
      'glass_received': 'Glass Received',
      'in_progress': 'In Progress',
      'completed': 'Completed'
    };
    
    return {
      percentage: Math.max(0, Math.min(100, percentage)),
      stage: stageNames[jobProgress || 'assigned'] || 'Assigned'
    };
  };

  const handleViewInCalendar = (job: AcceptedJob) => {
    if (job.appointment_date) {
      navigate(`/calendar?date=${job.appointment_date}&jobId=${job.id}`);
    } else {
      navigate('/calendar');
    }
    toast({
      title: "Opening Calendar",
      description: `Navigating to calendar${job.appointment_date ? ` for ${job.appointment_date}` : ''}`,
    });
  };

  const getFilteredJobs = () => {
    let filtered = acceptedJobs.filter(job => 
      job.status !== 'completed' && job.status !== 'cancelled'
    );

    if (activeTab === 'leads') {
      filtered = filtered.filter(job => job.status === 'assigned');
    } else if (activeTab === 'active') {
      filtered = filtered.filter(job => job.status === 'in_progress');
    }

    return filtered;
  };

  const filteredJobs = getFilteredJobs();

  useEffect(() => {
    if (user?.id) {
      fetchLeads();
      fetchAcceptedJobs();
    }
  }, [user?.id]);

  const fetchLeads = async () => {
    if (!user?.id) {
      console.log('⚠️ fetchLeads: No user ID, skipping');
      return;
    }

    try {
      setLoading(true);
      console.log('🔵 fetchLeads: Starting, user:', user.id);
      
      // Get technician ID
      let technicianId = null;
      const { data: techData1, error: techError1 } = await supabase
        .from('technicians')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (techData1) {
        technicianId = techData1.id;
        console.log('✅ Found technician by user_id:', technicianId);
      } else {
        const { data: techData2, error: techError2 } = await supabase
          .from('technicians')
          .select('id')
          .eq('contact_email', user.email)
          .maybeSingle();
        
        if (techData2) {
          technicianId = techData2.id;
          console.log('✅ Found technician by email:', technicianId);
        } else {
          console.error('❌ Technician not found:', techError1 || techError2);
        }
      }

      if (!technicianId) {
        console.log('⚠️ No technician ID found, showing empty leads list');
        setLeads([]);
        setStats(prev => ({ ...prev, leads: 0 }));
        return;
      }

      const allLeads: Lead[] = [];

      // 1. Fetch VRN leads from lead_purchases table
      console.log('🔵 fetchLeads: Querying lead_purchases for technician:', technicianId);
      const { data: purchasedLeadsData, error: leadsError } = await supabase
        .from('lead_purchases')
        .select('*, leads(*)')
        .eq('technician_id', technicianId)
        .is('converted_to_job_id', null)
        .order('purchased_at', { ascending: false });

      if (!leadsError && purchasedLeadsData) {
        console.log('🔵 Found', purchasedLeadsData.length, 'VRN lead purchases');
        const extractedLeads = purchasedLeadsData.map((purchase: any) => {
          if (!purchase.leads) {
            console.warn('⚠️ Purchase record missing lead data:', purchase.id);
            return null;
          }
          return purchase.leads;
        }).filter(Boolean);
        
        allLeads.push(...extractedLeads);
      } else if (leadsError) {
        console.warn('⚠️ Error fetching lead_purchases:', leadsError.message);
      }

      // 2. Fetch assigned MasterCustomer jobs (status='assigned', not 'in_progress')
      console.log('🔵 fetchLeads: Querying job_assignments for assigned jobs');
      const { data: assignedJobsData, error: jobsError } = await supabase
        .from('job_assignments')
        .select('*, MasterCustomer(*)')
        .eq('technician_id', technicianId)
        .eq('status', 'assigned')
        .order('assigned_at', { ascending: false });

      if (!jobsError && assignedJobsData) {
        console.log('🔵 Found', assignedJobsData.length, 'assigned MasterCustomer jobs');
        const extractedJobs = assignedJobsData.map((assignment: any) => {
          if (!assignment.MasterCustomer) {
            console.warn('⚠️ Assignment missing MasterCustomer data:', assignment.id);
            return null;
          }
          
          const job = assignment.MasterCustomer;
          return {
            id: job.id,
            quote_id: job.quote_id,
            full_name: job.full_name,
            name: job.full_name,
            email: job.email,
            phone: job.mobile,
            address: job.location,
            postcode: job.postcode,
            vrn: job.vehicle_reg,
            make: job.brand,
            model: job.model,
            year: job.year,
            glass_type: job.glass_type,
            glass_description: job.glass_description,
            service_type: job.service_type,
            quote_price: job.quote_price,
            estimated_price: job.quote_price,
            credits_cost: Math.round((job.quote_price || 0) * 0.1), // 10% of price as credits
            appointment_date: job.appointment_date,
            time_slot: job.time_slot,
            status: job.status,
            source: 'job_assignment',
            created_at: assignment.assigned_at,
            selected_windows: job.selected_windows,
            argic_code: job.argic_code,
            window_damage: job.window_damage,
            window_spec: job.window_spec
          } as Lead;
        }).filter(Boolean);
        
        allLeads.push(...extractedJobs);
      } else if (jobsError) {
        console.warn('⚠️ Error fetching job_assignments:', jobsError.message);
      }
      
      console.log('🟢 Total leads found:', allLeads.length, '(VRN + Job Assignments)');
      
      if (allLeads.length > 0) {
        console.log('🔵 Sample lead data:', allLeads[0]);
      }
      
      setLeads(allLeads);
      
      // Update stats
      const leadsCount = allLeads.length;
      console.log('✅ Setting leads count in stats:', leadsCount);
      setStats(prev => ({ ...prev, leads: leadsCount }));

    } catch (error) {
      console.error('❌ Unexpected error in fetchLeads:', error);
      setLeads([]);
      setStats(prev => ({ ...prev, leads: 0 }));
      
      toast({
        title: "Error Loading Leads",
        description: "Unable to load your purchased leads. Please try refreshing the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAcceptedJobs = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      let technicianId = null;
      const { data: techData1 } = await supabase
        .from('technicians')
        .select('id, name, user_id, contact_email')
        .eq('user_id', user.id)
        .single();
      
      if (techData1) {
        technicianId = techData1.id;
      } else {
        const { data: techData2 } = await supabase
          .from('technicians')
          .select('id, name, user_id, contact_email')
          .eq('contact_email', user.email)
          .single();
        
        if (techData2) {
          technicianId = techData2.id;
        }
      }

      if (!technicianId) return;

      try {
        const response = await fetch('/api/technician/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ technicianId })
        });
        const serverResult = await response.json();
        
        if (serverResult.success && serverResult.data) {
          const serverJobs = serverResult.data.map((assignment: any) => {
            const price = assignment.MasterCustomer.quote_price || 0;
            const jobType = price >= 400 ? 'exclusive' : 'job_lead';
            
            return {
              id: assignment.MasterCustomer.id,
              quote_id: assignment.MasterCustomer.quote_id,
              customer_name: assignment.MasterCustomer.full_name,
              customer_phone: assignment.MasterCustomer.mobile,
              location: assignment.MasterCustomer.location,
              appointment_date: assignment.MasterCustomer.appointment_date,
              time_slot: assignment.MasterCustomer.time_slot,
              status: assignment.status,
              quote_price: assignment.MasterCustomer.quote_price,
              service_type: assignment.MasterCustomer.service_type,
              glass_type: assignment.MasterCustomer.glass_type,
              vehicle_reg: assignment.MasterCustomer.vehicle_reg,
              brand: assignment.MasterCustomer.brand,
              model: assignment.MasterCustomer.model,
              year: assignment.MasterCustomer.year,
              assigned_at: assignment.assigned_at,
              completed_at: assignment.completed_at,
              vehicle_info: `${assignment.MasterCustomer.year || ''} ${assignment.MasterCustomer.brand || ''} ${assignment.MasterCustomer.model || ''}`.trim(),
              job_type: jobType,
              window_damage: assignment.MasterCustomer.window_damage,
              selected_windows: assignment.MasterCustomer.selected_windows,
              window_spec: assignment.MasterCustomer.window_spec,
              adas_calibration: assignment.MasterCustomer.adas_calibration,
              delivery_type: assignment.MasterCustomer.delivery_type,
              timeline: assignment.MasterCustomer.timeline,
              duration: assignment.MasterCustomer.duration,
              job_progress: assignment.MasterCustomer.job_progress || 'assigned'
            };
          });
          
          setAcceptedJobs(serverJobs);
          
          const nonCompletedJobs = serverJobs.filter((j: any) => j.status !== 'completed' && j.status !== 'cancelled');
          const active = nonCompletedJobs.filter((j: any) => j.status === 'in_progress').length;
          
          // Only update active count, keep leads count from fetchLeads
          setStats(prev => ({
            ...prev,
            active,
            total: prev.leads + active
          }));
        }
      } catch (serverError) {
        console.error('Jobs: Server endpoint failed:', serverError);
      }
    } catch (error) {
      console.error('Jobs: Error fetching accepted jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Move lead to active jobs (convert lead to MasterCustomer job)
  const handleMoveToActive = async (lead: Lead) => {
    if (!user?.id) return;

    try {
      setIsMovingToActive(true);
      
      // Get technician ID first
      let currentTechnicianId = null;
      const { data: techData1 } = await supabase
        .from('technicians')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (techData1) {
        currentTechnicianId = techData1.id;
      } else {
        const { data: techData2 } = await supabase
          .from('technicians')
          .select('id')
          .eq('contact_email', user.email)
          .single();
        
        if (techData2) {
          currentTechnicianId = techData2.id;
        }
      }

      if (!currentTechnicianId) {
        toast({
          title: "Error",
          description: "Technician profile not found",
          variant: "destructive",
        });
        setIsMovingToActive(false);
        return;
      }
      
      // Check if this lead is from a job_assignment (source='job_assignment')
      // If so, just update the existing assignment status instead of creating a new job
      if (lead.source === 'job_assignment') {
        // Update the existing job_assignment status from 'assigned' to 'in_progress'
        const { error: updateAssignmentError } = await supabase
          .from('job_assignments')
          .update({ status: 'in_progress' })
          .eq('job_id', lead.id)
          .eq('technician_id', currentTechnicianId);

        if (updateAssignmentError) {
          console.error('Error updating job assignment:', updateAssignmentError);
          throw updateAssignmentError;
        }

        // Update the MasterCustomer status and job_progress
        const { error: updateJobError } = await supabase
          .from('MasterCustomer')
          .update({ 
            status: 'in_progress',
            job_progress: 'assigned' // Start at first stage of progress bar
          })
          .eq('id', lead.id);

        if (updateJobError) {
          console.error('Error updating MasterCustomer status:', updateJobError);
          throw updateJobError;
        }

        // Get the assignment for calendar event creation
        const { data: existingAssignment } = await supabase
          .from('job_assignments')
          .select('id')
          .eq('job_id', lead.id)
          .eq('technician_id', currentTechnicianId)
          .single();

        // Create calendar event if there's an appointment date and no existing calendar event
        if (lead.appointment_date && existingAssignment) {
          // Check if calendar event already exists
          const { data: existingEvent } = await supabase
            .from('calendar_events')
            .select('id')
            .eq('job_assignment_id', existingAssignment.id)
            .maybeSingle();

          if (!existingEvent) {
            // Parse time slot to get start and end times
            let startTime = '09:00:00';
            let endTime = '11:00:00';
            
            if (lead.time_slot) {
              const timeMatch = lead.time_slot.match(/(\d{1,2}):?(\d{2})?\s*-\s*(\d{1,2}):?(\d{2})?/);
              if (timeMatch) {
                const startHour = timeMatch[1].padStart(2, '0');
                const startMin = timeMatch[2] || '00';
                const endHour = timeMatch[3].padStart(2, '0');
                const endMin = timeMatch[4] || '00';
                startTime = `${startHour}:${startMin}:00`;
                endTime = `${endHour}:${endMin}:00`;
              }
            }

            const { error: calendarError } = await supabase
              .from('calendar_events')
              .insert([{
                job_assignment_id: existingAssignment.id,
                technician_id: currentTechnicianId,
                title: `${lead.service_type || 'Glass Service'} - ${getDisplayName(lead.full_name || lead.name)}`,
                description: `${lead.glass_type ? lead.glass_type + ' - ' : ''}${lead.vrn || 'Vehicle'}`,
                start_date: lead.appointment_date,
                start_time: startTime,
                end_date: lead.appointment_date,
                end_time: endTime,
                location: lead.address || lead.postcode || '',
                customer_name: lead.full_name || lead.name || '',
                customer_phone: lead.phone || '',
                vehicle_info: `${lead.year || ''} ${lead.make || ''} ${lead.model || ''}`.trim(),
                status: 'scheduled'
              }]);

            if (calendarError) {
              console.error('Error creating calendar event:', calendarError);
            }
          }
        }

        toast({
          title: "Moved to Active Jobs",
          description: `${getDisplayName(lead.full_name || lead.name)} has been moved to active jobs.`,
        });
        
        fetchLeads();
        fetchAcceptedJobs();
        setIsLeadDetailsOpen(false);
        return;
      }

      // Check if there's already an active job for this lead to prevent duplicates
      const { data: existingJobs } = await supabase
        .from('job_assignments')
        .select('job_id, MasterCustomer(*)')
        .eq('technician_id', currentTechnicianId)
        .in('status', ['assigned', 'in_progress']);

      // Check for duplicates based on vehicle_reg and phone
      const duplicate = existingJobs?.find((assignment: any) => 
        assignment.MasterCustomer && (
          (lead.vrn && assignment.MasterCustomer.vehicle_reg === lead.vrn) ||
          (lead.phone && assignment.MasterCustomer.mobile === lead.phone)
        )
      );

      if (duplicate) {
        toast({
          title: "Duplicate Job Detected",
          description: "This customer already has an active job. Please check your Active Jobs tab.",
          variant: "destructive",
        });
        setIsMovingToActive(false);
        setIsLeadDetailsOpen(false);
        return;
      }

      // For VRN leads from lead_purchases, create a new MasterCustomer job
      const { data: jobData, error: jobError } = await supabase
        .from('MasterCustomer')
        .insert([{
          full_name: lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim(),
          mobile: lead.phone,
          email: lead.email,
          location: lead.address,
          postcode: lead.postcode,
          vehicle_reg: lead.vrn,
          brand: lead.make,
          model: lead.model,
          year: lead.year,
          glass_type: lead.glass_type,
          service_type: lead.service_type || 'Glass Replacement',
          quote_price: lead.quote_price || lead.estimated_price,
          selected_windows: lead.selected_windows,
          window_damage: lead.window_damage,
          window_spec: lead.window_spec,
          argic_code: lead.argic_code,
          appointment_date: lead.appointment_date,
          time_slot: lead.time_slot,
          source: lead.source, // Preserve source to track lead origin
          status: 'in_progress',
          job_progress: 'assigned', // Start at first stage of progress bar
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (jobError) throw jobError;

      // Update the lead_purchase record for this technician to mark as converted
      const { error: updateError } = await supabase
        .from('lead_purchases')
        .update({ 
          converted_to_job_id: jobData.id
        })
        .eq('lead_id', lead.id)
        .eq('technician_id', currentTechnicianId);

      if (updateError) {
        console.error('Error updating purchase record:', updateError);
        // Don't throw - the job was created successfully
      }
      
      // Note: We don't change the lead's status to 'converted' because other technicians
      // may have also purchased this lead and haven't converted it yet

      // Assign the job to the technician
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('job_assignments')
        .insert([{
          job_id: jobData.id,
          technician_id: currentTechnicianId,
          assigned_at: new Date().toISOString(),
          status: 'in_progress'
        }])
        .select()
        .single();

      if (assignmentError) {
        console.error('Error creating job assignment:', assignmentError);
        throw assignmentError;
      }

      // Create calendar event if there's an appointment date
      if (lead.appointment_date && assignmentData) {
        // Parse time slot to get start and end times
        let startTime = '09:00:00';
        let endTime = '11:00:00';
        
        if (lead.time_slot) {
          const timeMatch = lead.time_slot.match(/(\d{1,2}):?(\d{2})?\s*-\s*(\d{1,2}):?(\d{2})?/);
          if (timeMatch) {
            const startHour = timeMatch[1].padStart(2, '0');
            const startMin = timeMatch[2] || '00';
            const endHour = timeMatch[3].padStart(2, '0');
            const endMin = timeMatch[4] || '00';
            startTime = `${startHour}:${startMin}:00`;
            endTime = `${endHour}:${endMin}:00`;
          }
        }

        const { error: calendarError } = await supabase
          .from('calendar_events')
          .insert([{
            job_assignment_id: assignmentData.id,
            technician_id: currentTechnicianId,
            title: `${lead.service_type || 'Glass Service'} - ${getDisplayName(lead.full_name || lead.name)}`,
            description: `${lead.glass_type ? lead.glass_type + ' - ' : ''}${lead.vrn || 'Vehicle'}`,
            start_date: lead.appointment_date,
            start_time: startTime,
            end_date: lead.appointment_date,
            end_time: endTime,
            location: lead.address || lead.postcode || '',
            customer_name: lead.full_name || lead.name || '',
            customer_phone: lead.phone || '',
            vehicle_info: `${lead.year || ''} ${lead.make || ''} ${lead.model || ''}`.trim(),
            status: 'scheduled'
          }]);

        if (calendarError) {
          console.error('Error creating calendar event:', calendarError);
          // Don't throw - the job was created successfully, just log the calendar error
        }
      }

      toast({
        title: "Moved to Active Jobs",
        description: `${getDisplayName(lead.full_name || lead.name)} has been moved to active jobs.`,
      });
      
      fetchLeads();
      fetchAcceptedJobs();
      setIsLeadDetailsOpen(false);
    } catch (error) {
      console.error('Error moving to active:', error);
      toast({
        title: "Error",
        description: "Failed to move lead to active jobs",
        variant: "destructive",
      });
    } finally {
      setIsMovingToActive(false);
    }
  };

  // Save edited lead information
  const handleSaveLeadEdits = async () => {
    if (!selectedLead) return;

    try {
      setIsSavingEdits(true);

      // Update the lead in database based on source
      if (selectedLead.source === 'job_assignment') {
        // Update MasterCustomer table
        const { error } = await supabase
          .from('MasterCustomer')
          .update({
            full_name: editedLead.full_name || selectedLead.full_name,
            email: editedLead.email || selectedLead.email,
            mobile: editedLead.phone || selectedLead.phone,
            location: editedLead.address || selectedLead.address,
            postcode: editedLead.postcode || selectedLead.postcode,
            appointment_date: editedLead.appointment_date || selectedLead.appointment_date,
            time_slot: editedLead.time_slot || selectedLead.time_slot,
          })
          .eq('id', selectedLead.id);

        if (error) throw error;
      } else {
        // Update leads table
        const { error } = await supabase
          .from('leads')
          .update({
            full_name: editedLead.full_name || selectedLead.full_name,
            name: editedLead.full_name || selectedLead.full_name,
            email: editedLead.email || selectedLead.email,
            phone: editedLead.phone || selectedLead.phone,
            address: editedLead.address || selectedLead.address,
            postcode: editedLead.postcode || selectedLead.postcode,
            appointment_date: editedLead.appointment_date || selectedLead.appointment_date,
            time_slot: editedLead.time_slot || selectedLead.time_slot,
          })
          .eq('id', selectedLead.id);

        if (error) throw error;
      }

      // Update the selected lead with edited values
      setSelectedLead({
        ...selectedLead,
        ...editedLead
      });

      // Clear edit states
      setIsEditingCustomerInfo(false);
      setIsEditingAppointment(false);
      setEditedLead({});

      // Refresh leads
      fetchLeads();
      fetchAcceptedJobs();

      toast({
        title: "Lead Updated",
        description: "Lead information has been successfully updated.",
      });
    } catch (error) {
      console.error('Error saving lead edits:', error);
      toast({
        title: "Error",
        description: "Failed to update lead information",
        variant: "destructive",
      });
    } finally {
      setIsSavingEdits(false);
    }
  };

  const handleUnassignJob = async (job: AcceptedJob) => {
    if (!user?.id) return;

    try {
      setUnassigningJobId(job.id);
      
      const { data: techData } = await supabase
        .from('technicians')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!techData) {
        toast({
          title: "Error",
          description: "Could not find technician profile",
          variant: "destructive",
        });
        return;
      }

      const result = await JobService.unassignJob(job.id, techData.id);
      
      if (result.success) {
        toast({
          title: "Job Unassigned",
          description: `${job.customer_name}'s job has been unassigned and returned to the job pool.`,
        });
        
        fetchAcceptedJobs();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to unassign job",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error unassigning job:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setUnassigningJobId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "assigned":
        return "bg-blue-100 text-blue-600 border-blue-200";
      case "in_progress":
        return "bg-yellow-100 text-yellow-600 border-yellow-200";
      case "completed":
        return "bg-green-100 text-green-600 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-600 border-red-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  return (
    <DashboardLayout>
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 -left-4 w-96 h-96 bg-[#0FB8C1]/5 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-700" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/3 rounded-full blur-3xl animate-pulse delay-1000" />
          </div>

        {/* Modern Header */}
        <div className="relative backdrop-blur-xl bg-white/80 border border-gray-200/50 shadow-sm rounded-3xl m-2 sm:m-4">
          <div className="px-4 sm:px-6 py-6 sm:py-10">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1 sm:space-y-2">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-1 h-8 sm:h-10 bg-gradient-to-b from-[#0FB8C1] via-[#0FB8C1]/70 to-transparent rounded-full" />
                    <h1 className="text-2xl sm:text-4xl font-light tracking-tight text-gray-900">
                      Jobs<span className="text-[#0FB8C1] font-normal">.</span>
                    </h1>
                  </div>
                  <p className="text-gray-600 text-sm sm:text-base font-light ml-4 sm:ml-5 tracking-wide">
                    Orchestrate your workflow with precision
                  </p>
                </div>
                <Button className="group relative bg-white hover:bg-gray-50 border-2 border-[#0FB8C1]/30 hover:border-[#0FB8C1] text-[#0FB8C1] hover:text-[#0FB8C1] shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0FB8C1]/0 via-[#0FB8C1]/5 to-[#0FB8C1]/0 group-hover:translate-x-full transition-transform duration-1000" />
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2 relative z-10" />
                  <span className="relative z-10 font-medium">Add Manual Job</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-8 space-y-8 relative z-10 max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Futuristic Tab Navigation */}
            <div className="relative bg-white/60 backdrop-blur-2xl border border-gray-200/60 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.06)] mb-4 sm:mb-6">
              <TabsList className="grid w-full grid-cols-2 bg-transparent p-0 h-auto gap-1 sm:gap-1.5">
                <TabsTrigger 
                  value="leads" 
                  className="relative flex items-center justify-center gap-1.5 sm:gap-2 py-3 sm:py-2.5 px-2 sm:px-4 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm transition-all duration-500 ease-out
                    data-[state=active]:text-white data-[state=active]:shadow-[0_4px_12px_rgba(15,184,193,0.25)]
                    data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900 data-[state=inactive]:hover:bg-gray-50/50
                    before:absolute before:inset-0 before:rounded-lg sm:before:rounded-xl before:bg-gradient-to-r before:from-[#0FB8C1] before:to-[#06a6b4] before:opacity-0 data-[state=active]:before:opacity-100 before:transition-all before:duration-500
                    after:absolute after:inset-0 after:rounded-lg sm:after:rounded-xl after:bg-gradient-to-r after:from-white/0 after:via-white/20 after:to-white/0 after:opacity-0 data-[state=active]:after:opacity-100 after:translate-x-[-100%] data-[state=active]:after:translate-x-[100%] after:transition-transform after:duration-1000"
                >
                  <Target className="h-3.5 w-3.5 relative z-10 transition-transform duration-300 data-[state=active]:scale-110" />
                  <span className="relative z-10">Leads</span>
                  <span className="relative z-10 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 data-[state=active]:bg-white/25 transition-colors duration-300 min-w-[18px] sm:min-w-[20px] text-center">
                    {stats.leads}
                  </span>
                </TabsTrigger>
                <TabsTrigger 
                  value="active" 
                  className="relative flex items-center justify-center gap-1.5 sm:gap-2 py-3 sm:py-2.5 px-2 sm:px-4 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm transition-all duration-500 ease-out
                    data-[state=active]:text-white data-[state=active]:shadow-[0_4px_12px_rgba(15,184,193,0.25)]
                    data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900 data-[state=inactive]:hover:bg-gray-50/50
                    before:absolute before:inset-0 before:rounded-lg sm:before:rounded-xl before:bg-gradient-to-r before:from-[#0FB8C1] before:to-[#06a6b4] before:opacity-0 data-[state=active]:before:opacity-100 before:transition-all before:duration-500
                    after:absolute after:inset-0 after:rounded-lg sm:after:rounded-xl after:bg-gradient-to-r after:from-white/0 after:via-white/20 after:to-white/0 after:opacity-0 data-[state=active]:after:opacity-100 after:translate-x-[-100%] data-[state=active]:after:translate-x-[100%] after:transition-transform after:duration-1000"
                >
                  <Briefcase className="h-3.5 w-3.5 relative z-10 transition-transform duration-300 data-[state=active]:scale-110" />
                  <span className="relative z-10 hidden sm:inline">Active Jobs</span>
                  <span className="relative z-10 sm:hidden">Active</span>
                  <span className="relative z-10 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 data-[state=active]:bg-white/25 transition-colors duration-300 min-w-[18px] sm:min-w-[20px] text-center">
                    {stats.active}
                  </span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* LEADS TAB */}
            <TabsContent value="leads" className="space-y-4 sm:space-y-6 mt-4 sm:mt-8 data-[state=active]:animate-fadeIn">
              {/* Modern Search and Filter Bar */}
              <div className="backdrop-blur-xl bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-lg">
                <div className="flex flex-col gap-2 sm:gap-3">
                  <div className="flex-1 relative group">
                    <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-[#0FB8C1] w-4 h-4 transition-colors duration-300" />
                    <Input
                      placeholder="Search by name, VRN, or phone..."
                      value={leadsSearchTerm}
                      onChange={(e) => setLeadsSearchTerm(e.target.value)}
                      className="pl-10 sm:pl-11 h-11 sm:h-10 bg-gray-50/50 border-gray-200 hover:border-[#0FB8C1]/30 focus:border-[#0FB8C1] text-gray-900 placeholder:text-gray-500 text-sm sm:text-base rounded-xl transition-all duration-300"
                    />
                  </div>
                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 sm:flex-initial justify-start bg-white hover:bg-gray-50 border-gray-200 hover:border-[#0FB8C1]/30 text-gray-700 hover:text-[#0FB8C1] transition-all duration-300 rounded-xl h-11 sm:h-9"
                        >
                          <ArrowUpDown className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="truncate text-xs sm:text-sm">
                            <span className="hidden sm:inline">Sort: </span>
                            {leadsSortBy === 'date_bought' ? 'Date Bought' : 'Appointment'}
                          </span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white backdrop-blur-xl border-gray-200 w-56">
                        <DropdownMenuItem onClick={() => setLeadsSortBy('date_bought')} className="cursor-pointer hover:bg-[#0FB8C1]/10 focus:bg-[#0FB8C1]/10 text-gray-700">
                          <Clock className="w-4 h-4 mr-2 text-[#0FB8C1]" />
                          Date Bought (Newest First)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setLeadsSortBy('appointment_date')} className="cursor-pointer hover:bg-[#0FB8C1]/10 focus:bg-[#0FB8C1]/10 text-gray-700">
                          <Calendar className="w-4 h-4 mr-2 text-[#0FB8C1]" />
                          Appointment Date (Earliest First)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        fetchLeads();
                        toast({
                          title: "Refreshed",
                          description: "Lead list has been updated.",
                        });
                      }}
                      className="bg-white hover:bg-gray-50 border-gray-200 hover:border-[#0FB8C1]/30 text-gray-700 hover:text-[#0FB8C1] transition-all duration-300 rounded-xl h-11 sm:h-9 px-3 sm:px-4"
                    >
                      <RefreshCw className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Refresh</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Leads Grid */}
              <div className="grid gap-4 sm:gap-6">
                {loading ? (
                  <div className="space-y-4 sm:space-y-6">
                    {[...Array(3)].map((_, i) => (
                      <Card key={i} className="animate-pulse overflow-hidden bg-white border border-gray-200 rounded-xl sm:rounded-2xl shadow-sm">
                        <div className="h-1 bg-gradient-to-r from-[#0FB8C1] to-blue-500" />
                        <CardContent className="p-4 sm:p-8">
                          <div className="space-y-3 sm:space-y-5">
                            <div className="flex justify-between items-start">
                              <div className="space-y-2 sm:space-y-3 flex-1">
                                <div className="h-6 sm:h-7 bg-gray-200 rounded-xl w-2/3"></div>
                                <div className="h-4 sm:h-5 bg-gray-200 rounded-xl w-1/2"></div>
                              </div>
                              <div className="h-8 sm:h-10 w-16 sm:w-20 bg-gray-200 rounded-xl"></div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                              <div className="h-4 sm:h-5 bg-gray-200 rounded-xl"></div>
                              <div className="h-4 sm:h-5 bg-gray-200 rounded-xl"></div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : leads.length === 0 ? (
                  <Card className="text-center py-12 sm:py-20 border-2 border-dashed border-gray-300 bg-white rounded-xl sm:rounded-2xl shadow-sm">
                    <CardContent className="px-4 sm:px-6">
                      <div className="max-w-md mx-auto">
                        <div className="mb-6 sm:mb-8 relative">
                          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-[#0FB8C1]/20 to-blue-500/20 rounded-full mx-auto flex items-center justify-center border border-[#0FB8C1]/30">
                            <Target className="w-12 h-12 sm:w-16 sm:h-16 text-[#0FB8C1]" />
                          </div>
                        </div>
                        <h3 className="text-xl sm:text-3xl font-light text-gray-900 mb-3 sm:mb-4">No Purchased Leads</h3>
                        <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-lg font-light leading-relaxed">
                          You haven't purchased any leads yet. Explore the Instant Leads marketplace to discover new opportunities.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                          <Button 
                            className="group relative bg-[#0FB8C1] hover:bg-[#0FB8C1]/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-11 sm:h-auto"
                            onClick={() => navigate('/instant-leads')}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 group-hover:translate-x-full transition-transform duration-1000" />
                            <Target className="w-4 h-4 mr-2 relative z-10" />
                            <span className="relative z-10">Browse Instant Leads</span>
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => navigate('/price-lookup')}
                            className="bg-white hover:bg-gray-50 border-gray-300 hover:border-[#0FB8C1] text-gray-700 hover:text-[#0FB8C1] transition-all duration-300 h-11 sm:h-auto"
                          >
                            <Search className="w-4 h-4 mr-2" />
                            VRN Search
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  (() => {
                    // Filter leads by search term
                    const filteredLeads = leads.filter(lead => {
                      if (!leadsSearchTerm) return true;
                      const searchLower = leadsSearchTerm.toLowerCase();
                      const fullName = (lead.full_name || lead.name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim()).toLowerCase();
                      const vrn = (lead.vrn || '').toLowerCase();
                      const phone = (lead.phone || '').toLowerCase();
                      return fullName.includes(searchLower) || vrn.includes(searchLower) || phone.includes(searchLower);
                    });

                    // Sort leads based on selected sort option
                    const sortedLeads = [...filteredLeads].sort((a, b) => {
                      if (leadsSortBy === 'date_bought') {
                        // Sort by created_at (newest first)
                        const dateA = new Date(a.created_at).getTime();
                        const dateB = new Date(b.created_at).getTime();
                        return dateB - dateA; // Descending order (newest first)
                      } else if (leadsSortBy === 'appointment_date') {
                        // Sort by appointment_date (earliest first)
                        if (!a.appointment_date && !b.appointment_date) return 0;
                        if (!a.appointment_date) return 1; // Push to end
                        if (!b.appointment_date) return -1; // Push to end
                        const dateA = new Date(a.appointment_date).getTime();
                        const dateB = new Date(b.appointment_date).getTime();
                        return dateA - dateB; // Ascending order (earliest first)
                      }
                      return 0;
                    });

                    return sortedLeads.length === 0 ? (
                      <Card className="text-center py-12 sm:py-16 bg-white border border-gray-200 rounded-xl sm:rounded-2xl shadow-sm">
                        <CardContent className="px-4">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mx-auto mb-4 sm:mb-6 flex items-center justify-center border border-gray-300">
                            <Search className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                          </div>
                          <h3 className="text-xl sm:text-2xl font-light text-gray-900 mb-2 sm:mb-3">No Results Found</h3>
                          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 font-light">
                            No leads match your search criteria.
                          </p>
                          <Button 
                            variant="outline"
                            onClick={() => setLeadsSearchTerm("")}
                            className="bg-white hover:bg-gray-50 border-gray-300 hover:border-[#0FB8C1] text-gray-700 hover:text-[#0FB8C1] transition-all duration-300 h-11 sm:h-auto"
                          >
                            Clear Search
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      sortedLeads.map(lead => (
                        <Card 
                          key={lead.id} 
                          className="group hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer bg-white border border-gray-200 hover:border-[#0FB8C1]/50 rounded-xl sm:rounded-2xl active:scale-[0.98] sm:hover:scale-[1.01] sm:hover:-translate-y-1"
                          onClick={() => {
                            setSelectedLead(lead);
                            setIsLeadDetailsOpen(true);
                          }}
                        >
                          {/* Gradient top border */}
                          <div className="h-1 bg-gradient-to-r from-[#0FB8C1] via-blue-500 to-[#0FB8C1] group-hover:from-[#0FB8C1]/80 group-hover:via-blue-500/80 group-hover:to-[#0FB8C1]/80 transition-all duration-300" />
                          
                          <CardContent className="p-4 sm:p-7">
                            <div className="flex flex-col gap-4 sm:gap-5">
                              <div className="flex-1 space-y-3 sm:space-y-5">
                                {/* Header with badges */}
                                <div className="flex justify-between items-start gap-3">
                                  <div className="space-y-2 sm:space-y-3 flex-1 min-w-0">
                                    <h3 className="font-medium text-lg sm:text-xl text-gray-900 flex items-center gap-2 sm:gap-3 group-hover:text-[#0FB8C1] transition-colors duration-300">
                                      <div className="w-2 h-2 rounded-full bg-[#0FB8C1] flex-shrink-0 group-hover:scale-125 transition-transform duration-300" />
                                      <span className="truncate">{lead.full_name || lead.name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim()}</span>
                                    </h3>
                                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                      {/* Source Badge - Show first if it's a Windscreen Compare Lead */}
                                      {(() => {
                                        if (lead.source === 'job_assignment' || (!lead.source || (lead.source !== 'price_estimator' && lead.source !== 'price_lookup'))) {
                                          return (
                                            <Badge 
                                              className="text-xs text-[#0FB8C1] border-0 bg-[#0FB8C1]/10 font-medium px-3 py-1 rounded-lg"
                                            >
                                              Windscreen Compare Lead
                                            </Badge>
                                          );
                                        }
                                        return null;
                                      })()}
                                      
                                      <Badge className="text-xs bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border border-blue-200 font-medium px-3 py-1 rounded-lg">
                                        New Lead
                                      </Badge>
                                      
                                      {/* Other Source Badges */}
                                      {lead.source === 'price_estimator' && (
                                        <Badge variant="outline" className="text-xs border-gray-300 text-gray-700 bg-gray-50 px-3 py-1 rounded-lg">
                                          Price Estimator
                                        </Badge>
                                      )}
                                      {lead.source === 'price_lookup' && (
                                        <Badge variant="outline" className="text-xs border-gray-300 text-gray-700 bg-gray-50 px-3 py-1 rounded-lg">
                                          Price Lookup
                                        </Badge>
                                      )}
                                      
                                      {lead.glass_type && (
                                        <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700 border-0 px-3 py-1 rounded-lg">
                                          {lead.glass_type.charAt(0).toUpperCase() + lead.glass_type.slice(1)}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Credits badge / Manual tag */}
                                  <div className="flex flex-col items-end flex-shrink-0">
                                    {lead.source === 'price_estimator' || lead.source === 'price_lookup' ? (
                                      <div className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-300 sm:border-2 rounded-lg">
                                        <span className="text-xs sm:text-sm font-bold text-gray-700">Manual</span>
                                      </div>
                                    ) : (
                                      <>
                                        <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 sm:border-2 rounded-lg">
                                          <Coins className="w-4 sm:w-5 h-4 sm:h-5 text-amber-600" />
                                          <span className="text-lg sm:text-xl font-bold text-amber-700">{lead.credits_cost || 1}</span>
                                        </div>
                                        <p className="text-[10px] sm:text-xs text-gray-500 mt-1">credits paid</p>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* Info grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                                  {lead.appointment_date && (
                                    <div className="flex items-center gap-2 text-gray-700">
                                      <div className="p-1.5 bg-blue-50 rounded">
                                        <Calendar className="h-4 w-4 text-blue-600" />
                                      </div>
                                      <span className="font-medium">{new Date(lead.appointment_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                                    </div>
                                  )}
                                  {lead.time_slot && (
                                    <div className="flex items-center gap-2 text-gray-700">
                                      <div className="p-1.5 bg-purple-50 rounded">
                                        <Clock className="h-4 w-4 text-purple-600" />
                                      </div>
                                      <span className="font-medium">{lead.time_slot}</span>
                                    </div>
                                  )}
                                  {lead.vrn && (
                                    <div className="flex items-center gap-2 text-gray-700">
                                      <div className="p-1.5 bg-green-50 rounded">
                                        <Car className="h-4 w-4 text-green-600" />
                                      </div>
                                      <span className="font-medium">{lead.vrn} - {lead.make} {lead.model}</span>
                                    </div>
                                  )}
                                  {lead.phone && (
                                    <div className="flex items-center gap-2 text-gray-700">
                                      <div className="p-1.5 bg-orange-50 rounded">
                                        <Phone className="h-4 w-4 text-orange-600" />
                                      </div>
                                      <span className="font-medium">{lead.phone}</span>
                                    </div>
                                  )}
                                  {lead.postcode && (
                                    <div className="flex items-center gap-2 text-gray-700">
                                      <div className="p-1.5 bg-red-50 rounded">
                                        <MapPin className="h-4 w-4 text-red-600" />
                                      </div>
                                      <span className="font-medium">{lead.postcode}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Windscreen Specifications */}
                                {lead.glass_description && (
                                  <div className="space-y-3 pt-3 border-t border-gray-100">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                                      <Package className="w-3.5 h-3.5" />
                                      Windscreen Details
                                    </h4>
                                    
                                    <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                                      <p className="text-sm text-gray-700 font-medium">{lead.glass_description}</p>
                                    </div>
                                  </div>
                                )}

                                {/* Action hint */}
                                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                                  <p className="text-xs text-gray-500">Click to view full details and move to active jobs</p>
                                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    );
                  })()
                )}
              </div>
            </TabsContent>

            {/* ACTIVE JOBS TAB */}
            <TabsContent value="active" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6 data-[state=active]:animate-fadeIn">
              <div className="grid gap-4 sm:gap-6">
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                          <div className="space-y-3">
                            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : filteredJobs.length === 0 ? (
                  <Card className="text-center py-12 sm:py-16 rounded-xl sm:rounded-2xl">
                    <CardContent className="px-4">
                      <Briefcase className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No Active Jobs</h3>
                      <p className="text-sm sm:text-base text-gray-600">
                        Move leads to active jobs to start working on them.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredJobs.map(job => (
                    <Card 
                      key={job.id} 
                      className="hover:shadow-lg transition-all border-l-4 border-l-yellow-500 cursor-pointer hover:border-l-[#0FB8C1] active:scale-[0.98]"
                      onClick={() => navigate(`/jobs/${job.id}`)}
                    >
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col gap-3 sm:gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-base sm:text-lg text-gray-900 flex items-center gap-2 truncate">
                                  <Briefcase className="w-4 sm:w-5 h-4 sm:h-5 text-yellow-600 flex-shrink-0" />
                                  <span className="truncate">{getDisplayName(job.customer_name)}</span>
                                </h3>
                                <Badge className={`text-[10px] sm:text-xs mt-1 ${getStatusColor(job.status)}`}>
                                  In Progress
                                </Badge>
                              </div>
                            </div>

                            {/* Mini Progress Bar */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px] sm:text-xs">
                                <span className="text-gray-600">Progress</span>
                                <span className="font-medium text-[#0FB8C1] text-xs sm:text-sm">{getJobProgress(job.job_progress).stage}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                                <div 
                                  className="bg-[#0FB8C1] h-1.5 sm:h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${getJobProgress(job.job_progress).percentage}%` }}
                                ></div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                              {job.appointment_date && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-gray-400 flex-shrink-0" />
                                  <span className="truncate">{job.appointment_date}</span>
                                </div>
                              )}
                              {job.location && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-gray-400 flex-shrink-0" />
                                  <span className="truncate">{job.location}</span>
                                </div>
                              )}
                              {job.vehicle_info && (
                                <div className="flex items-center gap-2">
                                  <Car className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-gray-400 flex-shrink-0" />
                                  <span className="truncate">{job.vehicle_info}</span>
                                </div>
                              )}
                              {job.customer_phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-gray-400 flex-shrink-0" />
                                  <span className="truncate">{job.customer_phone}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2 pt-3 sm:pt-4 border-t">
                              <Button 
                                className="flex-1 bg-[#0FB8C1] hover:bg-[#0d9da5] h-10 sm:h-auto text-sm sm:text-base"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/jobs/${job.id}`);
                                }}
                              >
                                <ArrowRight className="h-4 w-4 mr-1 sm:mr-2" />
                                <span className="hidden sm:inline">Progress Job</span>
                                <span className="sm:hidden">Progress</span>
                              </Button>
                              <Button 
                                variant="outline"
                                className="h-10 sm:h-auto px-3 sm:px-4 text-sm sm:text-base"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewInCalendar(job);
                                }}
                              >
                                <Calendar className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Calendar</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Lead Details Modal */}
        {selectedLead && (
          <Dialog open={isLeadDetailsOpen} onOpenChange={setIsLeadDetailsOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="text-2xl flex items-center gap-2">
                      <Target className="h-6 w-6 text-blue-600" />
                      Lead Details
                    </DialogTitle>
                    <DialogDescription>
                      Complete lead information and actions
                    </DialogDescription>
                  </div>
                  {selectedLead.quote_id && (
                    <Badge variant="outline" className="border-[#0FB8C1] text-[#0FB8C1] font-semibold text-sm px-3 py-1">
                      Quote: {selectedLead.quote_id}
                    </Badge>
                  )}
                </div>
              </DialogHeader>

              <div className="space-y-6">
                {/* Customer Information */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Customer Information
                    </CardTitle>
                      {!isEditingCustomerInfo ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsEditingCustomerInfo(true);
                            setEditedLead({
                              full_name: selectedLead.full_name || selectedLead.name,
                              phone: selectedLead.phone,
                              email: selectedLead.email,
                              address: selectedLead.address,
                              postcode: selectedLead.postcode,
                            });
                          }}
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setIsEditingCustomerInfo(false);
                              setEditedLead({});
                            }}
                            disabled={isSavingEdits}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSaveLeadEdits}
                            disabled={isSavingEdits}
                            className="bg-[#145484] hover:bg-[#145484]/90"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            {isSavingEdits ? 'Saving...' : 'Save'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500">Full Name</label>
                      {isEditingCustomerInfo ? (
                        <Input
                          value={editedLead.full_name || ''}
                          onChange={(e) => setEditedLead({ ...editedLead, full_name: e.target.value })}
                          className="mt-1"
                        />
                      ) : (
                      <p className="text-sm font-semibold">{selectedLead.full_name || selectedLead.name || 'N/A'}</p>
                      )}
                      </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Phone</label>
                      {isEditingCustomerInfo ? (
                        <Input
                          value={editedLead.phone || ''}
                          onChange={(e) => setEditedLead({ ...editedLead, phone: e.target.value })}
                          className="mt-1"
                        />
                      ) : (
                      <p className="text-sm font-medium">{selectedLead.phone}</p>
                      )}
                    </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500">Email</label>
                      {isEditingCustomerInfo ? (
                        <Input
                          type="email"
                          value={editedLead.email || ''}
                          onChange={(e) => setEditedLead({ ...editedLead, email: e.target.value })}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm">{selectedLead.email || 'N/A'}</p>
                      )}
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500">Postcode</label>
                      {isEditingCustomerInfo ? (
                        <Input
                          value={editedLead.postcode || ''}
                          onChange={(e) => setEditedLead({ ...editedLead, postcode: e.target.value })}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm">{selectedLead.postcode || 'N/A'}</p>
                      )}
                      </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-medium text-gray-500">Address</label>
                      {isEditingCustomerInfo ? (
                        <Input
                          value={editedLead.address || ''}
                          onChange={(e) => setEditedLead({ ...editedLead, address: e.target.value })}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm">{selectedLead.address || 'N/A'}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Vehicle Information */}
                {selectedLead.vrn && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Car className="h-5 w-5" />
                        Vehicle Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500">VRN</label>
                        <p className="text-sm font-semibold">{selectedLead.vrn}</p>
                      </div>
                      {selectedLead.make && (
                        <div>
                          <label className="text-xs font-medium text-gray-500">Make</label>
                          <p className="text-sm">{selectedLead.make}</p>
                        </div>
                      )}
                      {selectedLead.model && (
                        <div>
                          <label className="text-xs font-medium text-gray-500">Model</label>
                          <p className="text-sm">{selectedLead.model}</p>
                        </div>
                      )}
                      {selectedLead.year && (
                        <div>
                          <label className="text-xs font-medium text-gray-500">Year</label>
                          <p className="text-sm">{selectedLead.year}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Service Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Info className="h-5 w-5" />
                      Service Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedLead.glass_type && (
                        <div>
                          <label className="text-xs font-medium text-gray-500">Glass Type</label>
                          <p className="text-sm font-semibold capitalize">{selectedLead.glass_type}</p>
                        </div>
                      )}
                      {selectedLead.service_type && (
                        <div>
                          <label className="text-xs font-medium text-gray-500">Service Type</label>
                          <p className="text-sm">{selectedLead.service_type}</p>
                        </div>
                      )}
                      {selectedLead.glass_description && (
                        <div className="md:col-span-2">
                          <label className="text-xs font-medium text-gray-500">Description</label>
                          <p className="text-sm">{selectedLead.glass_description}</p>
                        </div>
                      )}
                      {selectedLead.vrn && (
                        <div className="md:col-span-2">
                          <label className="text-xs font-medium text-gray-500 mb-2 block">ARGIC Code</label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/vrn-search/argic-lookup')}
                            className="w-full md:w-auto"
                          >
                            <Package className="w-4 h-4 mr-2" />
                            Get ARGIC Code
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Window Damage Section */}
                    {selectedLead.window_damage && Array.isArray(selectedLead.window_damage) && selectedLead.window_damage.length > 0 && (
                            <div className="pt-4 border-t border-gray-200">
                              <h4 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                          Window Damage
                              </h4>
                        <div className="bg-red-50 p-4 rounded-lg border border-red-200 space-y-2">
                          {selectedLead.window_damage.map((damageItem: any, index: number) => {
                            if (typeof damageItem === 'object' && damageItem !== null) {
                              return Object.entries(damageItem).map(([windowKey, damageType]: [string, any]) => (
                                <div key={`${index}-${windowKey}`} className="flex items-start gap-2">
                                  <Package className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <span className="font-semibold text-red-900">{getGlassDisplayName(windowKey)}:</span>
                                    <span className="text-gray-700 ml-2">{String(damageType)}</span>
                                    </div>
                                </div>
                              ));
                            }
                            return null;
                          })}
                            </div>
                              </div>
                              )}

                    {/* Window Specifications Section */}
                    {selectedLead.window_spec && Array.isArray(selectedLead.window_spec) && selectedLead.window_spec.length > 0 && (() => {
                      // Parse the nested array structure
                      const specs = selectedLead.window_spec[0];
                      if (!specs || !Array.isArray(specs) || specs.length === 0) return null;
                      
                      // Filter out "Not Sure?" values
                      const validSpecs = specs.filter((spec: string) => 
                        spec && spec.toLowerCase() !== 'not sure?' && spec.toLowerCase() !== 'not sure'
                      );
                      
                      if (validSpecs.length === 0) return null;

                        return (
                          <div className="pt-4 border-t border-gray-200">
                          <h4 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Window Specifications
                            </h4>
                          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <div className="flex flex-wrap gap-2">
                              {validSpecs.map((spec: string, index: number) => (
                                <span 
                                  key={index}
                                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                                >
                                  {spec}
                                </span>
                              ))}
                                </div>
                            </div>
                          </div>
                        );
                    })()}
                  </CardContent>
                </Card>

                {/* Appointment Information */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Appointment Details
                    </CardTitle>
                      {!isEditingAppointment ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsEditingAppointment(true);
                            setEditedLead({
                              appointment_date: selectedLead.appointment_date,
                              time_slot: selectedLead.time_slot,
                            });
                          }}
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setIsEditingAppointment(false);
                              setEditedLead({});
                            }}
                            disabled={isSavingEdits}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSaveLeadEdits}
                            disabled={isSavingEdits}
                            className="bg-[#145484] hover:bg-[#145484]/90"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            {isSavingEdits ? 'Saving...' : 'Save'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500">Date</label>
                      {isEditingAppointment ? (
                        <Input
                          type="date"
                          value={editedLead.appointment_date || ''}
                          onChange={(e) => setEditedLead({ ...editedLead, appointment_date: e.target.value })}
                          className="mt-1"
                        />
                      ) : (
                        selectedLead.appointment_date ? (
                        <p className="text-sm font-semibold">
                          {new Date(selectedLead.appointment_date).toLocaleDateString('en-GB', { 
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        ) : (
                          <p className="text-sm text-gray-400">Not set</p>
                        )
                    )}
                    </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500">Time Slot</label>
                      {isEditingAppointment ? (
                        <Input
                          value={editedLead.time_slot || ''}
                          onChange={(e) => setEditedLead({ ...editedLead, time_slot: e.target.value })}
                          placeholder="e.g., 9:00-11:00"
                          className="mt-1"
                        />
                      ) : (
                        selectedLead.time_slot ? (
                        <p className="text-sm font-semibold">{selectedLead.time_slot}</p>
                        ) : (
                          <p className="text-sm text-gray-400">Not set</p>
                        )
                    )}
                    </div>
                  </CardContent>
                </Card>

                {/* Credits & Pricing Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Coins className="h-5 w-5" />
                      {selectedLead.source === 'price_estimator' || selectedLead.source === 'price_lookup' ? 'Lead Type' : 'Credits & Pricing'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedLead.source === 'price_estimator' || selectedLead.source === 'price_lookup' ? (
                      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border-2 border-gray-300">
                        <span className="text-sm font-medium text-gray-700">Lead Source</span>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-gray-700">Manual</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center bg-amber-50 p-4 rounded-lg border-2 border-[#FFC107]">
                        <span className="text-sm font-medium text-gray-700">Credits Cost</span>
                        <div className="flex items-center gap-2">
                          <Coins className="h-5 w-5 text-[#FFC107]" />
                          <span className="text-2xl font-bold text-[#FFC107]">{selectedLead.credits_cost || 0}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <DialogFooter className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsLeadDetailsOpen(false)}
                >
                  Close
                </Button>
                <Button
                  className="bg-[#145484] hover:bg-[#145484]/90"
                  onClick={() => handleMoveToActive(selectedLead)}
                  disabled={isMovingToActive}
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  {isMovingToActive ? "Moving..." : "Move to Active Jobs"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      </PageTransition>
    </DashboardLayout>
  );
};

export default Jobs;
