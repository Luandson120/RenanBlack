"use client";

import React, { useState, useMemo } from "react";
import { Scissors, User, CreditCard, Smile, Star, ChevronLeft, Check } from "lucide-react";
import Link from "next/link";
import { createBooking } from "app/actions/booking";
import type { BarbershopService } from "@/generated/prisma";

type DayOption = { name: string; num: number; month: number; year: number; disabled: boolean };
type FormData = { name: string; phone: string; notes: string };
type FormErrors = Partial<Record<keyof FormData, string>>;
type Props = { barbershopId: string; services: BarbershopService[]; takenByDate: Record<string, string[]> };

const ALL_TIMES = ["08:00","09:00","10:00","11:00","13:00","14:00","15:00","16:00"];
const DAY_NAMES = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const MONTH_NAMES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const STEPS = ["Serviço","Data","Horário","Dados"];

function buildWeek(): DayOption[] {
  const today = new Date();
  today.setHours(0,0,0,0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dow = d.getDay();
    return { name: DAY_NAMES[dow], num: d.getDate(), month: d.getMonth(), year: d.getFullYear(), disabled: dow === 0 || dow === 6 };
  });
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
  if (n.includes("hidratação"))  return <Star size={18} />;
  if (n.includes("assinatura"))  return <CreditCard size={18} />;
  if (n.includes("barba"))       return <User size={18} />;
  return <Scissors size={18} />;
}
function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.name.trim()) errors.name = "Nome obrigatório";
  if (data.phone.replace(/\D/g,"").length < 10) errors.phone = "WhatsApp inválido";
  return errors;
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/5 border border-[#d4a017]/20 rounded p-5 mb-4">
      <h2 className="text-[10px] tracking-[0.18em] uppercase text-[#d4a017] font-bold mb-3.5">{title}</h2>
      {children}
    </div>
  );
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

function BookingSummary({ service, day, time }: { service: BarbershopService; day: DayOption; time: string }) {
  return (
    <div className="border border-[#d4a017]/30 rounded p-4 mb-4 bg-[#d4a017]/5 flex flex-col gap-1.5">
      <p className="text-[10px] tracking-[0.18em] uppercase text-[#d4a017] font-bold mb-1">Resumo</p>
      <div className="flex justify-between text-sm">
        <span className="text-[#f5f0e8]/50">Serviço</span>
        <span className="font-medium">{service.name} — {formatPrice(Number(service.price))}{isSubscription(service.name) && <span className="text-xs text-[#d4a017]/60">/mês</span>}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-[#f5f0e8]/50">Data</span>
        <span className="font-medium">{formatDate(day)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-[#f5f0e8]/50">Horário</span>
        <span className="font-medium">{time}</span>
      </div>
    </div>
  );
}

export default function BookingPage({ barbershopId, services, takenByDate }: Props) {
  const WEEK           = useMemo(() => buildWeek(), []);
  const firstAvailable = WEEK.find((d) => !d.disabled);

  // ── Todos os hooks PRIMEIRO ────────────────────────────────────
  const [step, setStep]               = useState(1);
  const [serviceId, setServiceId]     = useState<string>(services?.[0]?.id ?? "");
  const [selectedDay, setSelectedDay] = useState<DayOption>(firstAvailable ?? WEEK[0]);
  const [selectedTime, setTime]       = useState<string>("");
  const [form, setForm]               = useState<FormData>({ name: "", phone: "", notes: "" });
  const [errors, setErrors]           = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);
  const [submitted, setSubmitted]     = useState(false); // ← estava faltando

  const activeService = services?.find((s) => s.id === serviceId) ?? services?.[0];

  const takenTimesForDay = useMemo(() => {
    const key = `${selectedDay.year}-${String(selectedDay.month+1).padStart(2,"0")}-${String(selectedDay.num).padStart(2,"0")}`;
    return new Set(takenByDate?.[key] ?? []);
  }, [takenByDate, selectedDay]);

  function handleNext() {
    if (step === 3 && !selectedTime) return;
    setStep((s) => Math.min(s + 1, 4));
  }
  function handleBack() { setStep((s) => Math.max(s - 1, 1)); }

  async function handleSubmit() {
    const errs = validateForm(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    setServerError(null);
    const result = await createBooking({
      ...form,
      serviceId: activeService.id,
      barbershopId,
      date: formatDate(selectedDay),
      time: selectedTime,
    });
    setLoading(false);
    if ("error" in result) { setServerError(result.error); return; }
    setSubmitted(true);
  }

  // ── Early return DEPOIS de todos os hooks ──────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#f5f0e8] flex flex-col items-center justify-center gap-5 p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-[#d4a017]/15 border border-[#d4a017]/40 flex items-center justify-center">
          <Check size={26} className="text-[#d4a017]" />
        </div>
        <h1 className="font-['Bebas_Neue'] text-4xl tracking-wider">
          Agendado com <span className="text-[#d4a017]">sucesso!</span>
        </h1>
        <p className="text-sm text-[#f5f0e8]/50 max-w-xs leading-relaxed">
          Seu horário foi reservado. Entraremos em contato pelo WhatsApp para confirmar.
        </p>
        <BookingSummary service={activeService} day={selectedDay} time={selectedTime} />
        <Link href="/" className="text-[11px] tracking-widest uppercase text-[#d4a017]/70 hover:text-[#d4a017] transition-colors">
          ← Voltar ao início
        </Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-[#f5f0e8] font-sans p-9 pb-16 overflow-hidden">
      <div className="absolute top-0 bottom-0 left-10 w-px bg-gradient-to-b from-transparent via-[#d4a017] to-transparent opacity-50 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-10 w-px bg-gradient-to-b from-transparent via-[#d4a017] to-transparent opacity-20 pointer-events-none" />

      <div className="relative z-10 max-w-xl mx-auto">
        <div className="text-center mb-9">
          <Link href="/" className="inline-flex items-center gap-1 text-[11px] tracking-[0.15em] uppercase text-[#d4a017]/70 hover:text-[#d4a017] transition-colors mb-4 no-underline">
            <ChevronLeft size={14} /> Voltar para início
          </Link>
          <h1 className="font-['Bebas_Neue'] text-5xl leading-[0.9] tracking-wider uppercase">
            Agende seu <span className="text-[#d4a017]">horário</span>
          </h1>
          <div className="w-10 h-px bg-[#d4a017] mx-auto mt-3.5" />
        </div>

        <StepIndicator current={step} />

        {step === 1 && (
          <SectionCard title="Escolha o serviço">
            <div className="grid grid-cols-2 gap-2.5">
              {services.map((svc) => (
                <div key={svc.id} onClick={() => setServiceId(svc.id)}
                  className={`border rounded p-3.5 text-center cursor-pointer transition-all select-none ${serviceId === svc.id ? "bg-[#d4a017]/10 border-[#d4a017]" : "border-[#d4a017]/20 hover:bg-[#d4a017]/5"}`}>
                  <div className="w-8 h-8 bg-[#d4a017]/10 rounded-full flex items-center justify-center mx-auto mb-2 text-[#d4a017]">{serviceIcon(svc.name)}</div>
                  <div className="text-[11px] tracking-widest uppercase font-medium text-[#f5f0e8]/75">{svc.name}</div>
                  <div className="text-sm text-[#d4a017] font-semibold mt-1">
                    {formatPrice(Number(svc.price))}{isSubscription(svc.name) && <span className="text-xs font-normal text-[#d4a017]/60">/mês</span>}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {step === 2 && (
          <SectionCard title={`Escolha a data — ${MONTH_NAMES[selectedDay.month]} ${selectedDay.year}`}>
            <div className="grid grid-cols-7 gap-1.5">
              {WEEK.map((day, idx) => (
                <div key={idx} onClick={() => !day.disabled && setSelectedDay(day)}
                  className={`border rounded py-2 px-1 text-center transition-all select-none ${day.disabled ? "opacity-25 cursor-default" : "cursor-pointer hover:bg-[#d4a017]/10"} ${selectedDay.num === day.num && selectedDay.month === day.month && !day.disabled ? "bg-[#d4a017]/10 border-[#d4a017]" : "border-[#d4a017]/15"}`}>
                  <div className="text-[9px] tracking-widest uppercase text-[#f5f0e8]/40 font-bold">{day.name}</div>
                  <div className="text-base font-semibold text-[#f5f0e8] mt-0.5">{day.num}</div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {step === 3 && (
          <SectionCard title="Escolha o horário">
            <div className="grid grid-cols-4 gap-2">
              {ALL_TIMES.map((time) => {
                const taken = takenTimesForDay.has(time);
                const active = selectedTime === time;
                return (
                  <div key={time} onClick={() => !taken && setTime(time)} title={taken ? "Horário indisponível" : undefined}
                    className={`border rounded py-2.5 px-1.5 text-center text-xs font-medium tracking-wider transition-all select-none ${taken ? "opacity-20 cursor-default line-through" : active ? "bg-[#d4a017]/10 border-[#d4a017] text-[#f5f0e8] cursor-pointer" : "border-[#d4a017]/15 text-[#f5f0e8]/70 hover:text-[#f5f0e8] hover:border-[#d4a017] cursor-pointer"}`}>
                    {time}
                  </div>
                );
              })}
            </div>
            {!selectedTime && <p className="text-[11px] text-[#d4a017]/60 mt-3">Selecione um horário para continuar.</p>}
          </SectionCard>
        )}

        {step === 4 && (
          <>
            <BookingSummary service={activeService} day={selectedDay} time={selectedTime} />
            <SectionCard title="Seus dados">
              <div className="flex flex-col gap-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="flex flex-col gap-1">
                    <input className={`bg-white/5 border text-[#f5f0e8] p-2.5 px-3.5 text-sm rounded outline-none focus:border-[#d4a017]/50 placeholder:text-[#f5f0e8]/30 transition-colors ${errors.name ? "border-red-500/60" : "border-[#f5f0e8]/20"}`}
                      type="text" placeholder="Nome completo" value={form.name}
                      onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setErrors((er) => ({ ...er, name: undefined })); }} />
                    {errors.name && <span className="text-red-400 text-[11px]">{errors.name}</span>}
                  </div>
                  <div className="flex flex-col gap-1">
                    <input className={`bg-white/5 border text-[#f5f0e8] p-2.5 px-3.5 text-sm rounded outline-none focus:border-[#d4a017]/50 placeholder:text-[#f5f0e8]/30 transition-colors ${errors.phone ? "border-red-500/60" : "border-[#f5f0e8]/20"}`}
                      type="tel" placeholder="WhatsApp (ex: 83 9 9999-9999)" value={form.phone}
                      onChange={(e) => { setForm((f) => ({ ...f, phone: e.target.value })); setErrors((er) => ({ ...er, phone: undefined })); }} />
                    {errors.phone && <span className="text-red-400 text-[11px]">{errors.phone}</span>}
                  </div>
                </div>
                <input className="bg-white/5 border border-[#f5f0e8]/20 text-[#f5f0e8] p-2.5 px-3.5 text-sm rounded outline-none focus:border-[#d4a017]/50 placeholder:text-[#f5f0e8]/30 w-full"
                  type="text" placeholder="Observações (opcional)" value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
                {serverError && <p className="text-red-400 text-[11px] text-center">{serverError}</p>}
                <button onClick={handleSubmit} disabled={loading}
                  className="w-full bg-[#d4a017] hover:bg-[#e6b420] active:scale-[0.98] text-[#0a0a0a] py-3.5 px-4 text-xs font-bold tracking-[0.18em] uppercase rounded transition-all mt-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? "Confirmando…" : "Confirmar agendamento"}
                </button>
              </div>
            </SectionCard>
          </>
        )}

        <div className={`flex mt-2 gap-3 ${step > 1 ? "justify-between" : "justify-end"}`}>
          {step > 1 && (
            <button onClick={handleBack} className="text-[11px] tracking-widest uppercase text-[#f5f0e8]/40 hover:text-[#f5f0e8]/70 transition-colors flex items-center gap-1">
              <ChevronLeft size={13} /> Anterior
            </button>
          )}
          {step < 4 && (
            <button onClick={handleNext} disabled={step === 3 && !selectedTime}
              className="text-[11px] tracking-widest uppercase bg-[#d4a017] text-[#0a0a0a] font-bold px-5 py-2.5 rounded transition-all hover:bg-[#e6b420] disabled:opacity-30 disabled:cursor-not-allowed">
              Próximo →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
