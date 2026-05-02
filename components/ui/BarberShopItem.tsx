interface BarberShopItemProps {
  barbershop: {
    name: string;
  };
}

const BarberShopItem = ({ barbershop }: BarberShopItemProps) => {
  return (
    <h1>{barbershop.name}</h1>
  );
}

export default BarberShopItem;