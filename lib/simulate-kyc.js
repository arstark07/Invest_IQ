/**
 * KYC Verification Simulation Engine
 * Simulates PAN, Aadhaar, Bank Account verification without real API calls
 */

// Simulated success rate (95% success)
const SUCCESS_RATE = 0.95;

// Simulated processing delays (ms)
const MIN_DELAY = 1000;
const MAX_DELAY = 3000;

// Generate random delay
const randomDelay = () =>
  Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY) + MIN_DELAY);

// Generate random ID
const generateId = (prefix) =>
  `${prefix}_sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Simulate success based on success rate
const shouldSucceed = () => Math.random() < SUCCESS_RATE;

// Sample names for simulation
const SAMPLE_FIRST_NAMES = ["Rahul", "Priya", "Amit", "Sneha", "Vikram", "Ananya", "Rajesh", "Meera"];
const SAMPLE_LAST_NAMES = ["Sharma", "Patel", "Singh", "Kumar", "Gupta", "Verma", "Reddy", "Nair"];

// Generate random name
const getRandomName = () => {
  const firstName = SAMPLE_FIRST_NAMES[Math.floor(Math.random() * SAMPLE_FIRST_NAMES.length)];
  const lastName = SAMPLE_LAST_NAMES[Math.floor(Math.random() * SAMPLE_LAST_NAMES.length)];
  return { firstName, lastName, fullName: `${firstName} ${lastName}` };
};

// Validate PAN format
const isValidPANFormat = (pan) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);

// Validate Aadhaar format (12 digits)
const isValidAadhaarFormat = (aadhaar) => /^[0-9]{12}$/.test(aadhaar);

// Generate masked Aadhaar
const maskAadhaar = (aadhaar) => `XXXX XXXX ${aadhaar.slice(-4)}`;

// Generate random date of birth (between 18-70 years old)
const getRandomDOB = () => {
  const today = new Date();
  const minAge = 18;
  const maxAge = 70;
  const age = Math.floor(Math.random() * (maxAge - minAge) + minAge);
  const dob = new Date(today.getFullYear() - age, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
  return dob.toISOString().split('T')[0];
};

/**
 * Simulate PAN Card Verification
 * @param {Object} params - Verification parameters
 * @param {string} params.panNumber - The PAN number to verify
 * @param {string} [params.name] - Optional name to verify against
 * @param {string} [params.dateOfBirth] - Optional date of birth to verify against
 */
export async function simulatePANVerification({ panNumber, name = null, dateOfBirth = null }) {
  await new Promise(resolve => setTimeout(resolve, randomDelay()));
  
  // Validate format
  if (!panNumber || !isValidPANFormat(panNumber)) {
    return {
      success: false,
      simulated: true,
      error: {
        code: "INVALID_FORMAT",
        message: "Invalid PAN format. Expected format: ABCDE1234F",
      }
    };
  }
  
  const success = shouldSucceed();
  const verificationId = generateId("PAN_VER");
  
  if (success) {
    const { fullName } = getRandomName();
    const verifiedName = name || fullName;
    
    // Determine PAN type from 4th character
    const panType = panNumber[3];
    const panTypeMap = {
      'P': 'Individual',
      'C': 'Company',
      'H': 'HUF',
      'F': 'Firm',
      'A': 'AOP',
      'T': 'Trust',
    };
    
    return {
      success: true,
      simulated: true,
      verification: {
        verificationId,
        panNumber,
        name: verifiedName,
        firstName: verifiedName.split(' ')[0],
        lastName: verifiedName.split(' ').slice(1).join(' '),
        panType: panTypeMap[panType] || 'Individual',
        status: "VALID",
        sepiStatus: "ACTIVE",
        lastUpdated: new Date().toISOString().split('T')[0],
        aadhaarLinked: Math.random() > 0.3, // 70% chance of Aadhaar linked
        message: "PAN verification successful",
      }
    };
  } else {
    return {
      success: false,
      simulated: true,
      error: {
        code: "VERIFICATION_FAILED",
        message: "PAN details could not be verified. Please check and try again.",
        verificationId,
      }
    };
  }
}

/**
 * Simulate Aadhaar Verification (Basic)
 * @param {Object} params - Verification parameters
 * @param {string} params.aadhaarNumber - The Aadhaar number to verify
 * @param {string} [params.otp] - Optional OTP for verification
 */
export async function simulateAadhaarVerification({ aadhaarNumber, otp = null }) {
  await new Promise(resolve => setTimeout(resolve, randomDelay()));
  
  // Validate format
  if (!aadhaarNumber || !isValidAadhaarFormat(aadhaarNumber)) {
    return {
      success: false,
      simulated: true,
      error: {
        code: "INVALID_FORMAT",
        message: "Invalid Aadhaar format. Must be 12 digits.",
      }
    };
  }
  
  const success = shouldSucceed();
  const verificationId = generateId("AADHAAR_VER");
  
  if (success) {
    const { fullName } = getRandomName();
    const dob = getRandomDOB();
    const gender = Math.random() > 0.5 ? "Male" : "Female";
    
    return {
      success: true,
      simulated: true,
      verification: {
        verificationId,
        maskedAadhaar: maskAadhaar(aadhaarNumber),
        name: fullName,
        dateOfBirth: dob,
        gender,
        address: {
          house: `${Math.floor(Math.random() * 500) + 1}`,
          street: `${Math.floor(Math.random() * 20) + 1}th Cross`,
          locality: "Model Town",
          district: "Mumbai",
          state: "Maharashtra",
          pincode: `${Math.floor(Math.random() * 90000) + 100000}`,
        },
        status: "VERIFIED",
        message: "Aadhaar verification successful",
      }
    };
  } else {
    return {
      success: false,
      simulated: true,
      error: {
        code: "VERIFICATION_FAILED",
        message: "Aadhaar verification failed. Please try again.",
        verificationId,
      }
    };
  }
}

/**
 * Simulate Aadhaar OTP Generation
 */
export async function simulateAadhaarOTPGeneration(aadhaarNumber) {
  await new Promise(resolve => setTimeout(resolve, randomDelay()));
  
  if (!isValidAadhaarFormat(aadhaarNumber)) {
    return {
      success: false,
      simulated: true,
      error: {
        code: "INVALID_FORMAT",
        message: "Invalid Aadhaar format.",
      }
    };
  }
  
  const success = shouldSucceed();
  
  if (success) {
    return {
      success: true,
      simulated: true,
      otp: {
        transactionId: generateId("OTP"),
        maskedMobile: `XXXXXX${Math.floor(Math.random() * 9000) + 1000}`,
        message: "OTP sent successfully (Simulated OTP: 123456)",
        simulatedOTP: "123456", // For testing
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      }
    };
  } else {
    return {
      success: false,
      simulated: true,
      error: {
        code: "OTP_FAILED",
        message: "Failed to send OTP. Please try again.",
      }
    };
  }
}

/**
 * Simulate Aadhaar OTP Verification
 */
export async function simulateAadhaarOTPVerification(transactionId, otp) {
  await new Promise(resolve => setTimeout(resolve, randomDelay()));
  
  // In simulation, accept 123456 as valid OTP
  if (otp === "123456") {
    const { fullName } = getRandomName();
    return {
      success: true,
      simulated: true,
      verification: {
        transactionId,
        name: fullName,
        dateOfBirth: getRandomDOB(),
        gender: Math.random() > 0.5 ? "Male" : "Female",
        mobileVerified: true,
        emailVerified: Math.random() > 0.5,
        status: "VERIFIED",
        message: "Aadhaar eKYC successful",
      }
    };
  } else {
    return {
      success: false,
      simulated: true,
      error: {
        code: "INVALID_OTP",
        message: "Invalid OTP. Please try again.",
      }
    };
  }
}

/**
 * Simulate Bank Account Verification
 * @param {Object} params - Verification parameters
 * @param {string} params.accountNumber - The bank account number
 * @param {string} params.ifscCode - The IFSC code
 * @param {string} [params.accountHolderName] - Optional account holder name
 */
export async function simulateBankVerification({ accountNumber, ifscCode, accountHolderName = null }) {
  await new Promise(resolve => setTimeout(resolve, randomDelay()));
  
  // Validate IFSC format
  if (!ifscCode || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
    return {
      success: false,
      simulated: true,
      error: {
        code: "INVALID_IFSC",
        message: "Invalid IFSC code format.",
      }
    };
  }
  
  const success = shouldSucceed();
  const verificationId = generateId("BANK_VER");
  
  if (success) {
    const { fullName } = getRandomName();
    const bankCode = ifscCode.substring(0, 4);
    
    // Bank name mapping
    const bankNames = {
      'HDFC': 'HDFC Bank',
      'ICIC': 'ICICI Bank',
      'SBIN': 'State Bank of India',
      'AXIS': 'Axis Bank',
      'KKBK': 'Kotak Mahindra Bank',
      'UTIB': 'Axis Bank',
      'PUNB': 'Punjab National Bank',
      'BARB': 'Bank of Baroda',
      'UBIN': 'Union Bank of India',
      'CNRB': 'Canara Bank',
    };
    
    const bankName = bankNames[bankCode] || `${bankCode} Bank`;
    
    return {
      success: true,
      simulated: true,
      verification: {
        verificationId,
        accountNumber: `XXXX${accountNumber.slice(-4)}`,
        accountHolderName: accountHolderName || fullName,
        ifscCode,
        bankName,
        branchName: `${bankName} - Main Branch`,
        accountType: Math.random() > 0.5 ? "Savings" : "Current",
        upiEnabled: true,
        status: "VERIFIED",
        message: "Bank account verification successful",
      }
    };
  } else {
    return {
      success: false,
      simulated: true,
      error: {
        code: "VERIFICATION_FAILED",
        message: "Bank account verification failed. Account details do not match.",
        verificationId,
      }
    };
  }
}

/**
 * Simulate Address Verification (via Aadhaar)
 */
export async function simulateAddressVerification(aadhaarNumber) {
  await new Promise(resolve => setTimeout(resolve, randomDelay()));
  
  const success = shouldSucceed();
  const verificationId = generateId("ADDR_VER");
  
  if (success) {
    return {
      success: true,
      simulated: true,
      verification: {
        verificationId,
        address: {
          house: `${Math.floor(Math.random() * 500) + 1}, Block ${String.fromCharCode(65 + Math.floor(Math.random() * 10))}`,
          street: `${Math.floor(Math.random() * 20) + 1}th Main Road`,
          locality: "Sector " + (Math.floor(Math.random() * 100) + 1),
          city: "Mumbai",
          district: "Mumbai Suburban",
          state: "Maharashtra",
          pincode: `${Math.floor(Math.random() * 400) + 400001}`,
          country: "India",
        },
        status: "VERIFIED",
        message: "Address verification successful",
      }
    };
  } else {
    return {
      success: false,
      simulated: true,
      error: {
        code: "VERIFICATION_FAILED",
        message: "Address verification failed.",
        verificationId,
      }
    };
  }
}

/**
 * Complete KYC verification (PAN + Aadhaar + Bank)
 */
export async function simulateCompleteKYC(kycData) {
  const { panNumber, aadhaarNumber, accountNumber, ifscCode, name } = kycData;
  
  const results = {
    pan: null,
    aadhaar: null,
    bank: null,
    overall: "PENDING",
  };
  
  // Verify PAN
  if (panNumber) {
    results.pan = await simulatePANVerification(panNumber, name);
  }
  
  // Verify Aadhaar
  if (aadhaarNumber) {
    results.aadhaar = await simulateAadhaarVerification(aadhaarNumber);
  }
  
  // Verify Bank Account
  if (accountNumber && ifscCode) {
    results.bank = await simulateBankVerification(accountNumber, ifscCode, name);
  }
  
  // Determine overall status
  const allSuccessful = 
    (results.pan?.success ?? true) && 
    (results.aadhaar?.success ?? true) && 
    (results.bank?.success ?? true);
  
  results.overall = allSuccessful ? "VERIFIED" : "PARTIALLY_VERIFIED";
  results.verificationId = generateId("KYC");
  results.completedAt = new Date().toISOString();
  
  return {
    success: allSuccessful,
    simulated: true,
    kyc: results,
  };
}

/**
 * Get KYC status
 */
export function getKYCStatus(userId) {
  // This would normally check the database
  return {
    success: true,
    simulated: true,
    status: {
      userId,
      panVerified: true,
      aadhaarVerified: true,
      bankVerified: true,
      addressVerified: true,
      overallStatus: "VERIFIED",
      kycLevel: "FULL", // BASIC, INTERMEDIATE, FULL
      lastUpdated: new Date().toISOString(),
    }
  };
}

export const KYCSimulator = {
  verifyPAN: simulatePANVerification,
  verifyAadhaar: simulateAadhaarVerification,
  generateAadhaarOTP: simulateAadhaarOTPGeneration,
  verifyAadhaarOTP: simulateAadhaarOTPVerification,
  verifyBankAccount: simulateBankVerification,
  verifyAddress: simulateAddressVerification,
  completeKYC: simulateCompleteKYC,
  getStatus: getKYCStatus,
};

export default KYCSimulator;
