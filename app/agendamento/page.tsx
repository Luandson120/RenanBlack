"use client";

import React, { useState } from 'react';
import { Scissors, User, CreditCard, ChevronLeft } from 'lucide-react';

const BookingComponent = () => {
  const [selectedService, setSelectedService] = useState('Cabelo');
  const [selectedDay, setSelectedDay] = useState(30);
  const [selectedTime, setSelectedTime] = useState('10:00');

  const services = [
    { id: 'Cabelo', name: 'Cabelo', price: 'R$ 25', icon: <Scissors size={18} /> },
    { id: 'Barba', name: 'Barba', price: 'R$ 20', icon: <User size={18} /> },
    { 
        id: 'assinatura-cabelo-barba', 
        name: 'Assinatura Cabelo e Barba', 
        price: 'R$ 72,50',
        period: '/mês',
        Image: '/cabelo-e-barba.jpeg'
    },
    { id: 'Assinatura Cabelo', name: 'Assinatura', price: 'R$ 52,50 /mês', icon: <CreditCard size={18} /> },

  ];

  const days = [
    { name: 'Seg', num: 28, disabled: true },
    { name: 'Ter', num: 29, disabled: true },
    { name: 'Qua', num: 30, disabled: false },
    { name: 'Qui', num: 1, disabled: false },
    { name: 'Sex', num: 2, disabled: false },
    { name: 'Sáb', num: 3, disabled: true },
    { name: 'Dom', num: 4, disabled: true },
  ];

  const times = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];
  const takenTimes = ['08:00', '09:00', '13:00'];

  return (
    <div className="relative min-h-[700px] bg-[#0a0a0a] text-[#f5f0e8] font-sans p-9 pb-12 overflow-hidden">
      {/* Decorative Stripes */}
      <div className="absolute top-0 bottom-0 left-10 w-[3px] bg-gradient-to-b from-transparent via-[#d4a017] to-transparent opacity-50" />
      <div className="absolute top-0 bottom-0 right-10 w-[3px] bg-gradient-to-b from-transparent via-[#d4a017] to-transparent opacity-20" />

      <div className="relative z-10 max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-9">
          <div className="flex items-center justify-center text-[11px] tracking-[0.15em] uppercase text-[#d4a017] opacity-70 mb-4 cursor-pointer hover:opacity-100 transition-opacity">
            <ChevronLeft size={14} className="mr-1" /> Voltar para início
          </div>
          <h1 className="font-['Bebas_Neue'] text-5xl leading-[0.9] tracking-wider uppercase">
            Agende seu <span className="text-[#d4a017]">horário</span>
          </h1>
          <div className="w-10 h-[1px] bg-[#d4a017] mx-auto mt-3.5" />
        </div>

        {/* Steps Indicators */}
        <div className="flex justify-center items-center mb-8 gap-1">
          {[1, 2, 3, 4].map((step, idx) => (
            <React.Fragment key={step}>
              <div className={`flex items-center gap-2 text-[11px] tracking-widest uppercase font-semibold ${step === 1 ? 'text-[#d4a017]' : 'text-[#f5f0e8]/35'}`}>
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] ${step === 1 ? 'bg-[#d4a017] text-[#0a0a0a] border-[#d4a017]' : 'border-current'}`}>
                  {step}
                </div>
                <span className="hidden sm:inline">{['Serviço', 'Data', 'Horário', 'Dados'][idx]}</span>
              </div>
              {step < 4 && <div className="w-7 h-[1px] bg-[#f5f0e8]/15 mx-1" />}
            </React.Fragment>
          ))}
        </div>

        {/* Section: Service */}
        <div className="bg-white/5 border border-[#d4a017]/20 rounded p-5 mb-4">
          <h2 className="text-[10px] tracking-[0.18em] uppercase text-[#d4a017] font-bold mb-3.5">Escolha o serviço</h2>
          <div className="grid grid-cols-3 gap-2.5">
            {services.map((svc) => (
              <div
                key={svc.id}
                onClick={() => setSelectedService(svc.id)}
                className={`border rounded p-3.5 text-center cursor-pointer transition-all ${
                  selectedService === svc.id ? 'bg-[#d4a017]/10 border-[#d4a017]' : 'border-[#d4a017]/20 hover:bg-[#d4a017]/5'
                }`}
              >
                <div className="w-8 h-8 bg-[#d4a017]/10 rounded-full flex items-center justify-center mx-auto mb-2 text-[#d4a017]">
                  {svc.icon}
                </div>
                <div className="text-[11px] tracking-widest uppercase font-medium text-[#f5f0e8]/75">{svc.name}</div>
                <div className="text-sm text-[#d4a017] font-semibold mt-1">{svc.price}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Section: Date */}
        <div className="bg-white/5 border border-[#d4a017]/20 rounded p-5 mb-4">
          <h2 className="text-[10px] tracking-[0.18em] uppercase text-[#d4a017] font-bold mb-3.5">Escolha a data — Maio 2026</h2>
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((day, idx) => (
              <div
                key={idx}
                onClick={() => !day.disabled && setSelectedDay(day.num)}
                className={`border rounded py-2 px-1 text-center transition-all ${
                  day.disabled ? 'opacity-25 cursor-default' : 'cursor-pointer hover:bg-[#d4a017]/10'
                } ${selectedDay === day.num && !day.disabled ? 'bg-[#d4a017]/10 border-[#d4a017]' : 'border-[#d4a017]/15'}`}
              >
                <div className="text-[9px] tracking-widest uppercase text-[#f5f0e8]/40 font-bold">{day.name}</div>
                <div className="text-base font-semibold text-[#f5f0e8] mt-0.5">{day.num}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Section: Time */}
        <div className="bg-white/5 border border-[#d4a017]/20 rounded p-5 mb-4">
          <h2 className="text-[10px] tracking-[0.18em] uppercase text-[#d4a017] font-bold mb-3.5">Escolha o horário</h2>
          <div className="grid grid-cols-4 gap-2">
            {times.map((time) => {
              const isTaken = takenTimes.includes(time);
              return (
                <div
                  key={time}
                  onClick={() => !isTaken && setSelectedTime(time)}
                  className={`border rounded py-2.5 px-1.5 text-center text-xs font-medium tracking-wider transition-all ${
                    isTaken ? 'opacity-20 cursor-default line-through' : 'cursor-pointer'
                  } ${selectedTime === time && !isTaken ? 'bg-[#d4a017]/10 border-[#d4a017] text-[#f5f0e8]' : 'border-[#d4a017]/15 text-[#f5f0e8]/70 hover:text-[#f5f0e8] hover:border-[#d4a017]'}`}
                >
                  {time}
                </div>
              );
            })}
          </div>
        </div>

        {/* Section: Form */}
        <div className="bg-white/5 border border-[#d4a017]/20 rounded p-5">
          <h2 className="text-[10px] tracking-[0.18em] uppercase text-[#d4a017] font-bold mb-3.5">Seus dados</h2>
          <div className="flex flex-col gap-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                className="bg-white/5 border border-[#f5f0e8]/20 text-[#f5f0e8] p-2.5 px-3.5 text-sm rounded outline-none focus:border-[#d4a017]/50 placeholder:text-[#f5f0e8]/30"
                type="text"
                placeholder="Nome completo"
              />
              <input
                className="bg-white/5 border border-[#f5f0e8]/20 text-[#f5f0e8] p-2.5 px-3.5 text-sm rounded outline-none focus:border-[#d4a017]/50 placeholder:text-[#f5f0e8]/30"
                type="tel"
                placeholder="WhatsApp"
              />
            </div>
            <input
              className="bg-white/5 border border-[#f5f0e8]/20 text-[#f5f0e8] p-2.5 px-3.5 text-sm rounded outline-none focus:border-[#d4a017]/50 placeholder:text-[#f5f0e8]/30 w-full"
              type="text"
              placeholder="Observações (opcional)"
            />
            <button className="w-full bg-[#d4a017] hover:bg-[#e6b420] text-[#0a0a0a] py-3.5 px-4 text-xs font-bold tracking-[0.18em] uppercase rounded transition-colors mt-1.5">
              Confirmar agendamento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingComponent;