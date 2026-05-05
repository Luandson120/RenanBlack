"use client";

import { useState, useMemo, useCallback } from "react";
import { createBooking } from "app/actions/booking";
import type { BarbershopService } from "@/generated/prisma";
import {
  Scissors,
  User,
  CreditCard,
  Smile,
  Star,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  Calendar,
  AlertCircle,
  Loader2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────

type Props = {
  barbershopId: string;
  services: BarbershopService[];
  takenByDate: Record<string, string[]>;
};

type DayOption = {
  num: number;
  label: string;
  weekday: string;
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

// ─── Constants ────────────────────────────────────────────────────

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00",
];

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// ─── Utilities ────────────────────────────────────────────────────

function buildWeek(): DayOption[] {
  const today = new Date();
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      num: d.getDate(),
      label: String(d.getDate()).padStart(2, "0"),
      weekday: WEEKDAYS[d.getDay()],
      month: d.getMonth(),
      year: d.getFullYear(),
      disabled: d.getDay() === 0, // domingo fechado
    };
  });
}

function formatDate(day: DayOption): string {
  return `${day.year}-${String(day.month + 1).padStart(2, "0")}-${String(day.num).padStart(2, "0")}`;
}

function formatPrice(price: number): string {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function validateForm(form: FormData): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) errors.name = "Nome é obrigatório";
  if (!form.phone.trim()) errors.phone = "Telefone é obrigatório";
  else if (!/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/.test(form.phone.replace(/\s/g, "")))
    errors.phone = "Formato inválido (ex: 11 99999-9999)";
  return errors;
}

function serviceIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes("barba"))       return <User size={16} />;
  if (n.includes("sobrancelha")) return <Smile size={16} />;
  if (n.includes("assinatura"))  return <CreditCard size={16} />;
  if (n.includes("hidratação"))  return <Star size={16} />;
  return <Scissors size={16} />;
}

// ─── Sub-components ───────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-all duration-300 ${
              i + 1 < current
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : i + 1 === current
                ? "bg-zinc-900 text-white ring-4 ring-zinc-900/20 dark:bg-white dark:text-zinc-900 dark:ring-white/20"
                : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600"
            }`}
          >
            {i + 1 < current ? <Check size={12} /> : i + 1}
          </div>
          {i < total - 1 && (
            <div
              className={`h-px w-8 transition-all duration-500 ${
                i + 1 < current ? "bg-zinc-900 dark:bg-white" : "bg-zinc-200 dark:bg-zinc-700"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function ServiceCard({
  service,
  selected,
  onSelect,
}: {
  service: BarbershopService;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`group relative flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-200 ${
        selected
          ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
          : "border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-500"
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
          selected
            ? "bg-white/20 dark:bg-zinc-900/20"
            : "bg-zinc-100 dark:bg-zinc-800"
        }`}
      >
        {serviceIcon(service.name)}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{service.name}</p>
        {service.description && (
          <p
            className={`mt-0.5 truncate text-sm ${
              selected ? "text-white/70 dark:text-zinc-900/70" : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            {service.description}
          </p>
        )}
      </div>

      <div className="text-right">
        <p className={`font-semibold ${selected ? "" : "text-zinc-900 dark:text-white"}`}>
          {formatPrice(Number(service.price))}
        </p>
        {service.durationMinutes && (
          <p
            className={`mt-0.5 flex items-center justify-end gap-1 text-xs ${
              selected ? "text-white/70 dark:text-zinc-900/70" : "text-zinc-400"
            }`}
          >
            <Clock size={11} />
            {service.durationMinutes} min
          </p>
        )}
      </div>

      {selected && (
        <div className="absolute right-4 top-4">
          <Check size={14} />
        </div>
      )}
    </button>
  );
}

function DayPicker({
  days,
  selected,
  onSelect,
}: {
  days: DayOption[];
  selected: DayOption;
  onSelect: (d: DayOption) => void;
}) {
  const [offset, setOffset] = useState(0);
  const visible = days.slice(offset, offset + 7);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          <Calendar size={13} className="mr-1.5 inline" />
          {MONTHS[selected.month]} {selected.year}
        </p>
        <div className="flex gap-1">
          <button
            onClick={() => setOffset((o) => Math.max(0, o - 7))}
            disabled={offset === 0}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 text-zinc-400 transition hover:border-zinc-400 hover:text-zinc-600 disabled:opacity-30 dark:border-zinc-700 dark:hover:border-zinc-500"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => setOffset((o) => Math.min(days.length - 7, o + 7))}
            disabled={offset + 7 >= days.length}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 text-zinc-400 transition hover:border-zinc-400 hover:text-zinc-600 disabled:opacity-30 dark:border-zinc-700 dark:hover:border-zinc-500"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {visible.map((day) => {
          const isSelected = day.num === selected.num && day.month === selected.month;
          return (
            <button
              key={`${day.year}-${day.month}-${day.num}`}
              onClick={() => !day.disabled && onSelect(day)}
              disabled={day.disabled}
              className={`flex flex-col items-center rounded-xl py-2.5 text-center transition-all duration-200 ${
                isSelected
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : day.disabled
                  ? "cursor-not-allowed opacity-30"
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <span className="text-[10px] font-medium opacity-60">{day.weekday}</span>
              <span className="mt-0.5 text-sm font-semibold">{day.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TimePicker({
  slots,
  taken,
  selected,
  onSelect,
}: {
  slots: string[];
  taken: Set<string>;
  selected: string;
  onSelect: (t: string) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
      {slots.map((time) => {
        const isTaken = taken.has(time);
        const isSelected = time === selected;
        return (
          <button
            key={time}
            onClick={() => !isTaken && onSelect(time)}
            disabled={isTaken}
            className={`rounded-xl py-2.5 text-sm font-medium transition-all duration-200 ${
              isSelected
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : isTaken
                ? "cursor-not-allowed bg-zinc-50 text-zinc-300 line-through dark:bg-zinc-800/50 dark:text-zinc-600"
                : "border border-zinc-200 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500"
            }`}
          >
            {time}
          </button>
        );
      })}
    </div>
  );
}

function InputField({
  label,
  id,
  value,
  onChange,
  error,
  placeholder,
  type = "text",
  multiline = false,
}: {
  label: string;
  id: keyof FormData;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  type?: string;
  multiline?: boolean;
}) {
  const base =
    "w-full rounded-xl border bg-transparent px-4 py-3 text-sm outline-none transition-all duration-200 placeholder:text-zinc-400 focus:ring-2 dark:placeholder:text-zinc-600";
  const state = error
    ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
    : "border-zinc-200 focus:border-zinc-900 focus:ring-zinc-900/10 dark:border-zinc-700 dark:focus:border-zinc-400 dark:focus:ring-white/10";

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={`${base} ${state} resize-none`}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${base} ${state}`}
        />
      )}
      {error && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-500">
          <AlertCircle size={11} />
          {error}
        </p>
      )}
    </div>
  );
}

function BookingSummary({
  service,
  day,
  time,
}: {
  service: BarbershopService;
  day: DayOption;
  time: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
        Resumo do agendamento
      </p>
      <div className="space-y-2">
        {[
          { label: "Serviço", value: service.name },
          {
            label: "Data",
            value: `${day.weekday}, ${day.label} de ${MONTHS[day.month]}`,
          },
          { label: "Horário", value: time },
          { label: "Valor", value: formatPrice(Number(service.price)) },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
            <span className="font-medium">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────

export default function BookingPage({ barbershopId, services, takenByDate }: Props) {
  const WEEK = useMemo(() => buildWeek(), []);
  const firstAvailable = WEEK.find((d) => !d.disabled);

  const [step, setStep]               = useState(1);
  const [selectedServiceId, setServiceId] = useState<string>(services[0]?.id ?? "");
  const [selectedDay, setSelectedDay] = useState<DayOption>(firstAvailable ?? WEEK[0]);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [form, setForm]               = useState<FormData>({ name: "", phone: "", notes: "" });
  const [errors, setErrors]           = useState<FormErrors>({});
  const [loading, setLoading]         = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const activeService = services.find((s) => s.id === selectedServiceId);

  const takenTimesForDay = useMemo(() => {
    const key = formatDate(selectedDay);
    return new Set(takenByDate[key] ?? []);
  }, [takenByDate, selectedDay]);

  const updateForm = useCallback(
    (field: keyof FormData) => (value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    []
  );

  const canProceedStep1 = Boolean(selectedServiceId);
  const canProceedStep2 = Boolean(selectedTime);

  async function handleSubmit() {
    const errs = validateForm(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    if (!activeService) return;

    setLoading(true);
    setServerError(null);

    const result = await createBooking({
      ...form,
      serviceId:    activeService.id,
      barbershopId,
      date:         formatDate(selectedDay),
      time:         selectedTime,
    });

    setLoading(false);

    if (result.error) {
      setServerError(result.error);
      return;
    }

    setSubmitted(true);
  }

  // ── Success screen ─────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 dark:bg-white">
          <Check size={28} className="text-white dark:text-zinc-900" />
        </div>
        <h2 className="text-2xl font-semibold">Agendamento confirmado!</h2>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          Você receberá uma confirmação no número informado.
        </p>
        {activeService && (
          <div className="mt-8 w-full max-w-sm">
            <BookingSummary service={activeService} day={selectedDay} time={selectedTime} />
          </div>
        )}
      </div>
    );
  }

  const STEP_LABELS = ["Serviço", "Data & Hora", "Seus dados"];

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-zinc-900 dark:hover:text-white"
            >
              <ChevronLeft size={16} />
              Voltar
            </button>
          ) : (
            <div />
          )}
          <StepIndicator current={step} total={3} />
        </div>
        <h1 className="mt-6 text-2xl font-semibold">
          {STEP_LABELS[step - 1]}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {step === 1 && "Escolha o serviço que deseja agendar"}
          {step === 2 && "Selecione o melhor dia e horário para você"}
          {step === 3 && "Informe seus dados para confirmar o agendamento"}
        </p>
      </div>

      {/* Step 1 — Serviço */}
      {step === 1 && (
        <div className="space-y-3">
          {services.map((s) => (
            <ServiceCard
              key={s.id}
              service={s}
              selected={s.id === selectedServiceId}
              onSelect={() => setServiceId(s.id)}
            />
          ))}

          <button
            onClick={() => setStep(2)}
            disabled={!canProceedStep1}
            className="mt-2 w-full rounded-2xl bg-zinc-900 py-3.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-40 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Continuar
          </button>
        </div>
      )}

      {/* Step 2 — Data & Horário */}
      {step === 2 && (
        <div className="space-y-6">
          <DayPicker days={WEEK} selected={selectedDay} onSelect={setSelectedDay} />

          <div>
            <p className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Horários disponíveis
            </p>
            <TimePicker
              slots={TIME_SLOTS}
              taken={takenTimesForDay}
              selected={selectedTime}
              onSelect={setSelectedTime}
            />
          </div>

          <button
            onClick={() => setStep(3)}
            disabled={!canProceedStep2}
            className="w-full rounded-2xl bg-zinc-900 py-3.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-40 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Continuar
          </button>
        </div>
      )}

      {/* Step 3 — Dados pessoais */}
      {step === 3 && (
        <div className="space-y-5">
          {activeService && (
            <BookingSummary service={activeService} day={selectedDay} time={selectedTime} />
          )}

          <div className="space-y-4">
            <InputField
              label="Nome completo"
              id="name"
              value={form.name}
              onChange={updateForm("name")}
              error={errors.name}
              placeholder="Seu nome"
            />
            <InputField
              label="WhatsApp"
              id="phone"
              type="tel"
              value={form.phone}
              onChange={updateForm("phone")}
              error={errors.phone}
              placeholder="(11) 99999-9999"
            />
            <InputField
              label="Observações (opcional)"
              id="notes"
              value={form.notes}
              onChange={updateForm("notes")}
              placeholder="Alguma preferência ou informação adicional?"
              multiline
            />
          </div>

          {serverError && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              {serverError}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 py-3.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-40 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Confirmando...
              </>
            ) : (
              "Confirmar agendamento"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
