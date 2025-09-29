export interface VehicleData {
  success: boolean;
  make: string;
  model: string;
  year?: string;
  error?: string;
}

export class VehicleService {
  /**
   * Lookup vehicle data by VRN using the existing API endpoint
   */
  static async lookupVehicleData(vrn: string): Promise<VehicleData> {
    try {
      if (!vrn || !vrn.trim()) {
        return {
          success: false,
          make: '',
          model: '',
          error: 'Vehicle registration number is required'
        };
      }

      // Use the vehicle API endpoint on port 8080 where it's working
      const apiUrl = `http://localhost:8080/api/vehicle/${vrn.trim()}`;
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          make: '',
          model: '',
          error: `API request failed: ${errorText}`
        };
      }
      
      const data = await response.json();
      
      // Debug logging
      console.log('Vehicle API Response:', data);
      
      // Handle successful API response with nested data structure
      if (data.success === true && data.data) {
        const vehicleData = data.data;
        
        // Check if we have make and model in the nested data
        if (vehicleData.make && vehicleData.model) {
          return {
            success: true,
            make: vehicleData.make || '',
            model: vehicleData.model || '',
            year: vehicleData.year || '',
          };
        }
        // If we have registration but no make/model, the vehicle was found but data is incomplete
        else if (vehicleData.registration) {
          return {
            success: false,
            make: '',
            model: '',
            error: 'Vehicle found but make/model details not available from external API'
          };
        }
        // No useful vehicle data at all
        else {
          return {
            success: false,
            make: '',
            model: '',
            error: 'Vehicle data not found'
          };
        }
      }
      // Handle direct structure (fallback for older API format)
      else if (data.make && data.model) {
        return {
          success: true,
          make: data.make || '',
          model: data.model || '',
          year: data.year || '',
        };
      } 
      // Handle error response with success: false
      else if (data.success === false) {
        return {
          success: false,
          make: '',
          model: '',
          error: data.error || 'Vehicle data not found'
        };
      }
      // Handle case where no vehicle data is returned
      else {
        return {
          success: false,
          make: '',
          model: '',
          error: 'Vehicle data not found'
        };
      }
    } catch (error: any) {
      console.error('Error in VehicleService.lookupVehicleData:', error);
      return {
        success: false,
        make: '',
        model: '',
        error: error.message || 'Failed to lookup vehicle data'
      };
    }
  }
}
