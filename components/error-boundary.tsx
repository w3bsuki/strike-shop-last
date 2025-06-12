"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  showDetails: boolean
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service
    console.error("ErrorBoundary caught an error:", error, errorInfo)
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
    
    // Send to error tracking service
    if (typeof window !== "undefined" && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      })
    }
    
    this.setState({ errorInfo })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    })
  }

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }))
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} retry={this.handleReset} />
      }

      // Default error UI
      return (
        <div className="flex min-h-[400px] items-center justify-center p-4">
          <div className="w-full max-w-md space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Something went wrong</h3>
              <p className="text-sm text-muted-foreground">
                We encountered an error while rendering this component
              </p>
            </div>
            
            <div className="flex justify-center gap-2">
              <Button
                onClick={this.handleReset}
                variant="default"
                size="sm"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              
              {process.env.NODE_ENV === "development" && (
                <Button
                  onClick={this.toggleDetails}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  {this.state.showDetails ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Hide Details
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Show Details
                    </>
                  )}
                </Button>
              )}
            </div>
            
            {process.env.NODE_ENV === "development" && this.state.showDetails && (
              <div className="mt-4 space-y-2 text-left">
                <div className="rounded-lg bg-muted p-4">
                  <p className="mb-2 text-sm font-semibold">Error Message:</p>
                  <p className="text-xs font-mono text-destructive">
                    {this.state.error.message}
                  </p>
                </div>
                
                {this.state.error.stack && (
                  <details className="rounded-lg bg-muted p-4">
                    <summary className="cursor-pointer text-sm font-semibold">
                      Stack Trace
                    </summary>
                    <pre className="mt-2 overflow-auto text-xs">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
                
                {this.state.errorInfo?.componentStack && (
                  <details className="rounded-lg bg-muted p-4">
                    <summary className="cursor-pointer text-sm font-semibold">
                      Component Stack
                    </summary>
                    <pre className="mt-2 overflow-auto text-xs">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook for using error boundary programmatically
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return setError
}

// Async error boundary for handling async errors
export function AsyncErrorBoundary({ 
  children,
  fallback,
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const [hasError, setHasError] = React.useState(false)

  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason)
      setHasError(true)
    }

    window.addEventListener("unhandledrejection", handleUnhandledRejection)

    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
    }
  }, [])

  if (hasError) {
    return (
      <>
        {fallback || (
          <div className="flex min-h-[200px] items-center justify-center">
            <div className="text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
              <p className="mt-2 text-sm text-muted-foreground">
                An async error occurred
              </p>
              <Button
                onClick={() => setHasError(false)}
                variant="outline"
                size="sm"
                className="mt-4"
              >
                Retry
              </Button>
            </div>
          </div>
        )}
      </>
    )
  }

  return <>{children}</>
}

// Suspense error boundary for handling loading errors
export function SuspenseErrorBoundary({
  children,
  fallback,
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  return (
    <ErrorBoundary
      fallback={({ error, retry }) => (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
            <p className="text-sm text-muted-foreground">
              Loading failed. Please try again.
            </p>
            <Button onClick={retry} variant="outline" size="sm" className="mt-4">
              Retry
            </Button>
          </div>
        </div>
      )}
    >
      <React.Suspense
        fallback={
          fallback || (
            <div className="flex min-h-[200px] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
            </div>
          )
        }
      >
        {children}
      </React.Suspense>
    </ErrorBoundary>
  )
}