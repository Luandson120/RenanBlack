"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Scissors, User, CreditCard, Smile, Star, Check } from "lucide-react";
import { createBooking } from "@/app/actions/booking";
import type { BarbershopService } from "@/generated/prisma";

type DayOption = { name: string; num: number; month: number; year: number; disabled: boolean };
type FormData = { name: string; phone: string; notes: string };
type FormErrors = Partial<Record<keyof FormData, string>>;
type Props = { barbershopId: string; services?: (Omit<BarbershopService, "price"> & { price: number })[] };
const DAY_NAMES = ["Dom","Seg","Ter","Qua","Qui","Sex","Sab"];
const MONTH_NAMES = ["Janeiro","Fevereiro","Marco","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const STEPS = ["Servico","Data","Horario","Dados"];

function buildWeek(): DayOption[] {
  const today = new Date();
  today.setHours(0,0,0,0);
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dow = d.getDay();
    return { name: DAY_NAMES[dow], num: d.getDate(), month: d.getMonth(), year: d.getFullYear(), disabled: dow === 0 };
  });
}

function toApiDate(day: DayOption): string {
  return `${day.year}-${String(day.month+1).padStart(2,"0")}-${String(day.num).padStart(2,"0")}`;
}

function formatDate(day: DayOption): string {
  return `${String(day.num).padStart(2,"0")}/${String(day.month+1).padStart(2,"0")}/${day.year}`;
}

function formatPrice(price: number): string {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function isSubscription(name: string): boolean {
  return name.toLowerCase().includes("assinatura");
}

function serviceIcon(name: string): React.ReactNode {
  const n = name.toLowerCase();
  if (n.includes("sobrancelha")) return <Smile size={18} />;
  if (n.includes("hidratacao")) return <Star size={18} />;
  if (n.includes("assinatura")) return <CreditCard size={18} />;
  if (n.includes("barba")) return <User size={18} />;
  return <Scissors size={18} />;
}

function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.name.trim()) errors.name = "Nome obrigatorio";
  if (data.phone.replace(/\D/g,"").length < 10) errors.phone = "WhatsApp invalido";
  return errors;
}

// remove acentos/pontuacao pra comparar "Corte Degradê (Fade)" com variações vindas da URL
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex justify-center items-center mb-8 gap-1">
      {STEPS.map((label, idx) => {
        const step = idx + 1;
        const done = step < current;
        const active = step === current;
        return (
          <React.Fragment key={step}>
            <div className={`flex items-center gap-2 text-[11px] tracking-widest uppercase font-semibold transition-colors ${active ? "text-[#d4a017]" : done ? "text-[#d4a017]/60" : "text-[#f5f0e8]/35"}`}>
              <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] transition-all ${active ? "bg-[#d4a017] text-[#0a0a0a] border-[#d4a017]" : done ? "bg-[#d4a017]/30 border-[#d4a017]/60 text-[#d4a017]" : "border-current"}`}>
                {done ? <Check size={10} /> : step}
              </div>
              <span className="hidden sm:inline">{label}</span>
            </div>
            {step < 4 && <div className={`w-7 h-[1px] mx-1 transition-colors ${done ? "bg-[#d4a017]/40" : "bg-[#f5f0e8]/15"}`} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function BookingClient({ barbershopId, services = [] }: Props) {
  const WEEK = useMemo(() => buildWeek(), []);
  const firstAvailable = WEEK.find((d) => !d.disabled);
  const searchParams = useSearchParams();

  const [step, setStep]               = useState(1);
  const [serviceId, setServiceId]     = useState<string>(services[0]?.id ?? "");
  const [autoSelected, setAutoSelected] = useState(false);
  const [selectedDay, setDay]         = useState<DayOption>(firstAvailable ?? WEEK[0]);
  const [selectedTime, setTime]       = useState<string>("");
  const [form, setForm]               = useState<FormData>({ name: "", phone: "", notes: "" });
  const [errors, setErrors]           = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [availableTimes, setAvailableTimes]   = useState<string[]>([]);
  const [loadingTimes, setLoadingTimes]       = useState(false);

  const selectedService = services.find(s => s.id === serviceId);

  // pré-seleciona o serviço quando vem de /agendamento?servico=Nome (cards da home)
  useEffect(() => {
    if (autoSelected || services.length === 0) return;
    const servicoParam = searchParams.get("servico");
    if (!servicoParam) { setAutoSelected(true); return; }

    const target = normalize(servicoParam);
    const match =
      services.find((s) => normalize(s.name) === target) ??
      services.find((s) => normalize(s.name).includes(target) || target.includes(normalize(s.name)));

    if (match) {
      setServiceId(match.id);
      setStep(2);
    }
    setAutoSelected(true);
  }, [searchParams, services, autoSelected]);

  useEffect(() => {
    setLoadingTimes(true);
    setTime("");
    const dateStr = toApiDate(selectedDay);
    fetch(`/api/bookings/available?date=${dateStr}`)
      .then(res => res.json())
      .then(data => setAvailableTimes(data.available ?? []))
      .catch(() => setAvailableTimes([]))
      .finally(() => setLoadingTimes(false));
  }, [selectedDay]);

  async function handleSubmit() {
    const errs = validateForm(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setServerError(null);
    const res = await createBooking({
      barbershopId, serviceId,
      date: formatDate(selectedDay),
      time: selectedTime,
      name: form.name,
      phone: form.phone,
      notes: form.notes,
    });
    setLoading(false);
    if (res?.error) { setServerError(res.error); return; }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-[#d4a017]/20 flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-[#d4a017]" />
          </div>
          <h2 className="text-2xl font-bold text-[#f5f0e8] mb-2">Agendamento confirmado!</h2>
          <p className="text-[#f5f0e8]/50 mb-6">Ate logo, <span className="text-[#f5f0e8]">{form.name}</span>!</p>
          <div className="border border-[#d4a017]/20 rounded p-4 text-left space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-[#f5f0e8]/50">Servico</span>
              <span className="text-[#f5f0e8]">{selectedService?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#f5f0e8]/50">Data</span>
              <span className="text-[#f5f0e8]">{formatDate(selectedDay)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#f5f0e8]/50">Horario</span>
              <span className="text-[#f5f0e8]">{selectedTime}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#f5f0e8]/50">Valor</span>
              <span className="text-[#d4a017] font-bold">{formatPrice(Number(selectedService?.price))}</span>
            </div>
          </div>
          <button
            onClick={() => { setSubmitted(false); setStep(1); setTime(""); setForm({ name: "", phone: "", notes: "" }); }}
            className="w-full border border-[#d4a017]/30 text-[#d4a017] py-3 rounded text-sm hover:bg-[#d4a017]/10 transition"
          >
            Fazer novo agendamento
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f0e8] p-4">
      <div className="max-w-lg mx-auto pt-8">
        <StepIndicator current={step} />

        {selectedService && step > 1 && (
          <div className="flex items-center justify-between border border-[#d4a017]/20 bg-[#d4a017]/5 rounded px-3 py-2 mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#f5f0e8]/40">Servico selecionado</p>
              <p className="text-sm text-[#f5f0e8] font-medium">{selectedService.name}</p>
            </div>
            <button onClick={() => setStep(1)} className="text-xs text-[#d4a017] hover:underline">
              Trocar
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-2">
            {services.length === 0 ? (
              <p className="text-[#f5f0e8]/40 text-sm text-center py-8">
                Nenhum serviço disponível no momento.
              </p>
            ) : (
              services.map((s) => (
                <button key={s.id}
                  onClick={() => { setServiceId(s.id); setStep(2); }}
                  className={`w-full text-left p-4 rounded border transition flex items-center gap-3 ${serviceId === s.id ? "border-[#d4a017] bg-[#d4a017]/10" : "border-[#f5f0e8]/10 hover:border-[#d4a017]/40"}`}>
                  <span className="text-[#d4a017]">{serviceIcon(s.name)}</span>
                  <div className="flex-1">
                    <p className="font-medium">{s.name}</p>
                    <p className="text-sm text-[#f5f0e8]/50">
                      {formatPrice(Number(s.price))}{isSubscription(s.name) && <span className="text-xs text-[#d4a017]/60">/mes</span>}
                    </p>
                  </div>
                  {serviceId === s.id && <Check size={16} className="text-[#d4a017]" />}
                </button>
              ))
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-xs tracking-widest uppercase text-[#d4a017] font-bold">Escolha o dia</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {WEEK.map((d, i) => (
                <button key={i}
                  disabled={d.disabled}
                  onClick={() => setDay(d)}
                  className={`flex-shrink-0 flex flex-col items-center p-3 rounded border w-16 transition
                    ${d.disabled ? "border-[#f5f0e8]/5 text-[#f5f0e8]/20 cursor-not-allowed" : ""}
                    ${!d.disabled && toApiDate(d) === toApiDate(selectedDay) ? "border-[#d4a017] bg-[#d4a017]/10 text-[#d4a017]" : ""}
                    ${!d.disabled && toApiDate(d) !== toApiDate(selectedDay) ? "border-[#f5f0e8]/10 hover:border-[#d4a017]/40" : ""}
                  `}>
                  <span className="text-[10px] uppercase">{d.name}</span>
                  <span className="text-lg font-bold">{d.num}</span>
                  <span className="text-[10px] text-[#f5f0e8]/40">{MONTH_NAMES[d.month].slice(0,3)}</span>
                </button>
              ))}
            </div>
            <p className="text-xs tracking-widest uppercase text-[#d4a017] font-bold mt-4">Horarios disponiveis</p>
            {loadingTimes ? (
              <p className="text-[#f5f0e8]/40 text-sm text-center py-4">Carregando...</p>
            ) : availableTimes.length === 0 ? (
              <p className="text-red-400 text-sm text-center py-4">Nenhum horario disponivel neste dia.</p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {availableTimes.map((t) => (
                  <button key={t}
                    onClick={() => { setTime(t); setStep(3); }}
                    className={`py-2 rounded text-sm border transition ${
                      selectedTime === t
                        ? "bg-[#d4a017] text-[#0a0a0a] border-[#d4a017] font-bold"
                        : "border-[#f5f0e8]/10 hover:border-[#d4a017]/40"
                    }`}>
                    {t}
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setStep(1)} className="text-sm text-[#f5f0e8]/40 hover:text-[#f5f0e8] transition">
              Voltar
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="border border-[#d4a017]/20 rounded p-4 space-y-2">
              <p className="text-xs tracking-widest uppercase text-[#d4a017] font-bold mb-2">Resumo</p>
              <div className="flex justify-between text-sm">
                <span className="text-[#f5f0e8]/50">Servico</span>
                <span>{selectedService?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#f5f0e8]/50">Data</span>
                <span>{formatDate(selectedDay)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#f5f0e8]/50">Horario</span>
                <span>{selectedTime}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#f5f0e8]/50">Valor</span>
                <span className="text-[#d4a017] font-bold">{formatPrice(Number(selectedService?.price))}</span>
              </div>
            </div>
            <button onClick={() => setStep(4)}
              className="w-full bg-[#d4a017] text-[#0a0a0a] py-3 rounded font-bold hover:bg-[#d4a017]/90 transition">
              Continuar
            </button>
            <button onClick={() => setStep(2)} className="text-sm text-[#f5f0e8]/40 hover:text-[#f5f0e8] transition">
              Voltar
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <p className="text-xs tracking-widest uppercase text-[#d4a017] font-bold">Seus dados</p>
            <input
              placeholder="Seu nome"
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full bg-transparent border border-[#f5f0e8]/10 rounded p-3 text-[#f5f0e8] placeholder-[#f5f0e8]/30 focus:border-[#d4a017] outline-none"
            />
            {errors.name && <p className="text-red-400 text-xs">{errors.name}</p>}
            <input
              placeholder="WhatsApp"
              value={form.phone}
              onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full bg-transparent border border-[#f5f0e8]/10 rounded p-3 text-[#f5f0e8] placeholder-[#f5f0e8]/30 focus:border-[#d4a017] outline-none"
            />
            {errors.phone && <p className="text-red-400 text-xs">{errors.phone}</p>}
            <textarea
              placeholder="Observacoes (opcional)"
              value={form.notes}
              onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full bg-transparent border border-[#f5f0e8]/10 rounded p-3 text-[#f5f0e8] placeholder-[#f5f0e8]/30 focus:border-[#d4a017] outline-none h-20"
            />
            {serverError && <p className="text-red-400 text-sm">{serverError}</p>}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-[#d4a017] text-[#0a0a0a] py-3 rounded font-bold disabled:opacity-50 hover:bg-[#d4a017]/90 transition"
            >
              {loading ? "Agendando..." : "Confirmar agendamento"}
            </button>
            <button onClick={() => setStep(3)} className="text-sm text-[#f5f0e8]/40 hover:text-[#f5f0e8] transition">
              Voltar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}