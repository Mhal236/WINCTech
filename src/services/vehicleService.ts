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
  body_shape?: string;
  body_style?: string;
  colour?: string;
  transmission?: string;
  doors?: number;
  seats?: number;
  wheelbase_type?: string;
  fuel_tank_capacity?: number;
  number_of_axles?: number;
  payload_volume?: number;
  cab_type?: string;
  platform_name?: string;
  platform_is_shared?: boolean;
  tax_status?: string;
  mot_status?: string;
  motd_date?: string;
  tax_due_date?: string;
  vehicle_image_url?: string; // URL to vehicle image
  mvris_code?: string; // MVRIS Code
  vin?: string; // Vehicle Identification Number
  error?: string;
  cached?: boolean; // Indicates if data came from cache
}

export class VehicleService {
  /**
   * Check if vehicle data exists in cache
   */
  private static async checkVehicleCache(vrn: string): Promise<VehicleData | null> {
    try {
      // Import supabase client from the lib
      const { supabase } = await import('@/lib/supabase');
      
      if (!supabase) {
        console.error('❌ Supabase client not available for cache check');
        return null;
      }

      console.log(`🔍 Querying vehicle_data table for VRN: ${vrn.toUpperCase()}`);
      
      const { data, error } = await supabase
        .from('vehicle_data')
        .select('*')
        .eq('vrn', vrn.toUpperCase())
        .single();

      if (error) {
        console.log(`ℹ️ VRN not found in cache (${error.message})`);
        return null;
      }

      if (!data) {
        console.log(`ℹ️ VRN not found in cache (no data returned)`);
        return null;
      }

      console.log(`✅ Found VRN in cache:`, data);

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
        body_shape: data.body_shape || '',
        body_style: data.body_style || '',
        colour: data.colour || '',
        transmission: data.transmission || '',
        doors: data.doors || undefined,
        seats: data.seats || undefined,
        wheelbase_type: data.wheelbase_type || '',
        fuel_tank_capacity: data.fuel_tank_capacity || undefined,
        number_of_axles: data.number_of_axles || undefined,
        payload_volume: data.payload_volume || undefined,
        cab_type: data.cab_type || '',
        platform_name: data.platform_name || '',
        platform_is_shared: data.platform_is_shared || undefined,
        tax_status: data.tax_status || '',
        mot_status: data.mot_status || '',
        motd_date: data.motd_date || '',
        tax_due_date: data.tax_due_date || '',
        vehicle_image_url: data.vehicle_image_url || '',
        mvris_code: data.mvris_code || '',
        vin: data.vin || '',
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
  private static async saveVehicleToCache(vrn: string, vehicleData: any, imageUrl?: string | null): Promise<void> {
    try {
      // Import supabase client from the lib
      const { supabase } = await import('@/lib/supabase');
      
      if (!supabase) {
        console.error('❌ Supabase client not available for cache save');
        return;
      }

      console.log(`💾 Saving vehicle data to cache for VRN: ${vrn.toUpperCase()}`);
      console.log(`📸 Image URL to save: ${imageUrl || 'NO IMAGE'}`);

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
        body_shape: vehicleData.body_shape || vehicleData.bodyShape || null,
        body_style: vehicleData.body_style || vehicleData.bodyStyle || null,
        colour: vehicleData.colour || vehicleData.color || null,
        transmission: vehicleData.transmission || null,
        doors: vehicleData.doors ? parseInt(vehicleData.doors) : null,
        seats: vehicleData.seats ? parseInt(vehicleData.seats) : null,
        wheelbase_type: vehicleData.wheelbase_type || vehicleData.wheelbaseType || null,
        fuel_tank_capacity: vehicleData.fuel_tank_capacity || vehicleData.fuelTankCapacity ? parseInt(vehicleData.fuel_tank_capacity || vehicleData.fuelTankCapacity) : null,
        number_of_axles: vehicleData.number_of_axles || vehicleData.numberOfAxles ? parseInt(vehicleData.number_of_axles || vehicleData.numberOfAxles) : null,
        payload_volume: vehicleData.payload_volume || vehicleData.payloadVolume ? parseInt(vehicleData.payload_volume || vehicleData.payloadVolume) : null,
        cab_type: vehicleData.cab_type || vehicleData.cabType || null,
        platform_name: vehicleData.platform_name || vehicleData.platformName || null,
        platform_is_shared: vehicleData.platform_is_shared || vehicleData.platformIsShared || null,
        tax_status: vehicleData.tax_status || vehicleData.taxStatus || null,
        mot_status: vehicleData.mot_status || vehicleData.motStatus || null,
        motd_date: vehicleData.motd_date || vehicleData.motdDate || null,
        tax_due_date: vehicleData.tax_due_date || vehicleData.taxDueDate || null,
        vehicle_image_url: imageUrl || null,
        mvris_code: vehicleData.mvris_code || 'M0EZU',
        vin: vehicleData.vin || vehicleData.VIN || null,
        data_source: 'UKVehicleData',
        additional_data: vehicleData.additional_data || vehicleData,
        verification_count: 1,
        last_verified_at: new Date().toISOString()
      };

      console.log(`💾 Cache data to save:`, { 
        vrn: cacheData.vrn, 
        make: cacheData.make, 
        model: cacheData.model,
        vehicle_image_url: cacheData.vehicle_image_url 
      });

      const { data: savedData, error } = await supabase
        .from('vehicle_data')
        .upsert(cacheData, { 
          onConflict: 'vrn',
          ignoreDuplicates: false 
        })
        .select();

      if (error) {
        console.error('❌ Error saving vehicle data to cache:', error);
      } else {
        console.log(`✅ Cached vehicle data for VRN: ${vrn}`);
        console.log(`✅ Saved data:`, savedData);
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
        
        // If cached data doesn't have an image, try to fetch it from the API
        if (!cachedData.vehicle_image_url) {
          console.log(`📸 No image in cache, fetching from API for VRN: ${cleanVrn}`);
          try {
            const apiUrl = import.meta.env.DEV 
              ? `http://localhost:3000/api/vehicle/${cleanVrn}` 
              : `/api/vehicle-lookup?vrn=${encodeURIComponent(cleanVrn)}`;
            
            const response = await fetch(apiUrl);
            if (response.ok) {
              const data = await response.json();
              
              // Check if we got an image URL from the API
              const imageUrl = data.data?.vehicle_image_url || data.vehicle_image_url;
              if (imageUrl) {
                console.log(`✅ Found vehicle image from API: ${imageUrl}`);
                
                // Update cache with the new image URL
                const { supabase } = await import('@/lib/supabase');
                if (supabase) {
                  const { data: updateData, error: updateError } = await supabase
                    .from('vehicle_data')
                    .update({ vehicle_image_url: imageUrl })
                    .eq('vrn', cleanVrn)
                    .select();
                  
                  if (updateError) {
                    console.error(`❌ Error updating cache with image:`, updateError);
                  } else {
                    console.log(`💾 Updated cache with vehicle image for VRN: ${cleanVrn}`);
                    console.log(`✅ Updated record:`, updateData);
                  }
                }
                
                // Update cached data with the image URL
                cachedData.vehicle_image_url = imageUrl;
              } else {
                console.log(`ℹ️ No image available from API for VRN: ${cleanVrn}`);
              }
            }
          } catch (error) {
            console.error('Error fetching image for cached vehicle:', error);
            // Continue with cached data even if image fetch fails
          }
        }
        
        return cachedData;
      }

      // Not in cache, fetch from external API
      console.log(`🌐 Fetching from external API for VRN: ${cleanVrn}`);
      
      // Use Vercel serverless function for vehicle lookup
      const apiUrl = import.meta.env.DEV 
        ? `http://localhost:3000/api/vehicle/${cleanVrn}` // Local development uses api-server.js on port 3000
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
          // Image URL is now returned from the server endpoint
          const imageUrl = vehicleData.vehicle_image_url || null;
          
          // Save to cache for future lookups (including image and VIN)
          await this.saveVehicleToCache(cleanVrn, vehicleData, imageUrl);
          
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
            body_shape: vehicleData.body_shape || vehicleData.bodyShape || '',
            body_style: vehicleData.body_style || vehicleData.bodyStyle || '',
            colour: vehicleData.colour || vehicleData.color || '',
            transmission: vehicleData.transmission || '',
            doors: vehicleData.doors ? parseInt(vehicleData.doors) : undefined,
            seats: vehicleData.seats ? parseInt(vehicleData.seats) : undefined,
            wheelbase_type: vehicleData.wheelbase_type || vehicleData.wheelbaseType || '',
            fuel_tank_capacity: vehicleData.fuel_tank_capacity || vehicleData.fuelTankCapacity || undefined,
            number_of_axles: vehicleData.number_of_axles || vehicleData.numberOfAxles || undefined,
            payload_volume: vehicleData.payload_volume || vehicleData.payloadVolume || undefined,
            cab_type: vehicleData.cab_type || vehicleData.cabType || '',
            platform_name: vehicleData.platform_name || vehicleData.platformName || '',
            platform_is_shared: vehicleData.platform_is_shared || vehicleData.platformIsShared || undefined,
            tax_status: vehicleData.tax_status || vehicleData.taxStatus || '',
            mot_status: vehicleData.mot_status || vehicleData.motStatus || '',
            motd_date: vehicleData.motd_date || vehicleData.motdDate || '',
            tax_due_date: vehicleData.tax_due_date || vehicleData.taxDueDate || '',
            vehicle_image_url: imageUrl || undefined,
            mvris_code: vehicleData.mvris_code || 'M0EZU',
            vin: vehicleData.vin || vehicleData.VIN || undefined,
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
        // Image URL is now returned from the server endpoint
        const imageUrl = data.vehicle_image_url || null;
        
        // Save to cache for future lookups (including image and VIN)
        await this.saveVehicleToCache(cleanVrn, data, imageUrl);
        
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
          body_shape: data.body_shape || data.bodyShape || '',
          body_style: data.body_style || data.bodyStyle || '',
          colour: data.colour || data.color || '',
          transmission: data.transmission || '',
          doors: data.doors ? parseInt(data.doors) : undefined,
          seats: data.seats ? parseInt(data.seats) : undefined,
          wheelbase_type: data.wheelbase_type || data.wheelbaseType || '',
          fuel_tank_capacity: data.fuel_tank_capacity || data.fuelTankCapacity || undefined,
          number_of_axles: data.number_of_axles || data.numberOfAxles || undefined,
          payload_volume: data.payload_volume || data.payloadVolume || undefined,
          cab_type: data.cab_type || data.cabType || '',
          platform_name: data.platform_name || data.platformName || '',
          platform_is_shared: data.platform_is_shared || data.platformIsShared || undefined,
          tax_status: data.tax_status || data.taxStatus || '',
          mot_status: data.mot_status || data.motStatus || '',
          motd_date: data.motd_date || data.motdDate || '',
          tax_due_date: data.tax_due_date || data.taxDueDate || '',
          vehicle_image_url: imageUrl || undefined,
          mvris_code: data.mvris_code || 'M0EZU',
          vin: data.vin || data.VIN || undefined,
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
