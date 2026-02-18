/*
  Warnings:

  - You are about to drop the column `options` on the `FormField` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Form" ADD COLUMN     "published" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "FormField" DROP COLUMN "options",
ADD COLUMN     "max" DOUBLE PRECISION,
ADD COLUMN     "maxLength" INTEGER,
ADD COLUMN     "min" DOUBLE PRECISION,
ADD COLUMN     "minLength" INTEGER,
ADD COLUMN     "placeholder" TEXT,
ADD COLUMN     "rows" INTEGER,
ADD COLUMN     "step" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "FormResponse" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "valuesJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormResponse_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FormResponse" ADD CONSTRAINT "FormResponse_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;
