/*
  Warnings:

  - A unique constraint covering the columns `[title]` on the table `Media` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Media_title_idx";

-- DropIndex
DROP INDEX "UserAffinity_bID_idx";

-- CreateIndex
CREATE UNIQUE INDEX "Media_title_key" ON "Media"("title");

-- CreateIndex
CREATE INDEX "UserAffinity_aID_score_idx" ON "UserAffinity"("aID", "score" DESC);

-- CreateIndex
CREATE INDEX "UserAffinity_bID_score_idx" ON "UserAffinity"("bID", "score" DESC);
