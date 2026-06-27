"use client";

import React, { useState, useEffect, useRef } from 'react';

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
          if (entry.isIntersecting) entry.target.classList.add('visible');
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

  // Suprime warning de unused var
  void isScrolled;

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

        /* Coluna que agrupa os cards de serviço */
        .price-col {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* Card de serviço (substitui a antiga .price-line) */
        .price-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px;
          border: 1px solid rgba(245, 240, 232, 0.12);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.02);
          text-decoration: none;
          color: inherit;
          cursor: pointer;
          transition: border-color 0.2s ease, transform 0.15s ease, background 0.2s ease;
        }
        .price-card:hover {
          border-color: var(--gold);
          background: rgba(212, 160, 23, 0.06);
          transform: translateY(-2px);
        }
        .price-card-name {
          font-size: 15px;
          font-weight: 500;
          color: var(--cream);
        }
        .price-card-price {
          font-family: monospace;
          font-weight: 700;
          font-size: 16px;
          color: var(--gold);
        }
      `}</style>

      {/* HERO */}
      <section id="home">
        <div className="hero-grid">
          <div className="fade-up visible">
            <p style={{ color: 'var(--gold)', letterSpacing: '.4em', textTransform: 'uppercase', fontSize: '11px', marginBottom: '15px', fontWeight: 700 }}>Premium Grooming</p>
            <h1 className="hero-title">
              <img
                src="/logo.png"
                alt="Logo"
                style={{ width: '100%', maxWidth: '400px', display: 'block' }}
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

      {/* PREÇOS */}
      <section id="precos" style={{ padding: '100px 5%', background: '#0a0a0a' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="fade-up">
            <div style={{ textAlign: 'center', marginBottom: '50px' }}>
              <h2 style={{ fontFamily: 'Bebas Neue', fontSize: 'clamp(45px, 8vw, 70px)', letterSpacing: '2px' }}>
                Tabela de <span style={{ color: 'var(--gold)' }}>Agendar Agora</span>
              </h2>
              <div style={{ width: '60px', height: '3px', background: 'var(--gold)', margin: '15px auto' }}></div>
              <p style={{ color: 'var(--cream-dim)', fontSize: '13px', marginTop: '10px' }}>
                Clique em qualquer serviço para agendar
              </p>
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
                  <div className="price-col">
                    <PriceLine name="Corte Degradê (Fade)" price="R$ 25" />
                    <PriceLine name="Corte Tesoura" price="R$ 20" />
                    <PriceLine name="Barba Terapêutica" price="R$ 20" />
                  </div>
                  <div className="price-col">
                    <PriceLine name="Pezinho / Acabamento" price="R$ 25" />
                    <PriceLine name="Sobrancelha Navalha" price="R$ 05" />
                    <PriceLine name="Corte Kids" price="R$ 45" />
                  </div>
                </>
              )}

              {activeTab === 'coloracao' && (
                <>
                  <div className="price-col">
                    <PriceLine name="Platinado / Nevou" price="R$ 80" />
                    <PriceLine name="Luzes / Reflexo" price="R$ 60" />
                  </div>
                  <div className="price-col">
                    <PriceLine name="Pigmentação de Barba" price="R$ 15" />
                    <PriceLine name="Coloração Simples" price="R$ 60" />
                  </div>
                </>
              )}

              {activeTab === 'tratamentos' && (
                <>
                  <div className="price-col">
                    <PriceLine name="Limpeza de Pele" price="R$ 25" />
                  </div>
                  <div className="price-col">
                    <PriceLine name="Massagem Capilar" price="R$ 20" />
                    <PriceLine name="Selagem Térmica" price="R$ 60" />
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

// Cada serviço é um card que leva pra /agendamento já com o serviço pré-selecionado
const PriceLine: React.FC<{ name: string; price: string }> = ({ name, price }) => (
  <a href={`/agendamento?servico=${encodeURIComponent(name)}`} className="price-card">
    <span className="price-card-name">{name}</span>
    <span className="price-card-price">{price}</span>
  </a>
);

export default RenanBlack;