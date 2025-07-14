-- @param $1:mediaID
WITH "buckets" AS (
	SELECT generate_series as "start", generate_series + 0.05 as "end"
	FROM generate_series(0.0, 0.9, 0.05)
)

SELECT CONCAT(b."end", '%') as "bucket", (
	SELECT COUNT(*)::integer
	FROM "MediaAffinity" a
	WHERE b."start" < a."score" and a."score" <= b."end"
		and (a."aID" = $1 or a."bID" = $1)
) as "frequency"
FROM "buckets" b;