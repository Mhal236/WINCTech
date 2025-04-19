import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClipboardList, Search, Download } from "lucide-react";

const Quotes = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-semibold text-[#3d99be]">Quotes</h1>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Input
              placeholder="Search quotes..."
              className="w-full md:w-64 border-[#3d99be] focus:ring-[#3d99be]"
            />
            <Button variant="secondary" size="icon" className="bg-[#3d99be] hover:bg-[#2d7994]">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

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
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-[#3d99be] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <ClipboardList className="h-8 w-8 text-[#3d99be]" />
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
    </DashboardLayout>
  );
};

export default Quotes;