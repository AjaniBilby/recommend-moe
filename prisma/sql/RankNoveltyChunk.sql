WITH "updates" AS (
	m."id", (
		SELECT SUM("weight") / SUM("popularity")
		FROM (
			SELECT r."weight" * a."score" / r."width" as "weight", r."width"
			FROM "MediaAffinity" a
			INNER JOIN "MediaRanking" r ON a."bID" = r."id"
			WHERE a."aID" = m."id" and "overlap" > 100 -- scored both media

			UNION ALL

			SELECT r."weight" * a."score" / r."width", r."width"
			FROM "MediaAffinity" a
			INNER JOIN "MediaRanking" r ON a."aID" = r."id"
			WHERE a."bID" = m."id" and "overlap" > 100
		)
	) as "next"
	FROM "MediaRanking" m
	WHERE "outstanding"
	LIMIT 100
)

UPDATE "MediaRanking" m
SET "next" = u."next"
FROM "updates" u
WHERE u."id" = m."id";