-- @param $1:mediaID
-- @param $2:offset
-- @param $3:take
SELECT m."id", m."title", m."icon", a."score"
FROM (
	SELECT "bID" as "mediaID", "score", "overlap", "stale"
	FROM "MediaAffinity" m
	WHERE "aID" = $1::int

	UNION ALL

	SELECT "aID", "score", "overlap", "stale"
	FROM "MediaAffinity" m
	WHERE "bID" = $1::int
) a
INNER JOIN "Media" m ON m."id" = a."mediaID"
WHERE not a."stale" and a."overlap" > 10
ORDER BY a."score" desc
LIMIT $3::int
OFFSET $2::int