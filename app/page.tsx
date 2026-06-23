"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

// O type solicitado
type TabId = 'cortes' | 'coloracao' | 'tratamentos';

const RenanBlack: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('cortes');
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);

    scrollRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.fade-up').forEach((el) => scrollRef.current?.observe(el));

    return () => {
      window.removeEventListener('scroll', handleScroll);
      scrollRef.current?.disconnect();
    };
  }, []);

  return (
    <div className="app-container" style={{ backgroundColor: '#080808', color: '#f5f0e8', fontFamily: 'Barlow, sans-serif', overflowX: 'hidden' }}>
      <style>{`
        :root {
          --gold: #d4a017;
          --black: #080808;
          --dark2: #181818;
          --cream: #f5f0e8;
          --cream-dim: rgba(245,240,232,0.55);
        }

        .hero-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 40px;
          padding: 120px 5% 60px;
          max-width: 1200px;
          margin: 0 auto;
        }
        @media (min-width: 992px) {
          .hero-grid { grid-template-columns: 1.2fr 0.8fr; align-items: center; min-height: 100vh; }
        }

        .hero-title { 
            font-family: 'Bebas Neue', cursive; 
            font-size: clamp(50px, 15vw, 120px); 
            line-height: 0.85; 
            margin-bottom: 20px;
        }

        .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }

        .price-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 15px;
          animation: fadeIn 0.4s ease;
        }
        @media (min-width: 768px) { .price-grid { grid-template-columns: 1fr 1fr; gap: 40px; } }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .fade-up { opacity: 0; transform: translateY(30px); transition: all 0.8s cubic-bezier(0.2, 1, 0.3, 1); }
        .fade-up.visible { opacity: 1; transform: translateY(0); }

        .btn-primary { 
            background: var(--gold); 
            color: var(--black); 
            padding: 14px 28px; 
            border-radius: 4px; 
            text-decoration: none; 
            font-weight: 700; 
            text-transform: uppercase; 
            font-size: 13px; 
            display: inline-block; 
            transition: 0.3s;
            border: 1px solid var(--gold);
        }
        .btn-primary:hover { background: transparent; color: var(--gold); }
        
        .tab-button {
          background: none; border: none; padding: 12px 15px; cursor: pointer;
          color: var(--cream-dim); font-size: 12px; text-transform: uppercase; font-weight: 700;
          border-bottom: 2px solid transparent; transition: 0.3s;
        }
        .tab-button.active { color: var(--gold); border-bottom-color: var(--gold); }
      `}</style>

      {/* HERO SECTION */}
      <section id="home">
        <div className="hero-grid">
          <div className="fade-up visible">
            <p style={{ color: 'var(--gold)', letterSpacing: '.4em', textTransform: 'uppercase', fontSize: '11px', marginBottom: '15px', fontWeight: 700 }}>Premium Grooming</p>
           <h1 className="hero-title">
              <img 
                src="/logo.png" 
                alt="Logo" 
                style={{ 
                  width: '100%', 
                  maxWidth: '400px', 
                  display: 'block'
                }} 
              />
            </h1>
            <p style={{ maxWidth: '480px', color: 'var(--cream-dim)', lineHeight: 1.8, fontSize: '17px', fontWeight: 300 }}>
              Redefinindo o estilo clássico com técnicas modernas. Na <strong>RenanBlack</strong>, cada corte é uma assinatura de confiança e excelência.
            </p>
            <div style={{ marginTop: '35px' }}>
              <a href="#precos" className="btn-primary">Ver Serviços</a>
            </div>
          </div>

          <div className="stats-grid fade-up visible" style={{ alignSelf: 'center' }}>
            {[
              { n: '2020', l: 'Fundação' },
              { n: '15k+', l: 'Clientes' },
              { n: 'R$25', l: 'Preço Base' },
              { n: '4.9', l: 'Google Aval.' }
            ].map((stat, i) => (
              <div key={i} style={{ background: 'var(--dark2)', padding: '25px 15px', borderRadius: '10px', border: '1px solid rgba(212,160,23,.08)', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Bebas Neue', fontSize: '38px', color: 'var(--gold)', lineHeight: 1 }}>{stat.n}</div>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--cream-dim)', letterSpacing: '2px', marginTop: '5px' }}>{stat.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEÇÃO DE PREÇOS COM LÓGICA DE ABAS */}
      <section id="precos" style={{ padding: '100px 5%', background: '#0a0a0a' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="fade-up">
            <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                <h2 style={{ fontFamily: 'Bebas Neue', fontSize: 'clamp(45px, 8vw, 70px)', letterSpacing: '2px' }}>
                  Tabela de <span style={{ color: 'var(--gold)' }}>Serviços</span>
                </h2>
                <div style={{ width: '60px', height: '3px', background: 'var(--gold)', margin: '15px auto' }}></div>
            </div>
            
            <div style={{ display: 'flex', overflowX: 'auto', gap: '15px', marginBottom: '40px', borderBottom: '1px solid rgba(212,160,23,.1)', paddingBottom: '5px' }}>
              {(['cortes', 'coloracao', 'tratamentos'] as TabId[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`tab-button ${activeTab === tab ? 'active' : ''}`}
                >
                  {tab === 'coloracao' ? 'Química' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className="price-grid">
              {activeTab === 'cortes' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <PriceLine name="Corte Degradê (Fade)" price="R$ 40" />
                    <PriceLine name="Corte Tesoura" price="R$ 55" />
                    <PriceLine name="Barba Terapêutica" price="R$ 50" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <PriceLine name="Pezinho / Acabamento" price="R$ 25" />
                    <PriceLine name="Sobrancelha Navalha" price="R$ 15" />
                    <PriceLine name="Corte Kids" price="R$ 45" />
                  </div>
                </>
              )}

              {activeTab === 'coloracao' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <PriceLine name="Platinado / Nevou" price="R$ 120" />
                    <PriceLine name="Luzes / Reflexo" price="R$ 90" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <PriceLine name="Pigmentação de Barba" price="R$ 30" />
                    <PriceLine name="Coloração Simples" price="R$ 60" />
                  </div>
                </>
              )}

              {activeTab === 'tratamentos' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <PriceLine name="Hidratação Profunda" price="R$ 40" />
                    <PriceLine name="Limpeza de Pele" price="R$ 35" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <PriceLine name="Massagem Capilar" price="R$ 20" />
                    <PriceLine name="Selagem Térmica" price="R$ 80" />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '80px 5% 40px', background: 'var(--black)', textAlign: 'center', borderTop: '1px solid #1a1a1a' }}>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: '32px', marginBottom: '20px', letterSpacing: '3px' }}>
          Renan<span style={{ color: 'var(--gold)' }}>Black</span>
        </div>
        <p style={{ fontSize: '10px', color: 'rgba(245,240,232,.2)', textTransform: 'uppercase' }}>
          © 2026 RenanBlack Concept · Todos os direitos reservados
        </p>
      </footer>
    </div>
  );
};

const PriceLine: React.FC<{ name: string; price: string }> = ({ name, price }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0', borderBottom: '1px solid rgba(245,240,232,0.03)' }}>
    <span style={{ fontSize: '15px', fontWeight: 400 }}>{name}</span>
    <span style={{ color: 'var(--gold)', fontWeight: 700, fontFamily: 'monospace', fontSize: '16px' }}>{price}</span>
  </div>
);

export default RenanBlack;