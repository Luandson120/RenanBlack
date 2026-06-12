import BookingPage from "./BookingPage";
import { prisma } from "@/lib/prisma";


export default async function AgendamentoPage() {
  const barbershop = await prisma.barbershop.findFirst({
    include: { services: true },
  });

  if (!barbershop) return <div>Barbearia não encontrada</div>;

  // Converte Decimal para number
  const services = barbershop.services.map((service) => ({
    ...service,
    price: service.price.toNumber(),
  }));

  return (
    <BookingPage
      barbershopId={barbershop.id}
      services={services}
    />
  );
} 