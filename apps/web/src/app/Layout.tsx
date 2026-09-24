import { useEffect, useRef } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { useCart } from '../features/cart/CartProvider';
import { CurrentOrderBanner } from '../features/order/CurrentOrderBanner';

export function Layout() {
  const { data: cart } = useCart();
  const count = cart?.quantity ?? 0;
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const previousPath = useRef(pathname);

  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    window.scrollTo(0, 0);
    mainRef.current?.focus();
  }, [pathname]);
  return (
    <>
      <a className="skip-link" href="#main">
        К содержимому
      </a>
      <header className="header">
        <div className="container header__inner">
          <Link to="/" className="header__logo">
            Учебный магазин
          </Link>
          <nav className="header__nav" aria-label="Основная навигация">
            <NavLink to="/" end className="header__link">
              Каталог
            </NavLink>
            <NavLink to="/cart" className="header__link">
              Корзина
              {count > 0 && (
                <span className="badge" aria-label={`, товаров: ${count}`}>
                  {count}
                </span>
              )}
            </NavLink>
          </nav>
        </div>
      </header>
      <main id="main" ref={mainRef} tabIndex={-1} className="container main">
        <CurrentOrderBanner />
        <Outlet />
      </main>
    </>
  );
}
