CREATE TABLE "AppAccessSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppAccessSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AccessDeniedRole" (
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessDeniedRole_pkey" PRIMARY KEY ("role")
);

CREATE TABLE "AccessDeniedUser" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessDeniedUser_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AccessDeniedUser_identifier_key" ON "AccessDeniedUser"("identifier");
