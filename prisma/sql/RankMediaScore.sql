WITH "updates" AS (
	SELECT "id", ROW_NUMBER() OVER (ORDER BY "score" DESC NULLS LAST) as "rank"
	FROM "Media"
	WHERE "score" IS NOT NULL
)

UPDATE "Media" m
SET "scoreRank" = u."rank"
FROM "updates" u
WHERE m."id" = u."id";