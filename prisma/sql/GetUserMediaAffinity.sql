-- @param $1:userID
-- @param $2:mediaID
SELECT SUM(s."score" * a."score") / SUM(a."score"), COUNT(*) as "overlap"
FROM "UserMediaScore" s
INNER JOIN "UserAffinity" a ON a."aID" = LEAST($1, s."userID") and a."bID" = GREATEST($1, s."userID")
WHERE s."mediaID" = $2;