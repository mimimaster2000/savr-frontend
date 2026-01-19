import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MapPin, Star, Navigation, ExternalLink, X, ChevronDown, RefreshCw } from 'lucide-react';
import storeService, { UserSelectedStore } from '@/services/storeService';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { byDistanceAsc } from '@/lib/stores';
import { getCachedStores, setCachedStores, clearStoreCache } from '@/lib/storeCache';

// Define the Store interface (same as StoresPage)
export interface Store {
  id: string;
  name: string;
  address: string;
  distance: number; // in kilometers
  rating?: number;
  place_id: string;
  website?: string;
  image_url: string;
}

interface StoreSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoresUpdated: (stores: UserSelectedStore[]) => void;
}

// Nearby stores cache is now user-scoped and centralized in '@/lib/storeCache'

const StoreSelectionModal = ({ isOpen, onClose, onStoresUpdated }: StoreSelectionModalProps) => {
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStores, setSelectedStores] = useState<UserSelectedStore[]>([]);
  const [radius, setRadius] = useState<number>(5);
  const MAX_PRICE_CHECK_STORES = 3; // Users can select up to 3 stores in the modal

  // Define allowed store brands for filtering
  const ALLOWED_STORE_BRANDS = [
    'loblaw', 'loblaws',
    'no frills', 'nofrills', 
    'independent grocer', 'your independent', 'yig', 'independent',
    'superstore', 'real canadian superstore',
    'food basics', 'foodbasics',
    // Metro family
    'metro', 'metro plus', 'marche metro', "marché metro",
    'walmart', 'wal-mart',
    // New banners under Loblaw umbrella
    'valu-mart', 'valumart', 'value mart',
    'zehrs',
    'maxi',
    'fortinos',
    // Empire (Sobeys family)
    'sobeys', "sobey's", "sobey’s", // straight & curly apostrophes
    'sobeys extra', 'sobeys urban fresh', 'urban fresh',
    'safeway'
  ];

  // Helper function to check if a store is from an allowed brand
  const isAllowedStore = (storeName: string): boolean => {
    const lowerName = storeName.toLowerCase();
    return ALLOWED_STORE_BRANDS.some(brand => lowerName.includes(brand));
  };

  // Helper to check if a store is selected (by name+postal)
  const isStoreSelected = (store: Store) => {
    const postal = (store as any).postal_code || extractPostal(store.address);
    return selectedStores.some(sel => sel.store_name === store.name && sel.postal_code === postal);
  };

  // Helper to count selected stores excluding the current store
  const numOtherSelected = (store: Store) => {
    const postal = (store as any).postal_code || extractPostal(store.address);
    return selectedStores.filter(sel => !(sel.store_name === store.name && sel.postal_code === postal)).length;
  };

  // Helper to extract postal code from address string
  function extractPostal(address: string) {
    const match = address.match(/[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d/);
    return match ? match[0].replace(' ', '') : '';
  }

  // Load user-selected stores when modal opens
  useEffect(() => {
    if (isOpen) {
      storeService.getUserSelectedStores()
        .then(fetchedStores => {
          console.log('[StoreModal] Fetched initial selected stores:', fetchedStores);
          setSelectedStores(fetchedStores);
        })
        .catch(e => console.error('Failed to fetch selected stores', e));
    }
  }, [isOpen]);

  // Handle toggling price check for a store
  const handlePriceCheckToggle = async (storeId: string, checked: boolean) => {
    const store = stores.find(s => s.id === storeId);
    if (!store) return;
    const postal = (store as any).postal_code || extractPostal(store.address);

    if (checked) {
      if (selectedStores.length >= MAX_PRICE_CHECK_STORES) {
        alert(`You can only select up to ${MAX_PRICE_CHECK_STORES} stores for price check.`);
        return;
      }
      try {
        const added = await storeService.addUserSelectedStore({
          store_name: store.name,
          address: store.address,
          postal_code: postal,
        });
        const newStores = [...selectedStores, added];
        setSelectedStores(newStores);
        onStoresUpdated(newStores);
      } catch (e: any) {
        console.error('Failed to add selected store:', e);
        alert('Failed to add store: ' + (e?.response?.data?.detail || e.message || 'Unknown error'));
      }
    } else {
      const sel = selectedStores.find(sel => sel.store_name === store.name && sel.postal_code === postal);
      if (!sel) return;
      try {
        await storeService.removeUserSelectedStore(sel.id);
        const newStores = selectedStores.filter(s => s.id !== sel.id);
        setSelectedStores(newStores);
        onStoresUpdated(newStores);
      } catch (e: any) {
        console.error('Failed to remove selected store:', e);
        alert('Failed to remove store: ' + (e?.response?.data?.detail || e.message || 'Unknown error'));
      }
    }
  };

  // Fetch stores function with caching
  const fetchNearbyStores = async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);

      // Check cache first (unless force refresh)
      const userId = localStorage.getItem('user_id');
      const cached = !forceRefresh ? getCachedStores(userId, radius) : null;
      if (cached) {
        console.log('[StoreModal] Using user-scoped cached store data');
        const cachedFiltered = cached
          .filter(store => isAllowedStore(store.name))
          .sort(byDistanceAsc);
        setStores(cachedFiltered);
        setIsLoading(false);
        return;
      }

      // Get user data from localStorage
      const userJson = localStorage.getItem('user');
      if (!userJson) {
        throw new Error('User data not found');
      }

      const user = JSON.parse(userJson);
      if (!user.address) {
        throw new Error('Address information not found in your profile');
      }

      // Format the address for geocoding
      const addressString = `${user.address.street || ''}, ${user.address.city || ''}, ${user.address.province || ''}, ${user.address.postalCode || ''}, Canada`;

      // Get coordinates from address
      const coordinates = await storeService.getCoordinatesFromAddress(addressString);

      // Get nearby stores using coordinates
      const nearbySobeys = await storeService.getNearbyStores({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        radius: radius * 1000,
        keyword: 'sobeys'
      });
      const nearbyMetro = await storeService.getNearbyStores({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        radius: radius * 1000,
        keyword: 'metro'
      });
      const nearbyGeneric = await storeService.getNearbyStores({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        radius: radius * 1000
      });
      const seen = new Set<string>();
      const merged = [...nearbySobeys, ...nearbyMetro, ...nearbyGeneric].filter(s => {
        const key = (s as any).place_id || `${s.name}|${s.address}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Sort merged list by distance first so both cache and UI are ordered
      const mergedSorted = merged.sort(byDistanceAsc);

      // Filter stores to only include allowed brands (UI state), but cache RAW results
      const filteredStores = mergedSorted.filter(store => isAllowedStore(store.name));
      
      // Update user-scoped cache with raw data so future filter updates re-evaluate
      setCachedStores(userId, mergedSorted, radius);

      setStores(filteredStores);
    } catch (err) {
      console.error('Error fetching nearby stores:', err);
      setError(err instanceof Error ? err.message : 'Failed to load nearby stores');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch stores when radius changes or modal opens
  useEffect(() => {
    if (isOpen) {
      fetchNearbyStores();
    }
  }, [isOpen, radius]);

  // Clear in-memory cache when radius changes so subsequent requests refetch
  useEffect(() => {
    try { clearStoreCache(); } catch {}
  }, [radius]);

  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${(distance * 1000).toFixed(0)} m`;
    }
    return `${distance.toFixed(1)} km`;
  };

  const openDirections = (store: Store) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(store.address)}&destination_place_id=${store.place_id}`, '_blank');
  };

  const openStoreWebsite = (store: Store) => {
    if (store.website) {
      window.open(store.website, '_blank');
    } else {
      window.open(`https://www.google.com/search?q=${encodeURIComponent(store.name + ' ' + store.address)}`, '_blank');
    }
  };

  const handleRefresh = () => {
    fetchNearbyStores(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[80vw] max-h-[80vh] sm:max-h-[75vh] overflow-hidden flex flex-col p-4 sm:p-6 top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]" style={{ backgroundColor: '#F1F8E9' }}>
        <style>
          {`
            .modal-theme-slider {
              accent-color: #6FCF97;
            }
            
            .modal-theme-slider::-webkit-slider-thumb {
              background: #6FCF97;
              border: 2px solid #43B06A;
            }
            
            .modal-theme-slider::-webkit-slider-runnable-track {
              background: #E6F4EA;
            }
            
            .modal-theme-slider::-moz-range-thumb {
              background: #6FCF97;
              border: 2px solid #43B06A;
            }
            
            .modal-theme-slider::-moz-range-track {
              background: #E6F4EA;
            }
            
            .modal-theme-slider::-ms-thumb {
              background: #6FCF97;
              border: 2px solid #43B06A;
            }
            
            .modal-theme-slider::-ms-fill-lower {
              background: #E6F4EA;
            }
            
            .modal-theme-slider::-ms-fill-upper {
              background: #E6F4EA;
            }
            
            .modal-theme-slider:focus {
              outline: none;
            }
          `}
        </style>
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-2xl font-bold">Select Your Stores</DialogTitle>
        </DialogHeader>
        
        <TooltipProvider>
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center mb-3 sm:mb-4 gap-3 sm:gap-4 flex-shrink-0">
              <div className="flex items-center w-full sm:w-auto sm:flex-1 sm:max-w-md">
                <Label htmlFor="radius-slider" className="mr-2 sm:mr-4 whitespace-nowrap text-xs sm:text-sm">Search Radius:</Label>
                <input
                  id="radius-slider"
                  type="range"
                  min={1}
                  max={50}
                  step={1}
                  value={radius}
                  onChange={e => setRadius(Number(e.target.value))}
                  className="flex-1 mx-2 modal-theme-slider"
                />
                <span className="ml-2 font-medium text-xs sm:text-sm whitespace-nowrap">{radius} km</span>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="flex items-center gap-2 flex-1 sm:flex-none py-2 px-3"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>

                {/* Selected Stores Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center justify-between flex-1 sm:flex-none sm:min-w-[180px] py-2 px-3">
                      <span className="text-xs sm:text-sm">Selected ({selectedStores.length})</span>
                      <ChevronDown className="ml-2 h-4 w-4 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] sm:min-w-[260px] sm:w-auto max-w-[320px]">
                  {selectedStores.length === 0 ? (
                    <div className="p-3 text-muted-foreground text-xs sm:text-sm">No stores selected.</div>
                  ) : (
                    selectedStores.map(sel => (
                      <DropdownMenuItem key={sel.id} className="flex items-center justify-between gap-2">
                        <span className="truncate flex-1 text-xs sm:text-sm">
                          {sel.store_name}
                          <span className="text-xs text-muted-foreground ml-1">{sel.postal_code}</span>
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 sm:h-8 sm:w-8 flex-shrink-0 p-1"
                          title="Unselect store"
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await storeService.removeUserSelectedStore(sel.id);
                              const newStores = selectedStores.filter(s => s.id !== sel.id);
                              setSelectedStores(newStores);
                              onStoresUpdated(newStores);
                            } catch (err: any) {
                              alert('Failed to remove store: ' + (err?.response?.data?.detail || err.message || 'Unknown error'));
                            }
                          }}
                        >
                          <X className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
                        </Button>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden -mx-1 px-1">
              {/* Loading State */}
              {isLoading && (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <Card className="mb-6 border-destructive">
                  <CardContent className="pt-6">
                    <div className="text-destructive">{error}</div>
                    <p className="mt-2 text-muted-foreground">
                      Please make sure your address information is complete in your profile.
                    </p>
                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" onClick={handleRefresh} className="py-2 px-4">
                        Try Again
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* No Stores Found */}
              {!isLoading && !error && stores.length === 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <p>No grocery stores found near your location.</p>
                  </CardContent>
                </Card>
              )}

              {/* Store Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pb-2">
              {useMemo(() => {
                // Render-time guarantee: always sort by distance ascending
                return [...stores].sort(byDistanceAsc);
              }, [stores]).map(store => {
                const currentlySelected = isStoreSelected(store);
                const otherSelectedCount = numOtherSelected(store);
                const isDisabled = !currentlySelected && otherSelectedCount >= MAX_PRICE_CHECK_STORES;

                return (
                  <Card key={store.id} className="overflow-hidden flex flex-col">
                    <div className="h-40 sm:h-48 overflow-hidden bg-gray-100">
                      <img
                        src={store.image_url}
                        alt={store.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null; 
                          target.src = "/assets/store-placeholder.png"; 
                        }}
                      />
                    </div>

                    <CardHeader className="p-3 sm:p-6">
                      <CardTitle className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                        <span className="text-base sm:text-lg">{store.name}</span>
                        <span className="text-xs sm:text-sm font-normal bg-primary/10 text-primary px-2 py-1 rounded-full flex items-center w-fit">
                          <Navigation className="h-3 w-3 mr-1" />
                          {formatDistance(store.distance)}
                        </span>
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="flex flex-col flex-1 p-3 sm:p-6 pt-0">
                      <div className="space-y-3 sm:space-y-4 flex-1">
                        <div className="flex items-start">
                          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-2 mt-1 text-muted-foreground flex-shrink-0" />
                          <span className="text-xs sm:text-sm">{store.address}</span>
                        </div>

                        {store.rating && (
                          <div className="flex items-center">
                            <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-yellow-500" />
                            <span className="text-xs sm:text-sm">{store.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 sm:pt-4 mt-auto">
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                          <Label htmlFor={`price-check-${store.id}`} className="text-xs sm:text-sm font-medium text-muted-foreground">
                            Include in Price Check
                          </Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                <Switch
                                  id={`price-check-${store.id}`}
                                  checked={currentlySelected}
                                  onCheckedChange={(checked) => {
                                    handlePriceCheckToggle(store.id, checked);
                                  }}
                                  disabled={isDisabled}
                                />
                              </div>
                            </TooltipTrigger>
                            {isDisabled && (
                              <TooltipContent>
                                <p className="text-xs sm:text-sm">3 stores max. Toggle off one of your selections to add another store.</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 text-xs sm:text-sm py-2 px-3"
                            onClick={() => openDirections(store)}
                          >
                            <Navigation className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            Directions
                          </Button>
                          
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="flex-1 text-xs sm:text-sm py-2 px-3"
                            onClick={() => openStoreWebsite(store)}
                            title={store.website ? "Visit store website" : "Search for store online"}
                          >
                            <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">Visit Website</span>
                            <span className="sm:hidden">Website</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              </div>
            </div>
          </div>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
};

export default StoreSelectionModal; 