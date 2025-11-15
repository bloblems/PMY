/**
 * Security Audit Logging for OWASP Compliance
 * Tracks authentication events, consent operations, file uploads, and security events
 * Essential for incident response, compliance, and forensic analysis
 */

import { type Request } from "express";

export interface SecurityEvent {
  timestamp: string;
  eventType: string;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  status: "success" | "failure" | "suspicious";
  details?: Record<string, any>;
  severity: "low" | "medium" | "high" | "critical";
}

/**
 * Log a security event to console with structured format
 * In production, this should be sent to a security information and event management (SIEM) system
 */
function logSecurityEvent(event: SecurityEvent): void {
  const logEntry = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  // Use console.warn for suspicious events, console.error for failures
  if (event.status === "failure" || event.status === "suspicious") {
    console.warn("[SECURITY]", JSON.stringify(logEntry));
  } else {
    console.log("[SECURITY]", JSON.stringify(logEntry));
  }

  // TODO: In production, send to SIEM system (e.g., Datadog, Splunk, ELK Stack)
  // await siem.log(logEntry);
}

/**
 * Extract common request metadata for logging
 */
function getRequestMetadata(req: Request) {
  return {
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.headers["user-agent"],
  };
}

/**
 * Log authentication events (login, logout, signup, failures)
 */
export function logAuthEvent(
  req: Request,
  action: "login" | "logout" | "signup" | "login_failure" | "logout_failure" | "signup_failure",
  userId?: string,
  userEmail?: string,
  details?: Record<string, any>
): void {
  const status: SecurityEvent["status"] =
    action.includes("failure") ? "failure" : "success";

  const severity: SecurityEvent["severity"] =
    action.includes("failure") ? "medium" : "low";

  logSecurityEvent({
    timestamp: new Date().toISOString(),
    eventType: "authentication",
    action,
    userId,
    userEmail,
    status,
    severity,
    details,
    ...getRequestMetadata(req),
  });
}

/**
 * Log consent document operations (create, delete, share)
 */
export function logConsentEvent(
  req: Request,
  action: "create_contract" | "create_recording" | "create_photo" | "create_biometric" | "delete" | "share" | "create_failure",
  documentType: "contract" | "recording" | "photo" | "biometric",
  documentId: string | undefined,
  userId: string,
  details?: Record<string, any>
): void {
  const status: SecurityEvent["status"] = 
    action === "create_failure" ? "failure" : "success";
  
  const severity: SecurityEvent["severity"] = 
    action === "delete" ? "medium" : 
    action === "create_failure" ? "medium" : "low";

  logSecurityEvent({
    timestamp: new Date().toISOString(),
    eventType: "consent_operation",
    action,
    resource: documentId ? `${documentType}/${documentId}` : documentType,
    userId,
    status,
    severity,
    details,
    ...getRequestMetadata(req),
  });
}

/**
 * Log file upload events
 */
export function logFileUpload(
  req: Request,
  fileType: "audio" | "photo",
  fileName: string,
  fileSize: number,
  mimeType: string,
  userId: string,
  status: "success" | "failure",
  errorReason?: string
): void {
  logSecurityEvent({
    timestamp: new Date().toISOString(),
    eventType: "file_upload",
    action: "upload",
    resource: fileName,
    userId,
    status,
    severity: status === "failure" ? "medium" : "low",
    details: {
      fileType,
      fileSize,
      mimeType,
      errorReason,
    },
    ...getRequestMetadata(req),
  });
}

/**
 * Log suspicious activity
 */
export function logSuspiciousActivity(
  req: Request,
  reason: string,
  userId?: string,
  details?: Record<string, any>
): void {
  logSecurityEvent({
    timestamp: new Date().toISOString(),
    eventType: "suspicious_activity",
    userId,
    status: "suspicious",
    severity: "high",
    details: {
      reason,
      ...details,
    },
    ...getRequestMetadata(req),
  });
}

/**
 * Log rate limit violations
 */
export function logRateLimitViolation(
  req: Request,
  endpoint: string,
  userId?: string
): void {
  logSecurityEvent({
    timestamp: new Date().toISOString(),
    eventType: "rate_limit_violation",
    action: "exceeded_limit",
    resource: endpoint,
    userId,
    status: "suspicious",
    severity: "medium",
    ...getRequestMetadata(req),
  });
}

/**
 * Log CSRF validation failures
 */
export function logCsrfFailure(
  req: Request,
  userId?: string
): void {
  logSecurityEvent({
    timestamp: new Date().toISOString(),
    eventType: "csrf_validation_failure",
    action: "invalid_token",
    userId,
    status: "failure",
    severity: "high",
    details: {
      path: req.path,
      method: req.method,
    },
    ...getRequestMetadata(req),
  });
}
