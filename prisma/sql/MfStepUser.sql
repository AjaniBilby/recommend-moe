-- @param $1:userID
-- @param $2:learningRate
WITH "medias" AS (
	SELECT s."score", u."embedding"
	FROM "UserMediaScore" s
	INNER JOIN "MfFactor" u ON u."type" = 'MEDIA' and u."id" = s."mediaID"
	WHERE s."userID" = $1::int and "score" > 0
), "user" AS (
	SELECT "id", "embedding"
	FROM "MfFactor"
	WHERE "type" = 'USER' and "id" = $1::int
), "errors" AS (
	SELECT (1.0 - m."score") + (m."embedding" <#> u."embedding") as "error",
		m."embedding"
	FROM "medias" m
	CROSS JOIN "user" u
), "step" AS (
	SELECT u."embedding" + (array_fill($2::float, '{50}')::vector(50) * g."grad") as "embedding", "error"
	FROM (
		SELECT SUM(array_fill("error", '{50}')::vector(50) * "embedding") as "grad", SUM("error") as "error"
		FROM "errors"
	) g
	CROSS JOIN "user" u
)

UPDATE "MfFactor" f
SET "nextEmbedding" = n."embedding", "nextError" = n."error"
FROM "step" n
WHERE f."type" = 'USER' and f."id" = $1::int;
