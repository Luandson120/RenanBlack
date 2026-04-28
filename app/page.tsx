import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-zinc-50 dark:bg-black">
      <main className="flex flex-col items-center justify-center text-center gap-8 px-6 py-20">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Bem-vindo à Renan Black Barber
        </h1>
        <div className="flex gap-2">
          <input
            className="border border-black px-3 py-2 rounded"
            placeholder="Busca aqui"
          />
          <button className="bg-black text-white px-4 hover:bg-yellow-400 py-2 rounded">
            Buscar
          </button>
        </div>
        <div className="flex gap-10 ">
          <a href="/agendamento" className="hover:bg-yellow-400 rounded p-2 transition">   
            <Image
                  src="/cabelo-masculino-curto.png"
                  alt="Cabelo"
                  width={60}
                  height={20}
                  priority
                  /> </a>
         <a href="/agendamento" className="hover:bg-yellow-400 rounded p-2 transition">
            <Image
              src="/corte-de-barba.png"
              alt="Renan Barber"
              width={60}
              height={20}
            />
         </a>   
         <a href="/agendamento" className="hover:bg-yellow-400 rounded p-2 transition">
          <Image
            src="/assinatura.png"
            alt="Renan Barber"
            width={60}
            height={20}
          />
          </a>      
        </div>
        <p className="max-w-md text-lg text-zinc-500 dark:text-zinc-400">
          Cortes modernos, atendimento de qualidade e estilo pra você. Agende seu horário agora!
        </p>
        <a href="/agendamento" className="mt-4 px-8 py-3 rounded-full bg-zinc-900 text-white text-sm font-medium hover:bg-yellow-400 hover:text-zinc-900 transition-colors dark:bg-white dark:text-zinc-900">
          Agendar agora
        </a>
      </main>
    </div>
  );
}