-- @param $1:permission
-- @param $2:userID
SELECT EXISTS (
	SELECT "userID"
	FROM "UserPermission"
	WHERE "permission" = $1::"Permission" AND "userID" = $2::int

	UNION ALL

	SELECT u."B" as "userID"
	FROM "_RoleToUser" u
	INNER JOIN "RolePermission" r ON r."roleID" = u."A"
	WHERE u."B" = $2::int
		and r."permission" = $1::"Permission"
) as "valid";