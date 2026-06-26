import { getDashboardData, atualizarStatusAgendamento, toggleStatusBarbearia } from "../actions/dashboard";
import DashboardClient from "./DashboardClient";

export default async function BarbeiroDashboardPage() {
  const data = await getDashboardData();

  async function onConfirmar(id: string) {
    "use server";
    await atualizarStatusAgendamento(id, "concluido");
  }

  async function onCancelar(id: string) {
    "use server";
    await atualizarStatusAgendamento(id, "cancelado");
  }

  async function onToggleStatus() {
    "use server";
    if (!data.barbershopId) return;
    await toggleStatusBarbearia(data.barbershopId, data.aberta);
  }

  return (
    <DashboardClient
      data={data}
      onConfirmar={onConfirmar}
      onCancelar={onCancelar}
      onToggleStatus={onToggleStatus}
    />
  );
}
