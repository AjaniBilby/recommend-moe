-- @param $1:embedding
WITH "ranking" AS (
	SELECT "mediaID", MAX("embedding" <-> $1::float[]::vector) as "similarity"
	FROM "MediaTitle"
	GROUP BY "mediaID"
	LIMIT 100
)

SELECT m.*
FROM "ranking" r
INNER JOIN "Media" m on m."id" = r."mediaID"
ORDER BY r."similarity" desc;