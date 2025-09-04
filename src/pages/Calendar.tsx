import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { UserIcon, CalendarIcon, ClockIcon as Clock, MapPinIcon as MapPin } from "@heroicons/react/24/outline";

const Calendar = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  // The same jobs array as in Jobs.tsx with fake UK VRNs, addresses, damage details, etc.
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Scheduled":
        return "bg-blue-100 text-blue-600";
      case "In Progress":
        return "bg-yellow-100 text-yellow-600";
      case "Completed":
        return "bg-blue-100 text-blue-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <DashboardLayout>
      <div className="mobile-container py-6 sm:py-8">
        <div className="mobile-flex mobile-gap">
          {/* Left Column: Calendar Component */}
          <div className="md:w-1/3">
            <CalendarComponent 
              mode="single"
              selected={date}
              onSelect={setDate}
              className="mx-auto"
            />
          </div>

          {/* Right Column: Jobs Listing */}
          <div className="md:w-2/3">
            <Card>
              <CardHeader className="mobile-card">
                <CardTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#3d99be] animate-pulse"></span>
                  Jobs for {date?.toLocaleDateString()}
                </CardTitle>
              </CardHeader>
              <CardContent className="mobile-card">
                <div className="grid gap-3 sm:gap-4">
                  {jobs.map(job => (
                    <Card key={job.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-[#135084]">
                      <CardContent className="mobile-card">
                        <div className="mobile-flex justify-between mobile-gap">
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            <div>
                              <h3 className="font-semibold text-base sm:text-lg text-[#3d99be]">{job.damage || "Service"}</h3>
                              <p className="mobile-text text-gray-500">{job.vehicle || "Vehicle Info"}</p>
                              <p className="mobile-text text-gray-500">Customer: {job.customer}</p>
                            </div>
                            <div>
                              <p className="mobile-text font-medium">Scheduled for:</p>
                              <p className="mobile-text text-gray-500">{job.date}</p>
                              <p className="mobile-text text-gray-500">{job.time}</p>
                            </div>
                            <div>
                              <p className="mobile-text font-medium">Address:</p>
                              <p className="mobile-text text-gray-500">{job.address || "N/A"}</p>
                              <p className="mobile-text font-medium mt-2">Damage:</p>
                              <p className="mobile-text text-gray-500">{job.damage || "N/A"}</p>
                              <p className="mobile-text font-medium mt-2">VRN:</p>
                              <p className="mobile-text text-gray-500">{job.vrn || "N/A"}</p>
                            </div>
                          </div>
                          <div className="mobile-flex items-end md:items-center gap-3 sm:gap-4">
                            <div className="text-right">
                              <p className="font-medium text-base sm:text-lg">{job.price}</p>
                              <span
                                className={`inline-block px-2 py-1 text-xs rounded-full ${
                                  job.status === 'In Progress'
                                    ? 'bg-[#135084]/10 text-[#135084]'
                                    : job.status === 'Completed'
                                    ? 'bg-blue-100 text-blue-600'
                                    : 'bg-blue-100 text-blue-600'
                                }`}
                              >
                                {job.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Calendar; 