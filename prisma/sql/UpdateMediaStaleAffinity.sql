WITH "stale" AS (
	SELECT "aID", "bID"
	FROM "MediaAffinity"
	WHERE "stale" = true
	LIMIT 100
), "updates" AS (
	SELECT s."aID", s."bID", c.score, c.overlap
	FROM "stale" s
	CROSS JOIN LATERAL (
		SELECT COALESCE(1.0 - AVG(ABS(a."score" - b."score")), 0.0) as score, COUNT(*) as overlap
		FROM "UserMediaScore" a
		INNER JOIN "UserMediaScore" b ON b."userID" = a."userID" AND b."mediaID" = s."bID" AND b."score" IS NOT NULL
		WHERE a."mediaID" = s."aID" AND a."score" IS NOT NULL
	) c
)

UPDATE "MediaAffinity" a
SET "score" = u."score",
	"overlap" = u."overlap",
	"stale" = FALSE,
	"updatedAt" = now()
FROM "updates" u
WHERE a."aID" = u."aID" and a."bID" = u."bID";