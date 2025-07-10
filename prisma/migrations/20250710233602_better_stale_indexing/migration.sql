-- DropIndex
DROP INDEX "MediaAffinity_stale_idx";

-- DropIndex
DROP INDEX "UserAffinity_stale_idx";

-- CreateIndex
CREATE INDEX "MediaAffinity_stale_aID_bID_idx" ON "MediaAffinity"("stale", "aID", "bID");

-- CreateIndex
CREATE INDEX "UserAffinity_stale_aID_bID_idx" ON "UserAffinity"("stale", "aID", "bID");
