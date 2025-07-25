-- @param $1:userID
-- @param $2:take
WITH "users" AS (
	SELECT DISTINCT "userID"
	FROM "UserMediaScore"
	WHERE "mediaID" IN (SELECT "mediaID" FROM "UserMediaScore" WHERE "userID" = $1::int) and "userID" != $1::int
)

INSERT INTO "UserAffinity" ("aID", "bID")
SELECT LEAST($1::int, "userID"), GREATEST($1::int, "userID")
FROM "users"
WHERE (LEAST($1::int, "userID"), GREATEST($1::int, "userID")) NOT IN (SELECT "aID", "bID" FROM "UserAffinity")
LIMIT $2::int
ON CONFLICT DO NOTHING;