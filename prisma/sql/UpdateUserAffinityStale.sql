-- @param $1:userID
-- @param $2:mediaID
WITH "neighbours" AS (
	SELECT "bID" as "userID" FROM "UserAffinity" WHERE "aID" = $1
	UNION ALL
	SELECT "aID" as "userID" FROM "UserAffinity" WHERE "bID" = $1
), "affected" AS (
	SELECT "userID"
	FROM "neighbours" u
	WHERE EXISTS (SELECT $1 FROM "UserMediaScore" WHERE "userID" = u."userID" and "mediaID" = ANY($2::int[]))
)

UPDATE "UserAffinity"
SET "stale" = true
WHERE ("aID" = $1 and "bID" IN (SELECT "userID" FROM "affected"))
	OR ("bID" = $1 and "aID" IN (SELECT "userID" FROM "affected"))