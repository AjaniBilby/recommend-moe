-- @param $1:mediaID
UPDATE "Media" m
SET "novelty" = t."novelty"
FROM (
	SELECT 1.0 - COUNT(*) / SUM(1.0 / "score") as "novelty", COUNT(*)
	FROM "MediaAffinity"
	WHERE ("aID" = $1::int or "bID" = $1::int) and "score" > 0 and "overlap" > 100
) t
WHERE "id" = $1::int and t."count" > 100;