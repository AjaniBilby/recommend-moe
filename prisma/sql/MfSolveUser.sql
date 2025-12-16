-- @param $1:id
WITH "samples" AS (
	SELECT f."embedding", s."score"
	FROM "UserMediaScore" s
	INNER JOIN "MfFactor" f ON f."type" = 'MEDIA' and f."id" = s."mediaID"
	WHERE s."userID" = $1 and f."embedding" is not null and s."score" is not null
), "next" AS (
	SELECT l2_normalize(
		SUM(array_fill("score", '{384}')::vector(384) * "embedding"::vector(384))
	) as "nextEmbedding"
	FROM "samples"
), "error" AS (
	SELECT SUM(ABS(0.5*(s."embedding" <=> n."nextEmbedding") - (1.0 - s."score"))) as "nextError"
	FROM "samples" s
	CROSS JOIN "next" n
)

UPDATE "MfFactor" f
SET "nextEmbedding" = (SELECT "nextEmbedding" FROM "next"),
	"nextError" = (SELECT "nextError" FROM "error")
WHERE f."type" = 'USER' AND f."id" = $1;
