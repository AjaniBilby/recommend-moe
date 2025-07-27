-- @param $1:userID
SELECT DISTINCT "permission"
FROM (
	SELECT "permission"
	FROM "UserPermission" u
	WHERE "userID" = $1::int

	UNION ALL

	SELECT "permission"
	FROM "_RoleToUser" j
	INNER JOIN "RolePermission" r ON r."roleID" = j."A"
	WHERE j."B" = $1::int
)
ORDER BY "permission" asc;