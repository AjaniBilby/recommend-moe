WITH "scale" AS (
	SELECT MIN("weight"), MAX("weight") - MIN("weight") as "range"
	FROM "MediaRanking"
), "updates" AS (
	SELECT r."id", ("weight" - s."min") / s."range" AS "novelty"
	FROM "MediaRanking" AS r, "scale" AS s
)
UPDATE "Media" m
SET "novelty" = (
	SELECT u."novelty"
	FROM "updates" AS u
	WHERE u."id" = m."id"
)
WHERE "id" IN (SELECT "id" FROM "updates");