WITH "updates" AS (
	SELECT "mediaID", AVG("score"), COUNT("score")
	FROM "UserMediaScore"
	WHERE "mediaID" IN (SELECT "id" FROM "Media" WHERE "staleStats")
	GROUP BY "mediaID"
)

UPDATE "Media" m
SET "score" = u."avg",
	"popularity" = u."count"
FROM "updates" u
WHERE m."id" = u."mediaID";