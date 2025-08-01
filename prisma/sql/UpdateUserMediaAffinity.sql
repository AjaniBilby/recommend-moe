-- @param $1:userID
-- @param $2:mediaID
WITH "affinity" AS (
	SELECT "bID" as "userID", "score" FROM "UserAffinity" WHERE "aID" = $1 and "score" is not null
	UNION ALL
	SELECT "aID", "score" FROM "UserAffinity" WHERE "bID" = $1 and "score" is not null
), "update" AS (
	SELECT $2::int, $1::int, SUM(m."score" * a."score") / SUM(a."score")
	FROM "UserMediaScore" m
	INNER JOIN "affinity" a ON a."userID" = m."userID"
	WHERE "mediaID" = $2::int
)

INSERT INTO "UserMediaScore" ("mediaID", "userID", "affinity")
SELECT *
FROM "update"
ON CONFLICT ("mediaID", "userID") DO UPDATE
	SET "affinity" = EXCLUDED."affinity"
RETURNING "affinity";