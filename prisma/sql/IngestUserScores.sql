-- @param {ExternalKind} $1:type
-- @param {Json}         $2:data format { user_id: string, media_id, score: number }
INSERT INTO "UserMediaScore" ("userID", "mediaID", "score")
SELECT u."userID", m."mediaID", (d->>'score')::float as "score"
FROM jsonb_array_elements($2::jsonb) d
INNER JOIN "ExternalUser"  u ON u."type" = $1::"ExternalKind" and u."id" = d->>'user_id'
INNER JOIN "ExternalMedia" m ON m."type" = $1::"ExternalKind" and m."id" = d->>'media_id'
ON CONFLICT DO NOTHING;