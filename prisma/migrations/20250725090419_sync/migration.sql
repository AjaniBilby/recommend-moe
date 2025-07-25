-- CreateIndex
CREATE INDEX "MediaAffinity_aID_bID_overlap_idx" ON "MediaAffinity"("aID", "bID", "overlap" DESC);
