"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Shield, AlertTriangle, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { getKYCStatus } from "@/actions/kyc";

/**
 * KYC Prompt Component
 * Shows a prompt to complete KYC if not verified
 * Can be used as a gate or just a warning
 * 
 * Props:
 * - isGate: If true, blocks content until KYC is complete
 * - children: Content to show when KYC is verified (only used when isGate=true)
 * - onKYCStatusChange: Callback when KYC status is loaded
 */
export default function KYCPrompt({ isGate = false, children, onKYCStatusChange }) {
  const [kycData, setKycData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKYCStatus();
  }, []);

  const loadKYCStatus = async () => {
    try {
      const result = await getKYCStatus();
      if (result.success) {
        setKycData(result.data);
        onKYCStatusChange?.(result.data);
      }
    } catch (error) {
      console.error("Failed to load KYC status:", error);
    } finally {
      setLoading(false);
    }
  };

  const isPANVerified = kycData?.records?.some(
    (r) => r.type === "PAN" && r.status === "VERIFIED"
  );
  const isAadhaarVerified = kycData?.records?.some(
    (r) => r.type === "AADHAAR" && r.status === "VERIFIED"
  );
  const progress = ((isPANVerified ? 1 : 0) + (isAadhaarVerified ? 1 : 0)) * 50;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If KYC is verified, show children (for gate mode) or nothing (for warning mode)
  if (kycData?.kycVerified) {
    return isGate ? children : null;
  }

  // KYC not verified - show prompt
  return (
    <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30">
            <Shield className="h-8 w-8 text-amber-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              Complete Your KYC
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </CardTitle>
            <CardDescription className="text-amber-800 dark:text-amber-200">
              {isGate 
                ? "You need to complete KYC verification to access this feature"
                : "Complete KYC to unlock all features of the platform"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>KYC Progress</span>
            <span>{progress}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            {isPANVerified ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
            )}
            <span className={isPANVerified ? "text-green-600" : ""}>PAN Verification</span>
          </div>
          <div className="flex items-center gap-2">
            {isAadhaarVerified ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
            )}
            <span className={isAadhaarVerified ? "text-green-600" : ""}>Aadhaar Verification</span>
          </div>
        </div>

        <Link href="/kyc">
          <Button className="w-full gap-2">
            Complete KYC Now
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>

        <p className="text-xs text-muted-foreground text-center">
          KYC verification is required as per RBI guidelines for financial services
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Hook to get KYC status
 */
export function useKYCStatus() {
  const [kycData, setKycData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    loadKYCStatus();
  }, []);

  const loadKYCStatus = async () => {
    try {
      const result = await getKYCStatus();
      if (result.success) {
        setKycData(result.data);
        setIsVerified(result.data.kycVerified);
      }
    } catch (error) {
      console.error("Failed to load KYC status:", error);
    } finally {
      setLoading(false);
    }
  };

  return { kycData, loading, isVerified, refresh: loadKYCStatus };
}
