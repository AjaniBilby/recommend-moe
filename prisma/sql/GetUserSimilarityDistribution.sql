-- @param $1:userID
WITH "buckets" AS (
	SELECT generate_series as "start", generate_series + 0.05 as "end"
	FROM generate_series(0.0, 0.95, 0.05)
)

SELECT CONCAT(b."start" * 100, '% - ', b."end" * 100, '%') as "bucket", (
	SELECT COUNT(*)::integer
	FROM "UserAffinity" m
	WHERE b."start" < m."score" and m."score" <= b."end"
		and (m."aID" = $1 OR m."bID" = $1)
) as "frequency"
FROM "buckets" b;