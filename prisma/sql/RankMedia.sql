WITH "updates" AS (
	SELECT "id",
		ROW_NUMBER() OVER (ORDER BY "popularity" DESC NULLS LAST) as "popularRank",
		ROW_NUMBER() OVER (ORDER BY "score" DESC NULLS LAST) as "scoreRank"
	FROM "Media"
	WHERE "popularity" IS NOT NULL
)

UPDATE "Media" m
SET "popularRank" = u."popularRank",
	"scoreRank"     = u."scoreRank"
FROM "updates" u
WHERE m."id" = u."id";