import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Search, Clock, Filter, ArrowUp, Briefcase, Calendar, Users, MoreVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

const Jobs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const jobStats = [
    {
      title: "Active Jobs",
      value: "24",
      change: "+12%",
      trend: "up",
      icon: Briefcase,
    },
    {
      title: "Completed Today",
      value: "8",
      change: "+3",
      trend: "up",
      icon: Clock,
    },
    {
      title: "Scheduled",
      value: "15",
      change: "+5",
      trend: "up",
      icon: Calendar,
    },
    {
      title: "Available Technicians",
      value: "12",
      change: "2 on jobs",
      trend: "neutral",
      icon: Users,
    },
  ];

  const jobs = [
    {
      id: 1,
      customer: "Xander A",
      address: "1 Mayfair Place, London, W1J 8AJ",
      damage: "Damage: Windscreen (Sensor)",
      vrn: "HN11 EYW",
      date: "15-02-2025",
      time: "09:00 AM",
      status: "In Progress",
      price: "£299.99",
      vehicle: "BMW 1 series",
      priority: "High"
    },
    {
      id: 2,
      customer: "Bob Johnson",
      address: "Flat 12, 7 High Street, London, W1H 7AN",
      damage: "Damage: Side Window cracked",
      vrn: "AB12 CDE",
      date: "2024-03-20",
      time: "11:30 AM",
      status: "Scheduled",
      price: "£199.99",
      vehicle: "2023 Honda Civic",
      priority: "Medium"
    },
    {
      id: 3,
      customer: "Carol Williams",
      address: "Unit 3, 45 Kensington Park Road, London, SW7 1AA",
      damage: "Damage: Rear window shattered",
      vrn: "ZX98 YTR",
      date: "2024-03-20",
      time: "02:00 PM",
      status: "Completed",
      price: "£399.99",
      vehicle: "2021 Ford F-150",
      priority: "Normal"
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-[#0D9488]">Jobs Dashboard</h1>
            <p className="text-gray-500 mt-1">Manage and track all jobs</p>
          </div>
          <Button className="bg-[#0D9488] hover:bg-[#0D9488]/90">
            <Plus className="h-5 w-5 mr-2" />
            New Job
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {jobStats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                    <h3 className="text-2xl font-bold mt-2">{stat.value}</h3>
                  </div>
                  <div className={`p-2 rounded-lg ${stat.trend === "up" ? "bg-green-100" : "bg-gray-100"}`}>
                    <stat.icon className={`w-5 h-5 ${stat.trend === "up" ? "text-green-600" : "text-gray-600"}`} />
                  </div>
                </div>
                <div className="flex items-center mt-4">
                  {stat.trend === "up" && <ArrowUp className="w-4 h-4 text-green-600" />}
                  <span className={`text-sm ml-1 ${stat.trend === "up" ? "text-green-600" : "text-gray-600"}`}>
                    {stat.change}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters and Search */}
        <Card className="border-[#0D9488]/20">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 flex gap-4">
                <Input
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full md:w-64 border-[#0D9488] focus:ring-[#0D9488]"
                />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px] border-[#0D9488]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="border-[#0D9488] text-[#0D9488]">
                  <Filter className="h-4 w-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Jobs List */}
        <div className="grid gap-4">
          {jobs.map(job => (
            <Card key={job.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-[#0D9488]">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <h3 className="font-semibold text-lg text-[#0D9488]">{job.damage || "Service"}</h3>
                      <p className="text-sm text-gray-500">{job.vehicle || "Vehicle Info"}</p>
                      <p className="text-sm text-gray-500">Customer: {job.customer}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Scheduled for:</p>
                      <p className="text-sm text-gray-500">{job.date}</p>
                      <p className="text-sm text-gray-500">{job.time}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Address:</p>
                      <p className="text-sm text-gray-500">{job.address || "N/A"}</p>
                      <p className="text-sm font-medium mt-2">Damage:</p>
                      <p className="text-sm text-gray-500">{job.damage || "N/A"}</p>
                      <p className="text-sm font-medium mt-2">VRN:</p>
                      <p className="text-sm text-gray-500">{job.vrn || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row items-end md:items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium text-lg">{job.price}</p>
                    </div>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-5 w-5 text-gray-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Jobs; 