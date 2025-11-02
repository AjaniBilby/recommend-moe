-- @param $1:type
SELECT "type", SUM(ABS("error")) as "error"
FROM "MfFactor"
WHERE "type" = $1
GROUP BY 1;
