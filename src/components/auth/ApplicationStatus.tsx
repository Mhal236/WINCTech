import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ApplicationStatus() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      console.log('🔵 Application status logout clicked');
      await signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error logging out:', error);
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Application Status</h1>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
              <Clock className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">Application Under Review</CardTitle>
            <CardDescription className="text-lg text-gray-600 mt-2">
              Thank you for your interest in joining our platform
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            {/* User Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <div className="space-y-3">
                <div>
                  <p className="text-blue-800 font-medium">Email:</p>
                  <p className="text-blue-700">{user?.email}</p>
                </div>
                <div>
                  <p className="text-blue-800 font-medium">Name:</p>
                  <p className="text-blue-700">{user?.name}</p>
                </div>
                <div>
                  <p className="text-blue-800 font-medium">Status:</p>
                  <p className="text-blue-700 capitalize">{user?.verification_status || 'Pending Review'}</p>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">What happens next?</h3>
              <div className="text-left space-y-2 text-gray-700">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <p>Your application has been received</p>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                  <p>Our team will review your application within 24-48 hours</p>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <p>You'll receive an email notification once the review is complete</p>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <p>If approved, you'll gain access to all platform features</p>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="text-center">
              <p className="text-gray-600 mb-2">
                Have questions about your application?
              </p>
              <p className="text-gray-600 text-sm">
                Please contact our support team for assistance.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
