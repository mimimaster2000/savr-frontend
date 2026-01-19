import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  TableCell, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  ShoppingCart, 
  MoreVertical, 
  Calendar, 
  Trash2, 
  Edit,
  Copy, 
  Share2, 
  Loader2,
  Store,
  ChevronDown,
  XCircle,
  X,
  MessageSquarePlus
} from 'lucide-react';
import { getUserGroceryLists, SavedGroceryList, GroceryItem, deleteGroceryList, updateGroceryListSavings, GroceryListSavingsUpdate, getSavingsSummary, SavingsSummary } from '@/services/groceryListService';
import {
  testShoppingRouter,
  checkPricesDirectly,

  // New imports
  getShoppingDataForList,
  saveProductSelection,
  ShoppingDataForList,
  SearchResultInDB,
  ProductSelectionCreate,
  GroceryProduct // Keep if still used for 'Nothing' product or similar temporary uses
} from '@/services/shoppingService';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '@/services/authService';
import storeService, { UserSelectedStore } from '@/services/storeService';
import { formatDate } from '@/lib/utils'; // Import formatDate
import { resetChatStore } from '@/stores/chatStore';
import chatService from '@/services/chatService';
import StoreSelectionModal from '@/components/StoreSelectionModal';
import '@/styles/carousel-scrollbar.css';
import SkeletonBar from '@/components/SkeletonBar';

import StoreShoppingModal from '@/components/StoreShoppingModal';

// Type definition for sorting state
type SortKey = 'name' | 'category' | 'meal' | 'quantity';
type SortDirection = 'asc' | 'desc';

type SortConfig =
  | { type: 'field'; key: SortKey; direction: SortDirection }
  | { type: 'storePrice'; storeName: string; direction: SortDirection };

// Extend GroceryProduct locally to allow imageUrl for type safety
// This might become SearchResultInDB directly if all products are from DB
interface GroceryProductWithImage extends SearchResultInDB { // Changed from GroceryProduct
  // imageUrl is already in SearchResultInDB (via GroceryProduct)
}

// Interface for per-list price data - ALIGNED WITH ShoppingDataForList
interface ListPriceData extends ShoppingDataForList { // Now extends ShoppingDataForList
  // shoppingResults: ShoppingDataForList['results']; // Now inherited
  // selectedProducts: ShoppingDataForList['selections']; // Now inherited
  storeSubtotals: Record<string, {total: number, itemCount: number}>; // Keep this local calculation
  // lastChecked?: string; // Now inherited from ShoppingDataForList (optional)
  dataSource: 'api' | 'mock' | 'localStorage' | null; // 'localStorage' will be phased out
  // session_id?: string | null; // Now inherited from ShoppingDataForList
  // status?: string; // Now inherited from ShoppingDataForList
}

// Helper for image fallback
const getProductImage = (imageUrl?: string) => imageUrl || '/assets/store-placeholder.png';

// Add a helper function for truncating product names
const truncateName = (name: string, maxLength = 25) => {
  if (!name) return '';
  const trimmedName = name.trim();
  return trimmedName.length > maxLength ? trimmedName.slice(0, maxLength) + '…' : trimmedName;
};

// Strictly format prices: return "$X.XX" or null if invalid
const formatPriceStrict = (price: string | number | null | undefined): string | null => {
  try {
    if (price === null || price === undefined) return null;
    if (typeof price === 'number' && isFinite(price)) {
      return `$${price.toFixed(2)}`;
    }
    if (typeof price === 'string') {
      const trimmed = price.trim();
      // Accept only plain dollar amounts with optional leading $ and up to 2 decimals
      const match = trimmed.match(/^\s*\$?\s*(\d+(?:\.\d{1,2})?)\s*$/);
      if (!match) return null;
      const numeric = parseFloat(match[1]);
      if (!isFinite(numeric)) return null;
      return `$${numeric.toFixed(2)}`;
    }
    return null;
  } catch {
    return null;
  }
};

// Prepare structured fields for tooltip display
const getProductTooltipFields = (product: Partial<GroceryProductWithImage> | Partial<GroceryProduct>): { brand: string; name: string; size: string } => {
  const brand = typeof (product as any)?.brand === 'string' ? ((product as any).brand as string).trim() : '';
  const name = typeof (product as any)?.name === 'string' ? ((product as any).name as string).trim() : '';
  const size = typeof (product as any)?.size === 'string' ? ((product as any).size as string).trim() : '';
  return { brand, name, size };
};

// Helper function to convert store names to proper title case
const formatStoreName = (storeName: string) => {
  if (!storeName) return '';
  
  // Handle special cases for known store names
  const specialCases: Record<string, string> = {
    'no frills': 'No Frills',
    'nofrills': 'No Frills', 
    'food basics': 'Food Basics',
    'foodbasics': 'Food Basics',
    'loblaws': 'Loblaws',
    'metro': 'Metro',
    'sobeys': 'Sobeys',
    'safeway': 'Safeway',
    'walmart': 'Walmart',
    'costco': 'Costco',
    'superstore': 'Superstore',
    'independent': 'Independent'
  };
  
  // Check if it's a special case first
  const lowerStoreName = storeName.toLowerCase().trim();
  if (specialCases[lowerStoreName]) {
    return specialCases[lowerStoreName];
  }
  
  // Otherwise apply title case
  return storeName
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Helper function to get the path for a store's logo
const getStoreLogoPath = (storeName: string): string => {
  if (!storeName) return '/assets/store_logos/default.svg'; // Fallback or placeholder

  const formattedName = storeName.toLowerCase().replace(/\s+/g, '-');
  // Add specific mappings if filenames don't directly match formatted names
  const logoMappings: Record<string, string> = {
    'no-frills': 'no-frills.svg',
    'food-basics': 'food-basics.svg',
    'loblaws': 'loblaws.svg',    
    'metro': 'metro.svg',
    'walmart': 'walmart.svg',   
    'superstore': 'superstore.svg',
    'independent': 'independent.svg',
    // New banners and special filename cases
    'valumart': 'valu-mart.svg',
    'valuemart': 'valu-mart.svg',
    'valu-mart': 'valu-mart.svg',
    'value-mart': 'valu-mart.svg',
    'zehrs': 'zehrs.svg',
    'maxi': 'maxi.svg',
    'fortinos': 'fortinos.svg',
    // Empire
    'sobeys': 'sobeys.svg',
    'safeway': 'safeway.svg',
  };

  const fileName = logoMappings[formattedName] || `${formattedName}.svg`;
  return `/assets/store_logos/${fileName}`;
};

// Memoized Store Summary Row Component to prevent unnecessary re-renders
const StoreSummaryRow = memo(({ 
  orderedStoreNames, 
  storeSubtotals,
  onStoreClick,
  isCompleted
}: { 
  orderedStoreNames: string[], 
  storeSubtotals: Record<string, {total: number, itemCount: number}>,
  onStoreClick: (storeName: string) => void,
  isCompleted: boolean
}) => {
  const storeEntries = Object.entries(storeSubtotals).filter(([_, storeData]) => storeData.total > 0);
  const lowestStore = storeEntries.length > 0 ? storeEntries.reduce(
    (lowest, [name, storeData]) => 
      storeData.total < lowest.total ? {name, total: storeData.total} : lowest,
    {name: '', total: Infinity}
  ) : {name: '', total: Infinity};
  
  const highestStore = storeEntries.length > 0 ? storeEntries.reduce(
    (highest, [name, storeData]) => 
      storeData.total > highest.total ? {name, total: storeData.total} : highest,
    {name: '', total: 0}
  ) : {name: '', total: 0};

  return (
    <TableRow className="bg-muted/20 hover:bg-muted/20 border-b-2">
      <TableCell colSpan={4} className="font-semibold text-primary">
        Store Totals
      </TableCell>
      {orderedStoreNames.map((store: string) => {
        const data = storeSubtotals[store];
        const isLowestPrice = storeEntries.length > 1 && lowestStore.name === store && data && data.total > 0;
        const canOpen = isCompleted && data && data.itemCount > 0;
        
        // Calculate savings compared to most expensive store
        const savings = data && data.total > 0 && highestStore.total > data.total 
          ? highestStore.total - data.total 
          : 0;
        const savingsPercent = savings > 0 && highestStore.total > 0 
          ? Math.round((savings / highestStore.total) * 100) 
          : 0;
        
        return (
          <TableCell key={`summary-${store}`} className="w-[240px]">
            <div 
              className={`p-3 rounded-md border transition-all ${isLowestPrice ? 'border-green-500 bg-green-50 shadow-sm' : 'border-border bg-background'} ${canOpen ? 'cursor-pointer hover:shadow-md' : ''}`}
              onClick={() => { if (canOpen) onStoreClick(store); }}
              onKeyDown={(e) => { if (canOpen && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onStoreClick(store); } }}
              role={canOpen ? 'button' : undefined}
              tabIndex={canOpen ? 0 : -1}
              title={canOpen ? 'Open store view' : undefined}
            >
              <div className="flex items-center justify-between mb-2">
                <img 
                  src={getStoreLogoPath(store)} 
                  alt={`${formatStoreName(store)} logo`} 
                  className="h-5 w-auto object-contain"
                  onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => { 
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                {isLowestPrice && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs font-medium">
                    Best Price
                  </Badge>
                )}
              </div>
              {data && data.total > 0 ? (
                <>
                  <div className="text-sm text-muted-foreground">
                    {data.itemCount} item{data.itemCount !== 1 ? 's' : ''}
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    ${data.total.toFixed(2)}
                  </div>
                  {savings > 0 && (
                    <div className="text-xs text-green-600 mt-1 font-medium">
                      Save ${savings.toFixed(2)} ({savingsPercent}%) compared to {formatStoreName(highestStore.name)}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No items selected
                </div>
              )}
            </div>
          </TableCell>
        );
      })}
    </TableRow>
  );
});

StoreSummaryRow.displayName = 'StoreSummaryRow';

// Memoized ListCard component to prevent unnecessary re-renders
const ListCard = memo(React.forwardRef<HTMLDivElement, { 
  list: SavedGroceryList, 
  isSelected: boolean, 
  isPending: boolean, 
  onSelect: (list: SavedGroceryList) => void, 
  onDeleteConfirm: (list: SavedGroceryList, e: React.MouseEvent) => void,
  savedAmount: number | null 
}>(({ 
  list, 
  isSelected, 
  isPending, 
  onSelect, 
  onDeleteConfirm,
  savedAmount 
}, ref) => {
  return (
    <Card
      ref={ref}
      className={`min-w-[250px] max-w-[300px] flex-shrink-0 overflow-hidden cursor-pointer transition-all ${
        isSelected || isPending ? 'ring-2 ring-primary' : 'border'
      }`}
      onClick={() => onSelect(list)}
    >
      <CardHeader className="pb-1 pt-3 flex flex-row items-start justify-between">
        <div>
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <CardTitle className="text-lg truncate max-w-[170px]">{list.name}</CardTitle>
              </TooltipTrigger>
              <TooltipContent side="top" align="start">
                <p>{list.name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <CardDescription className="flex items-center gap-1 text-xs">
            <Calendar className="h-3 w-3" />
            <span>Created: {formatDate(list.createdAt)}</span>
          </CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1 -mr-2" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e: React.MouseEvent) => onDeleteConfirm(list, e)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="pt-0 pb-3">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{list.items.length} items</span>
          {savedAmount !== null && savedAmount > 0 && (
            <span className="text-green-600 font-medium">Saved ${savedAmount.toFixed(2)}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}));

ListCard.displayName = 'ListCard';

const ListsPage = () => {
  console.log('ListsPage component rendering');
  const [lists, setLists] = useState<SavedGroceryList[]>([]);
  const [selectedList, setSelectedList] = useState<SavedGroceryList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [listToDelete, setListToDelete] = useState<SavedGroceryList | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Add state for table sorting
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  // Modal state for focused store view (route-backed)
  const [isStoreViewOpen, setIsStoreViewOpen] = useState(false);
  const [focusedStoreName, setFocusedStoreName] = useState<string | null>(null);
  const [modalSortConfig, setModalSortConfig] = useState<SortConfig | null>(null);
  
  // Shopping-related state - NOW PER-LIST
  const [isShoppingNow, setIsShoppingNow] = useState(false);
  const [isPollingActive, setIsPollingActive] = useState(false);
  
  // Add separate loading state for list data (won't affect carousel)
  const [isLoadingListData, setIsLoadingListData] = useState(false);
  
  // Store all price data per list ID
  const [listPriceDataMap, setListPriceDataMap] = useState<Record<string, ListPriceData>>({});
  
  // Cache size limit (keep data for last N lists)
  const MAX_CACHED_LISTS = 5;

  // Add state for selected stores
  const [selectedStores, setSelectedStores] = useState<UserSelectedStore[]>([]);
  
  // Add state for savings summary
  const [savingsSummary, setSavingsSummary] = useState<SavingsSummary | null>(null);

  // Add state for creating new list
  const [isCreatingNewList, setIsCreatingNewList] = useState(false);

  // Add state for store selection modal
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);

  // Carousel scrollbar visibility state
  const [showCarouselScrollbar, setShowCarouselScrollbar] = useState(false);
  const carouselScrollbarTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Ref to track pending product selections to avoid duplicate API calls
  const pendingSelectionsRef = useRef(new Set<string>());

  // Refs for managing list selection and preventing cascading updates
  const currentListDataRef = useRef<ListPriceData | null>(null);
  const [currentListDataVersion, setCurrentListDataVersion] = useState(0);
  const listSelectionOrderRef = useRef<string[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const selectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [pendingListSelection, setPendingListSelection] = useState<SavedGroceryList | null>(null);

  // Ref to store the signature of the last saved price comparison data
  const lastSavedPriceComparisonSignatureRef = useRef<string | null>(null);

  // Ref for the horizontal scroll container
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Refs for individual list cards
  const listCardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const fetchSavingsSummary = async () => {
    try {
      const summary = await getSavingsSummary();
      setSavingsSummary(summary);
    } catch (error) {
      console.error('Error fetching savings summary:', error);
      // Don't show error toast for this - just silently fail
    }
  };

  // Helper function to get current list's price data
  const getCurrentListPriceData = useCallback((): ListPriceData | null => {
    if (!selectedList) return null;
    // Ensure a default structure if no data yet for the list
    return listPriceDataMap[selectedList.id] || {
      results: {},
      selections: {},
      storeSubtotals: {},
      dataSource: null,
      session_id: null,
      last_checked: null,
      status: undefined
    };
  }, [selectedList, listPriceDataMap]);

  // Update the stable reference only when current list's data meaningfully changes
  useEffect(() => {
    const newData = getCurrentListPriceData();
    const oldData = currentListDataRef.current;
    
    // Only update if there's a meaningful change for the current list
    if (!selectedList || !newData) {
      currentListDataRef.current = null;
      return;
    }
    
    // Check if this is actually different data
    const hasChanged = !oldData || 
      !isEqual(oldData.results, newData.results) ||
      !isEqual(oldData.selections, newData.selections) ||
      oldData.status !== newData.status ||
      oldData.session_id !== newData.session_id;
      
    if (hasChanged) {
      currentListDataRef.current = newData;
      setCurrentListDataVersion(v => v + 1); // Trigger dependent effects
    }
  }, [selectedList?.id, listPriceDataMap[selectedList?.id || ''], getCurrentListPriceData]);

  // Helper function to update price data for a specific list
  const updateListPriceData = useCallback((listId: string, data: Partial<ListPriceData>) => {
    setListPriceDataMap(prev => {
      // Update selection order
      listSelectionOrderRef.current = [
        listId,
        ...listSelectionOrderRef.current.filter(id => id !== listId)
      ].slice(0, MAX_CACHED_LISTS);
      
      const currentDataForList = prev[listId] || {
        results: {},
        selections: {},
        storeSubtotals: {},
        dataSource: null,
        session_id: null,
        last_checked: null,
        status: undefined
      };

      // Check if there's any actual change in the data that warrants an update
      let hasMeaningfulChange = false;
      if (data.results !== undefined && !isEqual(currentDataForList.results, data.results)) {
        hasMeaningfulChange = true;
      }
      if (data.selections !== undefined && !isEqual(currentDataForList.selections, data.selections)) {
        hasMeaningfulChange = true;
      }
      // Also consider status, session_id, and last_checked as meaningful changes
      if (data.status !== undefined && currentDataForList.status !== data.status) {
        hasMeaningfulChange = true;
      }
      if (data.session_id !== undefined && currentDataForList.session_id !== data.session_id) {
        hasMeaningfulChange = true;
      }
      if (data.last_checked !== undefined && currentDataForList.last_checked !== data.last_checked) {
        hasMeaningfulChange = true;
      }
      if (data.dataSource !== undefined && currentDataForList.dataSource !== data.dataSource) {
        hasMeaningfulChange = true;
      }
      // If storeSubtotals are passed, and they changed.
      if (data.storeSubtotals !== undefined && !isEqual(currentDataForList.storeSubtotals, data.storeSubtotals)) {
        hasMeaningfulChange = true;
      }


      if (!hasMeaningfulChange) {
        console.log(`[updateListPriceData] No meaningful change detected for list ${listId}. Skipping update.`);
        return prev; // Return previous state map, no re-render
      }
      
      console.log(`[updateListPriceData] Meaningful change detected for list ${listId}. Proceeding with update.`);
      const updatedData: ListPriceData = {
        ...currentDataForList,
        ...data,
        // Ensure results and selections are always defined objects if updated
        results: data.results !== undefined ? data.results : currentDataForList.results,
        selections: data.selections !== undefined ? data.selections : currentDataForList.selections,
        storeSubtotals: data.storeSubtotals !== undefined ? data.storeSubtotals : currentDataForList.storeSubtotals,
      };

      const newMap = {
        ...prev,
        [listId]: updatedData
      };
      
      // Evict based on selection order, not time
      const listIds = Object.keys(newMap);
      if (listIds.length > MAX_CACHED_LISTS) {
        const idsToKeep = new Set(listSelectionOrderRef.current);
        const idsToRemove = listIds.filter(id => !idsToKeep.has(id));
        idsToRemove.forEach(id => delete newMap[id]);
      }
      
      return newMap;
    });
  }, []);

  // Get current list data for easy access
  const currentListData = getCurrentListPriceData();
  const results = currentListData?.results || {};
  const selections = currentListData?.selections || {};
  const storeSubtotals = currentListData?.storeSubtotals || {};
  // const dataSource = currentListData?.dataSource || null; // dataSource will now be managed by fetchAndSetShoppingDataForList

  // Memoized store subtotals to prevent flickering during rapid updates
  const memoizedStoreSubtotals = useMemo(() => {
    return storeSubtotals;
  }, [storeSubtotals]);

  // Helper: parse price string/number to a numeric value; returns null if not a valid price
  const parsePriceToNumber = useCallback((price: string | number | null | undefined): number | null => {
    try {
      if (price === null || price === undefined) return null;
      if (typeof price === 'number') {
        return isFinite(price) ? price : null;
      }
      if (typeof price === 'string') {
        const numericPart = price.replace(/[$£€]/g, '').trim();
        if (numericPart === '') return null;
        const value = parseFloat(numericPart);
        return isFinite(value) ? value : null;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // Resolve a comparable price for an item at a given store
  // Priority: selected product (if not "Nothing") -> lowest price in results -> null if none
  const getComparablePrice = useCallback((item: GroceryItem, storeName: string): number | null => {
    const byItemSelections = selections[item.name];
    const selected = byItemSelections ? byItemSelections[storeName] : undefined;
    if (selected) {
      if (selected.name === 'Nothing') {
        // Treat "Nothing" as no price for sorting purposes
        return null;
      }
      const parsed = parsePriceToNumber(selected.price as any);
      if (parsed !== null) return parsed;
    }

    const byItemResults = results[item.name];
    const productsAtStore = byItemResults ? (byItemResults[storeName] as SearchResultInDB[] | undefined) : undefined;
    if (Array.isArray(productsAtStore) && productsAtStore.length > 0) {
      let lowest: number | null = null;
      for (const product of productsAtStore) {
        const val = parsePriceToNumber(product.price as any);
        if (val === null) continue;
        lowest = lowest === null ? val : Math.min(lowest, val);
      }
      return lowest;
    }

    return null;
  }, [results, selections, parsePriceToNumber]);

  // Memoized ordered list of stores - cheapest first, then natural discovery order
  const orderedStoreNames = useMemo<string[]>(() => {
    const seenStores = new Set<string>();
    const orderedNames: string[] = [];
    
    // Add stores in the order they first appear in results (natural discovery order)
    Object.values(results).forEach(productsByStore => {
      if (productsByStore && typeof productsByStore === 'object') {
        Object.keys(productsByStore).forEach(store => {
          if (!seenStores.has(store)) {
            seenStores.add(store);
            orderedNames.push(store);
          }
        });
      }
    });
    
    // Then add any stores from selections that weren't already in results
    // This maintains columns even if results are temporarily empty for some stores
    Object.values(selections).forEach(storeSelections => {
      if (storeSelections && typeof storeSelections === 'object') {
        Object.keys(storeSelections).forEach(store => {
          if (!seenStores.has(store)) {
            seenStores.add(store);
            orderedNames.push(store);
          }
        });
      }
    });
    
    // Sort to put cheapest store first
    const currentData = getCurrentListPriceData();
    if (currentData && currentData.storeSubtotals && Object.keys(currentData.storeSubtotals).length > 0) {
      const sortedStores = orderedNames.sort((a, b) => {
        const totalA = currentData.storeSubtotals[a]?.total || 0;
        const totalB = currentData.storeSubtotals[b]?.total || 0;
        
        // Only sort if both stores have valid totals
        if (totalA > 0 && totalB > 0) {
          return totalA - totalB; // Cheapest first
        }
        
        // Keep original order for stores without totals
        return 0;
      });
      
      return sortedStores;
    }
    
    return orderedNames;
  }, [results, selections, getCurrentListPriceData]);

  // Function to calculate store subtotals
  const calculateStoreSubtotals = useCallback(() => {
    if (!selectedList) return;
    
    console.log("Calculating store subtotals...");
    
    const currentData = getCurrentListPriceData();
    if (!currentData || !currentData.selections || Object.keys(currentData.selections).length === 0) {
      console.log("No selected products to calculate subtotals for");
      // Only update if there's a change to prevent render loops
      if (currentData && Object.keys(currentData.storeSubtotals).length > 0) {
        updateListPriceData(selectedList.id, { storeSubtotals: {} });
      }
      return;
    }

    const totals: Record<string, {total: number, itemCount: number}> = {};
    
    // Loop through each item's selected products
    Object.entries(currentData.selections).forEach(([itemName, storeSelections]) => {
      if (!storeSelections) return; // Skip if storeSelections is undefined
      
      // Loop through each store's selection for this item
      Object.entries(storeSelections).forEach(([storeName, product]) => {
        if (!product) return; // Skip if product is undefined
        
        // Skip products with name "Nothing" or price "$0.00"
        if (product.name === "Nothing" || product.price === "$0.00") {
          console.log(`Skipping ${itemName} from ${storeName} (Nothing/zero price selection)`);
          return;
        }
        
        // Initialize store totals if not already present
        if (!totals[storeName]) {
          totals[storeName] = { total: 0, itemCount: 0 };
        }
        
        // Extract numeric price from the price string (e.g., "$3.99" -> 3.99)
        // Add null check for product.price
        const priceStr = product.price || "0";
        let priceValue = 0;
        
        try {
          if (typeof priceStr === 'string') {
            // Try to parse the numeric value from the price string
            const numericPart = priceStr.replace(/[$£€]/g, '').trim();
            priceValue = parseFloat(numericPart) || 0;
          } else if (typeof priceStr === 'number') {
            priceValue = priceStr;
          }
        } catch (error) {
          console.error(`Error parsing price "${priceStr}" for ${itemName} from ${storeName}:`, error);
          priceValue = 0;
        }
        
        // Add to the store total
        totals[storeName].total += priceValue;
        totals[storeName].itemCount += 1;
        
        console.log(`Added ${priceValue} for ${itemName} from ${storeName}, new total: $${totals[storeName].total.toFixed(2)}`);
      });
    });
    
    console.log("Final store subtotals:", totals);
    
    // Only update state if we have actual totals AND they're different from current state
    // This prevents unnecessary re-renders
    if (Object.keys(totals).length > 0) {
      // Check if totals are different from current state
      const needsUpdate = !isEqual(totals, currentData.storeSubtotals);
      
      if (needsUpdate) {
        console.log("Updating store subtotals state");
        updateListPriceData(selectedList.id, { storeSubtotals: totals });
      } else {
        console.log("Store subtotals unchanged, skipping update");
      }
    }
  }, [selectedList, getCurrentListPriceData, updateListPriceData]);

  // Helper function to compare objects
  function isEqual(obj1: any, obj2: any, epsilon = 0.00001): boolean {
    if (obj1 === obj2) return true; // Handles primitives and same object reference

    if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
      // If one is an object and the other isn't, or if they are different primitives (not caught by ===)
      // Check for floating point numbers if both are numbers
      if (typeof obj1 === 'number' && typeof obj2 === 'number' && Math.abs(obj1 - obj2) < epsilon) {
        return true;
      }
      return false;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
      if (!keys2.includes(key)) return false; // Make sure key exists in obj2

      const val1 = obj1[key];
      const val2 = obj2[key];

      const areObjects = typeof val1 === 'object' && val1 !== null && typeof val2 === 'object' && val2 !== null;

      if (areObjects) {
        if (!isEqual(val1, val2, epsilon)) return false;
      } else if (typeof val1 === 'number' && typeof val2 === 'number') {
        if (Math.abs(val1 - val2) >= epsilon) return false; // Floating point comparison
      } else {
        if (val1 !== val2) return false;
      }
    }
    return true;
  }

  // Calculate subtotals when relevant data changes, but with debouncing to prevent loops
  useEffect(() => {
    if (!selectedList?.id || !currentListDataRef.current) return;
    
    // Only calculate if we have selections for the current list
    const currentSelections = currentListDataRef.current.selections;
    if (!currentSelections || Object.keys(currentSelections).length === 0) return;
    
    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;
    
    console.log("[SubtotalEffect] Selections changed, scheduling subtotal recalculation. Selections keys:", Object.keys(currentSelections));
    
    // Use RAF to batch DOM updates
    requestAnimationFrame(() => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        if (isMounted) {
          calculateStoreSubtotals();
        }
      }, 100); // Keep debounce
    });
    
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [selectedList?.id, currentListDataVersion, calculateStoreSubtotals]);

  // Function to calculate and save price comparison data to database
  const calculateAndSavePriceComparison = useCallback(async () => {
    if (!selectedList) return;
    
    const currentData = getCurrentListPriceData();
    if (!currentData || !currentData.storeSubtotals) return;
    
    // Get stores with valid totals
    const storeEntries = Object.entries(currentData.storeSubtotals)
      .filter(([_, data]) => data.total > 0)
      .map(([name, data]) => ({ name, ...data }));
    
    // Need at least 2 stores to calculate savings
    if (storeEntries.length < 2) {
      console.log("Not enough stores with prices to calculate savings");
      return;
    }
    
    // Find lowest and highest price stores
    const lowestStore = storeEntries.reduce((lowest, store) => 
      store.total < lowest.total ? store : lowest
    );
    
    const highestStore = storeEntries.reduce((highest, store) => 
      store.total > highest.total ? store : highest
    );
    
    // Calculate savings
    const savingsAmount = highestStore.total - lowestStore.total;
    const savingsPercent = (savingsAmount / highestStore.total) * 100;
    
    // Prepare savings data
    const savingsData: GroceryListSavingsUpdate = {
      savings_amount: savingsAmount,
      savings_percent: savingsPercent,
      most_expensive_store_name: highestStore.name,
      most_expensive_store_price: highestStore.total,
      least_expensive_store_name: lowestStore.name,
      least_expensive_store_price: lowestStore.total
    };

    // Generate a signature for the current comparison
    const currentSignature = JSON.stringify({
      listId: selectedList.id, // ensure list context is part of signature
      savingsAmount: savingsAmount.toFixed(2), // Use toFixed for consistent float string
      savingsPercent: savingsPercent.toFixed(2),
      mostExpensiveStoreName: highestStore.name,
      mostExpensiveStorePrice: highestStore.total.toFixed(2),
      leastExpensiveStoreName: lowestStore.name,
      leastExpensiveStorePrice: lowestStore.total.toFixed(2),
    });

    // Check against the last saved signature
    if (lastSavedPriceComparisonSignatureRef.current === currentSignature) {
      console.log("[AutoSave] Price comparison data is identical to the last saved version. Skipping save.", currentSignature);
      return; // Exit if data is the same
    }
    
    console.log("Calculated savings data (new or different):", savingsData);
    console.log("New signature:", currentSignature);
    console.log("Old signature:", lastSavedPriceComparisonSignatureRef.current);
    
    try {
      // Save to database
      const updatedList = await updateGroceryListSavings(selectedList.id, savingsData);
      
      // Update local state with the saved data
      setLists(prevLists => 
        prevLists.map(list => 
          list.id === selectedList.id ? updatedList : list
        )
      );
      
      // Update selected list as well
      if (selectedList.id === updatedList.id) {
        setSelectedList(updatedList);
      }

      // IMPORTANT: Update the signature ref AFTER successful save
      lastSavedPriceComparisonSignatureRef.current = currentSignature;
      
      console.log("Successfully saved price comparison data to database. Updated signature.");
      
      toast({
        title: "Price Comparison Saved",
        description: `You can save ${savingsPercent.toFixed(0)}% by shopping at ${formatStoreName(lowestStore.name)}`,
      });
      
      // Refresh savings summary
      fetchSavingsSummary();
    } catch (error) {
      console.error("Error saving price comparison data:", error);
      toast({
        title: "Error Saving Comparison",
        description: "Could not save price comparison data. Please try again.",
        variant: "destructive"
      });
    }
  }, [selectedList, getCurrentListPriceData, updateGroceryListSavings, toast, setLists]);

  // Memoized input signature for price comparison to make the auto-save effect more targeted
  const priceComparisonInputSignature = useMemo(() => {
    if (!selectedList?.id || !currentListDataRef.current?.storeSubtotals || currentListDataRef.current.status !== 'completed') {
      return null; // Not ready to save
    }
    const { storeSubtotals } = currentListDataRef.current;

    const sortedStoreNames = Object.keys(storeSubtotals).sort();
    const relevantSubtotals = sortedStoreNames.reduce((acc, storeName) => {
      if (storeSubtotals[storeName]?.total > 0) { // Only include stores with actual totals
        acc[storeName] = {
          total: storeSubtotals[storeName].total.toFixed(2), // Consistent formatting
          itemCount: storeSubtotals[storeName].itemCount
        };
      }
      return acc;
    }, {} as Record<string, {total: string, itemCount: number}>);

    if (Object.keys(relevantSubtotals).length < 2) return null; // Not enough data to compare

    return JSON.stringify({
      listId: selectedList.id,
      status: currentListDataRef.current.status,
      subtotals: relevantSubtotals,
    });
  }, [selectedList?.id, currentListDataVersion]);

  // Auto-save price comparison when store subtotals change (after user selections)
  useEffect(() => {
    // Use the memoized signature to decide if we should proceed
    if (!priceComparisonInputSignature) {
      console.log("[AutoSave Effect] Conditions not met for saving (priceComparisonInputSignature is null).");
      return;
    }
    
    // Debounce the save
    const timeoutId = setTimeout(() => {
      console.log("[AutoSave Effect] Conditions met, attempting to save price comparison. Signature:", priceComparisonInputSignature);
      calculateAndSavePriceComparison(); // This function now has its own internal check
    }, 2000); 
    
    return () => clearTimeout(timeoutId);
  }, [priceComparisonInputSignature, calculateAndSavePriceComparison]); // Dependency on the signature and the function itself

  // Test shopping router when component mounts
  useEffect(() => {
    const testShopping = async () => {
      try {
        console.log('Testing shopping router on page load...');
        const result = await testShoppingRouter();
        console.log('Shopping router is accessible:', result);
      } catch (error) {
        console.error('Shopping router is not accessible:', error);
      }
    };
    
    testShopping();
  }, []);

  // NEW: Function to fetch shopping data from API and update state
  const fetchAndSetShoppingDataForList = useCallback(async (listId: string) => {
    if (!listId) return;
    
    // Cancel any previous fetch for a different list
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    console.log(`Fetching API shopping data for list ${listId}`);
    setIsLoadingListData(true); // Use specific loading state for list data
    try {
      const apiData = await getShoppingDataForList(listId); // Note: API needs to support signal
      
      // Check if this request was aborted
      if (signal.aborted) {
        console.log(`Fetch aborted for list ${listId}`);
        return;
      }
      
      updateListPriceData(listId, {
        results: apiData.results || {},
        selections: apiData.selections || {},
        session_id: apiData.session_id || null,
        last_checked: apiData.last_checked || null,
        status: apiData.status,
        dataSource: 'api'
      });
      console.log(`Successfully fetched and set API data for list ${listId}`, apiData);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log(`Fetch aborted for list ${listId}`);
        return;
      }
      console.error(`Error fetching shopping data for list ${listId} from API:`, error);
      toast({
        title: "Error Fetching Prices",
        description: `Could not load price data for the list. ${(error as Error).message}`,
        variant: "destructive",
      });
      // Optionally, clear data or set an error state for the list
      updateListPriceData(listId, {
        results: {},
        selections: {},
        dataSource: 'api', // Still API attempt, but failed
        status: 'error',
        storeSubtotals: {},
      });
    } finally {
      setIsLoadingListData(false); // Or the specific loading state
    }
  }, [updateListPriceData, toast]);

  // Function to create a new list (fresh chat session)
  const handleCreateNewList = async () => {
    setIsCreatingNewList(true);
    try {
      // Clear all localStorage items related to chat
      const { setUserScopedSessionId } = await import('@/stores/chatStore');
      setUserScopedSessionId(null);
      localStorage.removeItem('savr-chat-storage');
      
      // Clear the chat store state
      resetChatStore();
      
      // Get a fresh welcome message with new session
      const welcomeResponse = await chatService.getWelcomeMessage();
      
      // Set the new session ID
      if (welcomeResponse.session_id && !welcomeResponse.session_id.startsWith('error-')) {
        const { setUserScopedSessionId } = await import('@/stores/chatStore');
        setUserScopedSessionId(welcomeResponse.session_id);
      }
      
      // Navigate to chat page
      navigate('/chat');
      
      toast({
        title: "New List Started",
        description: "Ready to create your new grocery list!",
      });
    } catch (error) {
      console.error('Error creating new list:', error);
      toast({
        title: "Error Creating New List",
        description: "Could not start a new list. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreatingNewList(false);
    }
  };

  // Function to fetch grocery lists
  const fetchGroceryLists = async (listIdToSelect?: string) => {
    try {
      console.log('Fetching grocery lists...');
      setIsLoading(true);
      
      // Fetch the lists from API
      const userLists = await getUserGroceryLists();
      console.log('Fetched grocery lists (raw):', userLists); // Log raw lists
      userLists.forEach(list => {
        console.log(`List ${list.id}: createdAt=${list.createdAt}, lastUpdated=${list.lastUpdated}`);
      });
      
      // Ensure we have unique lists by ID
      const uniqueLists = removeDuplicateListsById(userLists);
      
      // Sort lists by createdAt in descending order (newest first)
      const sortedLists = uniqueLists.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // Descending order (newest first)
      });
      
      if (sortedLists && sortedLists.length > 0) {
        console.log(`Found ${sortedLists.length} unique lists. Setting lists state.`);
        
        // Update the lists state
        setLists(sortedLists);
        
        // Select the specified list if provided, otherwise select the first list
        const listToSelect = listIdToSelect
          ? sortedLists.find(list => list.id === listIdToSelect)
          : sortedLists[0]; // Select first list by default

        // Update the selected list state
        if (listToSelect) {
          console.log(`Selecting list: ${listToSelect.id}`);
          console.log(`Selected list details: createdAt=${listToSelect.createdAt}, lastUpdated=${listToSelect.lastUpdated}`); // Log selected list dates
          setSelectedList(listToSelect);
          
          // Data fetching will now be handled by the useEffect hook observing selectedList
        } else {
          console.log('No list to select');
          setSelectedList(null);
        }
      } else {
        console.log('No lists found. Showing empty state.');
        setLists([]);
        setSelectedList(null);
      }
    } catch (error) {
      console.error('Error fetching grocery lists:', error);
      toast({
        title: "Failed to load lists",
        description: "There was an error fetching your grocery lists.",
        variant: "destructive"
      });
      setLists([]);
      setSelectedList(null);
    } finally {
      // Always mark loading as complete
      setIsLoading(false);
    }
  };

  const removeDuplicateListsById = (lists: SavedGroceryList[]): SavedGroceryList[] => {
    if (!lists) return [];
    
    const uniqueListMap = new Map<string, SavedGroceryList>();
    
    // Keep only the latest entry for each unique ID
    for (const list of lists) {
      uniqueListMap.set(list.id, list);
    }
    
    return Array.from(uniqueListMap.values());
  };

  // A single consolidated initialization effect that handles everything needed on mount
  useEffect(() => {
    console.log('ListsPage mounted - initializing component');
    
    // Check auth status
    const isLoggedIn = authService.isLoggedIn();
    console.log(`User login status: ${isLoggedIn}`);
    
    // Initialize the component by loading lists
    const loadInitialData = async () => {
      try {
        // Check if we should select a specific list from navigation state
      const listIdToSelect = location.state?.fromChatSave && location.state?.listId 
        ? location.state.listId 
        : undefined;
      
        // Fetch the lists
      await fetchGroceryLists(listIdToSelect);
      
        // Show save message if we navigated from chat page
      if (location.state?.fromChatSave) {
        toast({
          title: "List saved successfully",
          description: "Your grocery list has been saved.",
        });
        window.history.replaceState({}, document.title);
        }
      } catch (error) {
        console.error("Error during initial component load:", error);
        toast({
          title: "Loading Error",
          description: "Failed to load your grocery lists. Please try refreshing.",
          variant: "destructive"
        });
      }
    };
    
    // Start the initialization process
    loadInitialData();
    
    // Fetch savings summary
    fetchSavingsSummary();
    
    // For test API connectivity 
    const testShopping = async () => {
      try {
        const result = await testShoppingRouter();
        console.log('Shopping router is accessible:', result);
      } catch (error) {
        console.error('Shopping router is not accessible:', error);
      }
    };
    testShopping();
    
    // This effect should only run once on mount
  }, []);

  // Open/close modal based on URL param ?storeView=store and react to location changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const storeView = params.get('storeView');
    const ready = currentListDataRef.current && currentListDataRef.current.status === 'completed';
    if (storeView && ready) {
      if (!isStoreViewOpen || focusedStoreName !== storeView) {
        setFocusedStoreName(storeView);
        setIsStoreViewOpen(true);
      }
    } else if (!storeView && isStoreViewOpen) {
      setIsStoreViewOpen(false);
    }
  }, [location.search, currentListDataVersion]);

  // Restore isListSelected function (referenced in the Card component)
  const isListSelected = (listId: string): boolean => {
    return pendingListSelection?.id === listId || selectedList?.id === listId;
  };

  // Restore confirmDeleteList function
  const confirmDeleteList = (list: SavedGroceryList, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting the list when clicking delete
    setListToDelete(list);
  };

  // Restore handleDeleteList function
  const handleDeleteList = async () => {
    if (!listToDelete) return;
    
    try {
      setIsLoading(true);
      await deleteGroceryList(listToDelete.id);
      
      const updatedLists = lists.filter(list => list.id !== listToDelete.id);
      setLists(updatedLists);
      
      // If the selected list was deleted, select another list or clear selection
      if (selectedList && selectedList.id === listToDelete.id) {
        setSelectedList(updatedLists.length > 0 ? updatedLists[0] : null);
      }
      
      toast({
        title: "List deleted",
        description: `"${listToDelete.name}" has been deleted.`,
      });
      
      // Reset the listToDelete state
      setListToDelete(null);
    } catch (error) {
      console.error('Error deleting list:', error);
      toast({
        title: "Error deleting list",
        description: "There was a problem deleting your list. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch selected stores on mount (Restored)
  useEffect(() => {
    storeService.getUserSelectedStores()
      .then(setSelectedStores)
      .catch((e: any) => {
        console.error('Failed to fetch selected stores on mount', e);
        toast({
          title: "Store Load Error",
          description: "Could not load your saved store preferences.",
          variant: "default"
        });
      });
  }, [toast]); // Added toast to dependency array

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Polling function with better logging and error handling - MOVED BEFORE handleShopNow
  const startPollingForResults = useCallback((listId: string) => {
    console.log(`[Polling] Starting polling for list ${listId}`);
    setIsPollingActive(true); // Set polling active
    
    // Clear any existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    let pollCount = 0;
    const maxPolls = 120; // Poll for up to 5 minutes (120 * 2.5s)
    
    // Start polling
    pollingIntervalRef.current = setInterval(async () => {
      pollCount++;
      try {
        console.log(`[Polling] Fetching data for list ${listId} (poll #${pollCount})`);
        const data = await getShoppingDataForList(listId);
        
        // Log raw status from API
        console.log(`[Polling] Raw data from API:`, data);
        console.log(`[Polling] Received status: '${data.status}'`);

        const hasResults = Object.keys(data.results || {}).length > 0;
        
        console.log(`[Polling] Received data details:`, {
          resultsCount: Object.keys(data.results || {}).length,
          selectionsCount: Object.keys(data.selections || {}).length,
          status: data.status,
          sessionId: data.session_id,
          hasResults
        });

        const payloadForUpdate: Partial<ListPriceData> = {
          dataSource: 'api',
          status: data.status, // Always update status
          session_id: data.session_id !== undefined ? data.session_id : null, // Preserve null if explicitly undefined
          last_checked: data.last_checked !== undefined ? data.last_checked : null, // Preserve null if explicitly undefined
        };

        // Handle 'results':
        // Only include 'results' in the payload if:
        // 1. New results are provided and are non-empty.
        // 2. OR the session is terminal (completed/failed) - in this case, we take whatever results API sent (even if empty or undefined, which updateListPriceData will default to {}).
        if (data.results && Object.keys(data.results).length > 0) {
          payloadForUpdate.results = data.results;
        } else if (data.status === 'completed' || data.status === 'failed') {
          payloadForUpdate.results = data.results; // Will be handled by updateListPriceData (defaults to {} if undefined)
        }
        // If neither of these conditions is met (e.g., in_progress and data.results is empty/undefined),
        // payloadForUpdate.results remains undefined. The updateListPriceData function will then preserve
        // the existing results for the list, preventing them from being cleared.

        // Handle 'selections' with the same logic:
        if (data.selections && Object.keys(data.selections).length > 0) {
          payloadForUpdate.selections = data.selections;
        } else if (data.status === 'completed' || data.status === 'failed') {
          payloadForUpdate.selections = data.selections; // Will be handled by updateListPriceData
        }
        // If selections remain undefined in payload, updateListPriceData preserves existing.
        
        console.log(`[Polling] Payload for updateListPriceData:`, payloadForUpdate);
        updateListPriceData(listId, payloadForUpdate);
        
        // REVISED Stop polling condition:
        // Stop if backend reports session is completed or failed.
        const sessionOver = data.status === 'completed' || data.status === 'failed';
        console.log(`[Polling] Checking stop conditions: sessionOver=${sessionOver} (status: ${data.status}), pollCount=${pollCount}, maxPolls=${maxPolls}`);

        if (sessionOver) {
          console.log(`[Polling] Stopping - Search session status: '${data.status}'.`);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setIsPollingActive(false);
          setIsShoppingNow(false); // Also set isShoppingNow to false
          
          toast({
            title: data.status === 'completed' ? "Search Complete" : "Search Failed or Ended",
            description: data.status === 'completed' 
              ? `Price check finished. ${hasResults ? 'Products found.' : 'No products found for some items.'}`
              : "Search session ended. Check results or try again.",
            variant: data.status === 'completed' && hasResults ? "default" : (data.status === 'completed' ? "default" : "destructive")
          });
          
          // If search completed successfully, calculate and save price comparison
          if (data.status === 'completed' && hasResults) {
            // Wait a bit for store subtotals to be calculated
            setTimeout(() => {
              calculateAndSavePriceComparison();
            }, 500);
          }
        } else if (pollCount >= maxPolls) {
          console.log(`[Polling] Stopping - max polls reached (${maxPolls}). Current status: ${data.status}`);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setIsPollingActive(false);
          setIsShoppingNow(false);
          
          toast({
            title: "Search Timeout",
            description: "The search took too long. Some results may still be available.",
            variant: "default"
          });
        }
      } catch (err) {
        console.error('[Polling] Error fetching data:', err);
        // Don't stop polling on error - let it retry
      }
    }, 2500); // Poll every 2.5 seconds
  }, [updateListPriceData, toast, calculateAndSavePriceComparison]);

  // UPDATED handleSelectProduct function
  const handleSelectProduct = async (itemName: string, product: SearchResultInDB | GroceryProduct, storeName: string) => {
    if (!selectedList || !selectedList.id) {
      toast({ title: "Error", description: "No list selected for saving choice.", variant: "destructive" });
      return;
    }

    const selectionKey = `${itemName}_${storeName}`;
    if (pendingSelectionsRef.current.has(selectionKey)) {
      console.log(`[HandleSelectProduct] Selection for ${selectionKey} already pending. Skipping.`);
      toast({
        title: "Selection In Progress",
        description: `Selection for ${itemName} at ${formatStoreName(storeName)} is already being saved.`,
        variant: "default"
      });
      return;
    }

    const currentData = getCurrentListPriceData();
    const currentSessionId = currentData?.session_id;

    if (!currentSessionId) {
      toast({
        title: "Cannot Save Selection",
        description: "There is no active search session ID. Please perform a price check first.",
        variant: "default",
      });
      return;
    }

    pendingSelectionsRef.current.add(selectionKey);

    const isNothingProduct = product.name === "Nothing";
    // The product object for "Nothing" won't have a real DB id, so selected_product_id is null.
    // For real products, product.id comes from SearchResultInDB.id
    const selectedProductId = !isNothingProduct ? (product as SearchResultInDB).id : null;

    const selectionPayload: ProductSelectionCreate = {
      item_name: itemName,
      store_name: storeName, // Use the passed storeName
      selected_product_id: selectedProductId,
      is_nothing: isNothingProduct,
      session_id: currentSessionId,
    };

    // Optimistic update
    const originalSelections = currentData?.selections || {};
    const newSelectionsForList = {
      ...originalSelections,
      [itemName]: {
        ...(originalSelections[itemName] || {}),
        [storeName]: product as SearchResultInDB, // Store the full product object for UI display
      },
    };

    updateListPriceData(selectedList.id, { selections: newSelectionsForList });

    try {
      // API Call
      const savedSelection = await saveProductSelection(selectedList.id, selectionPayload);
      console.log('Product selection saved to DB:', savedSelection);
      
      // On successful save, the backend might return the full ProductSelectionInDB.
      // We can update our local state with this if it contains more/updated info (e.g. db-generated ids/timestamps)
      // For now, the optimistic update with the full product object is good for the UI.
      // If backend returns the full SearchResultInDB as part of ProductSelectionInDB.selected_product_detail,
      // we could use that to refresh the product details in our map, but current optimistic one is fine.
      updateListPriceData(selectedList.id, { 
        selections: {
          ...newSelectionsForList,
          [itemName]: {
            ...(newSelectionsForList[itemName] || {}),
            // If savedSelection.selected_product_detail is populated & useful, use it here
            // Otherwise, the 'product' object from optimistic update is already set.
            [storeName]: product as SearchResultInDB 
          }
        }
      });

      toast({
        title: "Selection Saved",
        description: `${isNothingProduct ? "'Nothing'" : product.name} selected for ${itemName} at ${formatStoreName(storeName)}. Session: ${currentSessionId.substring(0,8)}...`,
      });
    } catch (error) {
      console.error('Error saving product selection to API:', error);
      // Revert optimistic update on failure
      updateListPriceData(selectedList.id, { selections: originalSelections });
      toast({
        title: "Save Failed",
        description: `Could not save selection for ${itemName}. ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      pendingSelectionsRef.current.delete(selectionKey);
    }
  };

  // MODIFIED handleShopNow function - ensure polling starts reliably
  const handleShopNow = async () => {
    console.log('[HandleShopNow] Function called');
    
    if (!selectedList) {
      console.log('[HandleShopNow] No selected list, returning');
      toast({ title: "No List Selected", variant: "destructive" });
      return;
    }
    
    console.log('[HandleShopNow] Selected list:', selectedList.id);

    // --- BEGIN MODIFICATION: Clear old data ---
    console.log(`[HandleShopNow] Clearing previous data for list ${selectedList.id}`);
    updateListPriceData(selectedList.id, {
      results: {},
      selections: {},
      storeSubtotals: {},
      status: 'pending', // Set status to pending to reflect a new search starting
      session_id: null,  // Clear old session ID
      last_checked: null, // Clear old last_checked timestamp
      dataSource: 'api' // Or null, depending on desired initial state before polling
    });
    // --- END MODIFICATION ---

    let storesToSearch: UserSelectedStore[] = [];
    try {
      console.log('[HandleShopNow] Fetching stores...');
      storesToSearch = await storeService.getUserSelectedStores();
      console.log('[HandleShopNow] Stores fetched:', storesToSearch.length);
    } catch (e: any) {
      console.log('[HandleShopNow] Error fetching stores:', e);
      toast({ title: "Error Fetching Stores", variant: "destructive" });
      return;
    }
    
    // Single-store test mode via URL flag ?singleStore=1
    try {
      const params = new URLSearchParams(window.location.search);
      const singleStoreFlag = params.get('singleStore');
      if (singleStoreFlag) {
        const originalCount = storesToSearch.length;
        storesToSearch = storesToSearch.slice(0, 1);
        console.log(`[HandleShopNow] Single-store test mode enabled via URL. Limiting stores from ${originalCount} to ${storesToSearch.length}.`);
      }
    } catch (err) {
      console.warn('[HandleShopNow] Unable to parse URL params for singleStore flag:', err);
    }

    if (!storesToSearch.length) {
      console.log('[HandleShopNow] No stores selected, returning');
      toast({ title: "No Stores Selected", variant: "destructive" });
      return;
    }

    console.log('[HandleShopNow] Setting isShoppingNow to true');
    setIsShoppingNow(true);
    
    console.log('[HandleShopNow] Showing toast');
    toast({ title: "Initiating Price Check..." });

    // Directly call startPollingForResults - this MUST work
    console.log('[HandleShopNow] About to call startPollingForResults for list:', selectedList.id);
    console.log('[HandleShopNow] startPollingForResults function exists?', typeof startPollingForResults);
    
    try {
      startPollingForResults(selectedList.id);
      console.log('[HandleShopNow] startPollingForResults called successfully');
    } catch (err) {
      console.error('[HandleShopNow] Error calling startPollingForResults:', err);
    }

    // Then, initiate the backend search (this can run in parallel)
    console.log('[HandleShopNow] Starting async backend search');
    (async () => {
      try {
        const itemNames = selectedList.items.map(item => item.name);
        const storesPayload = storesToSearch.map(s => ({ store_name: s.store_name, postal_code: s.postal_code }));
        console.log('[HandleShopNow] Calling checkPricesDirectly with:', { storesPayload, itemNames, listId: selectedList.id });
        const checkResponse = await checkPricesDirectly(storesPayload, itemNames, selectedList.id);
        console.log("[HandleShopNow] Initial response from checkPricesDirectly:", checkResponse);
        if (checkResponse.message) toast({ title: "Search Update", description: checkResponse.message });
      } catch (error) {
        console.error('[HandleShopNow] Error in async backend search:', error);
        if (error instanceof Error && error.message.includes('timeout')) {
          toast({ title: "Search in Progress", description: "Search continues in background." });
        } else {
          toast({ title: "Search Error", description: "Error starting search.", variant: "default" });
        }
      }
    })();
    
    console.log('[HandleShopNow] Function completed');
  };
  
  // Add back the handleSelectList function and the effect to handle selected list changes
  const handleSelectList = (list: SavedGroceryList) => {
    // Clear any pending selection
    if (selectionTimeoutRef.current) {
      clearTimeout(selectionTimeoutRef.current);
    }
    
    // Show immediate visual feedback
    setPendingListSelection(list);
    
    // Debounce the actual selection
    selectionTimeoutRef.current = setTimeout(() => {
      console.log(`Selecting list with ID: ${list.id}`);
      const listFromState = lists.find(l => l.id === list.id);
      if (listFromState) {
        console.log(`Selected list from state: createdAt=${listFromState.createdAt}, lastUpdated=${listFromState.lastUpdated}`);
      } else if (list) {
        console.log(`Selected list (direct param): createdAt=${list.createdAt}, lastUpdated=${list.lastUpdated}`);
      }
      setSelectedList(listFromState || list);
      setPendingListSelection(null);
      
      // Scroll the selected card into view
      setTimeout(() => {
        const cardRef = listCardRefs.current[list.id];
        if (cardRef && scrollContainerRef.current) {
          // Calculate if the card is fully visible
          const containerRect = scrollContainerRef.current.getBoundingClientRect();
          const cardRect = cardRef.getBoundingClientRect();
          
          // Check if card is not fully visible
          if (cardRect.left < containerRect.left || cardRect.right > containerRect.right) {
            cardRef.scrollIntoView({
              behavior: 'smooth',
              block: 'nearest',
              inline: 'center'
            });
          }
        }
      }, 100); // Small delay to ensure DOM is updated
    }, 150); // 150ms debounce - fast enough to feel snappy, slow enough to skip intermediate selections
  };

  // A separate effect for handling selected list changes
  useEffect(() => {
    if (selectedList && selectedList.id) {
      console.log(`Selected list changed to: ${selectedList.id}`);
      
      // Check if we already have data for this list in memory from API
      const existingData = listPriceDataMap[selectedList.id];
      if (existingData && existingData.dataSource === 'api') {
        console.log(`Using cached API price data for list ${selectedList.id}`);
        // Data is already in state from API, no need to re-fetch unless explicitly requested
      } else {
        // Fetch data from API if not present or not from API
        console.log(`No API data in cache for list ${selectedList.id}, fetching...`);
        fetchAndSetShoppingDataForList(selectedList.id);
      }
    }
  }, [selectedList, listPriceDataMap, fetchAndSetShoppingDataForList]); // Added fetchAndSetShoppingDataForList to dependencies

  // Function to sort items based on current sortConfig
  const getSortedItems = useCallback((): GroceryItem[] => {
    if (!selectedList) return [];
    let sortableItems = [...selectedList.items];

    if (sortConfig !== null) {
      if (sortConfig.type === 'field') {
        const { key, direction } = sortConfig;
        sortableItems.sort((a, b) => {
          let aValue: string | number | null = (a as any)[key] ?? '';
          let bValue: string | number | null = (b as any)[key] ?? '';

          if (key === 'quantity') {
            aValue = parseFloat(a.quantity || '0');
            bValue = parseFloat(b.quantity || '0');
          }

          if (aValue === null || aValue === undefined) aValue = '';
          if (bValue === null || bValue === undefined) bValue = '';

          if (aValue < bValue) {
            return direction === 'asc' ? -1 : 1;
          }
          if (aValue > bValue) {
            return direction === 'asc' ? 1 : -1;
          }
          return 0;
        });
      } else if (sortConfig.type === 'storePrice') {
        const { storeName, direction } = sortConfig;
        sortableItems.sort((a, b) => {
          const aPrice = getComparablePrice(a, storeName);
          const bPrice = getComparablePrice(b, storeName);

          // Nulls always at the end regardless of direction
          const aNull = aPrice === null;
          const bNull = bPrice === null;
          if (aNull && !bNull) return 1;
          if (!aNull && bNull) return -1;
          if (aNull && bNull) {
            // Tie-breaker: name ascending
            const aName = (a.name || '').toString();
            const bName = (b.name || '').toString();
            return aName.localeCompare(bName);
          }

          // Both numbers present
          if (aPrice! === bPrice!) {
            // Tie-breaker: name ascending
            const aName = (a.name || '').toString();
            const bName = (b.name || '').toString();
            return aName.localeCompare(bName);
          }
          return direction === 'asc' ? (aPrice! - bPrice!) : (bPrice! - aPrice!);
        });
      }
    }
    return sortableItems;
  }, [selectedList, sortConfig]);

  // Sorting request helpers


  // Log state before rendering
  console.log('[Render] isLoading:', isLoading);
  console.log('[Render] selectedList:', selectedList ? selectedList.id : null);
  console.log('[Render] isShoppingNow:', isShoppingNow);
  // console.log('[Render] shoppingResults:', shoppingResults); // shoppingResults is derived
  // console.log('[Render] storeSubtotals:', storeSubtotals); // storeSubtotals is derived
  // console.log('[Render] dataSource:', dataSource); // dataSource is derived

  // useEffect for auto-selecting first product for each item/store as soon as products are available
  useEffect(() => {
    if (!selectedList || !selectedList.id) return;
    if (!currentListDataRef.current) return;
    
    const { results, selections, session_id } = currentListDataRef.current;
    
    // Don't require session_id for auto-selection - results might arrive before session_id
    console.log(`[AutoSelect] Checking for auto-selection opportunities. Results keys: ${Object.keys(results || {}).length}, Selections keys: ${Object.keys(selections || {}).length}`);

    Object.entries(results || {}).forEach(([itemName, storesObj]) => {
      Object.entries(storesObj || {}).forEach(([storeName, productsArr]) => {
        const selectionKey = `${itemName}_${storeName}`;
        if (
          Array.isArray(productsArr) &&
          productsArr.length > 0 &&
          (!selections || !selections[itemName] || !selections[itemName][storeName]) &&
          !pendingSelectionsRef.current.has(selectionKey) // Check pending selections here
        ) {
          // No selection yet for this item/store, auto-select first product
          if (!session_id) {
            console.log(`[AutoSelect] Would select first product for ${itemName} at ${storeName}, but waiting for session_id`);
          } else {
            console.log(`[AutoSelect] Selecting first product for ${itemName} at ${storeName}. Product:`, productsArr[0]);
            handleSelectProduct(itemName, productsArr[0], storeName);
          }
        }
      });
    });
  }, [selectedList?.id, currentListDataVersion, handleSelectProduct]); // Now depends on version, not the whole map

  // Clean up polling on unmount or list change
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        console.log('[Polling] Cleaning up polling interval on unmount or list change for:', selectedList?.id);
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
        // Only set these to false if truly stopping for this list context
        // If another effect is meant to resume, it will set them back.
        // setIsPollingActive(false); // Avoid race conditions, let new effect handle this
        // setIsShoppingNow(false);  // Avoid race conditions
      }
    };
  }, [selectedList]);

  // New useEffect to resume polling if necessary when list data indicates an active search
  useEffect(() => {
    let didResumePolling = false;
    if (selectedList && selectedList.id && !isPollingActive) { // Only attempt to resume if not already polling
      const currentData = listPriceDataMap[selectedList.id];
      if (currentData && (currentData.status === 'in_progress' || currentData.status === 'pending') && currentData.session_id) {
        console.log(`[ResumePollingEffect] List ${selectedList.id} has status '${currentData.status}' and session ID. Resuming polling.`);
        setIsShoppingNow(true); // Show loading indicator
        // startPollingForResults will set isPollingActive to true internally
        startPollingForResults(selectedList.id);
        didResumePolling = true;
      }
    }

    // If polling was not resumed by the logic above (e.g. status is 'completed' or no session_id)
    // and the component thought it was shopping (e.g. from a quick nav away/back before first poll after clicking "Check Prices"),
    // then we might need to turn off the spinner if the status is actually terminal.
    if (!didResumePolling && selectedList && selectedList.id) {
        const currentData = listPriceDataMap[selectedList.id];
        if (currentData && (currentData.status === 'completed' || currentData.status === 'failed' || currentData.status === 'error')) {
            if(isShoppingNow || isPollingActive) { // Only if they were true
                console.log(`[ResumePollingEffect] List ${selectedList.id} has terminal status '${currentData.status}'. Ensuring spinner is off.`);
                setIsShoppingNow(false);
                setIsPollingActive(false); // Ensure polling is marked as inactive
                if (pollingIntervalRef.current) { // Defensive: clear interval if somehow active
                    clearInterval(pollingIntervalRef.current);
                    pollingIntervalRef.current = null;
                }
            }
        }
    }
  }, [selectedList, listPriceDataMap, startPollingForResults, isPollingActive, isShoppingNow]);

  // Clean up selection timeout on unmount
  useEffect(() => {
    return () => {
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Carousel scrollbar visibility handlers
  const showScrollbarWithTimer = useCallback(() => {
    setShowCarouselScrollbar(true);
    
    // Clear existing timer
    if (carouselScrollbarTimeoutRef.current) {
      clearTimeout(carouselScrollbarTimeoutRef.current);
    }
    
    // Set auto-hide timer (3 seconds)
    carouselScrollbarTimeoutRef.current = setTimeout(() => {
      setShowCarouselScrollbar(false);
    }, 3000);
  }, []);

  const hideScrollbarImmediate = useCallback(() => {
    if (carouselScrollbarTimeoutRef.current) {
      clearTimeout(carouselScrollbarTimeoutRef.current);
    }
    setShowCarouselScrollbar(false);
  }, []);

  const handleCarouselMouseEnter = useCallback(() => {
    showScrollbarWithTimer();
  }, [showScrollbarWithTimer]);

  const handleCarouselMouseLeave = useCallback(() => {
    hideScrollbarImmediate();
  }, [hideScrollbarImmediate]);

  const handleCarouselFocus = useCallback(() => {
    showScrollbarWithTimer();
  }, [showScrollbarWithTimer]);

  const handleCarouselBlur = useCallback(() => {
    hideScrollbarImmediate();
  }, [hideScrollbarImmediate]);

  const handleCarouselScroll = useCallback(() => {
    // Show scrollbar when user is actively scrolling
    showScrollbarWithTimer();
  }, [showScrollbarWithTimer]);

  const handleCarouselTouchStart = useCallback(() => {
    showScrollbarWithTimer();
  }, [showScrollbarWithTimer]);

  // Clean up carousel scrollbar timer on unmount
  useEffect(() => {
    return () => {
      if (carouselScrollbarTimeoutRef.current) {
        clearTimeout(carouselScrollbarTimeoutRef.current);
      }
    };
  }, []);

  // Apply fixed gradient background to body while this page is mounted
  useEffect(() => {
    const className = 'app-gradient-bg';
    document.body.classList.add(className);
    return () => {
      document.body.classList.remove(className);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-cyan-100 via-teal-100 via-emerald-100 to-green-100 dark:from-cyan-900 dark:via-teal-900 dark:via-emerald-900 dark:to-green-900">
      <div className="container-fluid max-w-screen-2xl mx-auto py-6 sm:py-6 px-3 sm:px-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 pt-4 sm:pt-0">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold whitespace-nowrap">My Grocery Lists</h1>
        <div className="flex flex-row gap-3 sm:gap-4 items-center">
          <Button size="sm" onClick={handleCreateNewList} variant="outline" disabled={isCreatingNewList} className="whitespace-nowrap">
            {isCreatingNewList ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <MessageSquarePlus className="h-4 w-4 mr-2" />
            )}
            {isCreatingNewList ? 'Creating...' : 'New List'}
          </Button>
          {/* Savings Metrics: Combined into one with Tooltip */}
          {savingsSummary && savingsSummary.total_saved > 0 && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div 
                    className="px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-xs font-semibold shadow-md cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 ease-in-out whitespace-nowrap"
                  >
                    Saved: <span className="font-bold">${savingsSummary.total_saved.toFixed(2)}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="center" className="bg-gray-800 text-white rounded-md shadow-lg text-xs">
                  <div className="p-2">
                    {savingsSummary.saved_this_month > 0 && (
                      <p>This month: ${savingsSummary.saved_this_month.toFixed(2)}</p>
                    )}
                    <p>All time: ${savingsSummary.total_saved.toFixed(2)}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* Horizontal scrollable list row */}
      <div className="list-carousel-wrapper mb-4 sm:mb-6">
        <div 
          className={`list-carousel-inner w-full px-2 sm:px-4 py-3 sm:py-4 transition-all duration-300 ease-in-out ${
            showCarouselScrollbar ? 'list-carousel-visible' : 'list-carousel-hidden'
          }`}
          ref={scrollContainerRef}
          onMouseEnter={handleCarouselMouseEnter}
          onMouseLeave={handleCarouselMouseLeave}
          onFocus={handleCarouselFocus}
          onBlur={handleCarouselBlur}
          onScroll={handleCarouselScroll}
          onTouchStart={handleCarouselTouchStart}
          tabIndex={0}
          role="region"
          aria-label="Grocery lists carousel"
        >
          <div className="flex flex-row gap-3 sm:gap-4 min-h-[110px]" style={{ minWidth: 0 }}>
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading lists...</span>
              </div>
            ) : lists.length === 0 ? (
              <div className="text-center p-8 border rounded-lg bg-muted/20">
                <p className="text-muted-foreground mb-4">You don't have any grocery lists yet.</p>
                <Button onClick={() => navigate('/chat')}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Create Your First List
                </Button>
              </div>
            ) : (
              lists.map((list) => (
                <ListCard
                  key={list.id}
                  ref={(el) => { listCardRefs.current[list.id] = el; }}
                  list={list}
                  isSelected={isListSelected(list.id)}
                  isPending={pendingListSelection?.id === list.id}
                  onSelect={handleSelectList}
                  onDeleteConfirm={confirmDeleteList}
                  savedAmount={list.savings_amount || null}
                />
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Main list viewer (takes full width now) */}
      <div className="w-full">
        {selectedList ? (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 mb-4">
              <div>
                <CardTitle className="text-xl sm:text-2xl">Price Comparison</CardTitle>
                <CardDescription className="text-sm">
                  Compare prices across selected stores
                </CardDescription>
              </div>
              <div className="flex flex-row gap-2 items-center">
                {/* Selected Stores Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center justify-between flex-1 sm:w-auto whitespace-nowrap" style={{ minWidth: 'auto' }}>
                      <span className="text-sm truncate">Selected Stores ({selectedStores.length})</span>
                      <ChevronDown className="ml-2 h-4 w-4 opacity-70 flex-shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[260px]">
                    <DropdownMenuItem
                      className="flex items-center gap-2 font-medium text-primary cursor-pointer hover:bg-muted"
                      onClick={() => setIsStoreModalOpen(true)}
                    >
                      <Store className="h-4 w-4" />
                      Add or Edit Stores
                    </DropdownMenuItem>
                    {selectedStores.length === 0 ? (
                      <div className="p-3 text-muted-foreground text-sm">No stores selected.</div>
                    ) : (
                      selectedStores.map(sel => (
                        <DropdownMenuItem key={sel.id} className="flex items-center justify-between">
                          <span className="truncate max-w-[245px]">{formatStoreName(sel.store_name)} <span className="text-xs text-muted-foreground">{sel.postal_code}</span></span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="ml-2"
                            title="Unselect store"
                            onClick={async (e: React.MouseEvent) => {
                              e.stopPropagation();
                              try {
                                await storeService.removeUserSelectedStore(sel.id);
                                setSelectedStores(prev => prev.filter(s => s.id !== sel.id));
                              } catch (err: any) {
                                alert('Failed to remove store: ' + (err?.response?.data?.detail || err.message || 'Unknown error'));
                              }
                            }}
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button 
                  onClick={() => { 
                    console.log('[UI] Check Prices button clicked'); 
                    handleShopNow(); 
                  }} 
                  size="sm"
                  disabled={isShoppingNow || isPollingActive}
                  className="flex-1 sm:w-auto whitespace-nowrap"
                >
                  {(isShoppingNow || isPollingActive) ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      <span className="text-sm">Searching...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      <span className="text-sm">Check Prices</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
            <div>
              {isLoadingListData ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
                  <span>Loading list data...</span>
                </div>
              ) : orderedStoreNames.length > 0 ? (
                <div className="store-carousel-wrapper">
                  <div 
                    className={`store-carousel-inner px-2 sm:px-4 py-3 sm:py-4 transition-all duration-300 ease-in-out ${
                      showCarouselScrollbar ? 'store-carousel-visible' : 'store-carousel-hidden'
                    }`}
                    style={{ 
                      overflowX: 'auto', 
                      overflowY: 'visible',
                      width: '100%',
                      minWidth: 0
                    }}
                    onMouseEnter={handleCarouselMouseEnter}
                    onMouseLeave={handleCarouselMouseLeave}
                    onFocus={handleCarouselFocus}
                    onBlur={handleCarouselBlur}
                    onScroll={handleCarouselScroll}
                    onTouchStart={handleCarouselTouchStart}
                    tabIndex={0}
                    role="region"
                    aria-label="Store grocery lists carousel"
                  >
                    <div className="flex flex-row gap-4 sm:gap-6" style={{ width: 'max-content', minWidth: '100%', alignItems: 'flex-start' }}>
                      {orderedStoreNames.map((store: string) => {
                        // Calculate if this store has the cheapest total
                        const storeTotal = memoizedStoreSubtotals[store]?.total || 0;
                        const allStoreTotals = orderedStoreNames
                          .map(s => memoizedStoreSubtotals[s]?.total || 0)
                          .filter(total => total > 0);
                        const minTotal = Math.min(...allStoreTotals);
                        const isCheapest = allStoreTotals.length > 1 && storeTotal === minTotal && storeTotal > 0;
                        
                        return (
                        <div
                          key={store}
                          className="flex-shrink-0 w-72 sm:w-80 md:w-96 lg:w-80 xl:w-96"
                        >
                          {/* Grocery List Card (Receipt Style) */}
                          <div className={`bg-white dark:bg-slate-800 border border-solid rounded-lg overflow-visible ${
                            isCheapest 
                              ? 'border-green-500 dark:border-green-400' 
                              : 'border-slate-300 dark:border-slate-600'
                          }`}>
                            <div className="relative z-10 px-4 sm:px-6 py-3 sm:py-4">
                              {/* Store Header */}
                              <div className="text-center mb-3 sm:mb-4">
                                <div className="text-xs text-slate-400 tracking-widest mb-1 sm:mb-2 select-none">GROCERY LIST</div>
                                <div className="flex items-center justify-center mb-2">
                                  <img 
                                    src={getStoreLogoPath(store)} 
                                    alt={`${formatStoreName(store)} logo`} 
                                    className="h-6 sm:h-8 w-auto object-contain"
                                    onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => { 
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                  {isCheapest && (
                                    <div className="ml-2 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                                      BEST VALUE
                                    </div>
                                  )}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 sm:mb-3">
                                  {getSortedItems().length} items • {Object.keys(memoizedStoreSubtotals).length > 0 && memoizedStoreSubtotals[store] ? `$${memoizedStoreSubtotals[store].total.toFixed(2)}` : 'Calculating...'}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const params = new URLSearchParams(location.search);
                                    params.set('storeView', store);
                                    const nextUrl = `${location.pathname}?${params.toString()}`;
                                    navigate(nextUrl, { replace: false });
                                    setFocusedStoreName(store);
                                    setIsStoreViewOpen(true);
                                    setModalSortConfig(sortConfig);
                                  }}
                                  className="w-full mb-3 sm:mb-4 text-xs sm:text-sm"
                                >
                                  <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                  Shop Here
                                </Button>
                              </div>

                              {/* Items List */}
                              <div className="space-y-3 sm:space-y-4">
                                {getSortedItems().length > 0 ? getSortedItems().map((item) => (
                                  <div
                                    key={`${item.id || item.name}-${store}`}
                                    className="flex items-start gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded border transition-all bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700"
                                  >
                                    {/* Item Info */}
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
                                        {item.name}
                                      </div>
                                      <div className="text-xs text-slate-500 dark:text-slate-400">
                                        {item.quantity} {item.unit} • {item.category}
                                      </div>

                                      {/* Product Selection */}
                                      <div className="w-full">
                                        {results[item.name] && results[item.name][store] && Array.isArray(results[item.name][store]) ? (
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button 
                                                variant="outline" 
                                                size="sm"
                                                className={`w-full justify-between text-xs h-7 sm:h-8 ${
                                                  selections[item.name] && 
                                                  selections[item.name][store] ? (
                                                    selections[item.name][store].name === "Nothing" ?
                                                    'border-gray-300 text-muted-foreground' :
                                                    'border-green-500 bg-green-50'
                                                  ) : ''
                                                }`}
                                              >
                                                {selections[item.name] && 
                                                 selections[item.name][store] ? (
                                                  selections[item.name][store].name === "Nothing" ? (
                                                    <>
                                                      <div className="flex items-center w-full min-w-0">
                                                        <span className="truncate mr-2">Nothing</span>
                                                        <span className="ml-auto font-medium text-muted-foreground text-right tabular-nums">$0.00</span>
                                                        <ChevronDown className="h-3 w-3 ml-1" />
                                                      </div>
                                                    </>
                                                  ) : (
                                                    <>
                                                      <img
                                                        src={getProductImage(selections[item.name][store].imageUrl)}
                                                        alt={truncateName(selections[item.name][store].name)}
                                                        className="w-5 h-5 sm:w-6 sm:h-6 object-contain rounded border bg-white flex-shrink-0 mr-1 sm:mr-2"
                                                        onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => { (e.target as HTMLImageElement).src = '/assets/store-placeholder.png'; }}
                                                      />
                                                      <div className="flex items-center w-full min-w-0">
                                                        <TooltipProvider delayDuration={200}>
                                                          <Tooltip>
                                                            <TooltipTrigger asChild>
                                                              <span className="truncate mr-2">
                                                                {(() => { const sel = selections[item.name][store] as GroceryProductWithImage; const f = getProductTooltipFields(sel); return f.brand ? `${f.brand} ${truncateName(sel.name)}` : truncateName(sel.name); })()}
                                                              </span>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top" align="start">
                                                              {(() => { const f = getProductTooltipFields(selections[item.name][store] as GroceryProductWithImage); return (
                                                                <div className="text-white">
                                                                  {f.brand && <div className="font-semibold">{f.brand}</div>}
                                                                  {f.name && <div className="text-sm">{f.name}</div>}
                                                                  {f.size && <div className="text-xs opacity-90 mt-0.5">{f.size}</div>}
                                                                </div>
                                                              ); })()}
                                                            </TooltipContent>
                                                          </Tooltip>
                                                        </TooltipProvider>
                                                        {formatPriceStrict(selections[item.name][store].price) && (
                                                          <span className="ml-auto font-medium text-right tabular-nums">{formatPriceStrict(selections[item.name][store].price) as string}</span>
                                                        )}
                                                        <ChevronDown className="h-3 w-3 ml-1" />
                                                      </div>
                                                    </>
                                                  )
                                                ) : (
                                                  <>
                                                    <Store className="h-4 w-4 mr-2" />
                                                    <div className="flex items-center w-full min-w-0">
                                                      <span className="truncate">Select Product</span>
                                                      <ChevronDown className="h-3 w-3 ml-auto" />
                                                    </div>
                                                  </>
                                                )}
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent 
                                              align="end" 
                                              className="min-w-[280px] w-[--radix-dropdown-menu-trigger-width] max-h-[350px] overflow-y-auto before:content-[''] before:block before:h-2 before:w-full before:bg-background before:sticky before:top-0 before:z-10"
                                              sideOffset={5}
                                              avoidCollisions
                                              side="top"
                                            >
                                              <div className="p-2 pt-3 pb-2 border-b border-border bg-background sticky top-0 z-10 text-xs shadow-sm">
                                                <div className="font-bold flex items-center gap-1">
                                                  <Store className="h-3 w-3" /> {formatStoreName(store)}
                                                </div>
                                                <div className="text-sm mt-1">{item.name}</div>
                                                {results[item.name] && results[item.name][store] && Array.isArray(results[item.name][store]) && (
                                                  <div className="text-xs text-muted-foreground mt-1">
                                                    Found {(results[item.name][store] as SearchResultInDB[]).filter((p: SearchResultInDB) => p.store === store).length} products
                                                  </div>
                                                )}
                                              </div>

                                              <DropdownMenuItem
                                                onClick={(e: React.MouseEvent) => {
                                                  e.stopPropagation();
                                                  const nothingProduct: GroceryProduct = {
                                                    brand: "",
                                                    name: "Nothing",
                                                    price: "$0.00",
                                                    store: store,
                                                  };
                                                  handleSelectProduct(item.name, nothingProduct, store);
                                                }}
                                                className="flex flex-col items-start py-2 hover:bg-muted focus:bg-muted border-b border-border"
                                              >
                                                <div className="flex items-center w-full">
                                                  <span className="font-medium text-sm">Nothing</span>
                                                  <span className="ml-auto font-semibold text-muted-foreground text-right tabular-nums">$0.00</span>
                                                </div>
                                                <span className="text-xs text-muted-foreground mt-0.5">
                                                  Skip this item (will not be included in subtotal)
                                                </span>
                                              </DropdownMenuItem>

                                              {results[item.name] && 
                                               results[item.name][store] &&
                                               Array.isArray(results[item.name][store]) &&
                                               (results[item.name][store] as SearchResultInDB[])
                                                .filter((product: SearchResultInDB) => product.store === store)
                                                .map((product: GroceryProductWithImage, idx: number) => (
                                                <DropdownMenuItem
                                                  key={product.id || idx}
                                                  onClick={(e: React.MouseEvent) => {
                                                    e.stopPropagation();
                                                    handleSelectProduct(item.name, product, store);
                                                  }}
                                                  className="flex flex-row items-center gap-3 py-2 hover:bg-muted focus:bg-muted"
                                                >
                                                  <img
                                                    src={getProductImage(product.imageUrl)}
                                                    alt={truncateName(product.name)}
                                                    className="w-12 h-12 object-contain rounded border bg-white flex-shrink-0"
                                                    onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => { (e.target as HTMLImageElement).src = '/assets/store-placeholder.png'; }}
                                                  />
                                                  <div className="flex flex-col min-w-0 w-full">
                                                    <div className="flex items-center w-full">
                                                      <TooltipProvider delayDuration={200}>
                                                        <Tooltip>
                                                          <TooltipTrigger asChild>
                                                            <span className="font-medium text-sm truncate">
                                                              {(() => { const f = getProductTooltipFields(product); return f.brand || ''; })()}
                                                            </span>
                                                          </TooltipTrigger>
                                                          <TooltipContent side="right" align="start">
                                                            {(() => { const f = getProductTooltipFields(product); return (
                                                              <div className="text-white">
                                                                {f.brand && <div className="font-semibold">{f.brand}</div>}
                                                                {f.name && <div className="text-sm">{f.name}</div>}
                                                                {f.size && <div className="text-xs opacity-90 mt-0.5">{f.size}</div>}
                                                              </div>
                                                            ); })()}
                                                          </TooltipContent>
                                                        </Tooltip>
                                                      </TooltipProvider>
                                                      {formatPriceStrict(product.price) && (
                                                        <span className="ml-auto font-semibold text-primary text-right tabular-nums">{formatPriceStrict(product.price) as string}</span>
                                                      )}
                                                    </div>
                                                    {product.name && (
                                                      (() => { const f = getProductTooltipFields(product); return f.brand ? (
                                                        <span className="text-sm mt-0.5 truncate">{truncateName(product.name)}</span>
                                                      ) : (
                                                        <TooltipProvider delayDuration={200}>
                                                          <Tooltip>
                                                            <TooltipTrigger asChild>
                                                              <span className="text-sm mt-0.5 truncate">{truncateName(product.name)}</span>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="right" align="start">
                                                              <div className="text-white">
                                                                {f.name && <div className="text-sm">{f.name}</div>}
                                                                {f.size && <div className="text-xs opacity-90 mt-0.5">{f.size}</div>}
                                                              </div>
                                                            </TooltipContent>
                                                          </Tooltip>
                                                        </TooltipProvider>
                                                      ); })()
                                                    )}
                                                    {product.size && (
                                                      <span className="text-xs text-muted-foreground mt-0.5">{product.size}</span>
                                                    )}
                                                    <div className="flex justify-between w-full text-xs mt-1">
                                                      {(() => {
                                                        const anyProduct = product as any;
                                                        const promoText: string | undefined = typeof anyProduct?.multiBuyText === 'string' ? (anyProduct.multiBuyText as string) : undefined;
                                                        const isMultiBuy: boolean = !!anyProduct?.isMultiBuy;
                                                        const makeDisplay = (text: string) => {
                                                          const truncated = text.length > 80 ? text.slice(0, 80) + '…' : text;
                                                          return (
                                                            <TooltipProvider delayDuration={200}>
                                                              <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                  <span className="text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded cursor-default">
                                                                    {truncated}
                                                                  </span>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top" align="start">
                                                                  <div className="text-white">{text}</div>
                                                                </TooltipContent>
                                                              </Tooltip>
                                                            </TooltipProvider>
                                                          );
                                                        };

                                                        if (product.pricePerUnit) {
                                                          const base = String(product.pricePerUnit).trim();
                                                          if (promoText && promoText.length > 0) {
                                                            return makeDisplay(`${base} · ${promoText}`);
                                                          }
                                                          if (!promoText && isMultiBuy) {
                                                            return makeDisplay(`${base} · multi-buy promo price`);
                                                          }
                                                          return (
                                                            <span className="text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">{base}</span>
                                                          );
                                                        }

                                                        if (!product.pricePerUnit && promoText && promoText.length > 0) {
                                                          return makeDisplay(promoText);
                                                        }

                                                        return null;
                                                      })()}
                                                    </div>
                                                  </div>
                                                </DropdownMenuItem>
                                              ))}
                                              
                                              {(!results[item.name] || 
                                                !results[item.name][store] ||
                                                !Array.isArray(results[item.name][store]) ||
                                                (results[item.name][store] as SearchResultInDB[]).filter((p: SearchResultInDB) => p.store === store).length === 0) && (
                                                  <div className="p-4 text-center">
                                                    <XCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                                    <p className="text-sm text-muted-foreground">No products found for this item at {formatStoreName(store)}.</p>
                                                    <p className="text-xs text-muted-foreground mt-1">Try searching with a different item name.</p>
                                                  </div>
                                                )}
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        ) : (
                                          // While searching, show a skeleton shimmer instead of "No matches found"
                                          (isShoppingNow || isPollingActive || (currentListData?.status === 'pending' || currentListData?.status === 'in_progress')) ? (
                                            <div className="w-full">
                                              <SkeletonBar heightClass="h-8" seed={`${item.name}-${store}`} />
                                            </div>
                                          ) : (
                                            <div className="w-full p-2 text-center text-muted-foreground text-xs border rounded">
                                              {Object.keys(results).length === 0 ? 'Click "Check Prices" to search for products' : 'No matches found'}
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )) : (
                                  <div className="text-center py-8 text-muted-foreground">
                                    <div className="text-sm">No items in this list</div>
                                  </div>
                                )}
                              </div>

                              {/* Total */}
                              <div className="mt-3 sm:mt-4 pt-2 border-t border-solid border-slate-300 dark:border-slate-600 flex justify-between text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                                <span>TOTAL</span>
                                <span>{Object.keys(memoizedStoreSubtotals).length > 0 && memoizedStoreSubtotals[store] ? `$${memoizedStoreSubtotals[store].total.toFixed(2)}` : 'Calculating...'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 px-8">
                  <div className="max-w-md text-center space-y-6">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/20 dark:to-green-800/20 rounded-full flex items-center justify-center">
                      <ShoppingCart className="h-10 w-10 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white">No Price Check Yet</h3>
                      <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                        Ready to compare prices across stores? Select your preferred stores and check prices to see the best deals for your grocery list.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 pt-2 px-4 sm:px-0">
                      <Button 
                        onClick={() => setIsStoreModalOpen(true)}
                        variant="outline"
                        size="lg"
                        className="flex-1 py-4 sm:py-2"
                      >
                        <Store className="h-5 w-5 mr-2" />
                        Select Stores
                      </Button>
                      <Button 
                        onClick={() => { 
                          console.log('[UI] Check Prices button clicked'); 
                          handleShopNow(); 
                        }} 
                        size="lg"
                        disabled={isShoppingNow || isPollingActive}
                        className="flex-1 py-4 sm:py-2"
                      >
                        {(isShoppingNow || isPollingActive) ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Searching...
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="h-5 w-5 mr-2" />
                            Check Prices
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          !isLoading && lists.length > 0 && (
            <div className="flex items-center justify-center h-full min-h-[200px] border rounded-lg bg-muted/20 text-center p-4">
              <p className="text-muted-foreground">Select a list from the left to view its details.</p>
            </div>
          )
        )}
      </div>

      <AlertDialog open={!!listToDelete} onOpenChange={(open: boolean) => !open && setListToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Grocery List</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{listToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteList} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Store Selection Modal */}
      <StoreSelectionModal
        isOpen={isStoreModalOpen}
        onClose={() => setIsStoreModalOpen(false)}
        onStoresUpdated={(updatedStores) => {
          setSelectedStores(updatedStores);
        }}
      />
      {/* Store-focused fullscreen shopping modal */}
      <StoreShoppingModal
        isOpen={isStoreViewOpen}
        onClose={() => {
          const params = new URLSearchParams(location.search);
          if (params.has('storeView')) {
            params.delete('storeView');
            const nextUrl = `${location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
            navigate(nextUrl, { replace: false });
          }
          setIsStoreViewOpen(false);
        }}
        list={selectedList}
        storeName={focusedStoreName}
        selectionsByItem={currentListData?.selections}
        sortConfig={modalSortConfig || sortConfig}
        onSortChange={(next) => { setModalSortConfig(next); setSortConfig(next); }}
      />
      </div>
    </div>
  );
};

export default ListsPage; 