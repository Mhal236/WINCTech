import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Search, Mail, Phone } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";

const Team = () => {
  return (
    <DashboardLayout>
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-[#0FB8C1]/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-700" />
        </div>

        {/* Modern Header */}
        <div className="relative backdrop-blur-xl bg-white/80 border border-gray-200/50 shadow-sm rounded-3xl m-4">
          <div className="px-6 py-10">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <div className="w-1 h-10 bg-gradient-to-b from-[#0FB8C1] via-[#0FB8C1]/70 to-transparent rounded-full" />
                    <h1 className="text-4xl font-light tracking-tight text-gray-900">
                      Team Members<span className="text-[#0FB8C1] font-normal">.</span>
                    </h1>
                  </div>
                  <p className="text-gray-600 text-base font-light ml-5 tracking-wide">
                    Manage and communicate with your team
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    placeholder="Search team members..."
                    className="w-64 border-gray-200 focus:border-[#0FB8C1]"
                  />
                  <Button variant="secondary" size="icon" className="bg-[#0FB8C1] hover:bg-[#0FB8C1]/90">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-8 space-y-8 relative z-10 max-w-7xl mx-auto">

        <div className="p-4 sm:p-6 space-y-6">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[1, 2, 3, 4, 5, 6].map((member) => (
            <Card key={member} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <Users className="h-6 w-6 text-[#145484] mr-2" />
                <CardTitle className="text-lg font-semibold">Team Member {member}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Sales Representative</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Mail className="h-4 w-4" />
                    <span>member{member}@example.com</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Phone className="h-4 w-4" />
                    <span>020 7946 0000</span>
                  </div>
                  <Button className="w-full bg-[#145484] hover:bg-[#145484]/90">
                    Send Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      </div>
      </PageTransition>
    </DashboardLayout>
  );
};

export default Team;
