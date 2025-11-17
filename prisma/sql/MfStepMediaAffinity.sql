-- @param $1:id
-- @param $2:learningRate
WITH "target" AS (
	SELECT f."id", f."embedding"
	FROM "MfFactor" f
	WHERE f."type" = 'MEDIA' and f."id" = $1
), "samples" AS (
	SELECT s."score", f."embedding"
	FROM (
		 SELECT a."bID" as "id", a."score"
		 FROM "MediaAffinity" a
		 WHERE a."bID" = $1 and a."overlap" > 100

		 UNION ALL

		 SELECT a."aID" as "id", a."score"
		 FROM "MediaAffinity" a
		 WHERE a."bID" = $1 and a."overlap" > 100
	) s
	INNER JOIN "MfFactor" f ON f."type" = 'MEDIA' and f."id" = s."id"
	WHERE s."score" is not null and s."score" > 0
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
	WHERE "error" is not null
), "step" AS (
	SELECT g."error", t."embedding"
		+ (array_fill(COALESCE($2::float, 0.0), '{144}')::vector(144) * g."grad")::halfvec(144) as "embedding"
	FROM "grad" g
	CROSS JOIN "target" t
)

UPDATE "MfFactor" f
SET "nextEmbedding" = n."embedding", "nextError" = n."error"
FROM "step" n
WHERE f."type" = 'MEDIA' and f."id" = $1::int
RETURNING n."embedding", n."error";
