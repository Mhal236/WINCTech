import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClipboardList, Search, Download } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";

const Quotes = () => {
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
                      Quotes<span className="text-[#0FB8C1] font-normal">.</span>
                    </h1>
                  </div>
                  <p className="text-gray-600 text-base font-light ml-5 tracking-wide">
                    View and manage customer quotes
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    placeholder="Search quotes..."
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

        <div className="grid gap-4 md:gap-6">
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-semibold">Recent Quotes</CardTitle>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((quote) => (
                  <div
                    key={quote}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-[#145484] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <ClipboardList className="h-8 w-8 text-[#145484]" />
                      <div>
                        <p className="font-medium">Quote #{quote}0234</p>
                        <p className="text-sm text-gray-500">Toyota Camry 2022</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">£549.99</p>
                      <p className="text-sm text-gray-500">Created 2 days ago</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
      </PageTransition>
    </DashboardLayout>
  );
};

export default Quotes;