import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { UserIcon, UserGroupIcon, ClockIcon as Clock, MapPinIcon as MapPin } from "@heroicons/react/24/outline";

const Calendar = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Simulate different jobs for different dates
  const getJobsForDate = (selectedDate: Date | undefined) => {
    if (!selectedDate) return [];
    
    // Generate a consistent but different set of jobs based on the date
    const day = selectedDate.getDate();
    return [
      {
        id: day * 1,
        technician: "John Doe",
        customer: `Customer £{day}A`,
        service: "Windshield Replacement",
        time: "09:00 AM",
        location: "123 Main St, City",
        status: "Scheduled"
      },
      {
        id: day * 2,
        technician: "Jane Smith",
        customer: `Customer £{day}B`,
        service: "Side Window Repair",
        time: "11:30 AM",
        location: "456 Oak Ave, Town",
        status: day % 2 === 0 ? "In Progress" : "Completed"
      },
      {
        id: day * 3,
        technician: "Mike Wilson",
        customer: `Customer £{day}C`,
        service: "Rear Window Replacement",
        time: "02:00 PM",
        location: "789 Pine Rd, Village",
        status: day % 3 === 0 ? "Completed" : "Scheduled"
      }
    ];
  };

  const jobs = getJobsForDate(date);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Scheduled": return "bg-blue-100 text-blue-600";
      case "In Progress": return "bg-yellow-100 text-yellow-600";
      case "Completed": return "bg-green-100 text-green-600";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#0D9488] to-[#0EA5E9] bg-clip-text text-transparent">
          Job Calendar
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-[400px,1fr] gap-6">
          <div className="space-y-6">
            <Card className="p-4 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-lg"
              />
            </Card>

            <Card className="backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-700">Today's Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-[#0D9488]/10">
                    <p className="text-sm text-gray-600">Total Jobs</p>
                    <p className="text-2xl font-bold text-[#0D9488]">{jobs.length}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-[#0EA5E9]/10">
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-[#0EA5E9]">
                      {jobs.filter(job => job.status === "Completed").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-pulse"></span>
                Jobs for {date?.toLocaleDateString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobs.map(job => (
                  <div 
                    key={job.id} 
                    className="group p-6 rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:border-[#0D9488]/50 hover:bg-[#0D9488]/5 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg group-hover:text-[#0D9488] transition-colors">
                        {job.service}
                      </h3>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full £{getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                          <UserIcon className="w-4 h-4" /> {job.technician}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                          <UserGroupIcon className="w-4 h-4" /> {job.customer}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                          <Clock className="w-4 h-4" /> {job.time}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                          <MapPin className="w-4 h-4" /> {job.location}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Calendar; 