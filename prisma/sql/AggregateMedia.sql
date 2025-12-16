-- @param $1:take
WITH "updates" AS (
	SELECT m."id" as "mediaID", c."count", c."avg"
	FROM "Media" m
	CROSS JOIN LATERAL (
		SELECT AVG(s."score") as "avg", COUNT(s."score") as "count"
		FROM "UserMediaScore" s
		WHERE s."score" > 0
		AND s."mediaID" = m."id"
	) c
	WHERE m."staleStats" = true
	ORDER BY m."updatedAt" DESC
	LIMIT $1
)
UPDATE "Media" m
SET
	"score" = CASE
		WHEN u."count" < 100 THEN NULL
		ELSE u."avg"
	END,
	"popularity" = u."count",
	"staleStats" = false
FROM "updates" u
WHERE m."id" = u."mediaID";
