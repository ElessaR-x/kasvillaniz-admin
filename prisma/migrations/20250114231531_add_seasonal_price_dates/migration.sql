-- CreateTable
CREATE TABLE "Villa" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "originalName" TEXT,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "images" TEXT[],
    "features" TEXT[],
    "location" TEXT NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "maxGuests" INTEGER NOT NULL,
    "minStayDays" INTEGER NOT NULL DEFAULT 1,
    "ownerName" TEXT NOT NULL,
    "identityNumber" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "ibanOwner" TEXT NOT NULL,
    "ibanNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tourismLicenseNumber" TEXT NOT NULL,
    "mapLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Villa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Distance" (
    "id" TEXT NOT NULL,
    "miniMarket" INTEGER NOT NULL,
    "restaurant" INTEGER NOT NULL,
    "publicTransport" INTEGER NOT NULL,
    "beach" INTEGER NOT NULL,
    "airport" INTEGER NOT NULL,
    "cityCenter" INTEGER NOT NULL,
    "villaId" TEXT NOT NULL,

    CONSTRAINT "Distance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonalPrice" (
    "id" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "months" INTEGER[],
    "villaId" TEXT NOT NULL,

    CONSTRAINT "SeasonalPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "title" TEXT,
    "villaName" TEXT NOT NULL,
    "villaLocation" TEXT NOT NULL,
    "maxGuests" INTEGER NOT NULL,
    "specialRequests" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "villaId" TEXT NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactPerson" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "identityNumber" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,

    CONSTRAINT "ContactPerson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "identityNumber" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user" TEXT,
    "villaId" TEXT NOT NULL,
    "bookingId" TEXT,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Villa_code_key" ON "Villa"("code");

-- CreateIndex
CREATE INDEX "Villa_location_idx" ON "Villa"("location");

-- CreateIndex
CREATE UNIQUE INDEX "Distance_villaId_key" ON "Distance"("villaId");

-- CreateIndex
CREATE INDEX "SeasonalPrice_villaId_idx" ON "SeasonalPrice"("villaId");

-- CreateIndex
CREATE INDEX "SeasonalPrice_startDate_endDate_idx" ON "SeasonalPrice"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "Booking_villaId_status_idx" ON "Booking"("villaId", "status");

-- CreateIndex
CREATE INDEX "Booking_startDate_endDate_idx" ON "Booking"("startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "ContactPerson_bookingId_key" ON "ContactPerson"("bookingId");

-- CreateIndex
CREATE INDEX "Guest_bookingId_idx" ON "Guest"("bookingId");

-- CreateIndex
CREATE INDEX "Activity_villaId_idx" ON "Activity"("villaId");

-- CreateIndex
CREATE INDEX "Activity_type_idx" ON "Activity"("type");

-- CreateIndex
CREATE INDEX "Activity_date_idx" ON "Activity"("date");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Distance" ADD CONSTRAINT "Distance_villaId_fkey" FOREIGN KEY ("villaId") REFERENCES "Villa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonalPrice" ADD CONSTRAINT "SeasonalPrice_villaId_fkey" FOREIGN KEY ("villaId") REFERENCES "Villa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_villaId_fkey" FOREIGN KEY ("villaId") REFERENCES "Villa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactPerson" ADD CONSTRAINT "ContactPerson_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_villaId_fkey" FOREIGN KEY ("villaId") REFERENCES "Villa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
