import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Lock, Sparkles } from "lucide-react";
import { useRoleBasedAccess } from "@/components/auth/RoleBasedAccess";

const TonyAI = () => {
  const { isAdmin } = useRoleBasedAccess();

  // Show coming soon message for non-admin users
  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          {/* Coming Soon Message */}
          <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100">
            <div className="relative p-8 md:p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-200 mb-6">
                <Lock className="h-8 w-8 text-gray-500" />
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                Tony A.I
              </h1>
              
              <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                Our AI-powered windscreen assistant is currently in development and available only to administrators.
              </p>
              
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700">
                <Sparkles className="h-4 w-4" />
                Coming Soon
              </div>
              
              <p className="text-sm text-gray-500 mt-4">
                Contact your administrator for more information about early access.
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] w-full">
        <iframe
          src="https://v0-tony-ai-technician-assistant.vercel.app"
          className="w-full h-full border-0 rounded-lg"
          title="Tony A.I Assistant"
          allow="clipboard-read; clipboard-write"
        />
      </div>
    </DashboardLayout>
  );
};

export default TonyAI;


