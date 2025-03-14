import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Car, Search } from "lucide-react";
import { checkGlassAvailability } from '@/utils/glassAvailability';

const Glass = () => {
  const checkAvailability = async (eurocodeId: string, quantity: number) => {
    const credentials = {
      login: process.env.NEXT_PUBLIC_GLASS_API_LOGIN!,
      password: process.env.NEXT_PUBLIC_GLASS_API_PASSWORD!,
      userId: parseInt(process.env.NEXT_PUBLIC_GLASS_API_USER_ID!, 10)
    };

    const result = await checkGlassAvailability(eurocodeId, quantity, 'DEFAULT_DEPOT', credentials);
    
    if (result.error) {
      console.error('Availability check failed:', result.error);
      // Handle error (show toast notification, etc.)
    } else {
      console.log('Glass availability:', result.isAvailable);
      // Handle success (update UI, etc.)
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-semibold text-[#0D9488]">Vehicle Glass</h1>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Input
              placeholder="Search glass parts..."
              className="w-full md:w-64 border-[#0D9488] focus:ring-[#0D9488]"
            />
            <Button variant="secondary" size="icon" className="bg-[#0D9488] hover:bg-[#0F766E]">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Card key={item} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <Car className="h-6 w-6 text-[#0D9488] mr-2" />
                <CardTitle className="text-lg font-semibold">Windscreen Type {item}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Compatible with multiple vehicle models</p>
                  <p className="font-medium">£299.99</p>
                  <Button className="w-full bg-[#F97316] hover:bg-[#EA580C]">
                    Add to Quote
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button 
          className="w-full bg-[#F97316] hover:bg-[#EA580C]"
          onClick={() => checkAvailability('EUROCODE123', 1)}
        >
          Check Availability
        </Button>
      </div>
    </DashboardLayout>
  );
};

export default Glass;