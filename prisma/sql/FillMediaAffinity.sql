-- @param {Int} $1:mediaID
INSERT INTO "MediaAffinity" ("aID", "bID")
SELECT LEAST($1, m."id"), GREATEST($1, m."id")
FROM "Media" m
LEFT JOIN "MediaAffinity" a ON (
	(m."id" < $1 AND a."aID" = m."id" AND a."bID" = $1) OR
	(m."id" > $1 AND a."aID" = $1 AND a."bID" = m."id")
)
WHERE m."id" != $1 AND a."aID" IS NULL
ON CONFLICT DO NOTHING