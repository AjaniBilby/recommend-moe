-- @param $1:userID
-- @param $2:offset
-- @param $3:take
SELECT m."id", m."title", m."icon", s."score" as "score"
FROM "UserMediaScore" s
INNER JOIN "Media" m ON m."id" = s."mediaID"
WHERE "userID" = $1::int and s."score" is not null
ORDER BY s."score" desc
LIMIT $3
OFFSET $2::int