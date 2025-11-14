-- CreateEnum
CREATE TYPE "Role" AS ENUM ('volunteer', 'organization');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('female', 'male');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED');

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "file" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "volunteer_profile" (
    "id" SERIAL NOT NULL,
    "location" TEXT,
    "date_of_birth" TIMESTAMP(3),
    "gender" "Gender",
    "available_day" TEXT[],
    "interests" TEXT[],
    "skills" TEXT[],
    "user_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "volunteer_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "available_time" (
    "id" SERIAL NOT NULL,
    "time_from" TEXT NOT NULL,
    "time_to" TEXT NOT NULL,
    "usage_count_volunteer" INTEGER NOT NULL DEFAULT 0,
    "usage_count_opportunity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "available_time_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_profile" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "description" TEXT,
    "structure" TEXT,
    "user_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "volunteer_opportunity" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "rules" TEXT,
    "location" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "category" TEXT,
    "capacity" INTEGER NOT NULL,
    "required_skills" TEXT[],
    "matching_score" DOUBLE PRECISION,
    "organization_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "volunteer_opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application" (
    "id" SERIAL NOT NULL,
    "apply_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "position" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "volunteer_id" INTEGER NOT NULL,
    "opportunity_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "impact_analysis" (
    "id" SERIAL NOT NULL,
    "total_hours" INTEGER NOT NULL,
    "total_volunteers" INTEGER NOT NULL,
    "beneficiaries" INTEGER NOT NULL,
    "region_covered" TEXT,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organization_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "impact_analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio" (
    "id" SERIAL NOT NULL,
    "activity_title" TEXT NOT NULL,
    "contribution_hours" INTEGER NOT NULL,
    "certificate" TEXT,
    "badge" TEXT,
    "feedback" TEXT,
    "volunteer_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_VolunteerAvailableTimes" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_VolunteerAvailableTimes_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_OpportunityAvailableTimes" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_OpportunityAvailableTimes_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "volunteer_profile_user_id_key" ON "volunteer_profile"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_profile_user_id_key" ON "organization_profile"("user_id");

-- CreateIndex
CREATE INDEX "_VolunteerAvailableTimes_B_index" ON "_VolunteerAvailableTimes"("B");

-- CreateIndex
CREATE INDEX "_OpportunityAvailableTimes_B_index" ON "_OpportunityAvailableTimes"("B");

-- AddForeignKey
ALTER TABLE "volunteer_profile" ADD CONSTRAINT "volunteer_profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_profile" ADD CONSTRAINT "organization_profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteer_opportunity" ADD CONSTRAINT "volunteer_opportunity_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application" ADD CONSTRAINT "application_volunteer_id_fkey" FOREIGN KEY ("volunteer_id") REFERENCES "volunteer_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application" ADD CONSTRAINT "application_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "volunteer_opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impact_analysis" ADD CONSTRAINT "impact_analysis_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio" ADD CONSTRAINT "portfolio_volunteer_id_fkey" FOREIGN KEY ("volunteer_id") REFERENCES "volunteer_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_VolunteerAvailableTimes" ADD CONSTRAINT "_VolunteerAvailableTimes_A_fkey" FOREIGN KEY ("A") REFERENCES "available_time"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_VolunteerAvailableTimes" ADD CONSTRAINT "_VolunteerAvailableTimes_B_fkey" FOREIGN KEY ("B") REFERENCES "volunteer_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OpportunityAvailableTimes" ADD CONSTRAINT "_OpportunityAvailableTimes_A_fkey" FOREIGN KEY ("A") REFERENCES "available_time"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OpportunityAvailableTimes" ADD CONSTRAINT "_OpportunityAvailableTimes_B_fkey" FOREIGN KEY ("B") REFERENCES "volunteer_opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
