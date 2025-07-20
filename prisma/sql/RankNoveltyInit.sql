WITH "media" AS (
	SELECT m."id"
	FROM "Media" m
	WHERE NOT EXISTS (SELECT 1 FROM "MediaRanking" r WHERE r."id" = m."id")
	LIMIT 100
), "affinity" AS (
	SELECT "aID" AS "id", "score"
	FROM "MediaAffinity"
	WHERE "aID" IN (SELECT "id" FROM "media") and "overlap" > 100
	UNION ALL
	SELECT "bID" AS "id", "score"
	FROM "MediaAffinity"
	WHERE "bID" IN (SELECT "id" FROM "media") and "overlap" > 100
), "widths" AS (
	SELECT "id", SUM("score") AS "width"
	FROM "affinity"
	GROUP BY "id"
)

INSERT INTO "MediaRanking" ("id", "width")
SELECT m."id", COALESCE(a."width", 0)
FROM "media" m
LEFT JOIN "widths" a ON m."id" = a."id"
ON CONFLICT DO NOTHING