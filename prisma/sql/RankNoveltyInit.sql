INSERT INTO "MediaRanking" ("id", "width")
SELECT m."id", (
	SELECT SUM("score")
	FROM "MediaAffinity" a
	WHERE a."aID" = m."id" OR a."bID" = m."id"
)
FROM "Media" m
WHERE m."id" NOT IN (SELECT "id" FROM "MediaRanking")
LIMIT 100
ON CONFLICT DO NOTHING;