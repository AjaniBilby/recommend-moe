-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "popularRank" INTEGER,
ADD COLUMN     "popularity" INTEGER,
ADD COLUMN     "score" INTEGER,
ADD COLUMN     "scoreRank" INTEGER,
ADD COLUMN     "staleStats" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "Media_score_id_idx" ON "Media"("score" DESC, "id");

-- CreateIndex
CREATE INDEX "Media_popularity_id_idx" ON "Media"("popularity" DESC, "id");

-- CreateIndex
CREATE INDEX "Media_staleStats_id_idx" ON "Media"("staleStats", "id");
