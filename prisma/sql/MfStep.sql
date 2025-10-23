WITH "del" AS (
	DELETE FROM "MfFactor" WHERE "nextEmbedding" IS NULL OR "nextError" IS NULL
)

UPDATE "MfFactor"
SET "embedding" = "nextEmbedding", "error" = "nextError";
