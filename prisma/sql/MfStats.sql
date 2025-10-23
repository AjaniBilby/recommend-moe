SELECT "type", AVG(ABS("error")) as "error", AVG(ABS("nextError")) as "next"
FROM "MfFactor"
GROUP BY 1;
