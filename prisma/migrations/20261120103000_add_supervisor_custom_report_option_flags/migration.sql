ALTER TABLE "TermlyReportOptionSet"
    ADD COLUMN "allowCustomInterest" BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN "allowCustomConduct" BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN "allowCustomSupervisorRemarks" BOOLEAN NOT NULL DEFAULT TRUE;
