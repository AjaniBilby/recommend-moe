-- AlterTable
ALTER TABLE "UserAffinity" ADD COLUMN     "overlap" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "UserMediaScore" ADD COLUMN     "affinity" DOUBLE PRECISION,
ALTER COLUMN "score" DROP NOT NULL,
ALTER COLUMN "score" DROP DEFAULT;

-- CreateTable
CREATE TABLE "MediaAffinity" (
    "aID" INTEGER NOT NULL,
    "bID" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overlap" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stale" BOOLEAN NOT NULL DEFAULT true
);

-- CreateIndex
CREATE INDEX "MediaAffinity_aID_score_idx" ON "MediaAffinity"("aID", "score" DESC);

-- CreateIndex
CREATE INDEX "MediaAffinity_bID_score_idx" ON "MediaAffinity"("bID", "score" DESC);

-- CreateIndex
CREATE INDEX "MediaAffinity_stale_idx" ON "MediaAffinity"("stale");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAffinity_aID_bID_key" ON "MediaAffinity"("aID", "bID");

-- AddForeignKey
ALTER TABLE "MediaAffinity" ADD CONSTRAINT "MediaAffinity_aID_fkey" FOREIGN KEY ("aID") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAffinity" ADD CONSTRAINT "MediaAffinity_bID_fkey" FOREIGN KEY ("bID") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;
