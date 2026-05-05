"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Scissors, User, CreditCard, Smile, Star, ChevronLeft, Check, Smartphone } from "lucide-react";
import Link from "next/link";
import { createBooking } from "app/actions/booking";
import type { BarbershopService } from "@/generated/prisma";

// ─── Tipos ────────────────────────────────────────────────────────

type DayOption = {
  name: string;
  num: number;
  month: number;
  year: number;
  disabled: boolean;
};

type FormData = {
  name: string;
  phone: string;
  notes: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

type Props = {
  barbershopId: string;
  services: BarbershopService[];
  takenByDate: Record<string, string[]>;
};

// ─── Constantes (Inspiradas na Black Zone) ────────────────────────

const ALL_TIMES = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];
const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTH_NAMES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const STEPS = ["Serviço", "Data", "Horário", "Confirmação"];

// ─── Helpers ──────────────────────────────────────────────────────

function buildWeek(): DayOption[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dow = d.getDay();
    return {
      name: DAY_NAMES[dow],
      num: d.getDate(),
      month: d.getMonth(),
      year: d.getFullYear(),
      disabled: dow === 0, // Na Black Zone, domingo costuma ter horário reduzido ou fechado
    };
  });
}

function formatDate(day: DayOption): string {
  return `${String(day.num).padStart(2, "0")}/${String(day.month + 1).padStart(2, "0")}/${day.year}`;
}

function formatPrice(price: number): string {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ─── Sub-componentes ───────────────────────────────────────────────

function BookingSummary({ service, day, time }: { service?: BarbershopService; day: DayOption; time: string }) {
  if (!service) return null; // Proteção contra o erro 'reading name'

  return (
    <div className="border border-[#d4a017]/30 rounded p-4 mb-4 bg-[#d4a017]/5 flex flex-col gap-1.5 animate-in fade-in zoom-in duration-300">
      <p className="text-[10px] tracking-[0.18em] uppercase text-[#d4a017] font-bold mb-1">Resumo do Agendamento</p>
      <div className="flex justify-between text-sm">
        <span className="text-[#f5f0e8]/50">Serviço</span>
        <span className="font-medium text-[#f5f0e8]">{service.name}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-[#f5f0e8]/50">Preço</span>
        <span className="font-medium text-[#d4a017]">{formatPrice(Number(service.price))}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-[#f5f0e8]/50">Data</span>
        <span className="font-medium text-[#f5f0e8]">{formatDate(day)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-[#f5f0e8]/50">Horário</span>
        <span className="font-medium text-[#f5f0e8]">{time || "Não selecionado"}</span>
      </div>
    </div>
  );
}

// ─── Componente Principal ──────────────────────────────────────────

export default function BookingPage({ barbershopId, services = [], takenByDate = {} }: Props) {
  const WEEK = useMemo(() => buildWeek(), []);
  const firstAvailable = WEEK.find((d) => !d.disabled);

  // Estados
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [serviceId, setServiceId] = useState<string>(services[0]?.id || "");
  const [selectedDay, setSelectedDay] = useState<DayOption>(firstAvailable ?? WEEK[0]);
  const [selectedTime, setTime] = useState<string>("");
  const [form, setForm] = useState<FormData>({ name: "", phone: "", notes: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Cálculo do serviço ativo com fallback seguro
  const activeService = useMemo(() => {
    return services.find((s) => s.id === serviceId) || services[0];
  }, [services, serviceId]);

  // Reset de horário ao mudar o dia
  useEffect(() => {
    setTime("");
  }, [selectedDay]);

  const takenTimesForDay = useMemo(() => {
    const key = `${selectedDay.year}-${String(selectedDay.month + 1).padStart(2, "0")}-${String(selectedDay.num).padStart(2, "0")}`;
    return new Set(takenByDate[key] ?? []);
  }, [takenByDate, selectedDay]);

  const handleNext = () => setStep((s) => Math.min(s + 1, 4));
  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  async function handleSubmit() {
    if (!form.name.trim() || form.phone.length < 10) {
      setErrors({ name: !form.name.trim() ? "Nome obrigatório" : "", phone: form.phone.length < 10 ? "Telefone inválido" : "" });
      return;
    }

    setLoading(true);
    try {
      const result = await createBooking({
        ...form,
        serviceId: activeService.id,
        barbershopId,
        date: formatDate(selectedDay),
        time: selectedTime,
      });

      if (result?.error) {
        setServerError(result.error);
      } else {
        setSubmitted(true);
      }
    } catch (e) {
      setServerError("Erro ao processar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#f5f0e8] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center mb-6">
          <Check size={40} className="text-green-500" />
        </div>
        <h1 className="font-['Bebas_Neue'] text-5xl tracking-widest uppercase mb-2">Reserva <span className="text-[#d4a017]">Confirmada!</span></h1>
        <p className="text-[#f5f0e8]/60 mb-8">Obrigado, {form.name}! Seu horário na Black Zone está garantido.</p>
        <div className="w-full max-w-md">
          <BookingSummary service={activeService} day={selectedDay} time={selectedTime} />
        </div>
        <Link href="/" className="mt-8 text-[#d4a017] hover:underline uppercase tracking-widest text-xs font-bold">Voltar ao Início</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f0e8] p-6 lg:p-12">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="font-['Bebas_Neue'] text-6xl tracking-tighter uppercase mb-4">Black <span className="text-[#d4a017]">Zone</span></h1>
          <p className="text-[#f5f0e8]/40 uppercase tracking-[0.3em] text-[10px]">Qualidade com preço justo</p>
        </header>

        {/* Step 1: Serviços */}
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services?.map((svc) => (
              <button
                key={svc.id}
                onClick={() => { setServiceId(svc.id); handleNext(); }}
                className={`p-6 border rounded-xl text-left transition-all ${serviceId === svc.id ? 'border-[#d4a017] bg-[#d4a017]/10' : 'border-white/10 hover:border-white/30'}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold uppercase tracking-widest text-sm">{svc.name}</span>
                  <Scissors size={16} className="text-[#d4a017]" />
                </div>
                <span className="text-xl font-bold text-[#d4a017]">{formatPrice(Number(svc.price))}</span>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Data */}
        {step === 2 && (
          <div className="bg-white/5 p-8 rounded-2xl border border-white/10">
            <h2 className="text-[#d4a017] uppercase tracking-widest text-xs font-bold mb-6">Selecione o Dia</h2>
            <div className="grid grid-cols-7 gap-2">
              {WEEK.map((day, i) => (
                <button
                  key={i}
                  disabled={day.disabled}
                  onClick={() => setSelectedDay(day)}
                  className={`flex flex-col items-center p-3 rounded-lg transition-all ${day.disabled ? 'opacity-20' : selectedDay.num === day.num ? 'bg-[#d4a017] text-black' : 'bg-white/5 hover:bg-white/10'}`}
                >
                  <span className="text-[10px] uppercase font-bold">{day.name}</span>
                  <span className="text-lg font-bold">{day.num}</span>
                </button>
              ))}
            </div>
            <button onClick={handleNext} className="w-full mt-8 bg-[#d4a017] text-black font-bold py-4 rounded-xl uppercase tracking-widest hover:bg-[#b88a14]">Próximo</button>
          </div>
        )}

        {/* Step 3: Horário */}
        {step === 3 && (
          <div className="bg-white/5 p-8 rounded-2xl border border-white/10">
             <h2 className="text-[#d4a017] uppercase tracking-widest text-xs font-bold mb-6">Horários para {formatDate(selectedDay)}</h2>
             <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {ALL_TIMES.map(time => (
                  <button
                    key={time}
                    disabled={takenTimesForDay.has(time)}
                    onClick={() => setTime(time)}
                    className={`py-3 rounded-lg border text-sm font-bold ${takenTimesForDay.has(time) ? 'opacity-20 line-through' : selectedTime === time ? 'bg-[#d4a017] border-[#d4a017] text-black' : 'border-white/10 hover:border-[#d4a017]'}`}
                  >
                    {time}
                  </button>
                ))}
             </div>
             <div className="flex gap-4 mt-8">
                <button onClick={handleBack} className="flex-1 border border-white/20 py-4 rounded-xl uppercase tracking-widest font-bold">Voltar</button>
                <button onClick={handleNext} disabled={!selectedTime} className="flex-[2] bg-[#d4a017] text-black py-4 rounded-xl uppercase tracking-widest font-bold disabled:opacity-50">Confirmar Horário</button>
             </div>
          </div>
        )}

        {/* Step 4: Finalização */}
        {step === 4 && (
          <div className="max-w-md mx-auto">
            <BookingSummary service={activeService} day={selectedDay} time={selectedTime} />
            <div className="space-y-4">
              <input 
                placeholder="Seu Nome" 
                className="w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-[#d4a017]" 
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
              />
              <input 
                placeholder="WhatsApp (ex: 83993126003)" 
                className="w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-[#d4a017]" 
                value={form.phone}
                onChange={e => setForm({...form, phone: e.target.value})}
              />
              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-[#d4a017] text-black font-bold py-5 rounded-xl uppercase tracking-widest hover:bg-[#b88a14] transition-all disabled:opacity-50"
              >
                {loading ? "Processando..." : "Finalizar Agendamento"}
              </button>
              <button onClick={handleBack} className="w-full text-white/40 text-xs uppercase tracking-widest font-bold">Voltar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}