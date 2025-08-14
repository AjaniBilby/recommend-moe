WITH "buckets" AS (
	SELECT generate_series as "start", generate_series + 0.05 as "end"
	FROM generate_series(0.0, 0.95, 0.05)
)

SELECT CONCAT(b."start" * 100, '% - ', b."end", '%') as "bucket", (
	SELECT COUNT(*)::integer
	FROM "Media" m
	WHERE b."start" < m."novelty" and m."score" <= b."end"
) as "frequency"
FROM "buckets" b;