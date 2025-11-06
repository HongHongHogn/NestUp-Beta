-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "projectId" TEXT;

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "reportId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BMCanvas" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '비즈니스 모델 캔버스',
    "keyPartners" JSONB,
    "keyActivities" JSONB,
    "keyResources" JSONB,
    "valuePropositions" JSONB,
    "customerRelationships" JSONB,
    "channels" JSONB,
    "customerSegments" JSONB,
    "costStructure" JSONB,
    "revenueStreams" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BMCanvas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GTMStrategy" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "strategies" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GTMStrategy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MRD" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'MVP 기능 정의서',
    "epics" JSONB,
    "userStories" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MRD_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_userId_idx" ON "Project"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BMCanvas_projectId_key" ON "BMCanvas"("projectId");

-- CreateIndex
CREATE INDEX "BMCanvas_projectId_idx" ON "BMCanvas"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "GTMStrategy_projectId_key" ON "GTMStrategy"("projectId");

-- CreateIndex
CREATE INDEX "GTMStrategy_projectId_idx" ON "GTMStrategy"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "MRD_projectId_key" ON "MRD"("projectId");

-- CreateIndex
CREATE INDEX "MRD_projectId_idx" ON "MRD"("projectId");

-- CreateIndex
CREATE INDEX "Report_projectId_idx" ON "Report"("projectId");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BMCanvas" ADD CONSTRAINT "BMCanvas_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GTMStrategy" ADD CONSTRAINT "GTMStrategy_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MRD" ADD CONSTRAINT "MRD_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
