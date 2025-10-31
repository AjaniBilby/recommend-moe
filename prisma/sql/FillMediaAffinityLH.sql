-- @param {Int} $1:mediaID
INSERT INTO "MediaAffinity" ("aID", "bID")
SELECT m."id", $1::int
FROM "Media" m
WHERE m."id" < $1
ON CONFLICT DO NOTHING
