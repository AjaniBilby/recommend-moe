EXPLAIN ANALYZE
-- ), "updates" AS (
	SELECT s."mediaID", SUM(s."score" * a."score") / SUM(a."score") as "affinity"
	FROM "UserMediaScore" s
	INNER JOIN "UserAffinity" a ON a."aID" = LEAST(138998, s."userID") and a."bID" = GREATEST(138998, s."userID")
	WHERE s."mediaID" IN (SELECT "mediaID" FROM "UserMediaScore" WHERE "userID" = 138998 and "affinity" is null )
	GROUP BY s."mediaID"
	HAVING COUNT(*) > 10
-- )

-- UPDATE "UserMediaScore" a
-- SET "affinity" = u."affinity", "updatedAt" = now()
-- FROM "updates" u
-- WHERE u."mediaID" = a."mediaID" and a."userID" = 138998;