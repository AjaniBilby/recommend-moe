-- @param $1:offset
-- @param $2:take
SELECT "id", "title", "icon", "novelty" * "score" as "score"
FROM "Media"
WHERE "novelty" is not null
ORDER BY "score" desc
LIMIT $2::int
OFFSET $1::int;