import { memo } from 'react';
import type { Product } from '../api';
import { useCart } from '../features/cart/CartProvider';
import { CartControls } from '../features/cart/CartControls';
import { useCatalog } from '../features/catalog/CatalogProvider';
import { usePageTitle } from '../hooks/usePageTitle';
import { formatMoney } from '../lib/money';
import { ErrorNotice } from '../ui/Notice';
import { ResourceView } from '../ui/ResourceView';

export function CatalogPage() {
  const { products } = useCatalog();
  const cart = useCart();
  usePageTitle('Каталог');
  return (
    <section aria-labelledby="catalog-title">
      <h1 id="catalog-title">Каталог</h1>
      <ErrorNotice
        error={cart.data ? null : cart.error}
        title="Корзина недоступна"
        onRetry={() => void cart.reload()}
      />
      <ResourceView resource={products} loadingLabel="Загружаем каталог…">
        {(list) => <ProductList products={list} />}
      </ResourceView>
    </section>
  );
}

function ProductList({ products }: { products: Product[] }) {
  const { itemsById } = useCart();
  return (
    <ul className="product-grid">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          quantity={itemsById.get(product.id)?.quantity ?? 0}
        />
      ))}
    </ul>
  );
}

const ProductCard = memo(function ProductCard({
  product,
  quantity,
}: {
  product: Product;
  quantity: number;
}) {
  const available = product.stock > 0;
  return (
    <li className="card product">
      <h2 className="product__title">{product.title}</h2>
      <p className="product__description">{product.description}</p>
      <p className="product__price">{formatMoney(product.price)}</p>
      <p className={available ? 'product__stock' : 'product__stock product__stock--out'}>
        {available ? `В наличии: ${product.stock} шт.` : 'Нет в наличии'}
      </p>
      <CartControls
        productId={product.id}
        title={product.title}
        quantity={quantity}
        stock={product.stock}
      />
    </li>
  );
});
