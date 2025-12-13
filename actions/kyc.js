"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import {
  simulatePANVerification,
  simulateAadhaarVerification,
  simulateBankVerification,
  simulateCompleteKYC,
} from "@/lib/simulate-kyc";

/**
 * KYC Verification Actions
 * All verifications use simulation for realistic experience
 */

// ==================== GET KYC STATUS ====================

/**
 * Get user's KYC status and records
 */
export async function getKYCStatus() {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        kycRecords: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    return {
      success: true,
      data: {
        kycStatus: user.kycStatus,
        kycVerified: user.kycVerified,
        kycVerifiedAt: user.kycVerifiedAt,
        panNumber: user.panNumber ? `XXXX${user.panNumber.slice(-4)}` : null,
        aadhaarNumber: user.aadhaarNumber,
        records: user.kycRecords.map((record) => ({
          id: record.id,
          type: record.verificationType,
          status: record.verificationStatus,
          verifiedAt: record.verifiedAt,
          createdAt: record.createdAt,
        })),
      },
    };
  } catch (error) {
    console.error("Failed to get KYC status:", error);
    return { success: false, error: error.message };
  }
}

// ==================== VERIFY PAN ====================

/**
 * Verify PAN card
 */
export async function verifyPAN({ panNumber, name, dateOfBirth }) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Check if already verified
    const existingVerification = await db.kycRecord.findFirst({
      where: {
        userId: user.id,
        verificationType: "PAN",
        verificationStatus: "VERIFIED",
      },
    });

    if (existingVerification) {
      return { success: false, error: "PAN already verified" };
    }

    // Simulate PAN verification
    const result = await simulatePANVerification({
      panNumber,
      name,
      dateOfBirth,
    });

    if (!result.success) {
      // Create failed record
      await db.kycRecord.create({
        data: {
          userId: user.id,
          documentNumber: panNumber,
          verificationType: "PAN",
          verificationStatus: "FAILED",
          isSimulated: true,
          simulatedResponse: result,
          failureReason: result.error?.message || "PAN verification failed",
        },
      });

      return { success: false, error: typeof result.error === 'object' ? result.error.message : (result.error || "PAN verification failed") };
    }

    // Create successful record and update user
    const verificationData = result.verification || result.data;
    await db.$transaction([
      db.kycRecord.create({
        data: {
          userId: user.id,
          documentNumber: panNumber,
          verificationType: "PAN",
          verificationStatus: "VERIFIED",
          isSimulated: true,
          simulatedResponse: verificationData,
          verifiedAt: new Date(),
        },
      }),
      db.user.update({
        where: { id: user.id },
        data: {
          panNumber,
          kycStatus: "IN_PROGRESS",
        },
      }),
    ]);

    revalidatePath("/kyc");
    revalidatePath("/wallet");

    return {
      success: true,
      data: {
        verified: true,
        panDetails: {
          name: verificationData?.name || "Verified",
          maskedPan: `XXXX${panNumber.slice(-4)}`,
          status: verificationData?.status || "VERIFIED",
        },
      },
    };
  } catch (error) {
    console.error("Failed to verify PAN:", error);
    return { success: false, error: error.message };
  }
}

// ==================== VERIFY AADHAAR ====================

/**
 * Initiate Aadhaar verification (send OTP)
 */
export async function initiateAadhaarVerification({ aadhaarNumber }) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Validate Aadhaar format
    const cleanAadhaar = aadhaarNumber.replace(/\s/g, "");
    if (!/^\d{12}$/.test(cleanAadhaar)) {
      return { success: false, error: "Invalid Aadhaar number format" };
    }

    // Simulate sending OTP
    // In simulation, we just return success - user can enter any OTP
    return {
      success: true,
      data: {
        transactionId: `SIM_AADHAAR_${Date.now()}`,
        maskedMobile: `XXXXXXXX${Math.floor(Math.random() * 90 + 10)}`,
        message: "OTP sent to registered mobile number",
      },
    };
  } catch (error) {
    console.error("Failed to initiate Aadhaar verification:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Complete Aadhaar verification with OTP
 */
export async function verifyAadhaar({ aadhaarNumber, otp, transactionId }) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Check if already verified
    const existingVerification = await db.kycRecord.findFirst({
      where: {
        userId: user.id,
        verificationType: "AADHAAR",
        verificationStatus: "VERIFIED",
      },
    });

    if (existingVerification) {
      return { success: false, error: "Aadhaar already verified" };
    }

    // Simulate OTP verification (any 6-digit OTP works in simulation)
    if (!/^\d{6}$/.test(otp)) {
      return { success: false, error: "Invalid OTP format. Please enter 6 digits." };
    }

    const cleanAadhaar = aadhaarNumber.replace(/\s/g, "");
    
    // Simulate Aadhaar verification
    const result = await simulateAadhaarVerification({
      aadhaarNumber: cleanAadhaar,
      otp,
    });

    if (!result.success) {
      await db.kycRecord.create({
        data: {
          userId: user.id,
          documentNumber: cleanAadhaar.slice(-4), // Only store last 4 digits
          verificationType: "AADHAAR",
          verificationStatus: "FAILED",
          isSimulated: true,
          simulatedResponse: result,
          failureReason: result.error?.message || "Aadhaar verification failed",
        },
      });

      return { success: false, error: typeof result.error === 'object' ? result.error.message : (result.error || "Aadhaar verification failed") };
    }

    // Create successful record and update user
    await db.$transaction([
      db.kycRecord.create({
        data: {
          userId: user.id,
          documentNumber: cleanAadhaar.slice(-4), // Only store last 4 digits
          verificationType: "AADHAAR",
          verificationStatus: "VERIFIED",
          isSimulated: true,
          simulatedResponse: result.data,
          verifiedAt: new Date(),
        },
      }),
      db.user.update({
        where: { id: user.id },
        data: {
          aadhaarNumber: cleanAadhaar.slice(-4),
          kycStatus: "IN_PROGRESS",
        },
      }),
    ]);

    revalidatePath("/kyc");
    revalidatePath("/wallet");

    const verificationData = result.verification || result.data;
    return {
      success: true,
      data: {
        verified: true,
        aadhaarDetails: {
          name: verificationData?.name || "Verified",
          maskedAadhaar: `XXXXXXXX${cleanAadhaar.slice(-4)}`,
          address: verificationData?.address,
        },
      },
    };
  } catch (error) {
    console.error("Failed to verify Aadhaar:", error);
    return { success: false, error: error.message };
  }
}

// ==================== VERIFY BANK ACCOUNT ====================

/**
 * Verify bank account
 */
export async function verifyBankAccount({ accountNumber, ifscCode, accountHolderName }) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Simulate bank verification
    const result = await simulateBankVerification({
      accountNumber,
      ifscCode,
      accountHolderName,
    });

    if (!result.success) {
      await db.kycRecord.create({
        data: {
          userId: user.id,
          documentNumber: accountNumber.slice(-4),
          verificationType: "BANK_ACCOUNT",
          verificationStatus: "FAILED",
          isSimulated: true,
          simulatedResponse: result,
          failureReason: result.error?.message || "Bank verification failed",
        },
      });

      return { success: false, error: typeof result.error === 'object' ? result.error.message : (result.error || "Bank verification failed") };
    }

    // Create successful record
    const verificationData = result.verification || result.data;
    await db.kycRecord.create({
      data: {
        userId: user.id,
        documentNumber: accountNumber.slice(-4),
        verificationType: "BANK_ACCOUNT",
        verificationStatus: "VERIFIED",
        isSimulated: true,
        simulatedResponse: verificationData,
        verifiedAt: new Date(),
      },
    });

    revalidatePath("/kyc");

    return {
      success: true,
      data: {
        verified: true,
        bankDetails: {
          bankName: verificationData?.bankName || "Bank",
          branch: verificationData?.branchName || verificationData?.branch,
          maskedAccount: `XXXX${accountNumber.slice(-4)}`,
          accountHolderName: verificationData?.accountHolderName,
        },
      },
    };
  } catch (error) {
    console.error("Failed to verify bank account:", error);
    return { success: false, error: error.message };
  }
}

// ==================== COMPLETE KYC ====================

/**
 * Mark KYC as complete after all verifications
 */
export async function completeKYC() {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        kycRecords: {
          where: { verificationStatus: "VERIFIED" },
        },
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Check if PAN and Aadhaar are verified
    const verifiedTypes = user.kycRecords.map((r) => r.verificationType);
    const hasPAN = verifiedTypes.includes("PAN");
    const hasAadhaar = verifiedTypes.includes("AADHAAR");

    if (!hasPAN || !hasAadhaar) {
      return {
        success: false,
        error: "Please complete PAN and Aadhaar verification first",
      };
    }

    // Update user KYC status to VERIFIED
    await db.user.update({
      where: { id: user.id },
      data: {
        kycStatus: "VERIFIED",
        kycVerified: true,
        kycVerifiedAt: new Date(),
      },
    });

    revalidatePath("/kyc");
    revalidatePath("/wallet");
    revalidatePath("/investments");

    return {
      success: true,
      data: {
        kycStatus: "VERIFIED",
        message: "KYC verification completed successfully!",
      },
    };
  } catch (error) {
    console.error("Failed to complete KYC:", error);
    return { success: false, error: error.message };
  }
}
