import { Link } from 'react-router';
import { usePageTitle } from '../hooks/usePageTitle';

export function NotFoundPage() {
  usePageTitle('Страница не найдена');
  return (
    <section>
      <h1>Страница не найдена</h1>
      <p>
        <Link to="/">Вернуться в каталог</Link>
      </p>
    </section>
  );
}
