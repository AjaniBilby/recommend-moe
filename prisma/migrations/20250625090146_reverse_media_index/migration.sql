-- DropIndex
DROP INDEX "UserMediaScore_mediaID_idx";

-- CreateIndex
CREATE INDEX "UserMediaScore_mediaID_userID_idx" ON "UserMediaScore"("mediaID", "userID");
