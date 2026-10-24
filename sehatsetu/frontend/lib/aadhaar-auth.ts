/**
 * Aadhaar / ABHA Authentication Service Abstraction
 *
 * Implements compliant gateway abstraction for UIDAI / ABDM identity integration.
 * In accordance with Indian health privacy laws:
 * - Does NOT collect, transmit, or store 12-digit Aadhaar numbers, OTPs, or biometrics.
 * - Does NOT transmit identity data to third-party AI or analytics services.
 * - Clearly signals whether an authorized government gateway is configured in the environment.
 */

import { apiRequest } from './api';

export interface AadhaarAuthStatus {
  is_configured: boolean;
  provider_name: string;
  message: string;
}

export async function getAadhaarAuthStatus(): Promise<AadhaarAuthStatus> {
  try {
    return await apiRequest<AadhaarAuthStatus>('/auth/aadhaar-status');
  } catch {
    return {
      is_configured: false,
      provider_name: 'UIDAI / ABDM Sandbox Integration',
      message:
        'Aadhaar authentication integration is not configured in this demo deployment. In compliance with data privacy regulations, full Aadhaar numbers, OTPs, or biometric credentials are not collected without an official government gateway. Please use standard email/password authentication or DEMO MODE.'
    };
  }
}export type AadhaarConfigStatus = AadhaarAuthStatus;
export const getAadhaarConfigStatus = getAadhaarAuthStatus;
