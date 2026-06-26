import Link from "next/link";

interface Plano {
  nome: string;
  preco: number;
  link: string;
}

const planos: Plano[] = [
  {
    nome: "Club Cabelo e Barba",
    preco: 72.5,
    link: "https://www.asaas.com/c/bdy0zudgudku0j3j",
  },
  {
    nome: "Club Cabelo",
    preco: 52.53,
    link: "https://www.asaas.com/c/6v4jrwp1q3x1qw7n",
  },

  {
    nome: "Club Barba",
    preco: 42.5,
    link: "https://www.asaas.com/c/py6kgjxnx6lz13nq",
  },
];

function formatarPreco(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ClubePage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-8 max-w-2xl mx-auto flex flex-col gap-6">

      {/* Header */}
      <div className="flex flex-col items-center text-center gap-2">
        <div className="w-12 h-12 rounded-full bg-[#1a1200] border border-[#C9A84C] flex items-center justify-center text-[#C9A84C] text-lg font-medium mb-1">
          R
        </div>
        <h1 className="text-[#e8e8e8] text-xl font-medium">Clube Renan Black Barber</h1>
        <p className="text-[#666] text-sm max-w-sm">
          Escolha seu plano e garanta seus cuidados todo mês com prioridade no agendamento.
        </p>
      </div>

      {/* Planos */}
      <div className="flex flex-col gap-4">
        {planos.map((plano) => (
          <div
            key={plano.nome}
            className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-5 flex flex-col gap-4 hover:border-[#3a3020] transition-colors"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-[#e0e0e0] text-base font-medium">{plano.nome}</p>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-medium text-[#C9A84C]">
                {formatarPreco(plano.preco)}
              </span>
              <span className="text-[#555] text-xs">/mês</span>
            </div>

            <Link
              href={plano.link}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center bg-[#C9A84C] text-[#0a0a0a] text-sm font-medium py-2.5 rounded-lg hover:bg-[#d9b85c] transition-colors"
            >
              Assinar agora
            </Link>
          </div>
        ))}
      </div>

      <p className="text-[#444] text-xs text-center">
        O pagamento é processado de forma segura pelo Asaas. Após assinar, você recebe a confirmação por e-mail.
      </p>

    </main>
  );
}
