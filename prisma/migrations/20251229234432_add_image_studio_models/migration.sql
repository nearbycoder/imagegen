-- CreateTable
CREATE TABLE "generation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "negativePrompt" TEXT,
    "aspectRatio" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "generation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "image" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "generationId" TEXT NOT NULL,
    "r2Url" TEXT NOT NULL,
    "r2Key" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "image_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "generation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reference_image" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "generationId" TEXT NOT NULL,
    "r2Url" TEXT NOT NULL,
    "r2Key" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reference_image_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "generation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "generation_model" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "generationId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    CONSTRAINT "generation_model_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "generation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "generation_userId_idx" ON "generation"("userId");

-- CreateIndex
CREATE INDEX "generation_createdAt_idx" ON "generation"("createdAt");

-- CreateIndex
CREATE INDEX "image_generationId_idx" ON "image"("generationId");

-- CreateIndex
CREATE INDEX "image_createdAt_idx" ON "image"("createdAt");

-- CreateIndex
CREATE INDEX "reference_image_generationId_idx" ON "reference_image"("generationId");

-- CreateIndex
CREATE INDEX "generation_model_generationId_idx" ON "generation_model"("generationId");
