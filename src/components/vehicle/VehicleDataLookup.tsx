import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface VehicleDetails {
  make: string;
  model: string;
  year: string;
}

const VehicleDataLookup = () => {
  const [vrn, setVrn] = useState("");
  const [loading, setLoading] = useState(false);
  const [vehicleDetails, setVehicleDetails] = useState<VehicleDetails>({
    make: "",
    model: "",
    year: "",
  });
  const { toast } = useToast();

  const fetchVehicleData = async () => {
    if (!vrn.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter a valid registration number.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Use secure server endpoint that handles the API call
      const response = await fetch(`/api/vehicle/${vrn.trim()}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data && data.make) {
        setVehicleDetails({
          make: data.make,
          model: data.model,
          year: data.year,
        });
        toast({ title: "Vehicle data loaded successfully" });
      } else {
        throw new Error("Vehicle data not found");
      }
    } catch (error: any) {
      toast({
        title: "Error fetching vehicle data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="vrn" className="block text-sm font-medium">
          Vehicle Registration Number (VRN)
        </label>
        <Input
          id="vrn"
          type="text"
          value={vrn}
          onChange={(e) => setVrn(e.target.value.toUpperCase())}
          placeholder="e.g., AB12 CDE"
        />
      </div>
      <Button onClick={fetchVehicleData} disabled={loading}>
        {loading ? "Loading..." : "Fetch Vehicle Data"}
      </Button>
      {vehicleDetails.make && (
        <div className="mt-4 space-y-2">
          <p>
            <strong>Make:</strong> {vehicleDetails.make}
          </p>
          <p>
            <strong>Model:</strong> {vehicleDetails.model}
          </p>
          <p>
            <strong>Year:</strong> {vehicleDetails.year}
          </p>
        </div>
      )}
    </div>
  );
};

export default VehicleDataLookup; 