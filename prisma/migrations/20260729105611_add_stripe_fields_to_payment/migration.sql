/*
  Warnings:

  - You are about to drop the column `transectionId` on the `payments` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[stripeSessionId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripePaymentIntentId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "payments_transectionId_idx";

-- DropIndex
DROP INDEX "payments_transectionId_key";

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "transectionId",
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'usd',
ADD COLUMN     "paymentMethod" VARCHAR(50),
ADD COLUMN     "stripePaymentIntentId" VARCHAR(255),
ADD COLUMN     "stripeReceiptUrl" TEXT,
ADD COLUMN     "stripeSessionId" VARCHAR(255);

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripeSessionId_key" ON "payments"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripePaymentIntentId_key" ON "payments"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "payments_stripeSessionId_idx" ON "payments"("stripeSessionId");

-- CreateIndex
CREATE INDEX "payments_stripePaymentIntentId_idx" ON "payments"("stripePaymentIntentId");
