-- DropIndex
DROP INDEX "UserMediaScore_mediaID_userID_idx";

-- CreateIndex
CREATE INDEX "UserMediaScore_mediaID_userID_score_idx" ON "UserMediaScore"("mediaID", "userID", "score");
