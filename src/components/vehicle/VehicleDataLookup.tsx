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
    try {
      const apiUrl = import.meta.env.VITE_VEHICLE_API_URL;
      const apiKey = import.meta.env.VITE_VEHICLE_API_KEY;
      // Create the URL and append the required query parameters.
      const url = new URL(apiUrl);
      // The API might require the key to be passed as "api_key" along with your registration parameter.
      url.searchParams.append("api_key", apiKey);
      url.searchParams.append("registration", vrn.trim());
      // Append additional parameters here if necessary per the API documentation

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error("API request failed");
      }
      const result = await response.json();

      // Assuming the API responds with a structure like:
      // { data: { make: "...", model: "...", year: "..." } }
      const { data } = result;
      if (data) {
        setVehicleDetails({
          make: data.make || "",
          model: data.model || "",
          year: data.year || "",
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
      <Button onClick={fetchVehicleData}>
        Fetch Vehicle Data
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