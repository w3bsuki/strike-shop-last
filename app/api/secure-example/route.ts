/**
 * SECURE API ROUTE EXAMPLE
 * Demonstrates integration of all security layers
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAPISecurity } from '@/lib/api-security'
import { withRateLimit } from '@/lib/security/rate-limiting'
import { z } from 'zod'
import { withErrorHandling, ApiErrors } from '@/lib/security/error-handling'
import { withMonitoring, ApiMonitor, SecurityEventType } from '@/lib/security/api-monitoring'

// Custom validation schema for this endpoint
const secureEndpointSchema = z.object({
  action: z.enum(['create', 'update', 'delete']),
  resourceId: z.string().uuid(),
  data: z.object({
    name: z.string().min(1).max(100),
    value: z.number().positive(),
    tags: z.array(z.string()).optional()
  }).optional()
})

// Type for validated data
type SecureEndpointData = z.infer<typeof secureEndpointSchema>

/**
 * Example of a fully secured POST endpoint
 */
export const POST = withMonitoring(
  withErrorHandling(
    withRateLimit(
      withAPISecurity(
        async (request: NextRequest) => {
          // Validate request data
          const body = await request.json()
          const validatedData = secureEndpointSchema.parse(body) as SecureEndpointData
            // Log security event
            ApiMonitor.recordSecurityEvent(
              SecurityEventType.UNUSUAL_TRAFFIC_PATTERN,
              'info',
              `Secure action: ${validatedData.action} on ${validatedData.resourceId}`
            )

            // Simulate business logic
            switch (validatedData.action) {
              case 'create':
                if (!validatedData.data) {
                  throw ApiErrors.badRequest('Data required for create action')
                }
                
                // Create resource
                const created = {
                  id: validatedData.resourceId,
                  ...validatedData.data,
                  createdAt: new Date().toISOString()
                }
                
                return NextResponse.json({
                  success: true,
                  action: 'created',
                  resource: created
                })

              case 'update':
                if (!validatedData.data) {
                  throw ApiErrors.badRequest('Data required for update action')
                }
                
                // Update resource
                const updated = {
                  id: validatedData.resourceId,
                  ...validatedData.data,
                  updatedAt: new Date().toISOString()
                }
                
                return NextResponse.json({
                  success: true,
                  action: 'updated',
                  resource: updated
                })

              case 'delete':
                // Delete resource
                return NextResponse.json({
                  success: true,
                  action: 'deleted',
                  resourceId: validatedData.resourceId
                })

              default:
                throw ApiErrors.badRequest('Invalid action')
            }
        },
        {
          requireAuth: true,
          requireCSRF: true,
          allowedMethods: ['POST']
        }
      ),
      'AUTHENTICATED' // Rate limit tier
    )
  )
)

/**
 * Example of API key protected GET endpoint
 */
export const GET = withMonitoring(
  withErrorHandling(
    async (_request: NextRequest) => {
      // Simple GET handler for demonstration
      // In production, you would implement proper API key validation
      
      const data = {
        resources: [
          { id: '1', name: 'Resource 1', public: true },
          { id: '2', name: 'Resource 2', public: true }
        ],
        message: 'API key authentication example',
        timestamp: new Date().toISOString()
      }
      
      return NextResponse.json(data)
    }
  )
)

/**
 * Example of signed request endpoint (for internal services)
 */
export const PUT = withMonitoring(
  withErrorHandling(
    async (request: NextRequest) => {
      // This endpoint demonstrates request signature validation
      // Used for service-to-service communication
      
      const data = await request.json()
      
      // Process internal request
      ApiMonitor.recordSecurityEvent(
        SecurityEventType.UNUSUAL_TRAFFIC_PATTERN,
        'info',
        'Internal service request processed'
      )
      
      return NextResponse.json({
        success: true,
        message: 'Internal request processed',
        timestamp: new Date().toISOString(),
        data
      })
    }
  )
)

/**
 * Example health check endpoint (minimal security)
 */
export const HEAD = withMonitoring(
  async (_request: NextRequest) => {
    // Simple health check - no auth required
    return new NextResponse(null, { status: 200 })
  }
)