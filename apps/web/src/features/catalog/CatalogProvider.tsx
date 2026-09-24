import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { api, type Product } from '../../api';
import { useResource, type Resource } from '../../hooks/useResource';
import { indexBy } from '../../lib/collections';

interface Catalog {
  products: Resource<Product[]>;
  productsById: ReadonlyMap<string, Product>;
}

const CatalogContext = createContext<Catalog | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const products = useResource(api.products, []);
  const list = products.data;
  const productsById = useMemo(() => indexBy(list ?? [], (product) => product.id), [list]);
  const value = useMemo(() => ({ products, productsById }), [products, productsById]);
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): Catalog {
  const catalog = useContext(CatalogContext);
  if (!catalog) throw new Error('useCatalog is used outside of CatalogProvider');
  return catalog;
}
