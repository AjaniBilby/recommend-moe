-- Create Factoring Table
CREATE TYPE "MfFactorType" AS ENUM ('MEDIA', 'USER');
CREATE TABLE "MfFactor" (
	"type"     "MfFactorType" NOT NULL,
	"id"       INTEGER        NOT NULL,

	"embedding" halfvec(96)   NOT NULL,
	"error"  DOUBLE PRECISION NOT NULL,

	"nextEmbedding" halfvec(96),
	"nextError" DOUBLE PRECISION
);
CREATE UNIQUE INDEX "MfFactor_type_id_key" ON "MfFactor"("type", "id");

-- Add columns to store computed MF Factors
ALTER TABLE "Media" ADD COLUMN "embedding" halfvec(96);
ALTER TABLE "User" ADD COLUMN  "embedding" halfvec(96);
