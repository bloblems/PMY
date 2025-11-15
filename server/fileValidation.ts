import { type Request } from "express";
import { fileTypeFromBuffer } from "file-type";

/**
 * File upload validation for OWASP compliance
 * Protects against malicious file uploads, resource exhaustion, and content smuggling
 * iOS/Capacitor compatible - validates files from both browser and native plugins
 */

// Allowed MIME types for each upload category
const ALLOWED_MIME_TYPES = {
  audio: [
    "audio/mpeg",       // MP3
    "audio/mp4",        // M4A, AAC
    "audio/wav",        // WAV
    "audio/webm",       // WebM
    "audio/ogg",        // OGG
    "audio/x-caf",      // iOS CAF format
    "audio/aac",        // AAC
    "audio/x-m4a",      // M4A alternative MIME
  ],
  photo: [
    "image/jpeg",       // JPEG/JPG
    "image/png",        // PNG
    "image/webp",       // WebP
  ],
} as const;

// File size limits (in bytes)
const MAX_FILE_SIZES = {
  audio: 10 * 1024 * 1024,  // 10MB for audio
  photo: 5 * 1024 * 1024,   // 5MB for photos
} as const;

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  mimeType?: string;
  size?: number;
}

/**
 * Validate uploaded file based on type category
 * Performs MIME type sniffing to prevent content smuggling attacks
 */
export async function validateUploadedFile(
  file: Express.Multer.File | undefined,
  category: "audio" | "photo"
): Promise<FileValidationResult> {
  // Check if file exists
  if (!file) {
    return { valid: false, error: "No file provided" };
  }

  // Check file size
  const maxSize = MAX_FILE_SIZES[category];
  if (file.size > maxSize) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const maxMB = (maxSize / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `File size (${sizeMB}MB) exceeds maximum allowed size (${maxMB}MB)`,
    };
  }

  // Check minimum file size (prevent empty or near-empty files)
  if (file.size < 100) {
    return {
      valid: false,
      error: "File is too small to be valid",
    };
  }

  // Perform MIME type sniffing on file buffer to detect actual file type
  // This prevents attackers from uploading malicious files with spoofed extensions
  let detectedType: Awaited<ReturnType<typeof fileTypeFromBuffer>>;
  try {
    detectedType = await fileTypeFromBuffer(file.buffer);
  } catch (error) {
    return {
      valid: false,
      error: "Unable to determine file type",
    };
  }

  // If we can't detect the type, it might be a valid iOS/native format
  // Allow it if the declared MIME type is in our allowlist
  if (!detectedType) {
    const declaredMime = file.mimetype;
    const allowedTypes = ALLOWED_MIME_TYPES[category];
    if (allowedTypes.includes(declaredMime as any)) {
      // Trust the declared MIME type for iOS-native formats
      return {
        valid: true,
        mimeType: declaredMime,
        size: file.size,
      };
    }
    return {
      valid: false,
      error: "File type could not be detected or is not supported",
    };
  }

  // Verify the detected MIME type is in the allowed list
  const allowedTypes = ALLOWED_MIME_TYPES[category];
  const mimeType = detectedType.mime;
  if (!allowedTypes.includes(mimeType as (typeof allowedTypes)[number])) {
    return {
      valid: false,
      error: `File type ${mimeType} is not allowed. Allowed types: ${allowedTypes.join(", ")}`,
    };
  }

  // File passed all validation checks
  return {
    valid: true,
    mimeType: detectedType.mime,
    size: file.size,
  };
}

/**
 * Middleware factory for file upload validation
 * Use this to protect file upload endpoints
 */
export function validateFileUpload(category: "audio" | "photo") {
  return async (req: Request, res: any, next: any) => {
    const validation = await validateUploadedFile(req.file, category);
    
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Attach validation metadata to request for logging
    (req as any).fileValidation = {
      mimeType: validation.mimeType,
      size: validation.size,
    };

    next();
  };
}

/**
 * Validate Base64 signature data URL size
 * Used for digital signature uploads
 */
export function validateSignatureSize(
  dataURL: string,
  maxBytes: number = 2 * 1024 * 1024
): FileValidationResult {
  if (!dataURL) {
    return { valid: true };
  }

  try {
    // Remove data URL prefix (e.g., "data:image/png;base64,")
    const base64Data = dataURL.split(",")[1] || dataURL;

    // Calculate decoded byte size: (Base64 length * 3) / 4, minus padding
    const padding = (base64Data.match(/=/g) || []).length;
    const decodedSize = Math.floor((base64Data.length * 3) / 4) - padding;

    if (decodedSize > maxBytes) {
      const sizeMB = (decodedSize / (1024 * 1024)).toFixed(2);
      const maxMB = (maxBytes / (1024 * 1024)).toFixed(2);
      return {
        valid: false,
        error: `Signature size (${sizeMB}MB) exceeds maximum allowed size (${maxMB}MB)`,
      };
    }

    return { valid: true, size: decodedSize };
  } catch (error) {
    return { valid: false, error: "Invalid signature format" };
  }
}
