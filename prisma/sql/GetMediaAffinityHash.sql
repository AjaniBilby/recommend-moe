-- @param $1:mediaID
-- @param $2:bounded
SELECT MD5(string_agg("bID"::text, '' ORDER BY "score" desc, "bID" ASC))
FROM (
	SELECT "bID", "score" FROM "MediaAffinity" WHERE "aID" = $1
	UNION ALL
	SELECT "aID", "score" FROM "MediaAffinity" WHERE "bID" = $1
	LIMIT $2
);