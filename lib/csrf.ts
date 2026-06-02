// S1: CSRF token generation and validation.

const CSRF_SECRET = process.env.CSRF_SECRET || 'budgetai-csrf-dev-key';

/**
 * Generate a CSRF token using crypto.
 * In production, this should use a proper secret.
 */
export async function generateCSRFToken(sessionId: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${sessionId}:${CSRF_SECRET}`);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Validate a CSRF token against a session ID.
 */
export async function validateCSRFToken(
  token: string,
  sessionId: string
): Promise<boolean> {
  const expected = await generateCSRFToken(sessionId);
  return token === expected;
}
