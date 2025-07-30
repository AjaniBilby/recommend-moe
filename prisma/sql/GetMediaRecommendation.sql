-- @param $1:userID
-- @param $2:novelty
-- @param $3:offset
-- @param $4:take
SELECT m."id", m."title", m."icon", s."affinity" as "score"
FROM "UserMediaScore" s
INNER JOIN "Media" m ON m."id" = s."mediaID"
WHERE "userID" = $1::int and s."score" is null
	and ($2::float = 0 OR $2::float <= m."novelty")
ORDER BY s."affinity" desc
LIMIT $4::int
OFFSET $3::int