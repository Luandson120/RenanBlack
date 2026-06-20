"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Scissors } from "lucide-react";
import { loginBarbeiro } from "../actions/login";

function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length > 9)
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (digits.length > 6)
    return digits.replace(/(\d{3})(\d{3})(\d+)/, "$1.$2.$3");
  if (digits.length > 3) return digits.replace(/(\d{3})(\d+)/, "$1.$2");
  return digits;
}

function validarCPF(cpf: string): boolean {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  let sum = 0;
  for (let i = 1; i <= 9; i++) sum += parseInt(d[i - 1]) * (11 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(d[9])) return false;
  sum = 0;
  for (let i = 1; i <= 10; i++) sum += parseInt(d[i - 1]) * (12 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  return rest === parseInt(d[10]);
}

function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

interface FormErrors {
  cpf?: string;
  email?: string;
  senha?: string;
  geral?: string;
}

export default function BarbeiroLoginPage() {
  const router = useRouter();

  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  function handleCPFChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCpf(formatCPF(e.target.value));
  }

  function validar(): boolean {
    const errs: FormErrors = {};
    if (!validarCPF(cpf)) errs.cpf = "CPF inválido.";
    if (!validarEmail(email)) errs.email = "E-mail inválido.";
    if (senha.length < 6) errs.senha = "Mínimo 6 caracteres.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validar()) return;

    setLoading(true);
    setErrors({});

    const resultado = await loginBarbeiro(cpf, email, senha);

    if (!resultado.sucesso) {
      setErrors({ geral: resultado.erro });
      setLoading(false);
      return;
    }

    setSucesso(true);
    setTimeout(() => router.push("/barbeiro/dashboard"), 1800);
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-[#111111] border border-[#2a2a2a] rounded-2xl p-8">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-full bg-[#1a1a1a] border border-[#C9A84C] flex items-center justify-center mb-3">
            <Scissors className="w-6 h-6 text-[#C9A84C]" />
          </div>
          <h1 className="text-[#e8e8e8] text-lg font-medium">Renan Black Barber</h1>
          <p className="text-[#555] text-xs tracking-widest uppercase mt-0.5">
            Acesso do Barbeiro
          </p>
        </div>

        {!sucesso ? (
          <div className="space-y-5">

            {/* CPF */}
            <div>
              <label className="block text-[11px] text-[#666] uppercase tracking-wider mb-1.5">
                CPF
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={handleCPFChange}
                maxLength={14}
                autoComplete="off"
                className={`w-full bg-[#0d0d0d] border rounded-lg px-4 py-2.5 text-sm text-[#e0e0e0] placeholder-[#3a3a3a] outline-none transition-colors focus:border-[#C9A84C] ${
                  errors.cpf ? "border-red-600" : "border-[#2a2a2a]"
                }`}
              />
              {errors.cpf && (
                <p className="text-red-500 text-[11px] mt-1">{errors.cpf}</p>
              )}
            </div>

            {/* E-mail */}
            <div>
              <label className="block text-[11px] text-[#666] uppercase tracking-wider mb-1.5">
                E-mail
              </label>
              <input
                type="email"
                placeholder="barbeiro@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                className={`w-full bg-[#0d0d0d] border rounded-lg px-4 py-2.5 text-sm text-[#e0e0e0] placeholder-[#3a3a3a] outline-none transition-colors focus:border-[#C9A84C] ${
                  errors.email ? "border-red-600" : "border-[#2a2a2a]"
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-[11px] mt-1">{errors.email}</p>
              )}
            </div>

            {/* Senha */}
            <div>
              <label className="block text-[11px] text-[#666] uppercase tracking-wider mb-1.5">
                Senha
              </label>
              <div className="relative">
                <input
                  type={mostrarSenha ? "text" : "password"}
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  autoComplete="current-password"
                  className={`w-full bg-[#0d0d0d] border rounded-lg px-4 py-2.5 pr-10 text-sm text-[#e0e0e0] placeholder-[#3a3a3a] outline-none transition-colors focus:border-[#C9A84C] ${
                    errors.senha ? "border-red-600" : "border-[#2a2a2a]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#444] hover:text-[#C9A84C] transition-colors"
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  {mostrarSenha ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {errors.senha && (
                <p className="text-red-500 text-[11px] mt-1">{errors.senha}</p>
              )}
            </div>

            {/* Erro geral */}
            {errors.geral && (
              <p className="text-red-500 text-[11px] text-center">{errors.geral}</p>
            )}

            {/* Botão */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-[#C9A84C] hover:bg-[#d9b85c] disabled:bg-[#3a2f1a] disabled:text-[#6a5a2a] text-[#0a0a0a] font-medium text-sm py-3 rounded-lg tracking-wide transition-colors mt-2"
            >
              {loading ? "Verificando..." : "Entrar no painel"}
            </button>
          </div>
        ) : (
          /* Sucesso */
          <div className="flex flex-col items-center py-6 text-center">
            <div className="w-14 h-14 rounded-full bg-green-950 border border-green-700 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <p className="text-green-400 text-sm font-medium">Login realizado!</p>
            <p className="text-green-700 text-xs mt-1">Redirecionando para o dashboard...</p>
          </div>
        )}
      </div>
    </main>
  );
}
