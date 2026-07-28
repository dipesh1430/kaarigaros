-- CreateEnum
CREATE TYPE "KarigarType" AS ENUM ('stitching', 'button');

-- CreateEnum
CREATE TYPE "PaymentRequestStatus" AS ENUM ('pending', 'acknowledged', 'settled');

-- CreateEnum
CREATE TYPE "GarmentType" AS ENUM ('kurti', 'pant');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('received', 'cutting', 'stitching', 'interlock', 'press', 'ready', 'dispatched', 'billed');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('in_progress', 'completed', 'paid');

-- CreateEnum
CREATE TYPE "CheckedBy" AS ENUM ('home', 'press_vendor');

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('cash', 'cheque');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'received');

-- CreateEnum
CREATE TYPE "SettlementMode" AS ENUM ('cash', 'gpay');

-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('withdrawal', 'rounding_carry');

-- CreateTable
CREATE TABLE "Merchant" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "contactPerson" VARCHAR(100),
    "phone" VARCHAR(15),
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Merchant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Karigar" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" "KarigarType" NOT NULL,
    "gender" VARCHAR(10),
    "phone" VARCHAR(15) NOT NULL,
    "pinHash" VARCHAR(255),
    "address" TEXT,
    "selfPickup" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Karigar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentRequest" (
    "id" SERIAL NOT NULL,
    "karigarId" INTEGER NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amountOwedAtRequest" DECIMAL(12,2) NOT NULL,
    "status" "PaymentRequestStatus" NOT NULL DEFAULT 'pending',
    "resolvedSettlementId" INTEGER,
    "notes" TEXT,

    CONSTRAINT "PaymentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" SERIAL NOT NULL,
    "merchantId" INTEGER NOT NULL,
    "designName" VARCHAR(100) NOT NULL,
    "color" VARCHAR(50) NOT NULL,
    "garmentType" "GarmentType" NOT NULL,
    "fabricReceivedMeters" DECIMAL(10,2) NOT NULL,
    "ratePerPiece" DECIMAL(10,2) NOT NULL,
    "totalPiecesPlanned" INTEGER,
    "dateReceived" DATE NOT NULL,
    "status" "BatchStatus" NOT NULL DEFAULT 'received',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CuttingLog" (
    "id" SERIAL NOT NULL,
    "batchId" INTEGER NOT NULL,
    "piecesCut" INTEGER NOT NULL,
    "fabricUsedMeters" DECIMAL(10,2) NOT NULL,
    "cuttingDate" DATE NOT NULL,
    "notes" TEXT,

    CONSTRAINT "CuttingLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KarigarAssignment" (
    "id" SERIAL NOT NULL,
    "batchId" INTEGER NOT NULL,
    "karigarId" INTEGER NOT NULL,
    "piecesAssigned" INTEGER NOT NULL,
    "dateGiven" DATE NOT NULL,
    "dateCollected" DATE,
    "piecesReturned" INTEGER,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'in_progress',

    CONSTRAINT "KarigarAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualityCheck" (
    "id" SERIAL NOT NULL,
    "batchId" INTEGER NOT NULL,
    "checkedBy" "CheckedBy" NOT NULL,
    "piecesChecked" INTEGER,
    "piecesRejected" INTEGER NOT NULL DEFAULT 0,
    "rejectionReason" TEXT,
    "checkDate" DATE NOT NULL,

    CONSTRAINT "QualityCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispatch" (
    "id" SERIAL NOT NULL,
    "batchId" INTEGER NOT NULL,
    "chalanNumber" VARCHAR(50) NOT NULL,
    "piecesDispatched" INTEGER NOT NULL,
    "dispatchDate" DATE NOT NULL,
    "notes" TEXT,

    CONSTRAINT "Dispatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Billing" (
    "id" SERIAL NOT NULL,
    "merchantId" INTEGER NOT NULL,
    "billingDate" DATE NOT NULL,
    "totalPieces" INTEGER NOT NULL,
    "grossAmount" DECIMAL(12,2) NOT NULL,
    "tdsPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "tdsAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(12,2) NOT NULL,
    "paymentMode" "PaymentMode" NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "paymentDate" DATE,

    CONSTRAINT "Billing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingDispatch" (
    "billingId" INTEGER NOT NULL,
    "dispatchId" INTEGER NOT NULL,

    CONSTRAINT "BillingDispatch_pkey" PRIMARY KEY ("billingId","dispatchId")
);

-- CreateTable
CREATE TABLE "KarigarSettlement" (
    "id" SERIAL NOT NULL,
    "karigarId" INTEGER NOT NULL,
    "settlementDate" DATE NOT NULL,
    "calculatedAmount" DECIMAL(12,2) NOT NULL,
    "ledgerBalanceBefore" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "netPayable" DECIMAL(12,2) NOT NULL,
    "amountPaid" DECIMAL(12,2) NOT NULL,
    "roundingDiff" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paymentMode" "SettlementMode" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KarigarSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SettlementItem" (
    "settlementId" INTEGER NOT NULL,
    "assignmentId" INTEGER NOT NULL,
    "piecesCounted" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "SettlementItem_pkey" PRIMARY KEY ("settlementId","assignmentId")
);

-- CreateTable
CREATE TABLE "KarigarLedger" (
    "id" SERIAL NOT NULL,
    "karigarId" INTEGER NOT NULL,
    "entryDate" DATE NOT NULL,
    "entryType" "LedgerEntryType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "relatedSettlementId" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KarigarLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SamplePiece" (
    "id" SERIAL NOT NULL,
    "batchId" INTEGER NOT NULL,
    "size" VARCHAR(10) NOT NULL DEFAULT 'XL',
    "sentToPressDate" DATE,
    "notes" TEXT,

    CONSTRAINT "SamplePiece_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Karigar_phone_key" ON "Karigar"("phone");

-- AddForeignKey
ALTER TABLE "PaymentRequest" ADD CONSTRAINT "PaymentRequest_karigarId_fkey" FOREIGN KEY ("karigarId") REFERENCES "Karigar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CuttingLog" ADD CONSTRAINT "CuttingLog_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KarigarAssignment" ADD CONSTRAINT "KarigarAssignment_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KarigarAssignment" ADD CONSTRAINT "KarigarAssignment_karigarId_fkey" FOREIGN KEY ("karigarId") REFERENCES "Karigar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityCheck" ADD CONSTRAINT "QualityCheck_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispatch" ADD CONSTRAINT "Dispatch_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Billing" ADD CONSTRAINT "Billing_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingDispatch" ADD CONSTRAINT "BillingDispatch_billingId_fkey" FOREIGN KEY ("billingId") REFERENCES "Billing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingDispatch" ADD CONSTRAINT "BillingDispatch_dispatchId_fkey" FOREIGN KEY ("dispatchId") REFERENCES "Dispatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KarigarSettlement" ADD CONSTRAINT "KarigarSettlement_karigarId_fkey" FOREIGN KEY ("karigarId") REFERENCES "Karigar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementItem" ADD CONSTRAINT "SettlementItem_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "KarigarSettlement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementItem" ADD CONSTRAINT "SettlementItem_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "KarigarAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KarigarLedger" ADD CONSTRAINT "KarigarLedger_karigarId_fkey" FOREIGN KEY ("karigarId") REFERENCES "Karigar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KarigarLedger" ADD CONSTRAINT "KarigarLedger_relatedSettlementId_fkey" FOREIGN KEY ("relatedSettlementId") REFERENCES "KarigarSettlement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SamplePiece" ADD CONSTRAINT "SamplePiece_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
