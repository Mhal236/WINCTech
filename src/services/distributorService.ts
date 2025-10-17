import { supabase } from '@/lib/supabase';

export interface Distributor {
  Company: string;
  Address: string;
  Phone: string;
  Email: string;
}

export interface DepotLocation {
  DepotCode: string;
  DepotName: string;
  Address: string;
  Phone: string;
  Email: string;
}

export class DistributorService {
  /**
   * Get all distributors from Supabase
   */
  static async getAllDistributors(): Promise<{ success: boolean; distributors?: Distributor[]; error?: any }> {
    try {
      const { data, error } = await supabase
        .from('Distributors')
        .select('*')
        .order('Company', { ascending: true });

      if (error) {
        console.error('Error fetching distributors:', error);
        return { success: false, error };
      }

      return { success: true, distributors: data };
    } catch (error) {
      console.error('Exception fetching distributors:', error);
      return { success: false, error };
    }
  }

  /**
   * Get Master Auto Glass locations from Supabase
   */
  static async getMasterAutoGlassLocations(): Promise<{ success: boolean; locations?: DepotLocation[]; error?: any }> {
    try {
      const { data, error } = await supabase
        .from('Distributors')
        .select('*')
        .ilike('Company', '%Master Auto Glass%')
        .order('Company', { ascending: true });

      if (error) {
        console.error('Error fetching Master Auto Glass locations:', error);
        return { success: false, error };
      }

      // Transform to depot format with proper depot codes
      const locations: DepotLocation[] = (data || []).map((distributor: Distributor) => {
        let depotCode = '';
        const company = distributor.Company;

        // Extract depot code from company name
        if (company.includes('Birmingham')) depotCode = 'BIR';
        else if (company.includes('Cambridge')) depotCode = 'CMB';
        else if (company.includes('Durham')) depotCode = 'DUR';
        else if (company.includes('Glasgow')) depotCode = 'GLA';
        else if (company.includes('Manchester')) depotCode = 'MAN';
        else if (company.includes('Maidstone')) depotCode = 'ROC';
        else if (company.includes('London West') || company.includes('Park Royal')) depotCode = 'PAR';
        else if (company.includes('London East') || company.includes('Walthamstow')) depotCode = 'WAL';
        else if (company.includes('Head Office')) depotCode = 'PAR'; // Head Office same as Park Royal
        else depotCode = company.substring(0, 3).toUpperCase();

        // Extract location name
        let depotName = company.replace('Master Auto Glass – ', '').replace('Master Auto Glass (Head Office)', 'Park Royal');

        return {
          DepotCode: depotCode,
          DepotName: depotName,
          Address: distributor.Address,
          Phone: distributor.Phone,
          Email: distributor.Email
        };
      });

      return { success: true, locations };
    } catch (error) {
      console.error('Exception fetching Master Auto Glass locations:', error);
      return { success: false, error };
    }
  }

  /**
   * Get Charles Pugh locations from Supabase
   */
  static async getCharlesPughLocations(): Promise<{ success: boolean; locations?: DepotLocation[]; error?: any }> {
    try {
      const { data, error } = await supabase
        .from('Distributors')
        .select('*')
        .or('Company.ilike.%Charles Pugh%,Company.ilike.%Pugh\'s%')
        .order('Company', { ascending: true });

      if (error) {
        console.error('Error fetching Charles Pugh locations:', error);
        return { success: false, error };
      }

      // Transform to depot format with proper depot codes
      const locations: DepotLocation[] = (data || []).map((distributor: Distributor) => {
        let depotCode = '';
        const company = distributor.Company;

        // Extract depot code from company name
        if (company.includes('Bristol')) depotCode = 'BRS';
        else if (company.includes('Dartford')) depotCode = 'DAR';
        else if (company.includes('Enfield')) depotCode = 'ENF';
        else if (company.includes('Leeds')) depotCode = 'LDS';
        else if (company.includes('Manchester') || company.includes('Trafford Park')) depotCode = 'MAN';
        else if (company.includes('Wednesbury')) depotCode = 'WED';
        else if (company.includes('Head Office') || company.includes('Pinxton') || company.includes('Nottinghamshire')) depotCode = 'NOT';
        else depotCode = company.substring(0, 3).toUpperCase();

        // Extract location name
        let depotName = company.replace('Pugh\'s – ', '').replace('Charles Pugh (Head Office)', 'Nottingham');

        return {
          DepotCode: depotCode,
          DepotName: depotName,
          Address: distributor.Address,
          Phone: distributor.Phone,
          Email: distributor.Email
        };
      });

      return { success: true, locations };
    } catch (error) {
      console.error('Exception fetching Charles Pugh locations:', error);
      return { success: false, error };
    }
  }

  /**
   * Get distributor by company name
   */
  static async getDistributorByCompany(companyName: string): Promise<{ success: boolean; distributor?: Distributor; error?: any }> {
    try {
      const { data, error } = await supabase
        .from('Distributors')
        .select('*')
        .ilike('Company', `%${companyName}%`)
        .single();

      if (error) {
        console.error('Error fetching distributor:', error);
        return { success: false, error };
      }

      return { success: true, distributor: data };
    } catch (error) {
      console.error('Exception fetching distributor:', error);
      return { success: false, error };
    }
  }
}

export default DistributorService;

