-- @param $1:userID
-- @param $2:mediaID
WITH "update" AS (
	SELECT SUM(s."score"*a."score") / SUM(a."score") as "score"
	FROM "UserMediaScore" s
	INNER JOIN "MediaAffinity" a ON a."aID" = LEAST($2::int, s."mediaID") AND a."bID" = GREATEST($2::int, s."mediaID")
	WHERE s."userID" = $1::int and s."score" is not null
	HAVING SUM(a."score") > 10 -- exclude low overlap results
)

INSERT INTO "UserMediaScore" ("mediaID", "userID", "affinity")
SELECT $2::int, $1::int, "score"
FROM "update"
ON CONFLICT ("mediaID", "userID") DO UPDATE
	SET "affinity" = EXCLUDED."affinity"
RETURNING "affinity";