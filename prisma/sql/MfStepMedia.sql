-- @param $1:id
-- @param $2:learningRate
WITH "current" AS (
	SELECT f."id", f."embedding"
	FROM "MfFactor" f
	WHERE f."type" = 'MEDIA' and f."id" = $1
), "samples" AS (
	SELECT s."score", f."embedding"
	FROM "MfFactor" f
	INNER JOIN "UserMediaScore" s ON s."mediaID" = $1 and s."userID" = f."id"
	WHERE f."type" = 'USER' and "score" >= 0
), "factors" AS (
	SELECT
		(c."embedding" <=> s."embedding") as "distance_current",
		(1.0 - s."score")*2.0             as "distance_target",
		c."embedding"                     as "embedding_current",
		s."embedding"                     as "embedding_target"
	FROM "samples" s
	CROSS JOIN "current" c
), "gradient" AS (
	SELECT SUM(
			array_fill("distance_current" - "distance_target", '{144}')::vector(144)
			* l2_normalize("embedding_target" - "embedding_current")::vector(144)
		) as "gradient",
		SUM(ABS("distance_current" - "distance_target")) as "error_total"
	FROM "factors"
), "step" AS (
	SELECT g."error_total",
		g."gradient" * array_fill($2::float, '{144}')::vector(144) + c."embedding" as "embedding"
	FROM "gradient" g
	CROSS JOIN "current" c
)

UPDATE "MfFactor" f
SET "nextEmbedding" = n."embedding", "nextError" = n."error_total"
FROM "step" n
WHERE f."type" = 'MEDIA' and f."id" = $1::int;
