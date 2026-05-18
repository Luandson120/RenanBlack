# Renan Barber 💈

Sistema de agendamento online para barbearia, desenvolvido com Next.js 16, Prisma ORM e PostgreSQL (Neon).

---

## 📋 Visão Geral

O **Renan Barber** é uma aplicação web que permite aos clientes visualizar os serviços disponíveis de uma barbearia e realizar agendamentos online. O sistema conta com autenticação de usuários, listagem de serviços e gerenciamento de agendamentos.

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Versão | Uso |
|---|---|---|
| Next.js | 16.2.4 | Framework principal (App Router) |
| React | 19 | Interface do usuário |
| TypeScript | 6 | Tipagem estática |
| Prisma | 5.22 | ORM para banco de dados |
| PostgreSQL (Neon) | — | Banco de dados em nuvem |
| Tailwind CSS | 4 | Estilização |
| Radix UI | 1.4 | Componentes acessíveis |
| shadcn/ui | 4.6 | Biblioteca de componentes |
| Lucide React | 1.14 | Ícones |
| JSON Web Token | 9 | Autenticação |

---

## 📁 Estrutura de Pastas

```
renan-barber/
├── app/                          # App Router do Next.js
│   ├── layout.tsx                # Layout raiz da aplicação
│   ├── page.tsx                  # Página inicial (Home)
│   ├── Footer.tsx                # Componente de rodapé
│   ├── Sidebar.tsx               # Componente de menu lateral
│   ├── agendamento/
│   │   ├── page.tsx              # Página de agendamento (Server Component)
│   │   └── BookingPage.tsx       # Interface de agendamento (Client Component)
│   ├── booking/
│   │   ├── page.tsx              # Página de listagem de bookings
│   │   └── BookingClient.tsx     # Interface de bookings (Client Component)
│   └── sobre/
│       └── page.tsx              # Página "Sobre"
├── components/
│   └── ui/
│       ├── BarberShopItem.tsx    # Card de barbearia
│       └── card.tsx              # Componente de card genérico
├── lib/
│   └── prisma.ts                 # Instância global do Prisma Client
├── prisma/
│   ├── schema.prisma             # Schema do banco de dados
│   └── seed.ts                   # Script de seed do banco
├── generated/
│   └── prisma/                   # Prisma Client gerado
├── .env                          # Variáveis de ambiente
└── package.json
```

---

## 🗄️ Banco de Dados

### Diagrama de Entidades

```
User ──────────── Booking ──────────── BarbershopService
 │                                            │
 │                                       Barbershop
Account
Session
VerificationToken
```

### Modelos

#### `User`
Usuário autenticado na plataforma.

| Campo | Tipo | Descrição |
|---|---|---|
| id | String (cuid) | Identificador único |
| name | String? | Nome do usuário |
| email | String (unique) | E-mail do usuário |
| emailVerified | DateTime? | Data de verificação do e-mail |
| image | String? | URL da foto de perfil |
| bookings | Booking[] | Agendamentos do usuário |
| createdAt | DateTime | Data de criação |
| updatedAt | DateTime | Data de atualização |

#### `Barbershop`
Dados da barbearia.

| Campo | Tipo | Descrição |
|---|---|---|
| id | String (uuid) | Identificador único |
| name | String | Nome da barbearia |
| address | String | Endereço |
| phones | String[] | Lista de telefones |
| description | String | Descrição |
| imageUrl | String | URL da imagem |
| services | BarbershopService[] | Serviços oferecidos |

#### `BarbershopService`
Serviços oferecidos pela barbearia.

| Campo | Tipo | Descrição |
|---|---|---|
| id | String (uuid) | Identificador único |
| name | String | Nome do serviço |
| description | String | Descrição do serviço |
| imageUrl | String | URL da imagem |
| price | Decimal (10,2) | Preço do serviço |
| barbershopId | String | FK para Barbershop |
| bookings | Booking[] | Agendamentos desse serviço |

#### `Booking`
Agendamento realizado por um usuário.

| Campo | Tipo | Descrição |
|---|---|---|
| id | String (uuid) | Identificador único |
| userId | String | FK para User |
| serviceId | String | FK para BarbershopService |
| date | DateTime | Data e hora do agendamento |
| createdAt | DateTime | Data de criação |
| updatedAt | DateTime | Data de atualização |

#### `Account` / `Session` / `VerificationToken`
Modelos de autenticação compatíveis com **NextAuth.js**.

---

## 🛣️ Rotas

| Rota | Tipo | Descrição |
|---|---|---|
| `/` | Server Component | Página inicial |
| `/agendamento` | Server Component | Página de agendamento de serviços |
| `/booking` | Server Component | Listagem de agendamentos do usuário |
| `/sobre` | Server Component | Página institucional sobre a barbearia |

---

## ⚙️ Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL="postgresql://usuario:senha@host:5432/nome_do_banco?sslmode=require"
```

> ⚠️ Use o arquivo `.env` (não `.env.local`) pois o Prisma não lê `.env.local`.

---

## 🚀 Como Instalar e Rodar

### Pré-requisitos

- Node.js 18+
- Conta no [Neon](https://neon.tech) (banco de dados PostgreSQL)

### Passo a passo

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/renan-barber.git
cd renan-barber

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
# Crie o arquivo .env com sua DATABASE_URL

# 4. Gere o Prisma Client
npx prisma generate

# 5. Execute as migrations
npx prisma migrate deploy

# 6. (Opcional) Popule o banco com dados iniciais
npx prisma db seed

# 7. Rode o servidor de desenvolvimento
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`.

---

## 📦 Scripts Disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera o build de produção |
| `npm start` | Inicia o servidor em produção |
| `npx prisma generate` | Gera o Prisma Client |
| `npx prisma migrate dev` | Cria e aplica migrations em desenvolvimento |
| `npx prisma db seed` | Popula o banco com dados iniciais |
| `npx prisma studio` | Abre o painel visual do banco de dados |

---

## 🔑 Autenticação

O projeto utiliza os modelos padrão do **NextAuth.js** (`Account`, `Session`, `VerificationToken`), com suporte a provedores OAuth e autenticação via JWT.

---

## 📝 Observações

- O campo `price` nos serviços é do tipo `Decimal` no Prisma. Ao passar dados de Server Components para Client Components, converta com `.toNumber()`.
- O Prisma Client é gerado na pasta `generated/prisma` (configuração customizada no `schema.prisma`).
- O projeto usa **Turbopack** como bundler no modo de desenvolvimento.
