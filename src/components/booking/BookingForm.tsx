
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Technician {
  id: string;
  name: string;
  skills: string[];
  years_experience: string;
}

export const BookingForm = () => {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [technician, setTechnician] = useState("");
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [postcode, setPostcode] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [vrn, setVrn] = useState("");
  const [glassType, setGlassType] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const fetchTechnicians = async () => {
      const { data, error } = await supabase
        .from('technicians')
        .select('id, name, skills, years_experience')
        .eq('status', 'available');

      if (error) {
        console.error('Error fetching technicians:', error);
        toast({
          title: "Error",
          description: "Failed to load technicians",
          variant: "destructive",
        });
        return;
      }

      setTechnicians(data || []);
    };

    fetchTechnicians();
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time || !name || !email || !phone || !serviceType || !technician || 
        !postcode || !vehicleMake || !vehicleModel || !vehicleYear || !vrn || !glassType) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const selectedTechnician = technicians.find(t => t.id === technician);

    const { error } = await supabase
      .from('quotes')
      .insert([
        {
          customer_name: name,
          email,
          phone,
          service_type: serviceType,
          scheduled_date: date.toISOString(),
          scheduled_time: time,
          technician_id: technician,
          technician_name: selectedTechnician?.name,
          status: 'scheduled',
          glass_type: glassType,
          postcode,
          vehicle_make: vehicleMake,
          vehicle_model: vehicleModel,
          vehicle_year: vehicleYear,
          vehicleRegistration: vrn,
          total_amount: 0
        }
      ]);

    if (error) {
      console.error('Error submitting booking:', error);
      toast({
        title: "Error",
        description: "Failed to submit booking",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Booking Submitted",
      description: "We'll contact you to confirm your appointment.",
    });

    // Reset form
    setDate(undefined);
    setTime("");
    setName("");
    setEmail("");
    setPhone("");
    setServiceType("");
    setTechnician("");
    setPostcode("");
    setVehicleMake("");
    setVehicleModel("");
    setVehicleYear("");
    setVrn("");
    setGlassType("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule Service</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Date</label>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
              disabled={(date) => date < new Date()}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Preferred Time</label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              min="09:00"
              max="17:00"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Your Name</label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Phone Number</label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(123) 456-7890"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Vehicle Registration Number (VRN)</label>
            <Input
              type="text"
              value={vrn}
              onChange={(e) => setVrn(e.target.value.toUpperCase())}
              placeholder="AB12 CDE"
              className="uppercase"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Glass Type</label>
            <Select value={glassType} onValueChange={setGlassType}>
              <SelectTrigger>
                <SelectValue placeholder="Select glass type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="windscreen">Windscreen</SelectItem>
                <SelectItem value="side-window">Side Window</SelectItem>
                <SelectItem value="rear-window">Rear Window</SelectItem>
                <SelectItem value="sunroof">Sunroof</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Postcode</label>
            <Input
              type="text"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              placeholder="SW1A 1AA"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Vehicle Make</label>
            <Input
              type="text"
              value={vehicleMake}
              onChange={(e) => setVehicleMake(e.target.value)}
              placeholder="Toyota"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Vehicle Model</label>
            <Input
              type="text"
              value={vehicleModel}
              onChange={(e) => setVehicleModel(e.target.value)}
              placeholder="Camry"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Vehicle Year</label>
            <Input
              type="text"
              value={vehicleYear}
              onChange={(e) => setVehicleYear(e.target.value)}
              placeholder="2024"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Service Type</label>
            <Select value={serviceType} onValueChange={setServiceType}>
              <SelectTrigger>
                <SelectValue placeholder="Select service type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="windshield-replacement">Windshield Replacement</SelectItem>
                <SelectItem value="windshield-repair">Windshield Repair</SelectItem>
                <SelectItem value="side-window">Side Window Service</SelectItem>
                <SelectItem value="rear-window">Rear Window Service</SelectItem>
                <SelectItem value="calibration">ADAS Calibration</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Select Technician</label>
            <Select value={technician} onValueChange={setTechnician}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a technician" />
              </SelectTrigger>
              <SelectContent>
                {technicians.map((tech) => (
                  <SelectItem key={tech.id} value={tech.id}>
                    {tech.name} ({tech.years_experience} exp.)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full">
            Book Appointment
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
