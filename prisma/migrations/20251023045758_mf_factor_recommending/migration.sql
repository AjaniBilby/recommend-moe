-- CreateEnum
CREATE TYPE "MfFactorType" AS ENUM ('MEDIA', 'USER');

-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "embedding" vector(50);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "embedding" vector(50);

-- CreateTable
CREATE TABLE "MfFactor" (
    "id" INTEGER NOT NULL,
    "type" "MfFactorType" NOT NULL,
    "embedding" vector(50) NOT NULL,
    "error" DOUBLE PRECISION NOT NULL,
    "nextEmbedding" vector(50),
    "nextError" DOUBLE PRECISION
);

-- CreateIndex
CREATE UNIQUE INDEX "MfFactor_id_type_key" ON "MfFactor"("type", "id");
