import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

// Check if we're in development or production
const isDev = import.meta.env.DEV;

// Determine the most appropriate API base URL.
// Order of precedence:
// 1. Explicit build-time override via VITE_API_BASE_URL
// 2. Relative path behind the same origin (e.g. Nginx proxying /api -> backend)
// 3. Local-development fallbacks (localhost / 127.0.0.1)
// 4. Same host with port 8000 (useful when dev server proxies frontend)
const possibleBaseURLs: (string | undefined)[] = [
  import.meta.env.VITE_API_BASE_URL, // e.g. "/api" or full URL provided at build time
  isDev ? '' : '/api',                // In dev mode, use empty string to hit Vite proxy directly
  isDev ? 'http://localhost:8000' : undefined,
  isDev ? 'http://127.0.0.1:8000' : undefined,
  window.location.protocol + '//' + window.location.hostname + ':8000',
].filter(url => url !== undefined) as string[]; // filter out undefined values

// Log the environment and resolved URL list (useful during debugging)
console.log('Environment:', isDev ? 'Development' : 'Production');
console.log('Possible API Base URLs:', possibleBaseURLs);

// Use the first non-null URL
const baseURL = possibleBaseURLs.find(url => url) || 'http://31.97.140.85:8001';
console.log('Using API Base URL:', baseURL);

// Create API instance with base URL
const api = axios.create({
  baseURL,
  timeout: 30000, // Default timeout (30 seconds)
});

// Track if we're currently having backend connection issues
let hasConnectionIssues = false;

// Function to determine if a request contains image data
const requestContainsImage = (config: AxiosRequestConfig) => {
  if (config?.data) {
    // For FormData
    if (config.data instanceof FormData) {
      return Array.from(config.data.entries()).some(([key, _value]) => 
        String(key).toLowerCase().includes('image') || String(key) === 'imageBase64'
      );
    }
    
    // For JSON data
    try {
      const data = typeof config.data === 'string' 
        ? JSON.parse(config.data) 
        : config.data;
      
      return data && (
        data.imageBase64 || 
        data.image || 
        (data.data && (data.data.imageBase64 || data.data.image))
      );
    } catch (e) {
      return false;
    }
  }
  return false;
};

// Add request interceptor to include auth token in all requests
api.interceptors.request.use(
  (config) => {
    console.log(`Request: ${config.method?.toUpperCase()} ${config.url}`, 
      // Don't log image data as it's too large
      requestContainsImage(config) 
        ? {...config.data, imageBase64: config.data.imageBase64 ? '[IMAGE DATA]' : undefined} 
        : config.data
    );
    
    // Set longer timeout for image-containing requests
    if (requestContainsImage(config)) {
      console.log('Image detected in request, using extended timeout');
      config.timeout = 120000; // 2 minutes for image requests
    }
    // Check for connection issues
    else if (hasConnectionIssues && config.url !== '/health' && config.url !== '/ping') {
      console.warn('Connection issues detected, adjusting timeout');
      config.timeout = 10000; // Reduce timeout when we know there are issues
    }
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => {
    console.log(`Response: ${response.status} from ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('Response error:', error.message);
    
    // Enhanced logging for timeout errors with image detection
    if (error.code === 'ECONNABORTED' || (error.message && error.message.includes('timeout'))) {
      const hasImage = error.config && requestContainsImage(error.config);
      console.error(
        `Request timeout: ${error.config?.url}`,
        `Timeout duration: ${error.config?.timeout} ms`,
        hasImage ? 'Request contained image data' : ''
      );
    }
    
    // Track connection issues
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout') || 
        error.message.includes('Network Error')) {
      console.error('Connection issue detected!');
      hasConnectionIssues = true;
      
      // Auto-reset after 1 minute
      setTimeout(() => {
        hasConnectionIssues = false;
      }, 60000);
    }
    
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      console.error('Authentication token expired, clearing auth data');
      
      // Clear authentication data
      localStorage.removeItem('token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user');
      
      // Redirect to login page if not already there
      if (window.location.pathname !== '/login') {
        console.log('Redirecting to login page due to expired token');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Add a health check function
export const checkServerHealth = async (): Promise<boolean> => {
  try {
    // Use a very short timeout for health check
    const response = await api.get('/health', { timeout: 3000 });
    hasConnectionIssues = false; // Reset if successful
    return response.status === 200;
  } catch (error) {
    console.error('Health check failed:', error);
    hasConnectionIssues = true;
    return false;
  }
};

// Add a mock handler for grocery list endpoints during development
if (isDev) {
  // Create mock API responses for development
  const mockApiHandlers = {
    '/grocery-lists': async (config: any) => {
      console.log('Mocking /grocery-lists POST endpoint');
      
      // Save to localStorage
      const savr_grocery_lists = localStorage.getItem('savr_grocery_lists') || '[]';
      const lists = JSON.parse(savr_grocery_lists);
      
      // Create a new list with the request data
      const newList = {
        ...config.data,
        id: `list-${Date.now()}`,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      };
      
      // Add to list collection
      lists.unshift(newList);
      localStorage.setItem('savr_grocery_lists', JSON.stringify(lists));
      
      console.log('Saved mock list:', newList);
      
      return {
        status: 200,
        data: newList
      };
    },
    
    '/grocery-lists/user/': async (url: string) => {
      console.log('Mocking GET grocery lists for user');
      
      // Extract user ID from URL
      const userId = url.split('/').pop();
      
      // Get lists from localStorage
      const savr_grocery_lists = localStorage.getItem('savr_grocery_lists') || '[]';
      const allLists = JSON.parse(savr_grocery_lists);
      
      // Filter by user ID
      const userLists = allLists.filter((list: any) => list.userId === userId);
      
      console.log(`Found ${userLists.length} lists for user ${userId} in mock API`);
      
      return {
        status: 200,
        data: userLists
      };
    },

    '/grocery-lists/delete/': async (url: string) => {
      console.log('Mocking DELETE grocery list');
      
      // Extract list ID from URL
      const listId = url.split('/').pop();
      
      // Get lists from localStorage
      const savr_grocery_lists = localStorage.getItem('savr_grocery_lists') || '[]';
      const allLists = JSON.parse(savr_grocery_lists);
      
      // Filter out the deleted list
      const updatedLists = allLists.filter((list: any) => list.id !== listId);
      
      // Save back to localStorage
      localStorage.setItem('savr_grocery_lists', JSON.stringify(updatedLists));
      
      console.log(`Deleted list ${listId} in mock API`);
      
      return {
        status: 200,
        data: { success: true }
      };
    }
  };
  
  // Add this before the actual API request
  const originalGet = api.get;
  api.get = async function<T = any, R = AxiosResponse<T>, D = any>(
    url: string, 
    config?: AxiosRequestConfig<D>
  ): Promise<R> {
    if (isDev && url.startsWith('/grocery-lists/user/')) {
      try {
        console.log('Using mock handler for GET grocery lists');
        return await mockApiHandlers['/grocery-lists/user/'](url) as R;
      } catch (error) {
        console.error('Error in mock GET handler:', error);
      }
    }
    
    return originalGet.call(this, url, config) as Promise<R>;
  };
  
  const originalPost = api.post;
  api.post = async function<T = any, R = AxiosResponse<T>, D = any>(
    url: string, 
    data?: D, 
    config?: AxiosRequestConfig<D>
  ): Promise<R> {
    if (isDev && url === '/grocery-lists') {
      try {
        console.log('Using mock handler for POST grocery lists');
        return await mockApiHandlers['/grocery-lists']({ ...config, data }) as R;
      } catch (error) {
        console.error('Error in mock POST handler:', error);
      }
    }
    
    return originalPost.call(this, url, data, config) as Promise<R>;
  };
  
  const originalDelete = api.delete;
  api.delete = async function<T = any, R = AxiosResponse<T>, D = any>(
    url: string, 
    config?: AxiosRequestConfig<D>
  ): Promise<R> {
    if (isDev && url.startsWith('/grocery-lists/delete/')) {
      try {
        console.log('Using mock handler for DELETE grocery list');
        return await mockApiHandlers['/grocery-lists/delete/'](url) as R;
      } catch (error) {
        console.error('Error in mock DELETE handler:', error);
      }
    }
    
    return originalDelete.call(this, url, config) as Promise<R>;
  };
}

export default api;

// Export api as apiClient for consistent naming in services
export const apiClient = api; 
