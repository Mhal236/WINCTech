import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  Car, 
  CheckCircle, 
  AlertCircle,
  ChevronRight,
  Package,
  Clock,
  User,
  Camera
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { PageTransition } from "@/components/PageTransition";

interface Job {
  id: string;
  quote_id?: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  location?: string;
  appointment_date: string;
  time_slot?: string;
  status: string;
  quote_price?: number;
  vehicle_reg?: string;
  brand?: string;
  model?: string;
  year?: string;
  glass_type?: string;
  assigned_at: string;
  completed_at?: string;
  job_progress?: string;
  notes?: string;
  window_damage?: any;
  window_spec?: any;
  selected_windows?: any;
  adas_calibration?: string;
  service_type?: string;
  delivery_type?: string;
}

interface GlassOrder {
  id: string;
  order_number: string;
  total_amount: number;
  order_status: string;
}

const JobManagement = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [glassOrder, setGlassOrder] = useState<GlassOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [currentStage, setCurrentStage] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');
  const [completionPhoto, setCompletionPhoto] = useState<File | null>(null);
  const [completionPhotoPreview, setCompletionPhotoPreview] = useState<string>('');

  // Helper function to convert glass codes to readable names
  const getGlassDisplayName = (code: any): string => {
    // Handle null, undefined, or empty values
    if (!code) return 'Unknown Window';
    
    // Convert to string if it's not already
    const codeStr = typeof code === 'string' ? code : String(code);
    
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
      'jqvmap1_ql': 'Left Quarter Glass',
      'quarter_left': 'Left Quarter Glass',
      'ql': 'Left Quarter Glass',
      
      'jqvmap1_qr': 'Right Quarter Glass',
      'quarter_right': 'Right Quarter Glass',
      'qr': 'Right Quarter Glass',
      
      // Door Drop Glass variations
      'jqvmap1_dd': 'Door Drop Glass',
      'door_drop': 'Door Drop Glass',
      'dd': 'Door Drop Glass',
    };

    return glassNames[codeStr.toLowerCase()] || codeStr;
  };

  useEffect(() => {
    if (jobId && user?.id) {
      fetchJobDetails();
      fetchLinkedGlassOrder();
    }
  }, [jobId, user?.id]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);

      let technicianId = null;
      const { data: techData } = await supabase
        .from("technicians")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (techData) technicianId = techData.id;

      if (!technicianId) {
        toast({
          title: "Error",
          description: "Technician profile not found",
          variant: "destructive",
        });
        navigate("/jobs");
        return;
      }

      const response = await fetch("/api/technician/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technicianId }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        const jobData = result.data.find(
          (assignment: any) => assignment.MasterCustomer.id === jobId
        );

        if (jobData) {
          const mappedJob: Job = {
            id: jobData.MasterCustomer.id,
            quote_id: jobData.MasterCustomer.quote_id,
            customer_name: jobData.MasterCustomer.full_name,
            customer_phone: jobData.MasterCustomer.mobile,
            customer_email: jobData.MasterCustomer.email,
            location: jobData.MasterCustomer.location,
            appointment_date: jobData.MasterCustomer.appointment_date,
            time_slot: jobData.MasterCustomer.time_slot,
            status: jobData.status,
            quote_price: jobData.MasterCustomer.quote_price,
            vehicle_reg: jobData.MasterCustomer.vehicle_reg,
            brand: jobData.MasterCustomer.brand,
            model: jobData.MasterCustomer.model,
            year: jobData.MasterCustomer.year,
            glass_type: jobData.MasterCustomer.glass_type,
            assigned_at: jobData.assigned_at,
            completed_at: jobData.completed_at,
            job_progress: jobData.MasterCustomer.job_progress || 'assigned',
            notes: jobData.MasterCustomer.notes,
            window_damage: jobData.MasterCustomer.window_damage,
            window_spec: jobData.MasterCustomer.window_spec,
            selected_windows: jobData.MasterCustomer.selected_windows,
            adas_calibration: jobData.MasterCustomer.adas_calibration,
            service_type: jobData.MasterCustomer.service_type,
            delivery_type: jobData.MasterCustomer.delivery_type,
          };

          setJob(mappedJob);
          setCurrentStage(mappedJob.job_progress || 'assigned');
        } else {
          toast({
            title: "Job Not Found",
            description: "Could not find the requested job",
            variant: "destructive",
          });
          navigate("/jobs");
        }
      }
    } catch (error) {
      console.error("Error fetching job details:", error);
      toast({
        title: "Error",
        description: "Failed to load job details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLinkedGlassOrder = async () => {
    try {
      const { data, error } = await supabase
        .from("glass_orders")
        .select("id, order_number, total_amount, order_status")
        .eq("job_id", jobId)
        .single();

      if (data && !error) {
        setGlassOrder(data);
      }
    } catch (error) {
      console.error("Error fetching glass order:", error);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCompletionPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompletionPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateJobProgress = async (newProgress: string) => {
    if (!job) return;

    // Validate photo is required for completion
    if (newProgress === 'completed' && !completionPhoto) {
      toast({
        title: "Photo Required",
        description: "Please upload a completion photo before submitting",
        variant: "destructive",
      });
      return;
    }

    try {
      setUpdating(true);

      let photoUrl = null;

      // Upload completion photo if completing the job
      if (newProgress === 'completed' && completionPhoto) {
        const fileExt = completionPhoto.name.split('.').pop();
        const fileName = `${job.id}_${Date.now()}.${fileExt}`;
        const filePath = `job-completions/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('job-photos')
          .upload(filePath, completionPhoto);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('job-photos')
          .getPublicUrl(filePath);

        photoUrl = publicUrl;
      }

      const updateData: any = { 
        job_progress: newProgress,
        status: newProgress === 'completed' ? 'completed' : 'in_progress',
        notes: completionNotes || job.notes,
      };

      if (photoUrl) {
        updateData.completion_photo = photoUrl;
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("MasterCustomer")
        .update(updateData)
        .eq("id", job.id);

      if (error) throw error;

      // Update job_assignments
      await supabase
        .from("job_assignments")
        .update({ 
          status: newProgress === 'completed' ? 'completed' : 'in_progress',
          completed_at: newProgress === 'completed' ? new Date().toISOString() : null
        })
        .eq("job_id", job.id);

      toast({
        title: "Job Updated",
        description: newProgress === 'completed' ? "Job marked as completed! Redirecting to History..." : "Job progress updated",
      });

      fetchJobDetails();
      if (newProgress === 'completed') {
        setTimeout(() => navigate("/history", { state: { tab: 'completed' } }), 1500);
      }
    } catch (error) {
      console.error("Error updating job:", error);
      toast({
        title: "Error",
        description: "Failed to update job",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const getStageDisplay = (progress: string) => {
    const stages: Record<string, string> = {
      'assigned': 'Job Assigned',
      'glass_ordered': 'Glass Ordered',
      'glass_received': 'Glass Received',
      'in_progress': 'Work In Progress',
      'completed': 'Completed'
    };
    return stages[progress] || progress;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0FB8C1]"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!job) {
    return (
      <DashboardLayout>
        <div className="p-6 max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h2>
              <p className="text-gray-600 mb-6">The requested job could not be found.</p>
              <Button onClick={() => navigate("/jobs")} className="bg-[#0FB8C1] hover:bg-[#0d9da5]">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Jobs
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const stages = ['assigned', 'glass_ordered', 'glass_received', 'in_progress', 'completed'];
  const currentStageIndex = stages.indexOf(currentStage);
  const progressPercentage = ((currentStageIndex + 1) / stages.length) * 100;

  return (
    <DashboardLayout>
      <PageTransition>
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
          {/* Simple Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/jobs")}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Job #{job.id.slice(0, 8)}</h1>
                <p className="text-gray-600 text-sm mt-1">
                  {job.customer_name} – {job.brand} {job.model} ({job.vehicle_reg})
                </p>
              </div>
            </div>
            {job.quote_id && (
              <Badge variant="outline" className="border-[#0FB8C1] text-[#0FB8C1] font-semibold text-sm px-3 py-1.5">
                Quote: {job.quote_id}
              </Badge>
            )}
          </div>

          {/* Progress Bar */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Current Stage</span>
              <span className="text-sm font-semibold text-[#0FB8C1]">{getStageDisplay(currentStage)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-[#0FB8C1] h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              {stages.map((stage, idx) => (
                <span key={stage} className={idx <= currentStageIndex ? 'text-[#0FB8C1] font-semibold' : ''}>
                  {getStageDisplay(stage)}
                </span>
              ))}
            </div>
          </div>

          {/* Job Details Card */}
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-[#0FB8C1]" />
                    Customer
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">{job.customer_name}</p>
                    {job.customer_phone && (
                      <p className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        <a href={`tel:${job.customer_phone}`} className="hover:text-[#0FB8C1]">
                          {job.customer_phone}
                        </a>
                      </p>
                    )}
                    {job.customer_email && (
                      <p className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4" />
                        <a href={`mailto:${job.customer_email}`} className="hover:text-[#0FB8C1]">
                          {job.customer_email}
                        </a>
                      </p>
                    )}
                    {job.location && (
                      <p className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {job.location}
                      </p>
                    )}
                  </div>
                </div>

                {/* Vehicle Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Car className="w-4 h-4 text-[#0FB8C1]" />
                    Vehicle
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="inline-block bg-yellow-400 border-2 border-black px-3 py-1 rounded font-bold">
                      {job.vehicle_reg}
                    </div>
                    <p className="font-medium">{job.year} {job.brand} {job.model}</p>
                    {job.glass_type && <p className="text-gray-600">Glass: {job.glass_type}</p>}
                  </div>
                </div>

                {/* Appointment */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#0FB8C1]" />
                    Appointment
                  </h3>
                  <div className="space-y-2 text-sm">
                    {job.appointment_date && (
                      <p className="font-medium">{format(new Date(job.appointment_date), 'EEE, dd MMM yyyy')}</p>
                    )}
                    {job.time_slot && (
                      <p className="text-gray-600 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {job.time_slot}
                      </p>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Quote Price</h3>
                  {job.quote_price && (
                    <p className="text-3xl font-bold text-[#0FB8C1]">£{job.quote_price.toFixed(2)}</p>
                  )}
                </div>
              </div>

              {/* Service Info */}
              {(job.service_type || job.delivery_type || job.adas_calibration) && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold text-gray-900 mb-3">Service Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {job.service_type && (
                      <div>
                        <p className="text-gray-600">Service Type</p>
                        <p className="font-medium text-gray-900">{job.service_type}</p>
                      </div>
                    )}
                    {job.delivery_type && (
                      <div>
                        <p className="text-gray-600">Delivery</p>
                        <p className="font-medium text-gray-900">{job.delivery_type}</p>
                      </div>
                    )}
                    {job.adas_calibration && (
                      <div className="col-span-2">
                        <p className="text-gray-600">ADAS Calibration</p>
                        <Badge className="mt-1 bg-purple-500">{job.adas_calibration}</Badge>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Glass Order */}
              {glassOrder && (
                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-[#0FB8C1]" />
                      <div>
                        <p className="font-semibold text-gray-900">Glass Order: {glassOrder.order_number}</p>
                        <p className="text-sm text-gray-600">£{glassOrder.total_amount.toFixed(2)}</p>
                      </div>
                    </div>
                    <Badge className={
                      glassOrder.order_status === 'delivered' ? 'bg-green-500' :
                      glassOrder.order_status === 'processing' ? 'bg-blue-500' : 'bg-yellow-500'
                    }>
                      {glassOrder.order_status}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Existing Job Notes */}
          {job.notes && (
            <Card className="shadow-sm border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Job Notes</h3>
                <p className="text-sm text-gray-700">{job.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Window Damage & Specifications */}
          {(job.window_damage || job.window_spec || job.selected_windows) && (
            <Card className="shadow-sm border-l-4 border-l-red-500">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  Window Damage & Specifications
                </h3>

                {/* Selected Windows */}
                {job.selected_windows && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Affected Windows</p>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(job.selected_windows) ? (
                        job.selected_windows.flat().filter(Boolean).map((window: any, idx: number) => (
                          <Badge key={idx} variant="outline" className="border-red-300 text-red-700">
                            {getGlassDisplayName(window)}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline" className="border-red-300 text-red-700">
                          {getGlassDisplayName(job.selected_windows)}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Window Damage Details */}
                {job.window_damage && (
                  <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Damage Description</p>
                    <div className="text-sm text-gray-900">
                      {typeof job.window_damage === 'string' ? (
                        <p>{job.window_damage}</p>
                      ) : (
                        <div className="space-y-1">
                          {Object.entries(job.window_damage).map(([key, value]) => (
                            <p key={key}>
                              <span className="font-medium">{key}:</span> {String(value)}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Window Specifications */}
                {job.window_spec && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Window Specifications</p>
                    <div className="text-sm text-gray-900">
                      {typeof job.window_spec === 'string' ? (
                        <p>{job.window_spec}</p>
                      ) : (
                        <div className="space-y-1">
                          {Object.entries(job.window_spec).map(([key, value]) => (
                            <p key={key}>
                              <span className="font-medium">{key}:</span> {String(value)}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Manual Progress Control */}
          {currentStage !== 'completed' && currentStageIndex < stages.length - 1 && (
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Update Job Stage</h2>
                    <p className="text-sm text-gray-600">
                      Current: <span className="font-semibold text-[#0FB8C1]">{getStageDisplay(currentStage)}</span>
                    </p>
                  </div>
                  <Button
                    onClick={() => updateJobProgress(stages[currentStageIndex + 1])}
                    disabled={updating}
                    className="bg-[#0FB8C1] hover:bg-[#0d9da5] text-white px-6 py-3 h-auto"
                  >
                    {updating ? (
                      "Updating..."
                    ) : (
                      <>
                        Move to {getStageDisplay(stages[currentStageIndex + 1])}
                        <ChevronRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Complete Job Section - Only shown when job is "In Progress" */}
          {currentStage === 'in_progress' && (
            <Card className="shadow-sm border-2 border-green-500">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  Complete This Job
                </h2>
                <p className="text-sm text-gray-600 mb-6">Upload a completion photo and submit to mark this job as complete</p>
                
                {/* Photo Upload - Required */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <label className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-[#0FB8C1]" />
                    Completion Photo <span className="text-red-500">*</span>
                  </label>
                  <p className="text-sm text-gray-600 mb-3">Upload a photo of the completed work</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-[#0FB8C1] file:text-white
                      hover:file:bg-[#0d9da5]
                      cursor-pointer"
                  />
                  {completionPhotoPreview && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                      <img 
                        src={completionPhotoPreview} 
                        alt="Completion preview" 
                        className="max-h-64 rounded-lg border-2 border-gray-200"
                      />
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="mb-6">
                  <label className="block font-medium text-gray-900 mb-2">Notes (optional)</label>
                  <Textarea
                    placeholder="Enter notes here"
                    value={completionNotes}
                    onChange={(e) => setCompletionNotes(e.target.value)}
                    className="min-h-[120px] resize-none"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  onClick={() => updateJobProgress('completed')}
                  disabled={updating || !completionPhoto}
                  className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? (
                    "Uploading..."
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      {completionPhoto ? "Complete Job & Submit" : "Upload Photo to Complete"}
                    </>
                  )}
                </Button>
                {!completionPhoto && (
                  <p className="text-sm text-red-600 mt-2 text-center">
                    * Completion photo is required
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Info Message for non In Progress stages */}
          {currentStage !== 'completed' && currentStage !== 'in_progress' && (
            <Card className="shadow-sm bg-blue-50 border-2 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Job Completion Not Available Yet</h3>
                    <p className="text-sm text-gray-600">
                      Progress this job to <span className="font-semibold text-blue-600">"In Progress"</span> stage using the buttons above before you can complete it.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Completed Message */}
          {currentStage === 'completed' && (
            <div className="bg-green-900 text-white rounded-lg p-6 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <div>
                <p className="font-semibold text-lg">Job Completed Successfully</p>
                <p className="text-sm text-green-200 mt-1">This job has been marked as complete and moved to History</p>
              </div>
            </div>
          )}
        </div>
      </div>
      </PageTransition>
    </DashboardLayout>
  );
};

export default JobManagement;
