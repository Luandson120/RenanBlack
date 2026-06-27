"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  adicionarServico,
  editarServico,
  toggleServicoAtivo,
  removerServico,
} from "../actions/servicos";

interface Servico {
  id: string;
  name: string;
  description: string;
  price: unknown;
  imageUrl: string;
  ativo: boolean;
}

interface FormData {
  name: string;
  description: string;
  price: string;
  imageUrl: string;
}

const formVazio: FormData = { name: "", description: "", price: "", imageUrl: "" };

export default function ServicosClient({ servicos: inicial }: { servicos: Servico[] }) {
  const router = useRouter();
  const [servicos, setServicos] = useState<Servico[]>(inicial);
  const [modal, setModal] = useState<"add" | "edit" | "remove" | null>(null);
  const [selecionado, setSelecionado] = useState<Servico | null>(null);
  const [form, setForm] = useState<FormData>(formVazio);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  function abrirAdicionar() {
    setForm(formVazio);
    setSelecionado(null);
    setErro("");
    setModal("add");
  }

  function abrirEditar(s: Servico) {
    setForm({
      name: s.name,
      description: s.description,
      price: Number(s.price).toString(),
      imageUrl: s.imageUrl,
    });
    setSelecionado(s);
    setErro("");
    setModal("edit");
  }

  function abrirRemover(s: Servico) {
    setSelecionado(s);
    setModal("remove");
  }

  async function handleSalvar() {
    if (!form.name || !form.description || !form.price) {
      setErro("Preencha todos os campos obrigatórios.");
      return;
    }
    setLoading(true);
    setErro("");

    const data = {
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      imageUrl: form.imageUrl,
    };

    const resultado =
      modal === "add"
        ? await adicionarServico(data)
        : await editarServico(selecionado!.id, data);

    if (!resultado.sucesso) {
      setErro(resultado.erro ?? "Erro desconhecido.");
      setLoading(false);
      return;
    }

    router.refresh();
    setModal(null);
    setLoading(false);
  }

  async function handleToggle(s: Servico) {
    const resultado = await toggleServicoAtivo(s.id, !s.ativo);
    if (resultado.sucesso) {
      setServicos((prev) =>
        prev.map((x) => (x.id === s.id ? { ...x, ativo: !s.ativo } : x))
      );
    }
  }

  async function handleRemover() {
    if (!selecionado) return;
    setLoading(true);
    const resultado = await removerServico(selecionado.id);
    if (resultado.sucesso) {
      setServicos((prev) => prev.filter((x) => x.id !== selecionado.id));
      setModal(null);
    } else {
      setErro(resultado.erro ?? "Erro ao remover.");
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-6 w-full max-w-2xl mx-auto flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push("/barbeiro/dashboard")}
            className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg border border-[#2a2a2a] text-[#555] hover:text-[#e0e0e0] hover:border-[#444] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="min-w-0">
            <p className="text-[#e8e8e8] text-sm font-medium truncate">Serviços</p>
            <p className="text-[#555] text-xs">{servicos.length} cadastrados</p>
          </div>
        </div>

        <button
          onClick={abrirAdicionar}
          className="shrink-0 flex items-center gap-1.5 bg-[#C9A84C] text-[#0a0a0a] text-xs font-medium px-3 py-2 rounded-lg hover:bg-[#d9b85c] transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Novo serviço
        </button>
      </div>

      <div className="border-t border-[#1a1a1a]" />

      {/* Lista */}
      <div className="flex flex-col gap-2.5">
        {servicos.length === 0 && (
          <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-8 text-center">
            <p className="text-[#444] text-sm">Nenhum serviço cadastrado.</p>
          </div>
        )}

        {servicos.map((s) => (
          <div
            key={s.id}
            className={`bg-[#111] border rounded-xl p-3.5 flex flex-col gap-3 transition-all ${
              s.ativo ? "border-[#222]" : "border-[#1a1a1a] opacity-50"
            }`}
          >
            {/* Info + ações numa linha no desktop, empilhado no mobile */}
            <div className="flex items-start justify-between gap-3">
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <p className="text-[#e0e0e0] text-sm font-medium">{s.name}</p>
                  {!s.ativo && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1a1a1a] text-[#555] border border-[#2a2a2a] shrink-0">
                      desabilitado
                    </span>
                  )}
                </div>
                <p className="text-[#444] text-xs leading-relaxed">{s.description}</p>
                <p className="text-[#C9A84C] text-xs font-medium mt-1.5">
                  {Number(s.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>
              </div>

              {/* Ações — visíveis sempre, empilhadas verticalmente em telas muito pequenas */}
              <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                {/* Toggle ativo/inativo */}
                <button
                  onClick={() => handleToggle(s)}
                  title={s.ativo ? "Desabilitar" : "Habilitar"}
                  className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors ${
                    s.ativo
                      ? "border-[#2a5a2a] text-green-400 hover:bg-green-950"
                      : "border-[#2a2a2a] text-[#555] hover:bg-[#1a1a1a]"
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18.36 6.64A9 9 0 1 1 5.64 5.64" /><line x1="12" y1="2" x2="12" y2="12" />
                  </svg>
                </button>

                {/* Editar */}
                <button
                  onClick={() => abrirEditar(s)}
                  title="Editar"
                  className="w-9 h-9 rounded-lg border border-[#222] text-[#555] hover:text-[#C9A84C] hover:border-[#4a3a1a] hover:bg-[#1a1200] flex items-center justify-center transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>

                {/* Remover */}
                <button
                  onClick={() => abrirRemover(s)}
                  title="Remover"
                  className="w-9 h-9 rounded-lg border border-[#222] text-[#555] hover:text-red-400 hover:border-red-900 hover:bg-[#1a0808] flex items-center justify-center transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Barra de ações rápidas no mobile — linha separada com labels */}
            <div className="flex sm:hidden items-center gap-2 pt-1 border-t border-[#1a1a1a]">
              <button
                onClick={() => handleToggle(s)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs transition-colors ${
                  s.ativo
                    ? "border-[#2a5a2a] text-green-400 hover:bg-green-950"
                    : "border-[#2a2a2a] text-[#555] hover:bg-[#1a1a1a]"
                }`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18.36 6.64A9 9 0 1 1 5.64 5.64" /><line x1="12" y1="2" x2="12" y2="12" />
                </svg>
                {s.ativo ? "Desabilitar" : "Habilitar"}
              </button>

              <button
                onClick={() => abrirEditar(s)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-[#2a2a2a] text-[#888] hover:text-[#C9A84C] hover:border-[#4a3a1a] text-xs transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Editar
              </button>

              <button
                onClick={() => abrirRemover(s)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-[#2a2a2a] text-[#888] hover:text-red-400 hover:border-red-900 text-xs transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Adicionar / Editar */}
      {(modal === "add" || modal === "edit") && (
        <div className="fixed inset-0 bg-black/75 flex items-end sm:items-center justify-center z-50 px-4 pb-6 sm:pb-0">
          <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-5 w-full max-w-sm flex flex-col gap-4">
            <p className="text-[#e0e0e0] text-sm font-medium">
              {modal === "add" ? "Novo serviço" : "Editar serviço"}
            </p>

            <div className="flex flex-col gap-3">
              {[
                { label: "Nome *", key: "name", placeholder: "Ex: Corte de Cabelo" },
                { label: "Descrição *", key: "description", placeholder: "Breve descrição" },
                { label: "Preço (R$) *", key: "price", placeholder: "25.00" },
                { label: "URL da imagem", key: "imageUrl", placeholder: "https://..." },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-[10px] text-[#555] uppercase tracking-wider mb-1.5">
                    {f.label}
                  </label>
                  <input
                    type={f.key === "price" ? "number" : "text"}
                    inputMode={f.key === "price" ? "decimal" : "text"}
                    placeholder={f.placeholder}
                    value={form[f.key as keyof FormData]}
                    onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-[#e0e0e0] placeholder-[#333] outline-none focus:border-[#C9A84C] transition-colors"
                  />
                </div>
              ))}
            </div>

            {erro && <p className="text-red-500 text-[11px]">{erro}</p>}

            <div className="flex gap-2">
              <button
                onClick={() => setModal(null)}
                className="flex-1 py-2.5 rounded-lg border border-[#2a2a2a] text-[#666] text-sm hover:text-[#e0e0e0] hover:bg-[#1a1a1a] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvar}
                disabled={loading}
                className="flex-1 py-2.5 rounded-lg bg-[#C9A84C] text-[#0a0a0a] text-sm font-medium hover:bg-[#d9b85c] disabled:opacity-50 transition-colors"
              >
                {loading ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Remoção */}
      {modal === "remove" && selecionado && (
        <div className="fixed inset-0 bg-black/75 flex items-end sm:items-center justify-center z-50 px-4 pb-6 sm:pb-0">
          <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-5 w-full max-w-sm flex flex-col gap-4">
            <p className="text-[#e0e0e0] text-sm font-medium">Remover serviço</p>
            <p className="text-[#666] text-sm leading-relaxed">
              Tem certeza que deseja remover{" "}
              <span className="text-[#e0e0e0] font-medium">{selecionado.name}</span>?
              {" "}Esta ação não pode ser desfeita.
            </p>
            {erro && <p className="text-red-500 text-[11px]">{erro}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => setModal(null)}
                className="flex-1 py-2.5 rounded-lg border border-[#2a2a2a] text-[#666] text-sm hover:text-[#e0e0e0] hover:bg-[#1a1a1a] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRemover}
                disabled={loading}
                className="flex-1 py-2.5 rounded-lg bg-[#2a0d0d] border border-[#4a1a1a] text-red-400 text-sm font-medium hover:bg-[#3a1414] disabled:opacity-50 transition-colors"
              >
                {loading ? "Removendo..." : "Remover"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
