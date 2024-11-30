-- CreateTable
CREATE TABLE "Appointments" (
    "id" SERIAL NOT NULL,
    "doctorID" INTEGER NOT NULL,
    "patientID" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,

    CONSTRAINT "Appointments_pkey" PRIMARY KEY ("id")
);
