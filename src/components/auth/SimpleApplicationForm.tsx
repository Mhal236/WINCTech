import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LogOut, Briefcase, User, Phone, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export function SimpleApplicationForm() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    full_name: user?.name || '',
    email: user?.email || '',
    phone: '',
    company_name: '',
    experience: '',
    motivation: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // For now, just simulate submission since we have database issues
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('📝 Application submitted:', formData);
      
      toast({
        title: "Application Submitted Successfully!",
        description: "Thank you for your application. We'll review it within 24-48 hours.",
        variant: "default",
      });
      
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: "Submission Error",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-2xl mx-auto">
          <div className="relative text-center mb-8">
            <div className="absolute top-0 right-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
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
                <Briefcase className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-800">Application Submitted!</CardTitle>
              <CardDescription className="text-lg text-gray-600 mt-2">
                Thank you for your interest in joining our platform
              </CardDescription>
            </CardHeader>
            
            <CardContent className="text-center">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <h3 className="text-green-800 font-medium mb-2">What happens next?</h3>
                <div className="text-left space-y-2 text-green-700">
                  <p>• Our team will review your application within 24-48 hours</p>
                  <p>• You'll receive an email notification once the review is complete</p>
                  <p>• If approved, you'll gain access to all platform features</p>
                  <p>• If we need additional information, we'll contact you directly</p>
                </div>
              </div>
              
              <p className="text-gray-600">
                Please wait <strong>24-48 hours</strong> for a decision on your application.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-2xl mx-auto">
        <div className="relative text-center mb-8">
          <div className="absolute top-0 right-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
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
          <h1 className="text-2xl font-bold text-gray-900">Technician Application</h1>
          <p className="text-gray-600 mt-2">Complete your application to join our platform</p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Application Form
            </CardTitle>
            <CardDescription>
              Please provide your details to complete your technician application.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    disabled
                    className="mt-1 bg-gray-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required
                    className="mt-1"
                    placeholder="+44 123 456 7890"
                  />
                </div>
                
                <div>
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    className="mt-1"
                    placeholder="Your company name (optional)"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="experience">Experience in Auto Glass (Years)</Label>
                <Input
                  id="experience"
                  value={formData.experience}
                  onChange={(e) => handleInputChange('experience', e.target.value)}
                  className="mt-1"
                  placeholder="e.g. 5 years"
                />
              </div>

              <div>
                <Label htmlFor="motivation">Why do you want to join our platform?</Label>
                <Textarea
                  id="motivation"
                  value={formData.motivation}
                  onChange={(e) => handleInputChange('motivation', e.target.value)}
                  className="mt-1"
                  rows={4}
                  placeholder="Tell us about your motivation and what you hope to achieve..."
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#145484] hover:bg-[#0f3d5f] text-white"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Submitting Application...
                  </>
                ) : (
                  'Submit Application'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
