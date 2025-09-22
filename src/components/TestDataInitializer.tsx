import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { initializeTestData } from '@/utils/seedTestData';
import { Database, Loader2, CheckCircle } from 'lucide-react';

export function TestDataInitializer() {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { user } = useAuth();

  const handleInitializeTestData = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not found. Please try logging in again.",
        variant: "destructive",
      });
      return;
    }

    setIsInitializing(true);
    try {
      const result = await initializeTestData(user.id);
      
      if (result.success) {
        toast({
          title: "Test Data Initialized! 🎉",
          description: "Jobs and calendar events have been created. You can now explore the app!",
        });
        setIsInitialized(true);
      } else {
        toast({
          title: "Initialization Failed",
          description: result.summary,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error initializing test data:', error);
      toast({
        title: "Initialization Error",
        description: "An unexpected error occurred while setting up test data.",
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  // Only show for tech@windscreencompare.com
  if (user?.email !== 'tech@windscreencompare.com') {
    return null;
  }

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Database className="w-5 h-5" />
          Test Data Setup
        </CardTitle>
        <CardDescription className="text-blue-700">
          Initialize test data to explore the Jobs and Calendar features with sample data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isInitialized ? (
          <Button 
            onClick={handleInitializeTestData}
            disabled={isInitializing}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isInitializing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Setting up test data...
              </>
            ) : (
              <>
                <Database className="w-4 h-4 mr-2" />
                Initialize Test Data
              </>
            )}
          </Button>
        ) : (
          <div className="flex items-center justify-center gap-2 text-green-700 font-medium">
            <CheckCircle className="w-5 h-5" />
            Test data initialized! Check Jobs and Calendar tabs.
          </div>
        )}
        
        {!isInitialized && (
          <div className="mt-3 text-xs text-blue-600 space-y-1">
            <p>This will create:</p>
            <ul className="list-disc list-inside ml-2 space-y-0.5">
              <li>Technician profile</li>
              <li>5 sample jobs (3 regular + 2 exclusive)</li>
              <li>2 calendar appointments</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
