-- @param $1:embedding
WITH "ranking" AS (
	SELECT "mediaID", MAX(similarity($1::text, "title")) as "similarity"
	FROM "MediaTitle"
	GROUP BY "mediaID"
	ORDER BY "similarity" desc
	LIMIT 100
)

SELECT m."id", m."title", m."icon", r."similarity"
FROM "ranking" r
INNER JOIN "Media" m on m."id" = r."mediaID"
ORDER BY r."similarity" desc;