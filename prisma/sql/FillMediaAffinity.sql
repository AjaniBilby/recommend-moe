-- @param {Int} $1:mediaID
INSERT INTO "MediaAffinity" ("aID", "bID")
SELECT LEAST($1, m."id"), GREATEST($1, m."id")
FROM "Media" m
WHERE m."id" != $1
ON CONFLICT DO NOTHING