// This file should be on the server side, not accessible to the client
// It could be implemented in a Next.js API route, Express server, 
// or any other server-side technology your project uses

// Access environment variables without the VITE_ prefix
const apiUrl = process.env.VEHICLE_API_URL;
const apiKey = process.env.VEHICLE_API_KEY;

export async function lookupVehicleData(vrn: string) {
  if (!apiUrl || !apiKey) {
    throw new Error("Missing API URL or API Key in server environment variables.");
  }

  try {
    // Build the URL as required by the vehicle data API
    const url = `${apiUrl}?v=2&api_nullitems=1&auth_apikey=${apiKey}&key_VRM=${vrn.trim()}`;
    
    const response = await fetch(url);
    
    // Check that the response has JSON content
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await response.text();
      throw new Error(`Expected JSON, got: ${text}`);
    }

    const result = await response.json();

    // Return only the necessary data to the client
    if (
      result?.Response &&
      result?.Response.StatusCode === "Success" &&
      result?.Response.DataItems &&
      result.Response.DataItems.VehicleRegistration
    ) {
      const registration = result.Response.DataItems.VehicleRegistration;
      return {
        make: registration.Make || "",
        model: registration.Model || "",
        year: registration.YearOfManufacture || "",
        // Add other vehicle details as needed, but be selective
      };
    } else {
      throw new Error("Vehicle data not found in API response");
    }
  } catch (error) {
    console.error("Error fetching vehicle data:", error);
    throw error;
  }
} 