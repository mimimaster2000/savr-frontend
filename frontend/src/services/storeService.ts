import api from './api';

export interface Store {
  id: string;
  name: string;
  address: string;
  distance: number; // in kilometers
  rating?: number;
  place_id: string;
  website?: string;
  image_url: string; // Use the single image URL from backend
}

export interface StoreSearchParams {
  latitude: number;
  longitude: number;
  radius?: number; // in meters, default 5000 (5km)
  keyword?: string;
}

export interface StoreCredential {
  id: string;
  store_id: string;
  username: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface StoreCredentialCreate {
  store_id: string;
  username: string;
  password: string;
}

export interface UserSelectedStore {
  id: number;
  store_name: string;
  address: string;
  postal_code: string;
  image_url?: string; // Added for store logo
}

const storeService = {
  /**
   * Get nearby grocery stores based on user location
   */
  getNearbyStores: async (params: StoreSearchParams): Promise<Store[]> => {
    try {
      const response = await api.get('/stores/nearby', { params });
      return response.data;
    } catch (error) {
      console.log('Using mock data for nearby stores due to API error');
      
      // For development, return mock data if API fails
      return [
        {
          id: 'store-1',
          name: 'Loblaws',
          address: '123 Main St, Toronto, ON M5V 2K7',
          distance: 0.8,
          rating: 4.2,
          image_url: 'https://lh3.googleusercontent.com/places/ANXAkqEFJtcXdD_m9RD5DGVYUAQQNxuDmOgKCZz_lJ8HX0Hv6-r__mIMzAKiL0NxuXnsvi0-h23o8-Oy0SJHXg8PfFhYEeD-_6Q=s1600-w400',
          place_id: 'ChIJa7EQLTTL1IkRQD6Cw1y0UCs',
          website: 'https://www.loblaws.ca'
        },
        {
          id: 'store-2',
          name: 'Metro',
          address: '456 Queen St, Toronto, ON M5V 2A9',
          distance: 1.2,
          rating: 4.0,
          image_url: 'https://lh3.googleusercontent.com/places/ANXAkqFV5FwZdI2dLtznrt4v3gLgzG9PvauBDxCnCT1v_r-lhFDVkoZWGrJKSUH6Dv5scLDpRXzDN6b6PujToHv1G-gYBjqLvU8=s1600-w400',
          place_id: 'ChIJa7EQLTTb1IkRQD6Cw1y0UCs',
          website: 'https://www.metro.ca'
        },
        {
          id: 'store-3',
          name: 'No Frills',
          address: '789 College St, Toronto, ON M6G 1A7',
          distance: 1.5,
          rating: 3.8,
          image_url: 'https://lh3.googleusercontent.com/places/ANXAkqHsXQHGQz4lvE1E-GHlw1lOyCGf9T5Tmy-oyLb40LKdPkVDBKcpUQSQGUuVQb9V1TTF87V_sjELJLzDLlZ-FFqsJD2-5-o=s1600-w400',
          place_id: 'ChIJa7EQLTTc1IkRQD6Cw1y0UCs',
          website: 'https://www.nofrills.ca'
        },
        {
          id: 'store-4',
          name: 'Sobeys',
          address: '321 Bloor St, Toronto, ON M5S 1W2',
          distance: 2.3,
          rating: 4.1,
          image_url: 'https://lh3.googleusercontent.com/places/ANXAkqEyTfMhD2x-5OW0c8cJsQ-NIDp-EtkiIe49Vz7EqOAFdFbkYXKnZ_8gwk5gzQlmUeV90s0_eFPTzATr44G38Tr7dIGkNQ=s1600-w400',
          place_id: 'ChIJa7EQLTTd1IkRQD6Cw1y0UCs',
          website: 'https://www.sobeys.com'
        },
        {
          id: 'store-5',
          name: 'Walmart Supercentre',
          address: '654 Dufferin St, Toronto, ON M6K 2B4',
          distance: 3.1,
          rating: 3.9,
          image_url: 'https://lh3.googleusercontent.com/places/ANXAkqGDSh5PaXBUY5i8BbVi3TDVdRXDKgvwgqLfzRMV7LJ_Y_qVjqBGbQUMNVNEz9g4WGJfxiAfD1YRPNWMl8MUTRz-g13krg=s1600-w400',
          place_id: 'ChIJa7EQLTTe1IkRQD6Cw1y0UCs',
          website: 'https://www.walmart.ca'
        }
      ];
    }
  },

  /**
   * Get user's coordinates from address
   */
  getCoordinatesFromAddress: async (address: string): Promise<{latitude: number, longitude: number}> => {
    try {
      const response = await api.get('/stores/geocode', { params: { address } });
      return response.data;
    } catch (error) {
      console.log('Using mock data for geocoding due to API error');
      
      // For development, return mock Toronto coordinates
      return {
        latitude: 43.6532,
        longitude: -79.3832
      };
    }
  },

  /**
   * Save store credentials for a user
   */
  saveStoreCredentials: async (data: StoreCredentialCreate): Promise<StoreCredential> => {
    try {
      const response = await api.post('/stores/credentials', data);
      return response.data;
    } catch (error) {
      console.log('Error saving store credentials:', error);
      throw error;
    }
  },

  /**
   * Get all store credentials for a user
   */
  getStoreCredentials: async (): Promise<StoreCredential[]> => {
    try {
      const response = await api.get('/stores/credentials');
      return response.data;
    } catch (error) {
      console.log('Error getting store credentials:', error);
      return [];
    }
  },

  /**
   * Delete a store credential
   */
  deleteStoreCredentials: async (credentialId: string): Promise<void> => {
    try {
      await api.delete(`/stores/credentials/${credentialId}`);
    } catch (error) {
      console.log('Error deleting store credential:', error);
      throw error;
    }
  },

  /**
   * Get user-selected stores
   */
  getUserSelectedStores: async (): Promise<UserSelectedStore[]> => {
    const response = await api.get('/user/selected_stores');
    return response.data;
  },

  /**
   * Add a user-selected store
   */
  addUserSelectedStore: async (store: Omit<UserSelectedStore, 'id'>): Promise<UserSelectedStore> => {
    const response = await api.post('/user/selected_stores', store);
    return response.data;
  },

  /**
   * Remove a user-selected store
   */
  removeUserSelectedStore: async (storeId: number): Promise<void> => {
    await api.delete(`/user/selected_stores/${storeId}`);
  }
};

export default storeService; 