import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Search, Star } from "lucide-react";
import { Link } from "react-router-dom";

const Technicians = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-semibold text-[#3d99be]">Technicians</h1>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Input
              placeholder="Search technicians..."
              className="w-full md:w-64 border-[#3d99be] focus:ring-[#3d99be]"
            />
            <Button variant="secondary" size="icon" className="bg-[#3d99be] hover:bg-[#2d7994]">
              <Search className="h-4 w-4" />
            </Button>
            <Link to="/landing-page">
              <Button variant="outline" className="ml-2">View Landing Page</Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[1, 2, 3, 4, 5, 6].map((tech) => (
            <Card key={tech} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <Users className="h-6 w-6 text-[#3d99be] mr-2" />
                <CardTitle className="text-lg font-semibold">John Doe {tech}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${star <= 4 ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">Specializes in Windscreen replacement</p>
                  <p className="text-sm text-gray-500">5+ years experience</p>
                  <Button className="w-full bg-[#F97316] hover:bg-[#EA580C]">
                    Schedule Service
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

export default Technicians;