-- @param $1:userID
-- @param $2:rangeFrom
-- @param $3:rangeTill
-- @param $4:overlap
WITH "scores" AS (
	SELECT b."userID",
		AVG(ABS(a."score" - b."score")) as "score",
		COUNT(*) as "overlap"
	FROM "UserMediaScore" a
	INNER JOIN "UserMediaScore" b ON a."mediaID" = b."mediaID"
	WHERE a."userID" = $1 AND b."userID" != $1
		and NOT EXISTS (
			SELECT 1
			FROM "UserAffinity" s
			WHERE s."aID" = LEAST($1, b."userID") and s."bID" = GREATEST($1, b."userID") and s."stale"
		)
		and $2::int <= b."userID" and b."userID" <= $3::int
		and a."score" is not null
		and b."score" is not null
	GROUP BY b."userID"
	HAVING COUNT(*) > $4
	ORDER BY "score" desc
)

INSERT INTO "UserAffinity" ("aID", "bID", "score", "overlap", "stale")
SELECT LEAST($1, "userID") as "aID", GREATEST($1, "userID") as "bID", "score", "overlap", false
FROM "scores"
WHERE "score" is not null
ON CONFLICT ("aID", "bID")
DO UPDATE SET
	"score" = EXCLUDED."score",
	"overlap" = EXCLUDED."overlap",
	"stale" = false;