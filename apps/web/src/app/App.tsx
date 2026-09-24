import { BrowserRouter, Route, Routes } from 'react-router';
import { CartProvider } from '../features/cart/CartProvider';
import { CatalogProvider } from '../features/catalog/CatalogProvider';
import { CartPage } from '../pages/CartPage';
import { CatalogPage } from '../pages/CatalogPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { OrderPage } from '../pages/OrderPage';
import { Layout } from './Layout';

export function App() {
  return (
    <BrowserRouter>
      <CatalogProvider>
        <CartProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<CatalogPage />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="orders/:orderId" element={<OrderPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </CartProvider>
      </CatalogProvider>
    </BrowserRouter>
  );
}
