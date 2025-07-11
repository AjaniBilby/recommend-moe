-- @param {Int} $1:mediaID
INSERT INTO "MediaAffinity" ("aID", "bID")
SELECT LEAST($1, m."id"), GREATEST(12271, m."id")
FROM "Media" m
WHERE m."id" != $1 and NOT EXISTS(
	SELECT 1
	FROM "MediaAffinity" a
	WHERE a."aID" = LEAST($1, m."id") and a."bID" = GREATEST($1, m."id")
)
ON CONFLICT DO NOTHING