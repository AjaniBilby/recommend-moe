-- @param {Permission} $1:permission
-- @param {Int}        $2:prefix
-- @param {String}     $3:key
-- @param {String}     $4:ip
WITH "user" as (
	SELECT "userID", "expiry"
	FROM "UserSession"
	WHERE "prefix" = $2::int
		and "key" = $3::text
		and "ip" = $4::inet
		and "expiry" > now()
)

SELECT u.*
FROM (
	SELECT "userID"
	FROM "UserPermission"
	WHERE "permission" = $1::"Permission" AND "userID" in (SELECT "userID" FROM "user")

	UNION ALL

	SELECT u."B" as "userID"
	FROM "_RoleToUser" u
	INNER JOIN "RolePermission" r ON r."roleID" = u."A"
	WHERE u."B" in (SELECT "userID" FROM "user")
		and r."permission" = $1::"Permission"
) t
INNER JOIN "user" u ON t."userID" = u."userID"
LIMIT 1;