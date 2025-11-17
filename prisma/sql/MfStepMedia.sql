-- @param $1:id
-- @param $2:learningRate
WITH "target" AS (
	SELECT f."id", f."embedding"
	FROM "MfFactor" f
	WHERE f."type" = 'MEDIA' and f."id" = $1
), "samples" AS (
	SELECT s."score", f."embedding"
	FROM "MfFactor" f
	INNER JOIN "UserMediaScore" s ON s."mediaID" = $1 and s."userID" = f."id"
	WHERE f."type" = 'USER' and "score" > 0
), "errors" AS (
	SELECT (1.0 - s."score") - (t."embedding" <-> s."embedding") as "error",
		t."embedding"
	FROM "samples" s
	CROSS JOIN "target" t
), "grad" AS (
	SELECT AVG(
			-- need to use full vector here to prevent underflow errors
			(array_fill("error", '{144}')::vector(144) * "embedding"::vector(144))
		) as "grad",
		SUM(ABS("error")) as "error"
	FROM "errors"
), "step" AS (
	SELECT g."error",
		t."embedding" + (array_fill($2::float, '{144}')::vector(144) * g."grad")::halfvec(144) as "embedding"
	FROM "grad" g
	CROSS JOIN "target" t
)

UPDATE "MfFactor" f
SET "nextEmbedding" = n."embedding", "nextError" = n."error"
FROM "step" n
WHERE f."type" = 'MEDIA' and f."id" = $1::int;
