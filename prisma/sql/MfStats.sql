-- @param $1:type
SELECT "type", AVG(ABS("error")) as "error", AVG(ABS("nextError")) as "next"
FROM "MfFactor"
WHERE "type" = $1
GROUP BY 1;
