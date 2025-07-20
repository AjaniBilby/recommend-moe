-- @param $1:userID
-- @param $2:overlap
-- @param $3:take
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
	GROUP BY b."userID"
	HAVING COUNT(*) > $3
	ORDER BY "score" desc
	LIMIT $2
)

INSERT INTO "UserAffinity" ("aID", "bID", "score", "overlap", "stale")
SELECT LEAST($1, "userID") as "aID", GREATEST($1, "userID") as "bID", "score", "overlap", false
FROM "scores"
ON CONFLICT ("aID", "bID")
DO UPDATE SET
	"score" = EXCLUDED."score",
	"overlap" = EXCLUDED."overlap",
	"stale" = false;