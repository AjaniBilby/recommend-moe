-- @param $1:embedding
WITH "ranking" AS (
	SELECT "mediaID", similarity($1::text, "title") as "similarity"
	FROM "MediaTitle"
	GROUP BY "mediaID"
	LIMIT 100
)

SELECT m.*
FROM "ranking" r
INNER JOIN "Media" m on m."id" = r."mediaID"
ORDER BY r."similarity" desc;