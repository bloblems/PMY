/**
 * Rate Limiting Middleware
 * 
 * Protects PMY from brute force attacks, spam, and abuse.
 * Different limits for different endpoint types based on sensitivity.
 */

import rateLimit from "express-rate-limit";

/**
 * Strict rate limiting for authentication endpoints
 * Prevents brute force password attacks
 * 
 * Limit: 5 requests per 15 minutes per IP
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    error: "Too many authentication attempts. Please try again in 15 minutes.",
  },
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  // Use default IP-based rate limiting (handles IPv6 correctly)
});

/**
 * Moderate rate limiting for file uploads
 * Prevents storage abuse and DOS attacks
 * 
 * Limit: 10 requests per hour per IP
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  message: {
    error: "Too many file uploads. Please try again in an hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiting for state-changing operations
 * Protects amendments, notifications, and other mutations
 * 
 * Limit: 30 requests per 15 minutes per IP
 */
export const stateChangeRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per window
  message: {
    error: "Too many requests. Please slow down and try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * General API rate limiting
 * Prevents general abuse while allowing normal usage
 * 
 * Limit: 100 requests per 15 minutes per IP
 */
export const generalApiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    error: "Too many API requests. Please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Very strict rate limiting for email operations
 * Prevents email spam and abuse
 * 
 * Limit: 3 requests per hour per IP
 */
export const emailRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 email operations per hour
  message: {
    error: "Too many email operations. Please try again in an hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
