-- @param $1:mediaID
SELECT
	bucket,
	COUNT(*) as frequency,
	((bucket - 1) * 10)::text || '% - ' || (bucket * 10)::text || '%' as bucket_name
FROM (
	SELECT
		WIDTH_BUCKET(score, 0, 1.0001, 10) as bucket,
		score
	FROM "UserMediaScore"
	WHERE "mediaID" = $1
		AND score IS NOT NULL and 0 <= score  and score <= 1
) buckets
GROUP BY bucket
ORDER BY bucket;