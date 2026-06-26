// src/app/barbeiro/dashboard/page.tsx

import {
  getDashboardData,
  atualizarStatusAgendamento,
  toggleStatusBarbearia,
  adicionarValorExtra,
} from "../actions/dashboard";
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

  // Recebe o status ATUAL vindo do client (para não depender de data.aberta stale)
  async function onToggleStatus(abertaAtual: boolean) {
    "use server";
    if (!data.barbershopId) return;
    await toggleStatusBarbearia(data.barbershopId, abertaAtual);
  }

  async function onAdicionarValorExtra(descricao: string, valor: number) {
    "use server";
    await adicionarValorExtra(descricao, valor);
  }

  return (
    <DashboardClient
      data={data}
      onConfirmar={onConfirmar}
      onCancelar={onCancelar}
      onToggleStatus={onToggleStatus}
      onAdicionarValorExtra={onAdicionarValorExtra}
    />
  );
}
