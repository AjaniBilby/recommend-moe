WITH "media" AS (
	UPDATE "Media" m
	SET "embedding" = f."embedding"
	FROM "MfFactor" f
	WHERE f."type" = 'MEDIA' and f."id" = m."id"
), "user" AS (
	UPDATE "User" u
	SET "embedding" = f."embedding"
	FROM "MfFactor" f
	WHERE f."type" = 'USER' and f."id" = u."id"
)

SELECT 1 as "val";
