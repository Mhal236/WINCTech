export interface VehicleData {
  success: boolean;
  make: string;
  model: string;
  year?: string;
  variant?: string;
  fuel_type?: string;
  engine_capacity?: number;
  co2_emissions?: number;
  body_type?: string;
  colour?: string;
  transmission?: string;
  doors?: number;
  seats?: number;
  tax_status?: string;
  mot_status?: string;
  motd_date?: string;
  tax_due_date?: string;
  error?: string;
  cached?: boolean; // Indicates if data came from cache
}

export class VehicleService {
  /**
   * Check if vehicle data exists in cache
   */
  private static async checkVehicleCache(vrn: string): Promise<VehicleData | null> {
    try {
      // Import supabase client
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('Supabase credentials not available for cache check');
        return null;
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      const { data, error } = await supabase
        .from('vehicle_data')
        .select('*')
        .eq('vrn', vrn.toUpperCase())
        .single();

      if (error || !data) {
        return null;
      }

      // Update verification count and last verified timestamp
      await supabase
        .from('vehicle_data')
        .update({ 
          verification_count: (data.verification_count || 0) + 1,
          last_verified_at: new Date().toISOString()
        })
        .eq('id', data.id);

      // Convert database record to VehicleData interface
      return {
        success: true,
        make: data.make || '',
        model: data.model || '',
        year: data.year_of_manufacture?.toString() || '',
        variant: data.variant || '',
        fuel_type: data.fuel_type || '',
        engine_capacity: data.engine_capacity || undefined,
        co2_emissions: data.co2_emissions || undefined,
        body_type: data.body_type || '',
        colour: data.colour || '',
        transmission: data.transmission || '',
        doors: data.doors || undefined,
        seats: data.seats || undefined,
        tax_status: data.tax_status || '',
        mot_status: data.mot_status || '',
        motd_date: data.motd_date || '',
        tax_due_date: data.tax_due_date || '',
        cached: true
      };
    } catch (error) {
      console.error('Error checking vehicle cache:', error);
      return null;
    }
  }

  /**
   * Save vehicle data to cache
   */
  private static async saveVehicleToCache(vrn: string, vehicleData: any): Promise<void> {
    try {
      // Import supabase client
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('Supabase credentials not available for cache save');
        return;
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      // Prepare data for insertion
      const cacheData = {
        vrn: vrn.toUpperCase(),
        make: vehicleData.make || null,
        model: vehicleData.model || null,
        variant: vehicleData.variant || null,
        fuel_type: vehicleData.fuel_type || vehicleData.fuelType || null,
        year_of_manufacture: vehicleData.year ? parseInt(vehicleData.year) : null,
        engine_capacity: vehicleData.engine_capacity || vehicleData.engineCapacity || null,
        co2_emissions: vehicleData.co2_emissions || vehicleData.co2Emissions || null,
        euro_status: vehicleData.euro_status || vehicleData.euroStatus || null,
        body_type: vehicleData.body_type || vehicleData.bodyType || null,
        colour: vehicleData.colour || vehicleData.color || null,
        transmission: vehicleData.transmission || null,
        doors: vehicleData.doors ? parseInt(vehicleData.doors) : null,
        seats: vehicleData.seats ? parseInt(vehicleData.seats) : null,
        tax_status: vehicleData.tax_status || vehicleData.taxStatus || null,
        mot_status: vehicleData.mot_status || vehicleData.motStatus || null,
        motd_date: vehicleData.motd_date || vehicleData.motdDate || null,
        tax_due_date: vehicleData.tax_due_date || vehicleData.taxDueDate || null,
        data_source: 'UKVehicleData',
        additional_data: vehicleData.additional_data || vehicleData,
        verification_count: 1,
        last_verified_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('vehicle_data')
        .upsert(cacheData, { 
          onConflict: 'vrn',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Error saving vehicle data to cache:', error);
      } else {
        console.log(`✅ Cached vehicle data for VRN: ${vrn}`);
      }
    } catch (error) {
      console.error('Error in saveVehicleToCache:', error);
    }
  }

  /**
   * Lookup vehicle data by VRN - first check cache, then API
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

      const cleanVrn = vrn.trim().toUpperCase();
      
      // First, check if we have this vehicle in our cache
      console.log(`🔍 Checking cache for VRN: ${cleanVrn}`);
      const cachedData = await this.checkVehicleCache(cleanVrn);
      
      if (cachedData) {
        console.log(`✅ Found cached data for VRN: ${cleanVrn}`);
        return cachedData;
      }

      // Not in cache, fetch from external API
      console.log(`🌐 Fetching from external API for VRN: ${cleanVrn}`);
      
      // Use Vercel serverless function for vehicle lookup
      const apiUrl = import.meta.env.DEV 
        ? `http://localhost:8080/api/vehicle/${cleanVrn}` // Local development uses api-server.js
        : `/api/vehicle-lookup?vrn=${encodeURIComponent(cleanVrn)}`; // Production uses Vercel function
      
      console.log('🔍 Vehicle API URL:', apiUrl);
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
          // Save to cache for future lookups
          await this.saveVehicleToCache(cleanVrn, vehicleData);
          
          const result: VehicleData = {
            success: true,
            make: vehicleData.make || '',
            model: vehicleData.model || '',
            year: vehicleData.year || '',
            variant: vehicleData.variant || '',
            fuel_type: vehicleData.fuel_type || vehicleData.fuelType || '',
            engine_capacity: vehicleData.engine_capacity || vehicleData.engineCapacity || undefined,
            co2_emissions: vehicleData.co2_emissions || vehicleData.co2Emissions || undefined,
            body_type: vehicleData.body_type || vehicleData.bodyType || '',
            colour: vehicleData.colour || vehicleData.color || '',
            transmission: vehicleData.transmission || '',
            doors: vehicleData.doors ? parseInt(vehicleData.doors) : undefined,
            seats: vehicleData.seats ? parseInt(vehicleData.seats) : undefined,
            tax_status: vehicleData.tax_status || vehicleData.taxStatus || '',
            mot_status: vehicleData.mot_status || vehicleData.motStatus || '',
            motd_date: vehicleData.motd_date || vehicleData.motdDate || '',
            tax_due_date: vehicleData.tax_due_date || vehicleData.taxDueDate || '',
            cached: false
          };
          
          return result;
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
        // Save to cache for future lookups
        await this.saveVehicleToCache(cleanVrn, data);
        
        const result: VehicleData = {
          success: true,
          make: data.make || '',
          model: data.model || '',
          year: data.year || '',
          variant: data.variant || '',
          fuel_type: data.fuel_type || data.fuelType || '',
          engine_capacity: data.engine_capacity || data.engineCapacity || undefined,
          co2_emissions: data.co2_emissions || data.co2Emissions || undefined,
          body_type: data.body_type || data.bodyType || '',
          colour: data.colour || data.color || '',
          transmission: data.transmission || '',
          doors: data.doors ? parseInt(data.doors) : undefined,
          seats: data.seats ? parseInt(data.seats) : undefined,
          tax_status: data.tax_status || data.taxStatus || '',
          mot_status: data.mot_status || data.motStatus || '',
          motd_date: data.motd_date || data.motdDate || '',
          tax_due_date: data.tax_due_date || data.taxDueDate || '',
          cached: false
        };
        
        return result;
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
