-- @param $1:userID
INSERT INTO "UserMediaScore" ("userID", "mediaID")
SELECT $1::int, m."id"
FROM "Media" m
ON CONFLICT DO NOTHING;