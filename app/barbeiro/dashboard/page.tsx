import { getDashboardData, confirmarAgendamento, cancelarAgendamento } from "../actions/dashboard";
import DashboardClient from "./DashboardClient";

export default async function BarbeiroDashboardPage() {
  const data = await getDashboardData();
  return (
    <DashboardClient
      data={data}
      onConfirmar={confirmarAgendamento}
      onCancelar={cancelarAgendamento}
    />
  );
}
