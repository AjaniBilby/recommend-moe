WITH "updates" AS (
	SELECT
		"id" AS "mediaID",
		PERCENT_RANK() OVER (ORDER BY r."weight" ASC) AS "novelty"
	FROM "MediaRanking" r
	WHERE "width" > 0
	ORDER BY "novelty" DESC
)

UPDATE "Media" m
SET "novelty" = t."novelty"
FROM "updates" t
WHERE "id" = t."mediaID";