import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, LineChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ArrowUp, ArrowDown, TrendingUp, DollarSign, Users, Clock, PoundSterlingIcon } from 'lucide-react';
import { PageTransition } from "@/components/PageTransition";

const Reporting = () => {
  const mockData = [
    { month: 'Jan', jobs: 65, revenue: 12000, satisfaction: 4.5 },
    { month: 'Feb', jobs: 75, revenue: 15000, satisfaction: 4.6 },
    { month: 'Mar', jobs: 85, revenue: 18000, satisfaction: 4.7 },
    { month: 'Apr', jobs: 95, revenue: 21000, satisfaction: 4.8 },
    { month: 'May', jobs: 105, revenue: 24000, satisfaction: 4.9 },
  ];

  const kpiCards = [
    {
      title: "Total Revenue",
      value: "£24,000",
      change: "+12.5%",
      trend: "up",
      icon: PoundSterlingIcon,
    },
    {
      title: "Jobs Completed",
      value: "105",
      change: "+8.3%",
      trend: "up",
      icon: Clock,
    },
    {
      title: "Customer Satisfaction",
      value: "4.9/5",
      change: "+0.2",
      trend: "up",
      icon: Users,
    },
    {
      title: "Growth Rate",
      value: "15.8%",
      change: "+2.1%",
      trend: "up",
      icon: TrendingUp,
    },
  ];

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
                      Reports & Analytics<span className="text-[#0FB8C1] font-normal">.</span>
                    </h1>
                  </div>
                  <p className="text-gray-600 text-base font-light ml-5 tracking-wide">
                    Track your performance and business metrics
                  </p>
                </div>
                <div className="text-sm text-gray-500 font-light">
                  Last updated: {new Date().toLocaleDateString('en-GB')}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-8 space-y-8 relative z-10 max-w-7xl mx-auto">

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiCards.map((card, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{card.title}</p>
                    <h3 className="text-2xl font-bold mt-2">{card.value}</h3>
                  </div>
                  <div className={`p-2 rounded-lg £{
                    card.trend === 'up' ? 'bg-blue-100' : 'bg-red-100'
                  }`}>
                    <card.icon className={`w-5 h-5 £{
                      card.trend === 'up' ? 'text-blue-600' : 'text-red-600'
                    }`} />
                  </div>
                </div>
                <div className="flex items-center mt-4">
                  {card.trend === 'up' ? (
                    <ArrowUp className="w-4 h-4 text-blue-600" />
                  ) : (
                    <ArrowDown className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`text-sm ml-1 £{
                    card.trend === 'up' ? 'text-blue-600' : 'text-red-600'
                  }`}>
                    {card.change} vs last month
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>Monthly revenue analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={mockData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#145484" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#145484" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#888888" />
                  <YAxis stroke="#888888" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#145484" 
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Jobs Completed</CardTitle>
              <CardDescription>Monthly job completion rate</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mockData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#888888" />
                  <YAxis stroke="#888888" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px'
                    }}
                  />
                  <Bar 
                    dataKey="jobs" 
                    fill="#145484"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Customer Satisfaction</CardTitle>
              <CardDescription>Monthly satisfaction ratings</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mockData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#888888" />
                  <YAxis stroke="#888888" domain={[4, 5]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="satisfaction" 
                    stroke="#145484"
                    strokeWidth={2}
                    dot={{ fill: '#145484', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Services</CardTitle>
              <CardDescription>Most requested services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Windscreen Replacement', value: '45%' },
                  { name: 'Side Window Repair', value: '25%' },
                  { name: 'Rear Window Service', value: '20%' },
                  { name: 'Chip Repair', value: '10%' },
                ].map((service, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{service.name}</span>
                    <span className="text-sm text-[#145484] font-semibold">{service.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </PageTransition>
    </DashboardLayout>
  );
};

export default Reporting; 