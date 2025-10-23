-- @param $1:mediaID
-- @param $2:learningRate
WITH "users" AS (
	SELECT s."score", u."embedding"
	FROM "UserMediaScore" s
	INNER JOIN "MfFactor" u ON u."type" = 'USER' and u."id" = s."userID"
	WHERE s."mediaID" = $1::int and "score" > 0
), "media" AS (
	SELECT "id", "embedding"
	FROM "MfFactor"
	WHERE "type" = 'MEDIA' and "id" = $1::int
), "errors" AS (
	SELECT u."score" + (u."embedding" <#> m."embedding") as "error",
		u."embedding"
	FROM "users" u
	CROSS JOIN "media" m
), "step" AS (
SELECT m."embedding" + (array_fill($2::float, '{50}')::vector(50) * g."grad") as "embedding", "error"
	FROM (
		SELECT SUM(array_fill("error", '{50}')::vector(50) * "embedding") as "grad", SUM("error") as "error"
		FROM "errors"
	) g
	CROSS JOIN "media" m
)

UPDATE "MfFactor" f
SET "nextEmbedding" = n."embedding", "nextError" = n."error"
FROM "step" n
WHERE f."type" = 'MEDIA' and f."id" = $1::int;
