-- @param $1:userID
-- @param $2:offset
-- @param $3:take
SELECT m."id", m."title", m."icon", s."affinity" as "score"
FROM "UserMediaScore" s
INNER JOIN "Media" m ON m."id" = s."mediaID"
WHERE "userID" = $1::int and s."score" is null
ORDER BY s."affinity" desc
LIMIT $3
OFFSET $2::int