-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "novelty" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "Media_novelty_id_idx" ON "Media"("novelty" DESC, "id");
