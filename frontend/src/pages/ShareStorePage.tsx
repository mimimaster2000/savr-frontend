import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import api from '@/services/api';
import '@/styles/print-share.css'
import { formatStoreName, getStoreLogoPath } from '@/lib/stores';
import { ArrowUpDown, Store } from 'lucide-react';

interface ReadOnlySelection {
  id?: string;
  name: string;
  brand?: string;
  size?: string;
  imageUrl?: string;
  price?: string | number;
  pricePerUnit?: string;
}

interface SharePayload {
  list_name: string;
  store_name: string;
  items: Array<{
    id?: string;
    name: string;
    category?: string;
    meal?: string;
    quantity?: string;
    unit?: string;
    checked?: boolean;
    selection?: ReadOnlySelection | null;
  }>;
}

const ShareStorePage = () => {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<SharePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const token = searchParams.get('t') || '';

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        const resp = await api.get(`/share/${encodeURIComponent(token)}`);
        setData(resp.data);
      } catch (e: any) {
        setError(e?.response?.data?.detail || 'Link invalid or expired');
      }
    };
    if (token) load();
  }, [token]);

  // Hooks must be unconditional: define grouping/sorting before any early returns
  const [groupMode, setGroupMode] = useState<'category' | 'meal' | 'none'>('category');
  const [sort, setSort] = useState<{ key: 'name' | 'price'; dir: 'asc' | 'desc' }>({ key: 'name', dir: 'asc' });

  const processedItems = useMemo(() => {
    const items = [...(data?.items || [])];
    items.sort((a, b) => {
      if (sort.key === 'name') {
        const an = (a.name || '').toString();
        const bn = (b.name || '').toString();
        return sort.dir === 'asc' ? an.localeCompare(bn) : bn.localeCompare(an);
      }
      const ap = a.selection?.price ? parseFloat(String(a.selection.price).replace(/[$£€]/g, '')) : Infinity;
      const bp = b.selection?.price ? parseFloat(String(b.selection.price).replace(/[$£€]/g, '')) : Infinity;
      return sort.dir === 'asc' ? ap - bp : bp - ap;
    });
    return items;
  }, [data, sort]);

  const subtotal = useMemo(() => {
    if (!data) return 0;
    return data.items.reduce((sum, row) => {
      const p = row.selection?.price;
      if (!p) return sum;
      const n = typeof p === 'number' ? p : parseFloat(String(p).replace(/[$£€]/g, '').trim()) || 0;
      return sum + n;
    }, 0);
  }, [data]);

  if (!token) return <div className="p-6">Missing token.</div>;
  if (error) return <div className="p-6 text-destructive">{error}</div>;
  if (!data) return <div className="p-6">Loading...</div>;

  const renderGroups = () => {
    if (groupMode === 'none') {
      return (
        <div className="space-y-3">
          {processedItems.map((row) => (
            <Card key={row.id || row.name} className="shadow-sm">
              <CardContent className="py-3">
                <div className="flex items-center gap-3">
                  {row.selection?.imageUrl ? (
                    <img src={row.selection.imageUrl} alt={row.selection.name} className="w-14 h-14 object-contain rounded border bg-white" loading="lazy" />
                  ) : (
                    <div className="w-14 h-14 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">No image</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{row.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {row.selection?.brand && <>{row.selection.brand} · </>}
                      {row.selection?.size}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs">
                      {row.category && <Badge variant="outline">{row.category}</Badge>}
                      {row.meal && <Badge variant="secondary">{row.meal}</Badge>}
                      {row.quantity && <span className="text-muted-foreground">{row.quantity} {row.unit}</span>}
                    </div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="font-semibold">{row.selection?.price || '$0.00'}</div>
                    {row.selection?.pricePerUnit && (
                      <div className="text-xs text-muted-foreground">{row.selection.pricePerUnit}</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }
    const groups = new Map<string, typeof processedItems>();
    for (const row of processedItems) {
      const key = groupMode === 'meal' ? (row.meal || 'Other') : (row.category || 'Other');
      if (!groups.has(key)) groups.set(key, [] as any);
      (groups.get(key) as any).push(row);
    }
    return (
      <div className="space-y-4">
        {Array.from(groups.entries()).map(([group, rows]) => (
          <div key={group}>
            <div className="bg-muted/50 px-2 py-1 rounded-sm mb-2">
              <span className="text-xs font-semibold text-muted-foreground">{group}</span>
            </div>
            <div className="mt-2 space-y-3">
              {rows.map((row) => (
                <Card key={row.id || row.name} className="shadow-sm">
                  <CardContent className="py-3">
                    <div className="flex items-center gap-3">
                      {row.selection?.imageUrl ? (
                        <img src={row.selection.imageUrl} alt={row.selection.name} className="w-14 h-14 object-contain rounded border bg-white" loading="lazy" />
                      ) : (
                        <div className="w-14 h-14 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">No image</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{row.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {row.selection?.brand && <>{row.selection.brand} · </>}
                          {row.selection?.size}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs">
                          {row.meal && <Badge variant="secondary">{row.meal}</Badge>}
                          {row.quantity && <span className="text-muted-foreground">{row.quantity} {row.unit}</span>}
                        </div>
                      </div>
                      <div className="ml-auto text-right">
                        <div className="font-semibold">{row.selection?.price || '$0.00'}</div>
                        {row.selection?.pricePerUnit && (
                          <div className="text-xs text-muted-foreground">{row.selection.pricePerUnit}</div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      {/* Header (public mode – no action buttons) */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {data.store_name ? (
            <img src={getStoreLogoPath(data.store_name)} alt={`${formatStoreName(data.store_name)} logo`} className="h-7 w-auto object-contain" />
          ) : (
            <Store className="h-5 w-5" />
          )}
          <div className="min-w-0">
            <div className="font-semibold truncate text-xl">{formatStoreName(data.store_name)} </div>
            <div className="text-sm text-muted-foreground truncate">{data.list_name}</div>
          </div>
        </div>
        <div className="text-right font-bold hidden sm:block">${subtotal.toFixed(2)}</div>
      </div>

      {/* Toolbar: grouping + sort */}
      <div className="px-0 py-2 border-b mb-3 print:hidden">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="inline-flex rounded-md border overflow-hidden">
            <button className={`px-3 py-1 ${groupMode === 'category' ? 'bg-muted' : 'bg-background'}`} onClick={() => setGroupMode('category')}>Category</button>
            <button className={`px-3 py-1 border-l ${groupMode === 'meal' ? 'bg-muted' : 'bg-background'}`} onClick={() => setGroupMode('meal')}>Meal</button>
            <button className={`px-3 py-1 border-l ${groupMode === 'none' ? 'bg-muted' : 'bg-background'}`} onClick={() => setGroupMode('none')}>All</button>
          </div>
          <div className="ml-auto flex items-center gap-4 text-xs font-medium text-muted-foreground">
            <button className="flex items-center gap-2" onClick={() => setSort(s => ({ key: 'name', dir: s.key === 'name' && s.dir === 'asc' ? 'desc' : 'asc' }))} aria-label="Sort by product name">
              <span>Product Name</span>
              <ArrowUpDown className={`h-3 w-3 ${sort.key === 'name' ? 'text-primary' : 'opacity-40'}`} />
            </button>
            <button className="flex items-center gap-2" onClick={() => setSort(s => ({ key: 'price', dir: s.key === 'price' && s.dir === 'asc' ? 'desc' : 'asc' }))} aria-label="Sort by price">
              <span>Price</span>
              <ArrowUpDown className={`h-3 w-3 ${sort.key === 'price' ? 'text-primary' : 'opacity-40'}`} />
            </button>
          </div>
        </div>
      </div>

      {renderGroups()}

      {/* Footer subtotal (always visible) */}
      <div className="px-0 py-3 border-t mt-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Subtotal</div>
          <div className="font-bold">${subtotal.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
};

export default ShareStorePage;


