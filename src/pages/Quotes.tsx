import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClipboardList, Search, Download } from "lucide-react";

const Quotes = () => {
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Enhanced Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 rounded-b-2xl">
          <div className="px-6 py-8">
            <div className="flex flex-col gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold text-gray-900">Quotes</h1>
                </div>
                <p className="text-gray-600 text-lg">
                  View and manage customer quotes
                </p>
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <Input
                  placeholder="Search quotes..."
                  className="w-full md:w-64 border-[#145484] focus:ring-[#145484]"
                />
                <Button variant="secondary" size="icon" className="bg-[#145484] hover:bg-[#0f3d5f]">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

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
    </DashboardLayout>
  );
};

export default Quotes;