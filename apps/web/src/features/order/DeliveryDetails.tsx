import { api, type Delivery } from '../../api';
import { useResource } from '../../hooks/useResource';

export function DeliveryDetails({ delivery }: { delivery: Delivery }) {
  const isPickup = delivery.method === 'pickup';
  const options = useResource(isPickup ? api.checkoutOptions : null, [isPickup]);

  if (delivery.method === 'courier') {
    const { city, street, house, apartment } = delivery.address;
    return (
      <p>
        Курьером: {city}, {street}, д. {house}
        {apartment ? `, кв. ${apartment}` : ''}
      </p>
    );
  }

  const point = options.data?.deliveryMethods
    .find((method) => method.id === 'pickup')
    ?.pickupPoints.find((item) => item.id === delivery.pickupPointId);
  return <p>Самовывоз: {point ? `${point.title}, ${point.address}` : delivery.pickupPointId}</p>;
}
