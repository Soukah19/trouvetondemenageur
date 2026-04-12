/**
 * Email Verification Configuration Utility
 * 
 * This utility provides a centralized way to check if email verification is enabled.
 * The setting is controlled by the VITE_ENABLE_EMAIL_VERIFICATION environment variable.
 * 
 * Valid values:
 * - 'true' or 'True' = Email verification is required
 * - 'false' or any other value = Email verification is skipped (accounts auto-activate)
 */

/**
 * Check if email verification is enabled
 * @returns boolean - true if email verification is required
 */
export function isEmailVerificationEnabled(): boolean {
  const envValue = import.meta.env.VITE_ENABLE_EMAIL_VERIFICATION;
  return envValue === 'true' || envValue === 'True';
}

/**
 * Get the email verification setting as a string for display
 * @returns string - 'Activée' or 'Désactivée'
 */
export function getEmailVerificationStatus(): string {
  return isEmailVerificationEnabled() ? 'Activée' : 'Désactivée';
}
