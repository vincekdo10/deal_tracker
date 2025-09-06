import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/services/database';
import { validateEnvironment } from '@/lib/environment';
import { withApiSecurity } from '@/lib/secure-api';

export const GET = withApiSecurity(async (request: NextRequest) => {

  const startTime = Date.now();
  
  try {
    // Check environment configuration
    const envValidation = validateEnvironment();
    
    // Check database connection
    let dbStatus = 'healthy';
    let dbError = null;
    
    try {
      await db.getAllUsers();
    } catch (error) {
      dbStatus = 'unhealthy';
      dbError = error instanceof Error ? error.message : 'Unknown database error';
    }
    
    // Check API response time
    const responseTime = Date.now() - startTime;
    
    // Check memory usage
    const memoryUsage = process.memoryUsage();
    
    const health = {
      status: dbStatus === 'healthy' && envValidation.isValid ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: `${responseTime}ms`,
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        isValid: envValidation.isValid,
        errors: envValidation.errors
      },
      database: {
        status: dbStatus,
        error: dbError
      },
      memory: {
        used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
      },
      version: process.env.npm_package_version || '1.0.0'
    };
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: `${Date.now() - startTime}ms`
    }, { status: 503 });
  }

});
