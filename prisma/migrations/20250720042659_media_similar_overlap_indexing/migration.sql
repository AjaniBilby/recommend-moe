-- DropIndex
DROP INDEX "MediaAffinity_aID_score_idx";

-- DropIndex
DROP INDEX "MediaAffinity_bID_score_idx";

-- CreateIndex
CREATE INDEX "MediaAffinity_aID_score_overlap_idx" ON "MediaAffinity"("aID", "score" DESC, "overlap");

-- CreateIndex
CREATE INDEX "MediaAffinity_bID_score_overlap_idx" ON "MediaAffinity"("bID", "score" DESC, "overlap");
