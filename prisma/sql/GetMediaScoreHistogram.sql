-- @param $1:mediaID
WITH "buckets" AS (
	SELECT generate_series as "start", generate_series + 0.1 as "end"
	FROM generate_series(0.0, 0.9, 0.1)
)

SELECT CONCAT(b."start" * 100, '% - ', b."end", '%') as "bucket", (
	SELECT COUNT(*)::integer
	FROM "UserMediaScore" m
	WHERE b."start" < m."score" and m."score" <= b."end"
		and m."mediaID" = $1
) as "frequency"
FROM "buckets" b;