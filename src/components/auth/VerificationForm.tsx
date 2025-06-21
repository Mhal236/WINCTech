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
import { CheckCircle, AlertCircle, Clock, FileText, Building, User, Phone, Calendar, Shield, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

// Helper function to get application details by user ID (useful for admin views)
export const getApplicationByUserId = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', userId)
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
  // Company Information
  company_name: string;
  business_type: string;
  registration_number: string;
  vat_number: string;
  years_in_business: string;
  
  // Contact Information
  contact_name: string;
  contact_phone: string;
  business_address: string;
  
  // Services & Certifications
  services_offered: string[];
  certifications: string;
  insurance_details: string;
  additional_info: string;
}

const steps = [
  {
    id: 1,
    title: "Company Details",
    description: "Tell us about your business",
    icon: Building
  },
  {
    id: 2,
    title: "Contact Information", 
    description: "How can we reach you?",
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
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingApplication, setExistingApplication] = useState<any>(null);
  const [isCheckingApplication, setIsCheckingApplication] = useState(true);

  console.log('🔍 VerificationForm Debug:', {
    user,
    userRole: user?.user_role,
    verificationStatus: user?.verification_status
  });

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
        const { data: application, error } = await getApplicationByUserId(user.id);
        
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
    company_name: '',
    business_type: '',
    registration_number: '',
    vat_number: '',
    contact_name: user?.name || '',
    contact_phone: '',
    business_address: '',
    years_in_business: '',
    services_offered: [],
    certifications: '',
    insurance_details: '',
    additional_info: ''
  });

  const businessTypes = [
    'Auto Glass Repair Shop',
    'Mobile Auto Glass Service',
    'Independent Contractor',
    'Other'
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
        return formData.company_name && formData.business_type;
      case 2:
        return formData.contact_name && formData.contact_phone && formData.business_address;
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

      // Prepare application data
      const applicationData = {
        user_id: user.id,
        // Company Information
        company_name: formData.company_name,
        business_type: formData.business_type,
        registration_number: formData.registration_number || null,
        vat_number: formData.vat_number || null,
        years_in_business: formData.years_in_business,
        // Contact Information
        contact_name: formData.contact_name,
        contact_phone: formData.contact_phone,
        business_address: formData.business_address,
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
        .eq('id', user.id);

      if (userUpdateError) {
        console.error('🔴 Error updating user status:', userUpdateError);
        throw userUpdateError;
      }

      console.log('🟢 User verification status updated successfully');

      toast({
        title: "Verification Application Submitted",
        description: `Your verification application has been submitted successfully. Application ID: ${applicationResult.id.slice(0, 8)}... We'll review it within 2-3 business days.`,
        variant: "default",
      });

      // Refresh the page to update the user's status
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('🔴 Error submitting verification application:', error);
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit verification application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show a more elegant loading state
  if (isCheckingApplication) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-0 shadow-lg">
          <CardContent className="text-center py-12">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 bg-[#135084]/10 rounded-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#135084] border-t-transparent"></div>
              </div>
              <p className="text-gray-600 font-medium">Loading verification status...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show status based on user's verification status OR existing application
  const hasExistingApplication = existingApplication && existingApplication.status === 'pending';
  const isPending = user?.verification_status === 'pending' || hasExistingApplication;
  
  if (isPending) {
    // Use application submission date if available, otherwise use user submitted_at
    const submissionDate = existingApplication?.submitted_at || user?.submitted_at;
    
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
              <Clock className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">Verification Pending</CardTitle>
            <CardDescription className="text-lg text-gray-600 mt-2">
              Your verification request is being reviewed. We'll email you once the review is complete.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <p className="text-gray-700 mb-2 font-medium">
                Submitted on: {submissionDate ? new Date(submissionDate).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                }) : 'Unknown'}
              </p>
              {existingApplication && (
                <p className="text-gray-700 mb-2 font-medium">
                  Application ID: {existingApplication.id.slice(0, 8)}...
                </p>
              )}
              <p className="text-sm text-gray-500">
                This usually takes 2-3 business days. You'll receive an email notification once approved.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user?.verification_status === 'rejected') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
              <AlertCircle className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">Verification Rejected</CardTitle>
            <CardDescription className="text-lg text-gray-600 mt-2">
              Your verification request was not approved.
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
              Please contact support for more information or to resubmit your application with the required changes.
            </p>
            <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStepData = steps[currentStep - 1];
  const StepIcon = currentStepData.icon;
  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="border-0 shadow-xl bg-white">
        {/* Header with progress */}
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Business Verification</CardTitle>
                <CardDescription className="text-blue-100">
                  Get verified to access all platform features
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
                    <Label htmlFor="vat_number" className="text-base font-medium">VAT Number</Label>
                    <Input
                      id="vat_number"
                      value={formData.vat_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, vat_number: e.target.value }))}
                      className="mt-2 h-12"
                      placeholder="e.g. GB123456789"
                    />
                  </div>
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
                      <span>Submit for Verification</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 