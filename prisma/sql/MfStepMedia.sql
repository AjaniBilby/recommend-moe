WITH "users" AS (
	SELECT
	random() as "score",
	ARRAY[
	  random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1,
	  random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1,
	  random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1,
	  random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1,
	  random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1
	]::vector(50) AS "vector"
	FROM "UserMediaScore"
	WHERE "mediaID" = 5617 and "score" > 0
),
"media" AS (
  SELECT
    1 as media_id,
    ARRAY[
	  random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1,
	  random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1,
	  random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1,
	  random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1,
	  random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1, random() * 0.1
	]::vector(50) AS "vector"
), "step" AS (
	SELECT u."score" + (u."vector" <#> m."vector") as "error",
		u."vector"
	FROM "users" u
	CROSS JOIN "media" m
)


SELECT m."vector" + g."grad", "error"
FROM (
	SELECT SUM(array_fill("error", '{50}')::vector(50) * "vector") as "grad", SUM("error") as "error"
	FROM "step"
) g
CROSS JOIN "media" m;
