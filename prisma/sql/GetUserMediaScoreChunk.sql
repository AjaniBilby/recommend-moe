-- @param $1:mediaID
-- @param $2:userID
-- @param $3:take
SELECT "mediaID", "userID", "score"
FROM "UserMediaScore"
WHERE ("mediaID", "userID") > ($1::int, $2::int)
	and 0 < "score" and "score" <= 1
ORDER BY "mediaID" asc, "userID" asc
LIMIT $3;