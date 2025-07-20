DROP INDEX "MediaAffinity_aID_score_overlap_idx";
DROP INDEX "MediaAffinity_bID_score_overlap_idx";
DROP INDEX "MediaRanking_id_weight_width_idx";

DROP INDEX "UserMediaScore_mediaID_userID_score_idx";
DROP INDEX "UserAffinity_aID_bID_score_idx";


CREATE INDEX "MediaAffinity_aID_score_overlap_idx" ON "MediaAffinity"("aID", "score" DESC) INCLUDE ("overlap");
CREATE INDEX "MediaAffinity_bID_score_overlap_idx" ON "MediaAffinity"("bID", "score" DESC) INCLUDE ("overlap");
CREATE INDEX "MediaRanking_id_weight_width_idx"    ON "MediaRanking"("id") INCLUDE ("weight", "width");

CREATE INDEX "UserMediaScore_mediaID_userID_score_idx" ON "UserMediaScore"("mediaID", "userID") INCLUDE ("score");
CREATE INDEX "UserAffinity_aID_bID_score_idx" ON "UserAffinity"("aID", "bID") INCLUDE ("score");