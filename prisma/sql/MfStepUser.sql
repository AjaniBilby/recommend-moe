-- @param $1:id
-- @param $2:learningRate
WITH "target" AS (
	SELECT f."id", f."embedding"
	FROM "MfFactor" f
	WHERE f."type" = 'USER' and f."id" = $1
), "samples" AS (
	SELECT s."score", f."embedding"
	FROM "MfFactor" f
	INNER JOIN "UserMediaScore" s ON s."userID" = $1 and s."mediaID" = f."id"
	WHERE f."type" = 'MEDIA' and "score" > 0
), "errors" AS (
	SELECT (1.0 - s."score") - (t."embedding" <-> s."embedding") as "error",
		t."embedding"
	FROM "samples" s
	CROSS JOIN "target" t
), "grad" AS (
	SELECT AVG(
			-- need to use full vector here to prevent underflow errors
			(array_fill("error", '{96}')::vector(96) * "embedding"::vector(96))
		) as "grad",
		AVG("error") as "error"
	FROM "errors"
), "step" AS (
	SELECT t."embedding" + (array_fill($2::float, '{96}')::vector(96) * g."grad")::halfvec(96) as "embedding", g."error"
	FROM "grad" g
	CROSS JOIN "target" t
)

UPDATE "MfFactor" f
SET "nextEmbedding" = n."embedding", "nextError" = n."error"
FROM "step" n
WHERE f."type" = 'USER' and f."id" = $1::int;
