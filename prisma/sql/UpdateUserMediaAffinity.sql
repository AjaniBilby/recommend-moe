-- @param $1:userID
-- @param $2:mediaID
WITH "update" AS (
	SELECT SUM(s."score"*a."score") / SUM(a."score") as "score"
	FROM "UserMediaScore" s
	INNER JOIN "MediaAffinity" a ON a."aID" = LEAST($2::int, s."mediaID") AND a."bID" = GREATEST($2::int, s."mediaID")
		and a."overlap" > 100 -- exclude low overlap results
	WHERE s."userID" = $1::int and s."score" is not null
	HAVING COUNT(*) > 10 -- exclude media with not enough similarities
)

INSERT INTO "UserMediaScore" ("mediaID", "userID", "affinity")
SELECT $2::int, $1::int, "score"
FROM "update"
ON CONFLICT ("mediaID", "userID") DO UPDATE
	SET "affinity" = EXCLUDED."affinity"
RETURNING "affinity";