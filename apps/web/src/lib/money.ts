const rubles = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export const formatMoney = (kopecks: number): string => rubles.format(kopecks / 100);

export const formatShipping = (kopecks: number): string =>
  kopecks === 0 ? 'Бесплатно' : formatMoney(kopecks);
