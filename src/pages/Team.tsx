import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Search, Mail, Phone } from "lucide-react";

const Team = () => {
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Enhanced Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 rounded-b-2xl">
          <div className="px-6 py-8">
            <div className="flex flex-col gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold text-gray-900">Team Members</h1>
                </div>
                <p className="text-gray-600 text-lg">
                  Manage and communicate with your team
                </p>
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <Input
                  placeholder="Search team members..."
                  className="w-full md:w-64 border-[#135084] focus:ring-[#135084]"
                />
                <Button variant="secondary" size="icon" className="bg-[#135084] hover:bg-[#135084]/90">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-6">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[1, 2, 3, 4, 5, 6].map((member) => (
            <Card key={member} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <Users className="h-6 w-6 text-[#3d99be] mr-2" />
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
                  <Button className="w-full bg-[#3d99be] hover:bg-[#3d99be]/90">
                    Send Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
};

export default Team;
