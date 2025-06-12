import { toast } from "@/hooks/use-toast"

// Error types for categorization
export enum ErrorType {
  NETWORK = "NETWORK",
  VALIDATION = "VALIDATION",
  AUTHENTICATION = "AUTHENTICATION",
  AUTHORIZATION = "AUTHORIZATION",
  NOT_FOUND = "NOT_FOUND",
  SERVER = "SERVER",
  UNKNOWN = "UNKNOWN",
}

// Custom error class with additional context
export class AppError extends Error {
  public readonly type: ErrorType
  public readonly code?: string
  public readonly statusCode?: number
  public readonly details?: any
  public readonly isOperational: boolean

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    isOperational: boolean = true,
    statusCode?: number,
    code?: string,
    details?: any
  ) {
    super(message)
    this.name = this.constructor.name
    this.type = type
    this.code = code
    this.statusCode = statusCode
    this.details = details
    this.isOperational = isOperational

    Error.captureStackTrace(this, this.constructor)
  }
}

// Error handler configuration
interface ErrorHandlerConfig {
  showToast?: boolean
  logToConsole?: boolean
  logToService?: boolean
  throwError?: boolean
}

// Global error handler
export class ErrorHandler {
  private static instance: ErrorHandler
  private errorLog: AppError[] = []
  private readonly maxLogSize = 100

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  // Handle different types of errors
  handle(
    error: Error | AppError | unknown,
    config: ErrorHandlerConfig = {
      showToast: true,
      logToConsole: true,
      logToService: true,
      throwError: false,
    }
  ): void {
    const appError = this.normalizeError(error)
    
    // Add to error log
    this.addToLog(appError)
    
    // Log to console in development
    if (config.logToConsole && process.env.NODE_ENV === "development") {
      console.error("Error handled:", appError)
    }
    
    // Show toast notification
    if (config.showToast) {
      this.showErrorToast(appError)
    }
    
    // Log to external service
    if (config.logToService) {
      this.logToService(appError)
    }
    
    // Re-throw if needed
    if (config.throwError) {
      throw appError
    }
  }

  // Normalize any error to AppError
  private normalizeError(error: unknown): AppError {
    if (error instanceof AppError) {
      return error
    }
    
    if (error instanceof Error) {
      // Handle specific error types
      if (error.name === "NetworkError" || error.message.includes("fetch")) {
        return new AppError(
          "Network connection error. Please check your internet connection.",
          ErrorType.NETWORK,
          true
        )
      }
      
      if (error.name === "ValidationError") {
        return new AppError(
          error.message || "Validation failed",
          ErrorType.VALIDATION,
          true,
          400
        )
      }
      
      // Default Error handling
      return new AppError(error.message, ErrorType.UNKNOWN, true)
    }
    
    // Handle non-Error objects
    if (typeof error === "string") {
      return new AppError(error, ErrorType.UNKNOWN, true)
    }
    
    if (typeof error === "object" && error !== null) {
      const err = error as any
      return new AppError(
        err.message || "An unknown error occurred",
        ErrorType.UNKNOWN,
        true,
        err.statusCode,
        err.code,
        err
      )
    }
    
    return new AppError("An unknown error occurred", ErrorType.UNKNOWN, true)
  }

  // Show error toast based on error type
  private showErrorToast(error: AppError): void {
    const toastConfig = this.getToastConfig(error)
    toast(toastConfig)
  }

  // Get toast configuration based on error type
  private getToastConfig(error: AppError) {
    switch (error.type) {
      case ErrorType.NETWORK:
        return {
          title: "Connection Error",
          description: error.message,
          variant: "destructive" as const,
        }
      
      case ErrorType.AUTHENTICATION:
        return {
          title: "Authentication Failed",
          description: error.message,
          variant: "destructive" as const,
        }
      
      case ErrorType.AUTHORIZATION:
        return {
          title: "Access Denied",
          description: error.message,
          variant: "destructive" as const,
        }
      
      case ErrorType.VALIDATION:
        return {
          title: "Validation Error",
          description: error.message,
          variant: "destructive" as const,
        }
      
      case ErrorType.NOT_FOUND:
        return {
          title: "Not Found",
          description: error.message,
          variant: "destructive" as const,
        }
      
      case ErrorType.SERVER:
        return {
          title: "Server Error",
          description: "Something went wrong on our end. Please try again later.",
          variant: "destructive" as const,
        }
      
      default:
        return {
          title: "Error",
          description: error.message || "An unexpected error occurred",
          variant: "destructive" as const,
        }
    }
  }

  // Log to external service (Sentry, LogRocket, etc.)
  private logToService(error: AppError): void {
    if (typeof window !== "undefined" && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        tags: {
          errorType: error.type,
          errorCode: error.code,
        },
        extra: {
          details: error.details,
          isOperational: error.isOperational,
        },
      })
    }
  }

  // Add error to local log
  private addToLog(error: AppError): void {
    this.errorLog.unshift(error)
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.pop()
    }
  }

  // Get error log
  getErrorLog(): AppError[] {
    return [...this.errorLog]
  }

  // Clear error log
  clearErrorLog(): void {
    this.errorLog = []
  }
}

// Singleton instance
export const errorHandler = ErrorHandler.getInstance()

// Helper functions for common error scenarios
export const handleApiError = (error: unknown): void => {
  if (error instanceof Response) {
    const statusCode = error.status
    let errorType = ErrorType.UNKNOWN
    let message = "An error occurred"
    
    switch (statusCode) {
      case 400:
        errorType = ErrorType.VALIDATION
        message = "Invalid request data"
        break
      case 401:
        errorType = ErrorType.AUTHENTICATION
        message = "Please log in to continue"
        break
      case 403:
        errorType = ErrorType.AUTHORIZATION
        message = "You don't have permission to perform this action"
        break
      case 404:
        errorType = ErrorType.NOT_FOUND
        message = "The requested resource was not found"
        break
      case 500:
      case 502:
      case 503:
        errorType = ErrorType.SERVER
        message = "Server error. Please try again later"
        break
    }
    
    errorHandler.handle(
      new AppError(message, errorType, true, statusCode)
    )
  } else {
    errorHandler.handle(error)
  }
}

// React hook for error handling
export const useErrorHandler = () => {
  const handleError = (error: unknown, config?: ErrorHandlerConfig) => {
    errorHandler.handle(error, config)
  }
  
  return { handleError }
}

// Async error wrapper
export const handleAsync = async <T>(
  fn: () => Promise<T>,
  config?: ErrorHandlerConfig
): Promise<T | null> => {
  try {
    return await fn()
  } catch (error) {
    errorHandler.handle(error, config)
    return null
  }
}

// Form validation error handler
export const handleValidationErrors = (errors: Record<string, string[]>) => {
  const errorMessages = Object.entries(errors)
    .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
    .join("\n")
  
  errorHandler.handle(
    new AppError(errorMessages, ErrorType.VALIDATION, true, 400),
    { showToast: true, logToService: false }
  )
}