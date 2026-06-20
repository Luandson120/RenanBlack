-- AlterTable
ALTER TABLE "Barbershop" ADD COLUMN     "aberta" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'aguardando';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "assinante" BOOLEAN NOT NULL DEFAULT false;
