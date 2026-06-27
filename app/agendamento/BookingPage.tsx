"use client";

import { useState, useEffect } from "react";
import { createBooking } from "@/app/actions/booking";

type Service = { id: string; name: string; price: number; duration?: number };

type Props = {
  barbershopId: string;
  barbershopName?: string;
  barbershopAddress?: string;
  services: Service[];
};

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const WEEKDAYS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const WEEKDAYS_FULL = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];

function toKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function formatDateFull(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return `${WEEKDAYS_FULL[d.getDay()]}, ${day} de ${MONTHS[month - 1]} de ${year}`;
}

export default function BookingPage({ barbershopId, barbershopName = "Barbearia", barbershopAddress = "", services }: Props) {
  const today = new Date();
  today.setHours(0,0,0,0);

  const [tab, setTab] = useState<"servico"|"data"|"dados">("servico");
  const [serviceId, setServiceId] = useState("");
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ error?: string; success?: boolean } | null>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);

  const selectedService = services.find(s => s.id === serviceId);

  useEffect(() => {
    if (!date) return;
    setLoadingTimes(true);
    setTime("");
    fetch(`/api/bookings/available?date=${date}`)
      .then(res => res.json())
      .then(data => setAvailableTimes(data.available ?? []))
      .catch(() => setAvailableTimes([]))
      .finally(() => setLoadingTimes(false));
  }, [date]);

  function buildCalendar() {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const cells: (number | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }

  function prevMonth() {
    if (calMonth === 0) { setCalYear(y => y-1); setCalMonth(11); }
    else setCalMonth(m => m-1);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear(y => y+1); setCalMonth(0); }
    else setCalMonth(m => m+1);
  }

  function selectDay(day: number) {
    const d = new Date(calYear, calMonth, day);
    if (d < today) return;
    if (d.getDay() === 0) return;
    setDate(toKey(d));
  }

  async function handleSubmit() {
    setLoading(true);
    const [year, month, day] = date.split("-");
    const res = await createBooking({ barbershopId, serviceId, date: `${day}/${month}/${year}`, time, name, phone, notes });
    setResult(res);
    setLoading(false);
  }

  if (result?.success) {
    return (
      <div className="max-w-md mx-auto p-4">
        <div className="flex flex-col items-center pt-6 pb-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-3">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Agendamento confirmado!</h2>
          <p className="text-sm text-gray-500 mt-1">Até logo, <span className="font-medium text-gray-700">{name}</span>!</p>
        </div>
        <div className="mt-4 border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-black text-white px-5 py-4">
            <p className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-1">Resumo</p>
            <p className="text-lg font-semibold">{barbershopName}</p>
            {barbershopAddress && <p className="text-sm text-gray-400 mt-0.5">{barbershopAddress}</p>}
          </div>
          <div className="divide-y divide-gray-100 bg-zinc-900">
            <div className="flex justify-between px-5 py-4 text-white">
              <span className="text-gray-400 text-sm">Serviço</span>
              <span className="font-medium text-sm">{selectedService?.name}</span>
            </div>
            <div className="flex justify-between px-5 py-4 text-white">
              <span className="text-gray-400 text-sm">Data</span>
              <span className="font-medium text-sm">{formatDateFull(date)}</span>
            </div>
            <div className="flex justify-between px-5 py-4 text-white">
              <span className="text-gray-400 text-sm">Horário</span>
              <span className="font-medium text-sm">{time}</span>
            </div>
            <div className="flex justify-between px-5 py-4 text-white">
              <span className="text-gray-400 text-sm">Valor</span>
              <span className="font-bold">R$ {selectedService?.price.toFixed(2).replace(".", ",")}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            setResult(null); setTab("servico");
            setServiceId(""); setDate(""); setTime("");
            setName(""); setPhone(""); setNotes("");
          }}
          className="w-full mt-4 border border-gray-300 text-white py-3 rounded-xl text-sm font-medium hover:bg-gray-800 transition"
        >
          Fazer novo agendamento
        </button>
      </div>
    );
  }

  const cells = buildCalendar();

  return (
    <div className="max-w-md mx-auto p-4">
      {/* Abas */}
      <div className="flex border-b mb-4">
        {(["servico","data","dados"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium ${tab === t ? "border-b-2 border-black text-white" : "text-gray-400"}`}>
            {t === "servico" ? "Serviço" : t === "data" ? "Data" : "Seus dados"}
          </button>
        ))}
      </div>

      {/* Aba: Serviço */}
      {tab === "servico" && (
        <div className="space-y-2">
          {services.map((s) => (
            <button key={s.id}
              onClick={() => { setServiceId(s.id); setTab("data"); }}
              className={`w-full text-left p-4 rounded-lg border transition ${serviceId === s.id ? "border-yellow-500 bg-yellow-500/10" : "border-gray-700 hover:border-gray-400"}`}>
              <p className="font-medium text-white">{s.name}</p>
              <p className="text-sm text-gray-400">
                R$ {s.price}{s.duration ? ` · ${s.duration} min` : ""}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Aba: Data */}
      {tab === "data" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button onClick={prevMonth} className="px-2 py-1 rounded hover:bg-gray-800 text-lg text-white">‹</button>
            <span className="font-medium text-white">{MONTHS[calMonth]} {calYear}</span>
            <button onClick={nextMonth} className="px-2 py-1 rounded hover:bg-gray-800 text-lg text-white">›</button>
          </div>
          <div className="grid grid-cols-7 text-center text-xs text-gray-400 mb-1">
            {WEEKDAYS.map(w => <span key={w}>{w}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-sm">
            {cells.map((day, i) => {
              if (!day) return <span key={i} />;
              const d = new Date(calYear, calMonth, day);
              const isPast = d < today;
              const isSunday = d.getDay() === 0;
              const key = toKey(d);
              const isSelected = date === key;
              const disabled = isPast || isSunday;
              return (
                <button key={i} onClick={() => !disabled && selectDay(day)}
                  className={`rounded-full w-8 h-8 mx-auto flex items-center justify-center transition
                    ${disabled ? "text-gray-600 cursor-not-allowed" : "hover:bg-gray-700 text-white"}
                    ${isSelected ? "bg-yellow-500 text-black hover:bg-yellow-400 font-bold" : ""}
                    ${isSunday && !isPast ? "text-red-400" : ""}
                  `}>
                  {day}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 text-center">Seg–Sáb · Domingos fechado</p>

          {date && (
            <div>
              <p className="text-xs text-gray-400 mb-2">{formatDateFull(date)}</p>
              {loadingTimes ? (
                <p className="text-center text-gray-500 text-sm py-4">Carregando horários...</p>
              ) : availableTimes.length === 0 ? (
                <p className="text-center text-red-400 text-sm py-4">Nenhum horário disponível neste dia.</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {availableTimes.map((t) => (
                    <button key={t}
                      onClick={() => { setTime(t); setTab("dados"); }}
                      className={`py-2 rounded-lg text-sm border transition ${
                        time === t
                          ? "bg-yellow-500 text-black border-yellow-500 font-bold"
                          : "border-gray-600 text-white hover:border-yellow-500"
                      }`}>
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Aba: Dados */}
      {tab === "dados" && (
        <div className="space-y-3">
          <input placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-700 bg-transparent text-white rounded-lg p-2 placeholder-gray-500" />
          <input placeholder="Telefone (WhatsApp)" value={phone} onChange={(e) => setPhone(e.target.value)}
            className="w-full border border-gray-700 bg-transparent text-white rounded-lg p-2 placeholder-gray-500" />
          <textarea placeholder="Observações (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-gray-700 bg-transparent text-white rounded-lg p-2 h-20 placeholder-gray-500" />
          {result?.error && <p className="text-red-400 text-sm">{result.error}</p>}
          <button onClick={handleSubmit} disabled={loading || !name || !phone}
            className="w-full bg-yellow-500 text-black py-3 rounded-lg font-bold disabled:opacity-50 hover:bg-yellow-400 transition">
            {loading ? "Agendando..." : "Confirmar agendamento"}
          </button>
        </div>
      )}
    </div>
  );
}
