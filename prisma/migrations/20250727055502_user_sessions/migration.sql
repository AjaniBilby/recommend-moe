-- CreateEnum
CREATE TYPE "Permission" AS ENUM ('MEDIA_MODIFY', 'PERMISSION_ASSIGN', 'USER_MODIFY');

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleID" INTEGER NOT NULL,
    "permission" "Permission" NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("permission","roleID")
);

-- CreateTable
CREATE TABLE "UserPermission" (
    "userID" INTEGER NOT NULL,
    "permission" "Permission" NOT NULL,

    CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("permission","userID")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "prefix" INTEGER NOT NULL,
    "key" VARCHAR(50) NOT NULL,
    "ip" INET NOT NULL,
    "expiry" TIMESTAMP(3) NOT NULL,
    "hash" VARCHAR(50) NOT NULL DEFAULT '',
    "subscription" JSONB,
    "userID" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("prefix")
);

-- CreateTable
CREATE TABLE "UserAuthToken" (
    "id" SERIAL NOT NULL,
    "type" "ExternalKind" NOT NULL,
    "expiry" TIMESTAMP(3),
    "access" TEXT,
    "refresh" TEXT,
    "userID" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAuthToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RoleToUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_RoleToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE INDEX "RolePermission_roleID_idx" ON "RolePermission"("roleID");

-- CreateIndex
CREATE INDEX "UserPermission_userID_idx" ON "UserPermission"("userID");

-- CreateIndex
CREATE INDEX "UserSession_userID_idx" ON "UserSession"("userID");

-- CreateIndex
CREATE INDEX "UserAuthToken_userID_idx" ON "UserAuthToken"("userID");

-- CreateIndex
CREATE INDEX "UserAuthToken_updatedAt_idx" ON "UserAuthToken"("updatedAt" DESC);

-- CreateIndex
CREATE INDEX "_RoleToUser_B_index" ON "_RoleToUser"("B");

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleID_fkey" FOREIGN KEY ("roleID") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAuthToken" ADD CONSTRAINT "UserAuthToken_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoleToUser" ADD CONSTRAINT "_RoleToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoleToUser" ADD CONSTRAINT "_RoleToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
