export const config = {
  database: {
    // Placeholder for Snowflake credentials
    account: process.env.SNOWFLAKE_ACCOUNT || 'PLACEHOLDER_ACCOUNT',
    username: process.env.SNOWFLAKE_USERNAME || 'PLACEHOLDER_USERNAME', 
    password: process.env.SNOWFLAKE_PASSWORD || 'PLACEHOLDER_PASSWORD',
    warehouse: process.env.SNOWFLAKE_WAREHOUSE || 'PLACEHOLDER_WAREHOUSE',
    database: process.env.SNOWFLAKE_DATABASE || 'DEAL_TRACKER',
    schema: process.env.SNOWFLAKE_SCHEMA || 'CONTAINER_APP',
    role: process.env.SNOWFLAKE_ROLE || 'TRANSFORMER'
  },
  app: {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-please-change-in-production',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  initialAdmin: {
    email: process.env.INITIAL_ADMIN_EMAIL || 'vincent.do@dbtlabs.com',
    password: process.env.INITIAL_ADMIN_PASSWORD || 'TempPass123!'
  }
};

export const REQUIRED_TABLES = [
  'users',
  'teams', 
  'user_teams',
  'deals',
  'tasks',
  'subtasks',
  'activity_logs'
];

export function validateEnvironment(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (config.app.nodeEnv === 'production') {
    if (config.app.jwtSecret === 'dev-secret-please-change-in-production') {
      errors.push('JWT_SECRET must be set to a secure value in production');
    }
    
    if (config.database.account === 'PLACEHOLDER_ACCOUNT') {
      errors.push('SNOWFLAKE_ACCOUNT must be set in production');
    }
    
    if (config.database.username === 'PLACEHOLDER_USERNAME') {
      errors.push('SNOWFLAKE_USERNAME must be set in production');
    }
    
    if (config.database.password === 'PLACEHOLDER_PASSWORD') {
      errors.push('SNOWFLAKE_PASSWORD must be set in production');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
