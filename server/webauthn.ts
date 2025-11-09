import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  type VerifiedRegistrationResponse,
  type PublicKeyCredentialCreationOptionsJSON,
} from '@simplewebauthn/server';

// In-memory challenge storage (expires after 5 minutes)
const challengeStore = new Map<string, { challenge: string; expiresAt: number }>();

// Cleanup expired challenges every minute
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, data] of Array.from(challengeStore.entries())) {
    if (data.expiresAt < now) {
      challengeStore.delete(sessionId);
    }
  }
}, 60000);

// RP (Relying Party) configuration
const getRP = (origin: string) => {
  const url = new URL(origin);
  return {
    name: "PMY Consent",
    id: url.hostname,
  };
};

export async function generateChallenge(sessionId: string, userName: string, origin: string): Promise<PublicKeyCredentialCreationOptionsJSON> {
  const rp = getRP(origin);
  
  // Generate registration options with a cryptographic challenge
  const options = await generateRegistrationOptions({
    rpName: rp.name,
    rpID: rp.id,
    userName: userName,
    userDisplayName: userName,
    attestationType: 'none',
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
      requireResidentKey: false,
    },
    timeout: 60000,
  });

  // Store challenge with 5-minute expiration
  challengeStore.set(sessionId, {
    challenge: options.challenge,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });

  return options;
}

export async function verifyAttestation(
  sessionId: string,
  attestationResponse: any,
  origin: string
): Promise<VerifiedRegistrationResponse> {
  // Retrieve stored challenge
  const stored = challengeStore.get(sessionId);
  if (!stored) {
    throw new Error('Challenge expired or not found');
  }

  if (stored.expiresAt < Date.now()) {
    challengeStore.delete(sessionId);
    throw new Error('Challenge expired');
  }

  const rp = getRP(origin);
  
  // Verify the attestation response
  const verification = await verifyRegistrationResponse({
    response: attestationResponse,
    expectedChallenge: stored.challenge,
    expectedOrigin: origin,
    expectedRPID: rp.id,
    requireUserVerification: true,
  });

  // Delete used challenge (one-time use)
  challengeStore.delete(sessionId);

  return verification;
}

export function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}
