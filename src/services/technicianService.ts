import { supabase } from '@/lib/supabase';

export interface TechnicianSignupData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  registrationNumber?: string;
  servicesOffered?: string[];
  initialStatus?: 'pending' | 'pro-1' | 'pro-2' | 'admin';
}

export interface ApplicationToTechnicianData {
  applicationId: string;
}

export class TechnicianService {
  /**
   * Create a technician record directly from signup data
   */
  static async createTechnicianFromSignup(
    userId: string, 
    data: TechnicianSignupData
  ): Promise<{ success: boolean; technicianId?: string; error?: any }> {
    try {
      console.log('Creating technician from signup:', { userId, data });

      const { data: result, error } = await supabase.rpc(
        'create_technician_from_signup',
        {
          p_user_id: userId,
          p_name: data.name,
          p_email: data.email,
          p_phone: data.phone || null,
          p_address: data.address || null,
          p_vehicle_make: data.vehicleMake || null,
          p_vehicle_model: data.vehicleModel || null,
          p_registration_number: data.registrationNumber || null,
          p_services_offered: data.servicesOffered || [],
          p_initial_status: data.initialStatus || 'pending'
        }
      );

      if (error) {
        console.error('Error creating technician:', error);
        return { success: false, error };
      }

      console.log('Technician created successfully:', result);
      return { success: true, technicianId: result };
    } catch (error) {
      console.error('Exception creating technician:', error);
      return { success: false, error };
    }
  }

  /**
   * Copy application data to technician table
   */
  static async copyApplicationToTechnician(
    applicationId: string
  ): Promise<{ success: boolean; technicianId?: string; error?: any }> {
    try {
      console.log('Copying application to technician:', applicationId);

      const { data: result, error } = await supabase.rpc(
        'copy_application_to_technician',
        {
          application_id: applicationId
        }
      );

      if (error) {
        console.error('Error copying application to technician:', error);
        return { success: false, error };
      }

      console.log('Application copied to technician successfully:', result);
      return { success: true, technicianId: result };
    } catch (error) {
      console.error('Exception copying application:', error);
      return { success: false, error };
    }
  }

  /**
   * Get technician by user ID
   */
  static async getTechnicianByUserId(
    userId: string
  ): Promise<{ success: boolean; technician?: any; error?: any }> {
    try {
      const { data, error } = await supabase
        .from('technicians')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching technician:', error);
        return { success: false, error };
      }

      return { success: true, technician: data };
    } catch (error) {
      console.error('Exception fetching technician:', error);
      return { success: false, error };
    }
  }

  /**
   * Update technician status
   */
  static async updateTechnicianStatus(
    technicianId: string,
    newStatus: 'pending' | 'pro-1' | 'pro-2' | 'admin' | 'available' | 'busy' | 'offline'
  ): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await supabase
        .from('technicians')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', technicianId);

      if (error) {
        console.error('Error updating technician status:', error);
        return { success: false, error };
      }

      // Also update the corresponding user role in app_users if it's a level change
      if (['pending', 'pro-1', 'pro-2', 'admin'].includes(newStatus)) {
        const { data: technician } = await supabase
          .from('technicians')
          .select('user_id')
          .eq('id', technicianId)
          .single();

        if (technician?.user_id) {
          await supabase
            .from('app_users')
            .update({ user_role: newStatus })
            .eq('id', technician.user_id);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Exception updating technician status:', error);
      return { success: false, error };
    }
  }

  /**
   * Get all technicians with their current status
   */
  static async getAllTechnicians(): Promise<{ success: boolean; technicians?: any[]; error?: any }> {
    try {
      const { data, error } = await supabase
        .from('technicians')
        .select(`
          *,
          app_users!technicians_user_id_fkey (
            email,
            user_role,
            verification_status
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching technicians:', error);
        return { success: false, error };
      }

      return { success: true, technicians: data };
    } catch (error) {
      console.error('Exception fetching technicians:', error);
      return { success: false, error };
    }
  }
}

export default TechnicianService;
