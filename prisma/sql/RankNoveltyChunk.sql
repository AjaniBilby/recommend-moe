-- @param $1:mediaID
UPDATE "MediaRanking"
SET "next" = (
	SELECT SUM(a."score" * r."weight" / r."width")
	FROM (
		SELECT "bID" as "id", "score"
		FROM "MediaAffinity"
		WHERE "bID" = $1::int and "overlap" > 100

		UNION ALL

		SELECT "aID", "score"
		FROM "MediaAffinity"
		WHERE "aID" = $1::int and "overlap" > 100
	) a
	INNER JOIN "MediaRanking" r ON r."id" = a."id"
)
WHERE "id" = $1::int;