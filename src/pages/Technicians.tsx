import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UsersRound, Search, PlusCircle, MapPin, Star, Phone, Calendar } from "lucide-react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Input } from "@/components/ui/input";

const technicians = [
  {
    id: 1,
    name: "Michael Johnson",
    position: "Senior Technician",
    location: "Manchester",
    rating: 4.9,
    status: "Available",
    nextAvailable: "Today",
    avatar: "/avatars/01.png",
  },
  {
    id: 2,
    name: "Sarah Williams",
    position: "Glass Specialist",
    location: "Birmingham",
    rating: 4.7,
    status: "Busy",
    nextAvailable: "Tomorrow",
    avatar: "/avatars/02.png",
  },
  {
    id: 3,
    name: "David Brown",
    position: "Windscreen Expert",
    location: "London",
    rating: 4.8,
    status: "Available",
    nextAvailable: "Today",
    avatar: "/avatars/03.png",
  },
  {
    id: 4,
    name: "Emma Taylor",
    position: "Junior Technician",
    location: "Leeds",
    rating: 4.5,
    status: "On Leave",
    nextAvailable: "Next Week",
    avatar: "/avatars/04.png",
  },
  {
    id: 5,
    name: "James Wilson",
    position: "Senior Technician",
    location: "Glasgow",
    rating: 4.9,
    status: "Available",
    nextAvailable: "Today",
    avatar: "/avatars/05.png",
  },
];

const Technicians = () => {
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Enhanced Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 rounded-b-2xl">
          <div className="px-6 py-8">
            <div className="flex flex-col gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold text-gray-900">Technicians</h1>
                </div>
                <p className="text-gray-600 text-lg">
                  Manage and view all technicians in your network
                </p>
              </div>
              <div className="flex gap-2">
                <div className="relative w-full md:w-auto">
                  <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Search technicians..."
                    className="w-full md:w-[300px] pl-8 bg-white"
                  />
                </div>
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add New
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-6">

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[#145484]">All Technicians</CardTitle>
            <CardDescription>
              A list of all technicians available for work in your area.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Next Available</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {technicians.map((tech) => (
                  <TableRow key={tech.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <img
                            src={tech.avatar}
                            alt={tech.name}
                            className="object-cover"
                          />
                        </Avatar>
                        <div>
                          <div className="font-semibold text-[#145484]">{tech.name}</div>
                          <div className="text-sm text-gray-500">{tech.position}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{tech.location}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <svg
                              key={i}
                              className={`h-4 w-4 ${
                                i < tech.rating
                                  ? "text-yellow-400"
                                  : "text-gray-200"
                              }`}
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ))}
                        </div>
                        <span className="ml-2 text-sm text-gray-500">{tech.rating}/5</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          tech.status === "Available"
                            ? "default"
                            : tech.status === "Busy"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {tech.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{tech.nextAvailable}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" className="text-[#145484] border-[#145484]">
                          Contact
                        </Button>
                        <Button size="sm" className="bg-[#FFC107] text-black hover:bg-[#FFC107]/80">
                          Schedule
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      </div>
    </DashboardLayout>
  );
};

export default Technicians;