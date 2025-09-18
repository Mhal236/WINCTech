import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase-client';
import { CheckCircle, AlertCircle, Clock, FileText, Building, User, Phone, Calendar, Shield, ArrowRight, ArrowLeft, Check, LogOut } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';

// Helper function to get application details by user ID (useful for admin views)
export const getApplicationByUserId = async (userId: string, userEmail?: string) => {
  try {
    // Check if the user ID looks like a Google OAuth ID instead of UUID
    let actualUserId = userId;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      console.log('🔵 User ID appears to be OAuth ID in getApplicationByUserId:', userId);
      
      // If we have the user email, look up the actual UUID
      if (userEmail) {
        console.log('🔵 Looking up UUID for email:', userEmail);
        const { data: appUser, error: lookupError } = await supabase
          .from('app_users')
          .select('id')
          .eq('email', userEmail)
          .single();
          
        if (!lookupError && appUser) {
          actualUserId = appUser.id;
          console.log('🟢 Found UUID for OAuth user:', actualUserId);
        } else {
          console.error('🔴 Could not find UUID for OAuth user:', lookupError);
          return { data: null, error: lookupError };
        }
      } else {
        console.log('🔴 No email provided to lookup UUID for OAuth ID');
        return { data: null, error: new Error('OAuth ID provided without email for lookup') };
      }
    }
    
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', actualUserId)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching application:', error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error in getApplicationByUserId:', error);
    return { data: null, error };
  }
};

// Helper function to get all pending applications (for admin use)
export const getPendingApplications = async () => {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        app_users!applications_user_id_fkey (
          id,
          email,
          name
        )
      `)
      .eq('status', 'pending')
      .order('submitted_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching pending applications:', error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error in getPendingApplications:', error);
    return { data: null, error };
  }
};

interface VerificationFormData {
  // Personal Information
  first_name: string;
  last_name: string;
  email: string;
  
  // Company Information
  company_name: string;
  business_type: string;
  registration_number: string;
  dvla_number: string;
  vat_registered: boolean;
  vat_number: string;
  years_in_business: string;
  
  // Contact Information
  contact_name: string;
  contact_phone: string;
  business_address: string;
  
  // Vehicle Information
  vehicle_registration_number: string;
  vehicle_make: string;
  vehicle_model: string;
  
  // Services & Certifications
  services_offered: string[];
  certifications: string;
  insurance_details: string;
  additional_info: string;
}

const steps = [
  {
    id: 1,
    title: "Personal & Company Details",
    description: "Tell us about yourself and your business",
    icon: Building
  },
  {
    id: 2,
    title: "Contact & Vehicle Info", 
    description: "Your contact details and vehicle information",
    icon: User
  },
  {
    id: 3,
    title: "Business Experience",
    description: "Your experience and timeline",
    icon: Calendar
  },
  {
    id: 4,
    title: "Services & Insurance",
    description: "What services do you provide?",
    icon: Shield
  }
];

export function VerificationForm() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingApplication, setExistingApplication] = useState<any>(null);
  const [isCheckingApplication, setIsCheckingApplication] = useState(true);
  const [isSubmissionComplete, setIsSubmissionComplete] = useState(false);
  const [submissionDetails, setSubmissionDetails] = useState<any>(null);

  console.log('🔍 VerificationForm Debug:', {
    user,
    userRole: user?.user_role,
    verificationStatus: user?.verification_status,
    renderingVerificationForm: true
  });

  const handleLogout = async () => {
    try {
      console.log('🔵 Verification form logout clicked');
      await signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Logout Error",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Check for existing application when component mounts
  useEffect(() => {
    const checkExistingApplication = async () => {
      if (!user?.id) {
        setIsCheckingApplication(false);
        return;
      }

      // Add a minimum delay to prevent flashing on fast page transitions
      const minDelay = new Promise(resolve => setTimeout(resolve, 300));

      try {
        console.log('🔵 Checking for existing application for user:', user.id);
        const { data: application, error } = await getApplicationByUserId(user.id, user.email);
        
        // Wait for minimum delay to prevent flashing
        await minDelay;
        
        if (application) {
          console.log('🟢 Found existing application:', application);
          setExistingApplication(application);
        } else {
          console.log('🔵 No existing application found');
          setExistingApplication(null);
        }
      } catch (error) {
        console.error('🔴 Error checking for existing application:', error);
        // Wait for minimum delay even on error
        await minDelay;
      } finally {
        setIsCheckingApplication(false);
      }
    };

    // Add a debounce to prevent rapid re-checking during page transitions
    const debounceTimer = setTimeout(checkExistingApplication, 100);
    
    return () => clearTimeout(debounceTimer);
  }, [user?.id]);

  const [formData, setFormData] = useState<VerificationFormData>({
    first_name: user?.name?.split(' ')[0] || '',
    last_name: user?.name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    company_name: '',
    business_type: '',
    registration_number: '',
    dvla_number: '',
    vat_registered: false,
    vat_number: '',
    contact_name: user?.name || '',
    contact_phone: '',
    business_address: '',
    vehicle_registration_number: '',
    vehicle_make: '',
    vehicle_model: '',
    years_in_business: '',
    services_offered: [],
    certifications: '',
    insurance_details: '',
    additional_info: ''
  });

  const businessTypes = [
    'Limited Company',
    'Mobile Auto Glass Service',
    'Partnerships'
  ];

  const serviceOptions = [
    'Windscreen Replacement',
    'Windscreen Repair',
    'Side Window Replacement',
    'Rear Window Replacement',
    'ADAS Calibration',
    'Mobile Service',
    'Insurance Claims'
  ];

  const handleServiceToggle = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services_offered: prev.services_offered.includes(service)
        ? prev.services_offered.filter(s => s !== service)
        : [...prev.services_offered, service]
    }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        const nameValid = formData.first_name && formData.last_name && formData.email;
        const basicInfoValid = formData.company_name && formData.business_type;
        const vatValid = !formData.vat_registered || (formData.vat_registered && formData.vat_number);
        return nameValid && basicInfoValid && vatValid;
      case 2:
        return formData.contact_name && formData.contact_phone && formData.business_address && 
               formData.vehicle_registration_number && formData.vehicle_make && formData.vehicle_model;
      case 3:
        return formData.years_in_business;
      case 4:
        return formData.services_offered.length > 0 && formData.insurance_details;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check if user already has a pending application
      if (existingApplication && existingApplication.status === 'pending') {
        toast({
          title: "Application Already Submitted",
          description: "You already have a pending verification application. Please wait for the review to complete.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      console.log('🔵 Submitting verification application for user:', user.id);

      // Ensure we have a valid UUID for user_id
      let userId = user.id;
      
      // Check if the user ID looks like a Google OAuth ID (numeric string) instead of UUID
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
        console.log('🔵 User ID appears to be OAuth ID, looking up UUID from app_users table');
        
        // Look up the actual UUID from app_users table
        const { data: appUser, error: lookupError } = await supabase
          .from('app_users')
          .select('id')
          .eq('email', user.email)
          .single();
          
        if (lookupError || !appUser) {
          console.error('🔴 Could not find user in app_users table, creating new user:', lookupError);
          
          // Create the user in app_users table
          const newUserData = {
            email: user.email,
            name: user.name,
            user_role: user.user_role || 'pending',
            verification_status: user.verification_status || 'non-verified',
            auth_provider: 'google',
            oauth_user_id: userId,
            created_at: new Date().toISOString()
          };
          
          try {
            const { data: insertedUser, error: insertError } = await supabase
              .from('app_users')
              .insert([newUserData])
              .select('id')
              .single();
            
            if (insertError) {
              console.error('🔴 Error creating user in app_users:', insertError);
              throw new Error('Could not create user record. Please try again.');
            }
            
            userId = insertedUser.id;
            console.log('🟢 Created new user in app_users table:', userId);
          } catch (createError) {
            console.error('🔴 Exception creating user:', createError);
            throw new Error('Could not create user record. Please try again.');
          }
        } else {
          userId = appUser.id;
          console.log('🟢 Found existing user UUID:', userId);
        }
      }

      // Prepare application data
      const applicationData = {
        user_id: userId,
        // Personal Information
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        // Company Information
        company_name: formData.company_name,
        business_type: formData.business_type,
        registration_number: formData.registration_number || null,
        dvla_number: formData.dvla_number || null,
        vat_number: formData.vat_registered ? formData.vat_number : null,
        years_in_business: formData.years_in_business,
        // Contact Information
        contact_name: formData.contact_name,
        contact_phone: formData.contact_phone,
        business_address: formData.business_address,
        // Vehicle Information
        vehicle_registration_number: formData.vehicle_registration_number || null,
        vehicle_make: formData.vehicle_make || null,
        vehicle_model: formData.vehicle_model || null,
        // Services & Certifications
        services_offered: formData.services_offered,
        certifications: formData.certifications || null,
        insurance_details: formData.insurance_details,
        additional_info: formData.additional_info || null,
        // Status
        status: 'pending',
        submitted_at: new Date().toISOString()
      };

      console.log('🔵 Application data to submit:', applicationData);

      // Insert application record
      const { data: applicationResult, error: applicationError } = await supabase
        .from('applications')
        .insert([applicationData])
        .select('*')
        .single();

      if (applicationError) {
        console.error('🔴 Error creating application:', applicationError);
        throw applicationError;
      }

      console.log('🟢 Application created successfully:', applicationResult);

      // Update user's verification status and link to the application
      const { error: userUpdateError } = await supabase
        .from('app_users')
        .update({
          verification_status: 'pending',
          verification_form_data: formData, // Keep for backward compatibility
          submitted_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (userUpdateError) {
        console.error('🔴 Error updating user status:', userUpdateError);
        throw userUpdateError;
      }

      console.log('🟢 User verification status updated successfully');

      // Set submission complete state with details
      setSubmissionDetails({
        applicationId: applicationResult.id,
        submittedAt: new Date().toISOString(),
        companyName: formData.company_name
      });
      setIsSubmissionComplete(true);

    } catch (error) {
      console.error('🔴 Error submitting verification application:', error);
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit technician application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show a more elegant loading state
  if (isCheckingApplication) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-2xl mx-auto">
          <div className="relative text-center mb-8">
            {/* Logout Button - Top Right */}
            <div className="absolute top-0 right-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 border-gray-300 hover:border-gray-400"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
            
            <img 
              src="/windscreen-compare-technician.png" 
              alt="WindscreenCompare" 
              className="h-12 w-auto mx-auto mb-4"
            />
          </div>
          <Card className="border-0 shadow-lg">
            <CardContent className="text-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-12 h-12 bg-[#135084]/10 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#135084] border-t-transparent"></div>
                </div>
                <p className="text-gray-600 font-medium">Loading application status...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show thank you screen for users with submitted applications (pending status)
  // This covers both just-submitted applications and existing submitted applications
  console.log('🔍 Thank you screen check:', {
    isSubmissionComplete,
    hasSubmissionDetails: !!submissionDetails,
    hasExistingApplication: !!existingApplication,
    existingApplicationStatus: existingApplication?.status,
    shouldShowThankYou: (isSubmissionComplete && submissionDetails) || (existingApplication && existingApplication.status === 'pending')
  });
  
  if ((isSubmissionComplete && submissionDetails) || (existingApplication && existingApplication.status === 'pending')) {
    // Use submission details if just submitted, otherwise use existing application data
    const displayData = submissionDetails || {
      applicationId: existingApplication?.id,
      submittedAt: existingApplication?.submitted_at || existingApplication?.created_at,
      companyName: existingApplication?.company_name
    };

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-2xl mx-auto">
          <div className="relative text-center mb-8">
            {/* Logout Button - Top Right */}
            <div className="absolute top-0 right-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 border-gray-300 hover:border-gray-400"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
            
            <img 
              src="/windscreen-compare-technician.png" 
              alt="WindscreenCompare" 
              className="h-12 w-auto mx-auto mb-4"
            />
          </div>
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-8">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-800">Thank You for Your Application!</CardTitle>
              <CardDescription className="text-lg text-gray-600 mt-2">
                Your technician application has been submitted successfully.
              </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <div className="space-y-3">
                <div>
                  <p className="text-green-800 font-medium">Application ID:</p>
                  <p className="text-green-700 font-mono text-sm break-all">{displayData.applicationId}</p>
                </div>
                {displayData.companyName && (
                  <div>
                    <p className="text-green-800 font-medium">Company:</p>
                    <p className="text-green-700">{displayData.companyName}</p>
                  </div>
                )}
                <div>
                  <p className="text-green-800 font-medium">Submitted:</p>
                  <p className="text-green-700">{new Date(displayData.submittedAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">What happens next?</h3>
              <div className="text-left space-y-2 text-blue-700">
                <p>• Our team will review your application within 24-48 hours</p>
                <p>• You'll receive an email notification once the review is complete</p>
                <p>• If approved, you'll gain access to all platform features</p>
                <p>• If we need additional information, we'll contact you directly</p>
              </div>
            </div>

            <div className="text-center">
              <p className="text-gray-600">
                Please wait <strong>24-48 hours</strong> for a decision on your application.
              </p>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    );
  }


  if (user?.verification_status === 'rejected') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-2xl mx-auto">
          <div className="relative text-center mb-8">
            {/* Logout Button - Top Right */}
            <div className="absolute top-0 right-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 border-gray-300 hover:border-gray-400"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
            
            <img 
              src="/windscreen-compare-technician.png" 
              alt="WindscreenCompare" 
              className="h-12 w-auto mx-auto mb-4"
            />
          </div>
          <Card className="border-0 shadow-lg">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
              <AlertCircle className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">Application Rejected</CardTitle>
            <CardDescription className="text-lg text-gray-600 mt-2">
              Your technician application was not approved.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            {user.rejection_reason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                <p className="text-red-800 font-medium mb-2">Reason for rejection:</p>
                <p className="text-red-700">{user.rejection_reason}</p>
              </div>
            )}
            <p className="text-gray-600 mb-6">
              Please contact support for more information or to resubmit your technician application with the required changes.
            </p>
            <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700">
              Try Again
            </Button>
          </CardContent>
        </Card>
        </div>
      </div>
    );
  }

  const currentStepData = steps[currentStep - 1];
  const StepIcon = currentStepData.icon;
  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-4xl mx-auto">
        {/* Standalone Header */}
        <div className="relative text-center mb-8">
          {/* Logout Button - Top Right */}
          <div className="absolute top-0 right-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 border-gray-300 hover:border-gray-400"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
          
          <div className="flex items-center justify-center mb-4">
            <img 
              src="/windscreen-compare-technician.png" 
              alt="WindscreenCompare" 
              className="h-12 w-auto"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Technician Verification</h1>
          <p className="text-gray-600">Complete your application to start receiving jobs</p>
        </div>
        
        <Card className="border-0 shadow-xl bg-white">
        {/* Header with progress */}
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Technician Application</CardTitle>
                <CardDescription className="text-blue-100">
                  Apply to join our network of verified technicians
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-white/80 text-sm">Step {currentStep} of {steps.length}</div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Step indicators */}
          <div className="flex justify-between mt-6">
            {steps.map((step, index) => {
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              const StepIconComponent = step.icon;
              
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-green-500 text-white' 
                      : isActive 
                        ? 'bg-white text-blue-600' 
                        : 'bg-white/20 text-white/60'
                  }`}>
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <StepIconComponent className="w-5 h-5" />
                    )}
                  </div>
                  <span className={`text-xs mt-2 transition-all duration-300 ${
                    isActive ? 'text-white font-medium' : 'text-white/60'
                  }`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </CardHeader>
        
        <CardContent className="p-8">
          {/* Current step content */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <StepIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800">{currentStepData.title}</h3>
                <p className="text-gray-600">{currentStepData.description}</p>
              </div>
            </div>

            {/* Step 1: Company Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="first_name" className="text-base font-medium">First Name *</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                      className="mt-2 h-12"
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name" className="text-base font-medium">Last Name *</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                      className="mt-2 h-12"
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email" className="text-base font-medium">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-2 h-12"
                    placeholder="Enter your email address"
                  />
                </div>
                
                <div>
                  <Label htmlFor="company_name" className="text-base font-medium">Company Name *</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                    className="mt-2 h-12"
                    placeholder="Enter your company name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="business_type" className="text-base font-medium">Business Type *</Label>
                  <Select 
                    value={formData.business_type} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, business_type: value }))}
                  >
                    <SelectTrigger className="mt-2 h-12">
                      <SelectValue placeholder="Select your business type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg">
                      {businessTypes.map(type => (
                        <SelectItem key={type} value={type} className="hover:bg-gray-50">{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="registration_number" className="text-base font-medium">Company Registration Number</Label>
                    <Input
                      id="registration_number"
                      value={formData.registration_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, registration_number: e.target.value }))}
                      className="mt-2 h-12"
                      placeholder="e.g. 12345678"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="dvla_number" className="text-base font-medium">DVLA Number</Label>
                    <Input
                      id="dvla_number"
                      value={formData.dvla_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, dvla_number: e.target.value }))}
                      className="mt-2 h-12"
                      placeholder="e.g. DVLA123456"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="vat_registered"
                      checked={formData.vat_registered}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        vat_registered: e.target.checked,
                        // Clear VAT number if unchecking
                        vat_number: e.target.checked ? prev.vat_number : ''
                      }))}
                      className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <Label htmlFor="vat_registered" className="text-base font-medium cursor-pointer">
                      My business is VAT registered
                    </Label>
                  </div>
                  
                  {formData.vat_registered && (
                    <div className="ml-8 transition-all duration-300 ease-in-out">
                      <Label htmlFor="vat_number" className="text-base font-medium">VAT Number *</Label>
                      <Input
                        id="vat_number"
                        value={formData.vat_number}
                        onChange={(e) => setFormData(prev => ({ ...prev, vat_number: e.target.value }))}
                        className="mt-2 h-12"
                        placeholder="e.g. GB123456789"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Contact Information */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="contact_name" className="text-base font-medium">Contact Name *</Label>
                    <Input
                      id="contact_name"
                      value={formData.contact_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                      className="mt-2 h-12"
                      placeholder="Your full name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="contact_phone" className="text-base font-medium">Contact Phone *</Label>
                    <Input
                      id="contact_phone"
                      type="tel"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                      className="mt-2 h-12"
                      placeholder="e.g. +44 7123 456789"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="business_address" className="text-base font-medium">Business Address *</Label>
                  <Textarea
                    id="business_address"
                    value={formData.business_address}
                    onChange={(e) => setFormData(prev => ({ ...prev, business_address: e.target.value }))}
                    className="mt-2 min-h-[100px]"
                    placeholder="Enter your full business address including postcode"
                  />
                </div>

                {/* Vehicle Information Section */}
                <div className="border-t pt-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Vehicle Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <Label htmlFor="vehicle_registration_number" className="text-base font-medium">Vehicle Registration Number (VRN) *</Label>
                      <Input
                        id="vehicle_registration_number"
                        value={formData.vehicle_registration_number}
                        onChange={(e) => setFormData(prev => ({ ...prev, vehicle_registration_number: e.target.value.toUpperCase() }))}
                        className="mt-2 h-12"
                        placeholder="e.g. AB12 CDE"
                        maxLength={8}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="vehicle_make" className="text-base font-medium">Vehicle Make *</Label>
                      <Input
                        id="vehicle_make"
                        value={formData.vehicle_make}
                        onChange={(e) => setFormData(prev => ({ ...prev, vehicle_make: e.target.value }))}
                        className="mt-2 h-12"
                        placeholder="e.g. Ford, BMW, Toyota"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="vehicle_model" className="text-base font-medium">Vehicle Model *</Label>
                      <Input
                        id="vehicle_model"
                        value={formData.vehicle_model}
                        onChange={(e) => setFormData(prev => ({ ...prev, vehicle_model: e.target.value }))}
                        className="mt-2 h-12"
                        placeholder="e.g. Focus, 3 Series, Corolla"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Business Experience */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="years_in_business" className="text-base font-medium">Years in Business *</Label>
                  <Select 
                    value={formData.years_in_business} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, years_in_business: value }))}
                  >
                    <SelectTrigger className="mt-2 h-12">
                      <SelectValue placeholder="How long have you been in business?" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg">
                      <SelectItem value="Less than 1 year" className="hover:bg-gray-50">Less than 1 year</SelectItem>
                      <SelectItem value="1-2 years" className="hover:bg-gray-50">1-2 years</SelectItem>
                      <SelectItem value="3-5 years" className="hover:bg-gray-50">3-5 years</SelectItem>
                      <SelectItem value="6-10 years" className="hover:bg-gray-50">6-10 years</SelectItem>
                      <SelectItem value="More than 10 years" className="hover:bg-gray-50">More than 10 years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-base font-medium">Certifications & Qualifications</Label>
                  <Textarea
                    value={formData.certifications}
                    onChange={(e) => setFormData(prev => ({ ...prev, certifications: e.target.value }))}
                    className="mt-2 min-h-[120px]"
                    placeholder="List any relevant certifications, licenses, or qualifications (e.g. FENSA, GQA, industry training)"
                  />
                </div>
              </div>
            )}

            {/* Step 4: Services & Insurance */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <Label className="text-base font-medium">Services Offered *</Label>
                  <p className="text-sm text-gray-500 mb-4">Select all services that you provide</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {serviceOptions.map(service => (
                      <label key={service} className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                          type="checkbox"
                          checked={formData.services_offered.includes(service)}
                          onChange={() => handleServiceToggle(service)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium">{service}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="insurance_details" className="text-base font-medium">Insurance Details *</Label>
                  <Textarea
                    id="insurance_details"
                    value={formData.insurance_details}
                    onChange={(e) => setFormData(prev => ({ ...prev, insurance_details: e.target.value }))}
                    className="mt-2 min-h-[100px]"
                    placeholder="Provide details about your business insurance coverage (Public Liability, Professional Indemnity, etc.)"
                  />
                </div>
                
                <div>
                  <Label htmlFor="additional_info" className="text-base font-medium">Additional Information</Label>
                  <Textarea
                    id="additional_info"
                    value={formData.additional_info}
                    onChange={(e) => setFormData(prev => ({ ...prev, additional_info: e.target.value }))}
                    className="mt-2 min-h-[100px]"
                    placeholder="Any additional information that would help us verify your business"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between items-center pt-6 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </Button>
            
            <div className="flex space-x-3">
              {currentStep < steps.length ? (
                <Button
                  onClick={nextStep}
                  disabled={!isStepValid()}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!isStepValid() || isSubmitting}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Submit Application</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
} 