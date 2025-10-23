-- @param $1:type

-- WITH "del" AS (
-- 	DELETE FROM "MfFactor"
-- 	WHERE "type" = $1 AND "nextEmbedding" is NULL OR "nextError" is NULL
-- )

UPDATE "MfFactor"
SET "embedding" = "nextEmbedding", "error" = "nextError"
WHERE "type" = $1 AND "nextEmbedding" is not NULL and "nextError" is not NULL;
