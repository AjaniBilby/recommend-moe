WITH "stats" AS (
	SELECT MAX("popularity") as "max", MAX("popularity") / 20 as "interval"
	FROM "Media"
), "buckets" AS (
	SELECT generate_series as "start", generate_series + s."interval" as "end"
	FROM "stats" s, generate_series(0.0, s."max" - s."interval", s."interval")
)

SELECT b."start" as "bucket", (
	SELECT COUNT(*)::integer
	FROM "Media" m
	WHERE b."start" < m."popularity" and m."popularity" <= b."end"
) as "frequency"
FROM "buckets" b;