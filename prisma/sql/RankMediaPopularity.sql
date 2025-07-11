WITH "updates" AS (
	SELECT "id", ROW_NUMBER() OVER (ORDER BY "popularity" DESC NULLS LAST) as "rank"
	FROM "Media"
	WHERE "popularity" IS NOT NULL
)

UPDATE "Media" m
SET "popularRank" = u."rank"
FROM "updates" u
WHERE m."id" = u."id";