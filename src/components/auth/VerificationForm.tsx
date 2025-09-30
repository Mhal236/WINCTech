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
import { CheckCircle, AlertCircle, Clock, FileText, Building, User, Phone, Calendar, Shield, ArrowRight, ArrowLeft, Check, LogOut, Search, Loader2, Mail } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { VehicleService } from '../../services/vehicleService';
import { PostcodeService } from '../../services/postcodeService';
import { EmailService } from '../../services/emailService';

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
    
    // Look for pending applications first, then drafts
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', actualUserId)
      .in('status', ['pending', 'approved', 'rejected']) // Don't return drafts in this function
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
  contact_phone: string;
  business_postcode: string;
  business_address: string;
  
  // Vehicle Information
  vehicle_registration_number: string;
  vehicle_make: string;
  vehicle_model: string;
  driver_license_number: string;
  
  // Services & Certifications
  services_offered: string[];
  coverage_areas: string[];
  glass_supplier: string;
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
    title: "Personal & Vehicle Info", 
    description: "Your personal details and vehicle information",
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
  const [isLookingUpVehicle, setIsLookingUpVehicle] = useState(false);
  const [vehicleLookupError, setVehicleLookupError] = useState<string>('');
  const [isLookingUpPostcode, setIsLookingUpPostcode] = useState(false);
  const [postcodeLookupError, setPostcodeLookupError] = useState<string>('');
  const [foundAddresses, setFoundAddresses] = useState<any[]>([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<string>('');
  const [postcodeDebounceTimer, setPostcodeDebounceTimer] = useState<NodeJS.Timeout | null>(null);

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

  // Cleanup postcode debounce timer on unmount
  useEffect(() => {
    return () => {
      if (postcodeDebounceTimer) {
        clearTimeout(postcodeDebounceTimer);
      }
    };
  }, [postcodeDebounceTimer]);

  // Form persistence helper functions
  const getStorageKey = () => `verification_form_${user?.id || 'temp'}`;
  
  const saveFormData = (data: VerificationFormData) => {
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(data));
      console.log('🟢 Form data saved to localStorage');
    } catch (error) {
      console.warn('⚠️ Failed to save form data to localStorage:', error);
    }
  };

  const loadFormData = (): VerificationFormData | null => {
    try {
      const saved = localStorage.getItem(getStorageKey());
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('🟢 Form data loaded from localStorage');
        return parsed;
      }
    } catch (error) {
      console.warn('⚠️ Failed to load form data from localStorage:', error);
    }
    return null;
  };

  const clearFormData = () => {
    try {
      localStorage.removeItem(getStorageKey());
      console.log('🟢 Form data cleared from localStorage');
    } catch (error) {
      console.warn('⚠️ Failed to clear form data from localStorage:', error);
    }
  };

  // Initialize form data with saved data or defaults
  const initializeFormData = (): VerificationFormData => {
    const savedData = loadFormData();
    const defaultData: VerificationFormData = {
      first_name: '',
      last_name: '',
      email: user?.email || '',
      company_name: '',
      business_type: '',
      registration_number: '',
      dvla_number: '',
      vat_registered: false,
      vat_number: '',
      contact_phone: '',
      business_postcode: '',
      business_address: '',
      vehicle_registration_number: '',
      vehicle_make: '',
      vehicle_model: '',
      driver_license_number: '',
      years_in_business: '',
      services_offered: [],
      coverage_areas: [],
      glass_supplier: '',
      certifications: '',
      insurance_details: '',
      additional_info: ''
    };

    if (savedData) {
      // Merge saved data with defaults, ensuring email is always current
      return {
        ...defaultData,
        ...savedData,
        email: user?.email || savedData.email || ''
      };
    }

    return defaultData;
  };

  // Load draft data from Supabase on component mount
  useEffect(() => {
    const loadDraftData = async () => {
      if (!user?.id || existingApplication || isCheckingApplication) return;

      try {
        const draftData = await loadDraftFromSupabase();
        if (draftData) {
          console.log('🟢 Loading draft data from Supabase');
          setFormData(draftData);
          // Also save to localStorage for offline access
          saveFormData(draftData);
        }
      } catch (error) {
        console.error('🔴 Error loading draft data:', error);
      }
    };

    // Only load draft once when component mounts and user is available
    if (user?.id && !isCheckingApplication && !existingApplication) {
      loadDraftData();
    }
  }, [user?.id]); // Remove dependencies that cause re-renders

  const [formData, setFormData] = useState<VerificationFormData>(initializeFormData());
  const [draftApplicationId, setDraftApplicationId] = useState<string | null>(null);
  const [isSavingToDB, setIsSavingToDB] = useState(false);

  // Auto-save form data to localStorage whenever it changes (debounced)
  useEffect(() => {
    if (user?.id && formData.email) { // Only save if we have meaningful data
      const timeoutId = setTimeout(() => {
        saveFormData(formData);
      }, 500); // Debounce saves by 500ms

      return () => clearTimeout(timeoutId);
    }
  }, [formData, user?.id]);

  // Enhanced setFormData that automatically saves to localStorage
  const updateFormData = (updater: (prev: VerificationFormData) => VerificationFormData) => {
    setFormData(prev => {
      const newData = updater(prev);
      // Save will happen in the useEffect above
      return newData;
    });
  };

  // Save draft application to Supabase
  const saveDraftToSupabase = async (stepCompleted: number) => {
    if (!user?.id || isSavingToDB) return;

    setIsSavingToDB(true);
    try {
      // Ensure we have a valid UUID for user_id and that user exists in app_users
      let userId = user.id;
      let isOAuthId = !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
      
      console.log('🔵 Draft save: Checking user in app_users table. User ID:', userId, 'Is OAuth ID:', isOAuthId);
      
      // Always check if user exists in app_users table by email first
      const { data: appUser, error: lookupError } = await supabase
        .from('app_users')
        .select('id')
        .eq('email', user.email)
        .single();
        
      if (lookupError || !appUser) {
        console.log('🔵 User not found in app_users for draft save, creating new user record. Error:', lookupError);
        
        // Create the user in app_users table using auth.uid() as primary key
        const newUserData = {
          id: userId, // Use the auth.uid() as the primary key for RLS compatibility
          email: user.email,
          name: user.name || user.email,
          user_role: 'pending',
          verification_status: 'non-verified',
          auth_provider: isOAuthId ? 'google' : 'email',
          oauth_user_id: isOAuthId ? userId : null,
          created_at: new Date().toISOString()
        };
        
        console.log('🔵 Draft save: Attempting to create user in app_users with data:', newUserData);
        
        const { data: insertedUser, error: insertError } = await supabase
          .from('app_users')
          .insert(newUserData)
          .select('id')
          .single();
        
        console.log('🔵 Draft save: Insert result:', { data: insertedUser, error: insertError });
        
        if (insertError) {
          console.error('🔴 Error creating user in app_users for draft save:', insertError);
          return;
        }
        
        if (!insertedUser || !insertedUser.id) {
          console.error('🔴 Draft save: No user data returned from insert');
          return;
        }
        
        userId = insertedUser.id;
        console.log('🟢 Created new user in app_users table for draft save with ID:', userId);
      } else {
        userId = appUser.id;
        console.log('🟢 Found existing user in app_users for draft save:', userId);
      }

      // Prepare application data for current step
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
        contact_phone: formData.contact_phone,
        business_postcode: formData.business_postcode,
        business_address: formData.business_address,
        // Vehicle Information
        vehicle_registration_number: formData.vehicle_registration_number || null,
        vehicle_make: formData.vehicle_make || null,
        vehicle_model: formData.vehicle_model || null,
        driver_license_number: formData.driver_license_number || null,
        // Services & Certifications
        services_offered: formData.services_offered,
        coverage_areas: formData.coverage_areas,
        glass_supplier: formData.glass_supplier,
        certifications: formData.certifications || null,
        insurance_details: formData.insurance_details,
        additional_info: formData.additional_info || null,
        // Status
        status: 'draft',
        updated_at: new Date().toISOString()
      };

      if (draftApplicationId) {
        // Update existing draft
        const { data, error } = await supabase
          .from('applications')
          .update(applicationData)
          .eq('id', draftApplicationId)
          .eq('user_id', userId)
          .select('*')
          .single();

        if (error) {
          console.error('🔴 Error updating draft application:', error);
        } else {
          console.log(`🟢 Draft application updated after step ${stepCompleted}:`, data);
        }
      } else {
        // Create new draft
        const { data, error } = await supabase
          .from('applications')
          .insert({ ...applicationData, created_at: new Date().toISOString() })
          .select('*')
          .single();

        if (error) {
          console.error('🔴 Error creating draft application:', error);
        } else {
          console.log(`🟢 Draft application created after step ${stepCompleted}:`, data);
          setDraftApplicationId(data.id);
        }
      }
    } catch (error) {
      console.error('🔴 Error saving draft to Supabase:', error);
    } finally {
      setIsSavingToDB(false);
    }
  };

  // Load existing draft from Supabase
  const loadDraftFromSupabase = async () => {
    if (!user?.id) return null;

    try {
      let userId = user.id;
      let isOAuthId = !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
      
      console.log('🔵 Draft load: Checking user in app_users table. User ID:', userId, 'Is OAuth ID:', isOAuthId);
      
      // Always check if user exists in app_users table, regardless of ID format
      const { data: appUser, error: lookupError } = await supabase
        .from('app_users')
        .select('id')
        .eq(isOAuthId ? 'email' : 'id', isOAuthId ? user.email : userId)
        .single();
        
      if (lookupError || !appUser) {
        console.log('🔵 User not found in app_users during draft load, will be created on first save. Error:', lookupError);
        return null; // No draft to load, user will be created on first save
      }
      
      userId = appUser.id;
      console.log('🟢 Found existing user in app_users for draft load:', userId);

      // Look for existing draft application
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'draft')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('🔴 Error loading draft application:', error);
        return null;
      }

      if (data) {
        console.log('🟢 Found existing draft application:', data);
        setDraftApplicationId(data.id);
        
        // Convert database data back to form data
        const draftFormData: VerificationFormData = {
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || user.email || '',
          company_name: data.company_name || '',
          business_type: data.business_type || '',
          registration_number: data.registration_number || '',
          dvla_number: data.dvla_number || '',
          vat_registered: !!data.vat_number,
          vat_number: data.vat_number || '',
          years_in_business: data.years_in_business || '',
          contact_phone: data.contact_phone || '',
          business_postcode: data.business_postcode || '',
          business_address: data.business_address || '',
          vehicle_registration_number: data.vehicle_registration_number || '',
          vehicle_make: data.vehicle_make || '',
          vehicle_model: data.vehicle_model || '',
          driver_license_number: data.driver_license_number || '',
          services_offered: data.services_offered || [],
          coverage_areas: data.coverage_areas || [],
          glass_supplier: data.glass_supplier || '',
          certifications: data.certifications || '',
          insurance_details: data.insurance_details || '',
          additional_info: data.additional_info || ''
        };

        return draftFormData;
      }

      return null;
    } catch (error) {
      console.error('🔴 Error in loadDraftFromSupabase:', error);
      return null;
    }
  };

  const businessTypes = [
    'Limited Company',
    'Sole Trader',
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

  const coverageAreas = [
    'Central London',
    'North London',
    'South London',
    'East London',
    'West London',
    'Greater London',
    'Surrey',
    'Kent',
    'Essex',
    'Hertfordshire',
    'Buckinghamshire',
    'Berkshire',
    'Sussex',
    'Hampshire',
    'Oxfordshire'
  ];


  const handleServiceToggle = (service: string) => {
    updateFormData(prev => ({
      ...prev,
      services_offered: prev.services_offered.includes(service)
        ? prev.services_offered.filter(s => s !== service)
        : [...prev.services_offered, service]
    }));
  };

  const handleCoverageAreaToggle = (area: string) => {
    updateFormData(prev => ({
      ...prev,
      coverage_areas: prev.coverage_areas.includes(area)
        ? prev.coverage_areas.filter(a => a !== area)
        : [...prev.coverage_areas, area]
    }));
  };

  const handleVehicleLookup = async () => {
    if (!formData.vehicle_registration_number) {
      setVehicleLookupError('Please enter a vehicle registration number');
      return;
    }

    setIsLookingUpVehicle(true);
    setVehicleLookupError('');

    try {
      const vehicleData = await VehicleService.lookupVehicleData(formData.vehicle_registration_number);
      
      if (vehicleData.success) {
        updateFormData(prev => ({
          ...prev,
          vehicle_make: vehicleData.make,
          vehicle_model: vehicleData.model,
        }));
        
        toast({
          title: "Vehicle Found!",
          description: `Found ${vehicleData.make} ${vehicleData.model}`,
          variant: "default",
        });
      } else {
        setVehicleLookupError(vehicleData.error || 'Vehicle not found');
        toast({
          title: "Vehicle Not Found",
          description: vehicleData.error || 'Please enter vehicle details manually',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error looking up vehicle:', error);
      setVehicleLookupError('Failed to lookup vehicle data');
      toast({
        title: "Lookup Failed",
        description: "Please enter vehicle details manually",
        variant: "destructive",
      });
    } finally {
      setIsLookingUpVehicle(false);
    }
  };

  const autoLookupPostcode = async (postcode: string) => {
    // Validate postcode format before making API call
    if (!PostcodeService.isValidPostcode(postcode)) {
      return; // Don't lookup invalid postcodes
    }

    setIsLookingUpPostcode(true);
    setPostcodeLookupError('');
    setFoundAddresses([]);

    try {
      const postcodeData = await PostcodeService.lookupAddresses(postcode);
      
      if (postcodeData.success) {
        setFoundAddresses(postcodeData.addresses);
        setSelectedAddressIndex(''); // Reset selection
        
        // Update the postcode format
        updateFormData(prev => ({ 
          ...prev, 
          business_postcode: postcodeData.postcode
        }));
        
        // Don't auto-select - let user choose from dropdown even for single addresses
      } else {
        setPostcodeLookupError(postcodeData.error || 'Postcode not found');
      }
    } catch (error) {
      console.error('Error auto-looking up postcode:', error);
      setPostcodeLookupError('Failed to lookup postcode');
    } finally {
      setIsLookingUpPostcode(false);
    }
  };

  const handlePostcodeChange = (newPostcode: string) => {
    const upperPostcode = newPostcode.toUpperCase();
    updateFormData(prev => ({ ...prev, business_postcode: upperPostcode }));
    setPostcodeLookupError(''); // Clear error when typing
    setFoundAddresses([]); // Clear found addresses when typing
    setSelectedAddressIndex(''); // Clear selection when typing

    // Clear existing timer
    if (postcodeDebounceTimer) {
      clearTimeout(postcodeDebounceTimer);
    }

    // Set new timer for auto-lookup after user stops typing
    const timer = setTimeout(() => {
      if (upperPostcode.length >= 5) { // Minimum UK postcode length
        autoLookupPostcode(upperPostcode);
      }
    }, 800); // Wait 800ms after user stops typing

    setPostcodeDebounceTimer(timer);
  };

  const handleAddressSelection = (selectedAddress: any) => {
    updateFormData(prev => ({ 
      ...prev, 
      business_address: selectedAddress.fullAddress
    }));
    
    // Clear the found addresses to hide the dropdown
    setFoundAddresses([]);
    setSelectedAddressIndex('');
    
    toast({
      title: "Address Selected",
      description: "Address has been populated in the form",
      variant: "default",
    });
  };

  const nextStep = async () => {
    if (currentStep < steps.length) {
      // Save current step progress to Supabase before moving to next step
      await saveDraftToSupabase(currentStep);
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
        const basicInfoValid = formData.company_name && formData.business_type && formData.email;
        
        // Only validate VAT for Limited Company
        const vatValid = formData.business_type !== 'Limited Company' || 
                        !formData.vat_registered || 
                        (formData.vat_registered && formData.vat_number);
        
        return basicInfoValid && vatValid;
      case 2:
        const nameValid = formData.first_name && formData.last_name;
        return nameValid && formData.contact_phone && formData.business_postcode && formData.business_address && 
               formData.vehicle_registration_number && formData.vehicle_make && formData.vehicle_model && 
               formData.driver_license_number;
      case 3:
        return formData.years_in_business && formData.coverage_areas.length > 0 && formData.glass_supplier;
      case 4:
        // Allow progression even if insurance_details is empty (user can say "No" to insurance)
        return formData.services_offered.length > 0;
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

      // Check if user already has a pending application (but allow draft conversion)
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

      // Ensure we have a valid UUID for user_id and that user exists in app_users
      let userId = user.id;
      let isOAuthId = !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
      
      console.log('🔵 Checking user in app_users table. User ID:', userId, 'Is OAuth ID:', isOAuthId);
      
      // Always check if user exists in app_users table, regardless of ID format
      const { data: appUser, error: lookupError } = await supabase
        .from('app_users')
        .select('id')
        .eq(isOAuthId ? 'email' : 'id', isOAuthId ? user.email : userId)
        .single();
        
      if (lookupError || !appUser) {
        console.log('🔵 User not found in app_users table, creating new user. Error:', lookupError);
        
        // Create the user in app_users table using auth.uid() as primary key
        const newUserData = {
          id: userId, // Use the auth.uid() as the primary key for RLS compatibility
          email: user.email,
          name: user.name || user.email,
          user_role: 'pending',
          verification_status: 'non-verified',
          auth_provider: isOAuthId ? 'google' : 'email',
          oauth_user_id: isOAuthId ? userId : null,
          created_at: new Date().toISOString()
        };
        
        console.log('🔵 Attempting to create user in app_users with data:', newUserData);
        
        try {
          const { data: insertedUser, error: insertError } = await supabase
            .from('app_users')
            .insert(newUserData)
            .select('id')
            .single();
          
          console.log('🔵 Insert result:', { data: insertedUser, error: insertError });
          
          if (insertError) {
            console.error('🔴 Error creating user in app_users:', insertError);
            throw new Error(`Could not create user record: ${insertError.message}`);
          }
          
          if (!insertedUser || !insertedUser.id) {
            console.error('🔴 No user data returned from insert');
            throw new Error('User creation succeeded but no ID returned');
          }
          
          userId = insertedUser.id;
          console.log('🟢 Created new user in app_users table with ID:', userId);
          
          // Verify the user was actually created
          const { data: verifyUser, error: verifyError } = await supabase
            .from('app_users')
            .select('id, email')
            .eq('id', userId)
            .single();
            
          if (verifyError || !verifyUser) {
            console.error('🔴 User creation verification failed:', verifyError);
            throw new Error('User creation could not be verified');
          }
          
          console.log('🟢 User creation verified:', verifyUser);
          
        } catch (createError) {
          console.error('🔴 Exception creating user:', createError);
          throw new Error(`Could not create user record: ${createError.message}`);
        }
      } else {
        userId = appUser.id;
        console.log('🟢 Found existing user in app_users table:', userId);
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
        contact_name: `${formData.first_name} ${formData.last_name}`.trim(),
        contact_phone: formData.contact_phone,
        business_postcode: formData.business_postcode,
        business_address: formData.business_address,
        // Vehicle Information
        vehicle_registration_number: formData.vehicle_registration_number || null,
        vehicle_make: formData.vehicle_make || null,
        vehicle_model: formData.vehicle_model || null,
        driver_license_number: formData.driver_license_number || null,
        // Services & Certifications
        services_offered: formData.services_offered,
        coverage_areas: formData.coverage_areas,
        glass_supplier: formData.glass_supplier,
        certifications: formData.certifications || null,
        insurance_details: formData.insurance_details,
        additional_info: formData.additional_info || null,
        // Status
        status: 'pending',
        submitted_at: new Date().toISOString()
      };

      console.log('🔵 Application data to submit:', applicationData);

      let applicationResult;
      let applicationError;

      if (draftApplicationId) {
        // Update existing draft to completed application
        const result = await supabase
          .from('applications')
          .update({
            ...applicationData,
            status: 'pending',
            submitted_at: new Date().toISOString()
          })
          .eq('id', draftApplicationId)
          .eq('user_id', userId)
          .select('*')
          .single();
        
        applicationResult = result.data;
        applicationError = result.error;
        
        if (!applicationError) {
          console.log('🟢 Draft application converted to pending:', applicationResult);
        }
      } else {
        // Insert new application record
        const result = await supabase
          .from('applications')
          .insert(applicationData)
          .select('*')
          .single();
        
        applicationResult = result.data;
        applicationError = result.error;
      }

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

      // Send application confirmation email
      try {
        const applicantName = `${formData.first_name} ${formData.last_name}`.trim();
        const emailResult = await EmailService.sendApplicationConfirmation(
          formData.email,
          applicantName,
          {
            companyName: formData.company_name,
            businessType: formData.business_type,
            submittedAt: new Date().toLocaleString('en-GB'),
            applicationId: applicationResult.id
          }
        );

        if (emailResult.success) {
          console.log('🟢 Application confirmation email sent successfully');
        } else {
          console.warn('⚠️ Failed to send confirmation email:', emailResult.error);
        }
      } catch (emailError) {
        console.warn('⚠️ Email sending failed but application was successful:', emailError);
      }

      // Clear saved form data since application was successfully submitted
      clearFormData();

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-2 sm:px-4">
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-2 sm:px-4">
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
                Your technician application has been submitted successfully. A confirmation email has been sent to {formData.email}.
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

            {/* Email Confirmation Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <h3 className="text-blue-800 font-semibold text-lg mb-2">Check Your Email</h3>
              <p className="text-blue-700 text-sm mb-3">
                We've sent a confirmation email to <strong>{formData.email}</strong> with your application details.
              </p>
              <p className="text-blue-600 text-xs">
                If you don't see the email in your inbox, please check your spam folder.
              </p>
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-2 sm:px-4">
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
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-2 sm:px-4">
      <div className="w-full max-w-4xl mx-auto">
        {/* Standalone Header */}
        <div className="relative text-center mb-4 sm:mb-8">
          {/* Logout Button - Top Right */}
          <div className="absolute top-0 right-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-900 border-gray-300 hover:border-gray-400 text-xs sm:text-sm px-2 sm:px-3"
            >
              <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
          
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            <img 
              src="/windscreen-compare-technician.png" 
              alt="WindscreenCompare" 
              className="h-8 sm:h-12 w-auto"
            />
          </div>
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 px-4">Technician Verification</h1>
          <p className="text-sm sm:text-base text-gray-600 px-4">Complete your application to start receiving jobs</p>
        </div>
        
        <Card className="border-0 shadow-xl bg-white">
        {/* Header with progress */}
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-lg sm:text-2xl font-bold truncate">Technician Application</CardTitle>
                <CardDescription className="text-blue-100 text-xs sm:text-sm hidden sm:block">
                  Apply to join our network of verified technicians
                </CardDescription>
              </div>
            </div>
            <div className="text-center sm:text-right">
              <div className="text-white/80 text-sm font-medium">Step {currentStep} of {steps.length}</div>
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
          <div className="flex justify-between mt-4 sm:mt-6 px-2 sm:px-0">
            {steps.map((step, index) => {
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              const StepIconComponent = step.icon;
              
              return (
                <div key={step.id} className="flex flex-col items-center flex-1 max-w-[80px] sm:max-w-none">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-green-500 text-white' 
                      : isActive 
                        ? 'bg-white text-blue-600' 
                        : 'bg-white/20 text-white/60'
                  }`}>
                    {isCompleted ? (
                      <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <StepIconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </div>
                  <span className={`text-[10px] sm:text-xs mt-1 sm:mt-2 transition-all duration-300 text-center leading-tight ${
                    isActive ? 'text-white font-medium' : 'text-white/60'
                  }`}>
                    <span className="hidden sm:inline">{step.title}</span>
                    <span className="sm:hidden">{step.title.split(' ')[0]}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </CardHeader>
        
        <CardContent className="p-4 sm:p-8">
          {/* Form auto-save notification */}
         

          {/* Current step content */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <StepIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800">{currentStepData.title}</h3>
                <p className="text-sm sm:text-base text-gray-600">{currentStepData.description}</p>
              </div>
            </div>

            {/* Step 1: Company Details */}
            {currentStep === 1 && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <Label htmlFor="email" className="text-sm sm:text-base font-medium block mb-2">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="h-11 sm:h-12 text-base"
                    placeholder="Enter your email address"
                  />
                </div>
                
                <div>
                  <Label htmlFor="company_name" className="text-sm sm:text-base font-medium block mb-2">Company Name *</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => updateFormData(prev => ({ ...prev, company_name: e.target.value }))}
                    className="h-11 sm:h-12 text-base"
                    placeholder="Enter your company name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="business_type" className="text-sm sm:text-base font-medium block mb-2">Business Type *</Label>
                  <Select 
                    value={formData.business_type} 
                    onValueChange={(value) => updateFormData(prev => ({ 
                      ...prev, 
                      business_type: value,
                      // Clear company-specific fields when switching to Sole Trader
                      registration_number: value === 'Sole Trader' ? '' : prev.registration_number,
                      dvla_number: value === 'Sole Trader' ? '' : prev.dvla_number,
                      vat_registered: value === 'Sole Trader' ? false : prev.vat_registered,
                      vat_number: value === 'Sole Trader' ? '' : prev.vat_number
                    }))}
                  >
                    <SelectTrigger className="h-11 sm:h-12 text-base">
                      <SelectValue placeholder="Select your business type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg">
                      {businessTypes.map(type => (
                        <SelectItem key={type} value={type} className="hover:bg-gray-50">{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Company Registration Fields - Only for Limited Company */}
                {formData.business_type === 'Limited Company' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <Label htmlFor="registration_number" className="text-sm sm:text-base font-medium block mb-2">Company Registration Number</Label>
                      <Input
                        id="registration_number"
                        value={formData.registration_number}
                        onChange={(e) => updateFormData(prev => ({ ...prev, registration_number: e.target.value }))}
                        className="h-11 sm:h-12 text-base"
                        placeholder="e.g. 12345678"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="dvla_number" className="text-sm sm:text-base font-medium block mb-2">DVLA Number</Label>
                      <Input
                        id="dvla_number"
                        value={formData.dvla_number}
                        onChange={(e) => updateFormData(prev => ({ ...prev, dvla_number: e.target.value }))}
                        className="h-11 sm:h-12 text-base"
                        placeholder="e.g. DVLA123456"
                      />
                    </div>
                  </div>
                )}
                
                {/* VAT Registration - Only for Limited Company */}
                {formData.business_type === 'Limited Company' && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="vat_registered"
                        checked={formData.vat_registered}
                        onChange={(e) => updateFormData(prev => ({ 
                          ...prev, 
                          vat_registered: e.target.checked,
                          // Clear VAT number if unchecking
                          vat_number: e.target.checked ? prev.vat_number : ''
                        }))}
                        className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <Label htmlFor="vat_registered" className="text-sm sm:text-base font-medium cursor-pointer">
                        My business is VAT registered
                      </Label>
                    </div>
                    
                    {formData.vat_registered && (
                      <div className="ml-6 sm:ml-8 transition-all duration-300 ease-in-out">
                        <Label htmlFor="vat_number" className="text-sm sm:text-base font-medium block mb-2">VAT Number *</Label>
                        <Input
                          id="vat_number"
                          value={formData.vat_number}
                          onChange={(e) => updateFormData(prev => ({ ...prev, vat_number: e.target.value }))}
                          className="h-11 sm:h-12 text-base"
                          placeholder="e.g. GB123456789"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Contact Information */}
            {currentStep === 2 && (
              <div className="space-y-4 sm:space-y-6">
                {/* Personal Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <Label htmlFor="first_name" className="text-sm sm:text-base font-medium block mb-2">First Name *</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => updateFormData(prev => ({ ...prev, first_name: e.target.value }))}
                      className="h-11 sm:h-12 text-base"
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name" className="text-sm sm:text-base font-medium block mb-2">Last Name *</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => updateFormData(prev => ({ ...prev, last_name: e.target.value }))}
                      className="h-11 sm:h-12 text-base"
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="contact_phone" className="text-sm sm:text-base font-medium block mb-2">Contact Phone *</Label>
                  <Input
                    id="contact_phone"
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => updateFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                    className="h-11 sm:h-12 text-base"
                    placeholder="e.g. +44 7123 456789"
                  />
                </div>
                
                {/* Business Address Section */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-800">Business Address</h4>
                  
                  {/* Postcode Input with Auto-Lookup */}
                  <div>
                    <Label htmlFor="business_postcode" className="text-sm sm:text-base font-medium block mb-2">
                      Postcode *
                      {isLookingUpPostcode && <Loader2 className="w-4 h-4 animate-spin inline ml-2" />}
                    </Label>
                    <Input
                      id="business_postcode"
                      value={formData.business_postcode}
                      onChange={(e) => handlePostcodeChange(e.target.value)}
                      className="h-11 sm:h-12 text-base"
                      placeholder="e.g. SW1A 1AA - addresses will appear as you type"
                      maxLength={8}
                    />
                    {postcodeLookupError && (
                      <p className="text-sm text-red-600 mt-1">{postcodeLookupError}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      {foundAddresses.length > 0 
                        ? `${foundAddresses.length} address${foundAddresses.length > 1 ? 'es' : ''} found - select one below`
                        : 'Start typing your postcode to see available addresses'
                      }
                    </p>
                  </div>
                  
                  {/* Address Field with Integrated Dropdown */}
                  <div className="relative">
                    <Label htmlFor="business_address" className="text-sm sm:text-base font-medium block mb-2">Full Address *</Label>
                    <Textarea
                      id="business_address"
                      value={formData.business_address}
                      onChange={(e) => updateFormData(prev => ({ ...prev, business_address: e.target.value }))}
                      className="min-h-[60px] max-h-[80px] text-base"
                      placeholder={foundAddresses.length > 0 ? "Select an address from the dropdown below" : "Enter your full business address or use postcode lookup above"}
                      readOnly={foundAddresses.length > 0}
                    />
                    
                    {/* Address Dropdown - appears directly under the textarea */}
                    {foundAddresses.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        <div className="p-2 bg-gray-50 border-b border-gray-200">
                          <p className="text-xs text-gray-600 font-medium">
                            {foundAddresses.length} address{foundAddresses.length > 1 ? 'es' : ''} found - click to select
                          </p>
                        </div>
                        {foundAddresses.map((address, index) => (
                          <div
                            key={index}
                            onClick={() => handleAddressSelection(address)}
                            className="p-3 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors hover:bg-blue-50 hover:border-l-4 hover:border-l-blue-500"
                          >
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">{address.line1}</div>
                              <div className="text-gray-600 text-xs mt-1">{address.fullAddress}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Vehicle Information Section */}
                <div className="border-t pt-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Vehicle Information</h4>
                  <div className="space-y-4">
                    {/* VRN Input with Lookup Button */}
                    <div>
                      <Label htmlFor="vehicle_registration_number" className="text-sm sm:text-base font-medium block mb-2">Vehicle Registration Number (VRN) *</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="vehicle_registration_number"
                          value={formData.vehicle_registration_number}
                          onChange={(e) => {
                            updateFormData(prev => ({ ...prev, vehicle_registration_number: e.target.value.toUpperCase() }));
                            setVehicleLookupError(''); // Clear error when typing
                          }}
                          className="h-12 flex-1"
                          placeholder="e.g. AB12 CDE"
                          maxLength={8}
                        />
                        <Button
                          type="button"
                          onClick={handleVehicleLookup}
                          disabled={!formData.vehicle_registration_number || isLookingUpVehicle}
                          className="h-12 px-4 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {isLookingUpVehicle ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Search className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      {vehicleLookupError && (
                        <p className="text-sm text-red-600 mt-1">{vehicleLookupError}</p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">Enter your VRN and click the search button to auto-fill vehicle details</p>
                    </div>
                    
                    {/* Vehicle Make and Model */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <Label htmlFor="vehicle_make" className="text-sm sm:text-base font-medium block mb-2">Vehicle Make *</Label>
                        <Input
                          id="vehicle_make"
                          value={formData.vehicle_make}
                          onChange={(e) => updateFormData(prev => ({ ...prev, vehicle_make: e.target.value }))}
                          className="h-11 sm:h-12 text-base"
                          placeholder="e.g. Ford, BMW, Toyota"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="vehicle_model" className="text-sm sm:text-base font-medium block mb-2">Vehicle Model *</Label>
                        <Input
                          id="vehicle_model"
                          value={formData.vehicle_model}
                          onChange={(e) => updateFormData(prev => ({ ...prev, vehicle_model: e.target.value }))}
                          className="h-11 sm:h-12 text-base"
                          placeholder="e.g. Focus, 3 Series, Corolla"
                        />
                      </div>
                    </div>
                    
                    {/* Driver License Number */}
                    <div>
                      <Label htmlFor="driver_license_number" className="text-sm sm:text-base font-medium block mb-2">Driver License Number *</Label>
                      <Input
                        id="driver_license_number"
                        value={formData.driver_license_number}
                        onChange={(e) => updateFormData(prev => ({ ...prev, driver_license_number: e.target.value.toUpperCase() }))}
                        className="h-11 sm:h-12 text-base"
                        placeholder="e.g. SMITH123456AB9CD"
                        maxLength={16}
                      />
                      <p className="text-sm text-gray-500 mt-1">Enter your UK driving license number (16 characters)</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Business Experience */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="years_in_business" className="text-sm sm:text-base font-medium block mb-2">Years in Business *</Label>
                  <Select 
                    value={formData.years_in_business} 
                    onValueChange={(value) => updateFormData(prev => ({ ...prev, years_in_business: value }))}
                  >
                    <SelectTrigger className="h-11 sm:h-12 text-base">
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
                
                {/* Areas of Coverage */}
                <div>
                  <Label className="text-sm sm:text-base font-medium block mb-2">Areas of Coverage *</Label>
                  <p className="text-sm text-gray-500 mb-4">Select all areas where you can provide services</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {coverageAreas.map(area => (
                      <label key={area} className="flex items-center space-x-3 p-3 sm:p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors min-h-[48px] touch-manipulation">
                        <input
                          type="checkbox"
                          checked={formData.coverage_areas.includes(area)}
                          onChange={() => handleCoverageAreaToggle(area)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">{area}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Selected: {formData.coverage_areas.length} area{formData.coverage_areas.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Glass Supplier */}
                <div>
                  <Label htmlFor="glass_supplier" className="text-sm sm:text-base font-medium block mb-2">Where do you purchase glass from? *</Label>
                  <Input
                    id="glass_supplier"
                    value={formData.glass_supplier}
                    onChange={(e) => updateFormData(prev => ({ ...prev, glass_supplier: e.target.value }))}
                    className="h-11 sm:h-12 text-base"
                    placeholder="e.g. Pilkington, Guardian Glass, Independent Supplier, etc."
                  />
                  <p className="text-sm text-gray-500 mt-1">Enter the name of your primary glass supplier or suppliers</p>
                </div>
                
                <div>
                  <Label className="text-sm sm:text-base font-medium block mb-2">Certifications & Qualifications</Label>
                  <Textarea
                    value={formData.certifications}
                    onChange={(e) => updateFormData(prev => ({ ...prev, certifications: e.target.value }))}
                    className="min-h-[100px] sm:min-h-[120px] text-base"
                    placeholder="List any relevant certifications, licenses, or qualifications (e.g. FENSA, GQA, industry training)"
                  />
                </div>
              </div>
            )}

            {/* Step 4: Services & Insurance */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <Label className="text-sm sm:text-base font-medium block mb-2">Services Offered *</Label>
                  <p className="text-sm text-gray-500 mb-4">Select all services that you provide</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {serviceOptions.map(service => (
                      <label key={service} className="flex items-center space-x-3 p-3 sm:p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors min-h-[48px] touch-manipulation">
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
                  <Label htmlFor="insurance_details" className="text-sm sm:text-base font-medium block mb-2">Insurance Details</Label>
                  <Textarea
                    id="insurance_details"
                    value={formData.insurance_details}
                    onChange={(e) => updateFormData(prev => ({ ...prev, insurance_details: e.target.value }))}
                    className="min-h-[80px] sm:min-h-[100px] text-base"
                    placeholder="Provide details about your business insurance coverage (Public Liability, Professional Indemnity, etc.) or type 'No insurance' if you don't have coverage"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    If you don't have insurance, you can type "No insurance" or "Not applicable" and still proceed with your application.
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="additional_info" className="text-sm sm:text-base font-medium block mb-2">Additional Information</Label>
                  <Textarea
                    id="additional_info"
                    value={formData.additional_info}
                    onChange={(e) => updateFormData(prev => ({ ...prev, additional_info: e.target.value }))}
                    className="min-h-[80px] sm:min-h-[100px] text-base"
                    placeholder="Any additional information that would help us verify your business"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-center sm:items-center pt-4 sm:pt-6 border-t space-y-2 sm:space-y-0">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center justify-center space-x-1 sm:space-x-2 h-10 sm:h-10 text-sm sm:text-sm px-4 sm:px-6 order-2 sm:order-1 rounded-md font-medium"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Back</span>
            </Button>
            
            <div className="flex justify-center sm:justify-start space-x-2 sm:space-x-3 order-1 sm:order-2">
              {currentStep < steps.length ? (
                <Button
                  onClick={nextStep}
                  disabled={!isStepValid()}
                  className="flex items-center justify-center space-x-1 sm:space-x-2 bg-yellow-500 hover:bg-yellow-600 h-10 sm:h-10 text-sm sm:text-sm px-4 sm:px-6 rounded-md font-medium"
                >
                  <span>Next</span>
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!isStepValid() || isSubmitting}
                  className="flex items-center justify-center space-x-1 sm:space-x-2 bg-yellow-500 hover:bg-yellow-600 h-10 sm:h-10 text-sm sm:text-sm px-4 sm:px-6 rounded-md font-medium"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span className="hidden sm:inline">Submitting...</span>
                      <span className="sm:hidden">Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Submit Application</span>
                      <span className="sm:hidden">Submit</span>
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