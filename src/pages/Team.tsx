import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Search, Mail, Phone } from "lucide-react";

const Team = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-semibold text-[#135084]">Team Members</h1>
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
    </DashboardLayout>
  );
};

export default Team;
