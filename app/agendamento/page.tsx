import { PrismaClient } from "@/generated/prisma";
import BookingPage from "/app/agendamento/BookingPage";
import { getServicesWithTakenTimes } from "app/actions/booking";

const prisma = new PrismaClient();

export default async function Page() {
  const barbershop = await prisma.barbershop.findFirst();
  if (!barbershop) return <p>Barbearia não encontrada.</p>;

  const { services, takenByDate } = await getServicesWithTakenTimes(barbershop.id);

  return (
    <BookingPage
      barbershopId={barbershop.id}
      services={services}
      takenByDate={takenByDate}
    />
  );
}
