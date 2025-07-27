-- @param $1:userID
SELECT DISTINCT "mediaID"
FROM (
	SELECT "mediaID" FROM "UserMediaScore" WHERE "userID" = $1::int and "affinity" is null

	UNION ALL

	SELECT "id"
	FROM "Media"
	WHERE "id" NOT IN (SELECT "id" FROM "UserMediaScore" WHERE "score" is not null OR "affinity" is not null)
)
ORDER BY "mediaID" asc;