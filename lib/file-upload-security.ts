/**
 * File Upload Security
 * Comprehensive file upload validation and security
 */

import { createHash } from 'crypto';
import { SecurityEventType, SecuritySeverity, logSecurityEvent } from './security-monitoring';

// File upload configuration
export const FILE_UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES_PER_REQUEST: 5,
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'application/pdf',
  ],
  ALLOWED_EXTENSIONS: [
    '.jpg',
    '.jpeg',
    '.png',
    '.webp',
    '.gif',
    '.svg',
    '.pdf',
  ],
  BLOCKED_EXTENSIONS: [
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.vbe',
    '.js', '.jse', '.ws', '.wsf', '.wsc', '.wsh', '.ps1', '.ps1xml',
    '.ps2', '.ps2xml', '.psc1', '.psc2', '.msh', '.msh1', '.msh2',
    '.mshxml', '.msh1xml', '.msh2xml', '.scf', '.lnk', '.inf',
    '.reg', '.dll', '.so', '.dylib', '.app', '.deb', '.rpm',
    '.dmg', '.pkg', '.msi', '.jar', '.war', '.ear', '.class',
    '.jsp', '.jspx', '.asp', '.aspx', '.asa', '.asax', '.ascx',
    '.ashx', '.asmx', '.cer', '.swf', '.xap', '.sql', '.db',
    '.php', '.php3', '.php4', '.php5', '.phtml', '.cgi', '.pl',
    '.py', '.pyc', '.pyo', '.rb', '.sh', '.bash', '.zsh',
    '.fish', '.ksh', '.csh', '.tcsh', '.htm', '.html', '.shtml',
    '.hta', '.htaccess', '.htpasswd', '.conf', '.config', '.ini',
    '.log', '.bak', '.backup', '.old', '.temp', '.tmp', '.cache',
    '.git', '.svn', '.env', '.DS_Store', '.idea', '.vscode',
  ],
  MAGIC_NUMBERS: {
    'image/jpeg': [Buffer.from([0xFF, 0xD8, 0xFF])],
    'image/png': [Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])],
    'image/gif': [Buffer.from('GIF87a'), Buffer.from('GIF89a')],
    'image/webp': [Buffer.from('RIFF'), Buffer.from('WEBP')],
    'application/pdf': [Buffer.from('%PDF-')],
  },
  SCAN_FOR_MALWARE: true,
  QUARANTINE_PATH: '/tmp/quarantine',
};

// File validation result
export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fileInfo?: {
    name: string;
    size: number;
    mimeType: string;
    extension: string;
    hash: string;
  };
}

/**
 * Validate file upload
 */
export async function validateFileUpload(
  file: File | Buffer,
  filename: string,
  mimeType: string,
  options?: Partial<typeof FILE_UPLOAD_CONFIG>
): Promise<FileValidationResult> {
  const config = { ...FILE_UPLOAD_CONFIG, ...options };
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Get file buffer
    const buffer = file instanceof File 
      ? Buffer.from(await file.arrayBuffer())
      : file;

    // Check file size
    if (buffer.length > config.MAX_FILE_SIZE) {
      errors.push(`File size (${buffer.length} bytes) exceeds maximum allowed size (${config.MAX_FILE_SIZE} bytes)`);
    }

    // Validate filename
    const filenameValidation = validateFilename(filename);
    if (!filenameValidation.isValid) {
      errors.push(...filenameValidation.errors);
    }

    // Check extension
    const extension = getFileExtension(filename).toLowerCase();
    if (!config.ALLOWED_EXTENSIONS.includes(extension)) {
      errors.push(`File extension '${extension}' is not allowed`);
    }

    if (config.BLOCKED_EXTENSIONS.includes(extension)) {
      errors.push(`File extension '${extension}' is explicitly blocked for security reasons`);
    }

    // Validate MIME type
    if (!config.ALLOWED_MIME_TYPES.includes(mimeType)) {
      errors.push(`MIME type '${mimeType}' is not allowed`);
    }

    // Verify magic numbers (file signature)
    const magicNumberValid = verifyMagicNumber(buffer, mimeType, config.MAGIC_NUMBERS);
    if (!magicNumberValid) {
      errors.push('File content does not match declared MIME type (possible file type spoofing)');
    }

    // Scan for embedded threats
    const threatScan = scanForThreats(buffer, filename);
    if (threatScan.threats.length > 0) {
      errors.push(...threatScan.threats);
    }
    if (threatScan.warnings.length > 0) {
      warnings.push(...threatScan.warnings);
    }

    // Calculate file hash
    const hash = createHash('sha256').update(buffer).digest('hex');

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      fileInfo: {
        name: sanitizeFilename(filename),
        size: buffer.length,
        mimeType,
        extension,
        hash,
      },
    };
  } catch (error) {
    errors.push(`File validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      isValid: false,
      errors,
      warnings,
    };
  }
}

/**
 * Validate filename
 */
function validateFilename(filename: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for null bytes
  if (filename.includes('\0')) {
    errors.push('Filename contains null bytes');
  }

  // Check for directory traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    errors.push('Filename contains directory traversal characters');
  }

  // Check for special characters that could cause issues
  const dangerousChars = ['<', '>', ':', '"', '|', '?', '*', '\n', '\r', '\t'];
  for (const char of dangerousChars) {
    if (filename.includes(char)) {
      errors.push(`Filename contains dangerous character: ${char}`);
    }
  }

  // Check filename length
  if (filename.length > 255) {
    errors.push('Filename is too long (max 255 characters)');
  }

  // Check for hidden files
  if (filename.startsWith('.')) {
    errors.push('Hidden files are not allowed');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  // Remove directory components
  let sanitized = filename.split(/[\/\\]/).pop() || '';
  
  // Replace dangerous characters
  sanitized = sanitized.replace(/[<>:"|?*\x00-\x1f]/g, '_');
  
  // Remove leading dots
  sanitized = sanitized.replace(/^\.+/, '');
  
  // Limit length
  if (sanitized.length > 200) {
    const extension = getFileExtension(sanitized);
    const base = sanitized.substring(0, 200 - extension.length);
    sanitized = base + extension;
  }
  
  // If filename is empty or only contains invalid characters
  if (!sanitized || sanitized === '_') {
    sanitized = `file_${Date.now()}`;
  }
  
  return sanitized;
}

/**
 * Get file extension
 */
function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot === -1 ? '' : filename.substring(lastDot).toLowerCase();
}

/**
 * Verify file magic number
 */
function verifyMagicNumber(
  buffer: Buffer,
  mimeType: string,
  magicNumbers: Record<string, Buffer[]>
): boolean {
  const signatures = magicNumbers[mimeType];
  if (!signatures) {
    // No signature to verify
    return true;
  }

  for (const signature of signatures) {
    if (buffer.length >= signature.length) {
      const fileStart = buffer.slice(0, signature.length);
      if (fileStart.equals(signature)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Scan file for embedded threats
 */
function scanForThreats(
  buffer: Buffer,
  filename: string
): { threats: string[]; warnings: string[] } {
  const threats: string[] = [];
  const warnings: string[] = [];
  const content = buffer.toString('utf8', 0, Math.min(buffer.length, 1024 * 100)); // First 100KB

  // Check for embedded scripts
  const scriptPatterns = [
    /<script[\s\S]*?<\/script>/gi,
    /<iframe[\s\S]*?>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /on\w+\s*=/gi,
  ];

  for (const pattern of scriptPatterns) {
    if (pattern.test(content)) {
      threats.push('File contains potentially malicious script content');
      break;
    }
  }

  // Check for PHP code
  if (/<\?php/i.test(content) || /<\?=/i.test(content)) {
    threats.push('File contains PHP code');
  }

  // Check for shell scripts
  if (/^#!\//.test(content)) {
    threats.push('File appears to be an executable script');
  }

  // Check for suspicious base64 content
  const base64Pattern = /[A-Za-z0-9+/]{100,}={0,2}/g;
  const base64Matches = content.match(base64Pattern);
  if (base64Matches && base64Matches.length > 5) {
    warnings.push('File contains suspicious amount of base64 encoded content');
  }

  // Check for executable headers in images
  if (filename.match(/\.(jpg|jpeg|png|gif|bmp)$/i)) {
    if (buffer.indexOf(Buffer.from('MZ')) === 0) {
      threats.push('Image file has executable header');
    }
  }

  return { threats, warnings };
}

/**
 * Express/Next.js middleware for file upload security
 */
export function fileUploadSecurityMiddleware(
  options?: Partial<typeof FILE_UPLOAD_CONFIG>
) {
  return async (req: any, res: any, next: any) => {
    if (!req.files && !req.file) {
      return next();
    }

    const files = req.files || [req.file];
    const validationResults: FileValidationResult[] = [];

    for (const file of files) {
      const result = await validateFileUpload(
        file.buffer,
        file.originalname,
        file.mimetype,
        options
      );

      validationResults.push(result);

      if (!result.isValid) {
        // Log security event
        logSecurityEvent(
          SecurityEventType.FILE_UPLOAD_VIOLATION,
          SecuritySeverity.HIGH,
          req,
          {
            filename: file.originalname,
            errors: result.errors,
            size: file.size,
            mimeType: file.mimetype,
          },
          true
        );

        return res.status(400).json({
          error: 'File upload validation failed',
          details: result.errors,
        });
      }
    }

    // Attach validation results to request
    req.fileValidations = validationResults;
    next();
  };
}

/**
 * Generate secure filename for storage
 */
export function generateSecureFilename(
  originalFilename: string,
  prefix?: string
): string {
  const extension = getFileExtension(originalFilename);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const hash = createHash('sha256')
    .update(`${originalFilename}-${timestamp}-${random}`)
    .digest('hex')
    .substring(0, 16);
  
  const secureFilename = `${prefix || 'upload'}_${timestamp}_${hash}${extension}`;
  return sanitizeFilename(secureFilename);
}