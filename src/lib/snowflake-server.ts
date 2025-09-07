// This file should only be imported on the server side
import * as snowflake from 'snowflake-sdk';

// Ensure environment variables are loaded
if (typeof window === 'undefined') {
  require('dotenv').config({ path: '.env.local' });
}

interface SnowflakeConfig {
  account: string;
  username?: string;
  password?: string;
  warehouse: string;
  database: string;
  schema: string;
  role: string;
}

class SnowflakeService {
  private connection: snowflake.Connection | null = null;
  private config: SnowflakeConfig;
  private initialized: boolean = false;

  constructor() {
    const isProduction = process.env.NODE_ENV === 'production';
    
    this.config = {
      account: process.env.SNOWFLAKE_ACCOUNT || 'placeholder-account',
      warehouse: process.env.SNOWFLAKE_WAREHOUSE || 'DEAL_TRACKER_WH',
      database: process.env.SNOWFLAKE_DATABASE || 'DEAL_TRACKER',
      schema: process.env.SNOWFLAKE_SCHEMA || 'CONTAINER_APP',
      role: process.env.SNOWFLAKE_ROLE || 'TRANSFORMER'
    };

    if (!isProduction) {
      // Local development - use username/password
      this.config.username = process.env.SNOWFLAKE_USERNAME || 'placeholder-username';
      this.config.password = process.env.SNOWFLAKE_PASSWORD || 'placeholder-password';
    }
    // Production uses OAuth (no username/password needed)
  }

  private async getConnection(): Promise<snowflake.Connection> {
    if (this.connection) {
      return this.connection;
    }

    return new Promise((resolve, reject) => {
      const connectionConfig = process.env.NODE_ENV === 'production' 
        ? {
            account: this.config.account,
            authenticator: 'OAUTH',
            warehouse: this.config.warehouse,
            database: this.config.database,
            schema: this.config.schema,
            role: this.config.role
          }
        : {
            account: this.config.account,
            username: this.config.username,
            password: this.config.password,
            warehouse: this.config.warehouse,
            database: this.config.database,
            schema: this.config.schema,
            role: this.config.role
          };

      this.connection = snowflake.createConnection(connectionConfig);
      
      this.connection.connect((err, conn) => {
        if (err) {
          console.error('Snowflake connection failed:', err);
          reject(err);
        } else {
          resolve(conn);
        }
      });
    });
  }

  async executeQuery<T = any>(sqlText: string, binds: any[] = []): Promise<T[]> {
    const connection = await this.getConnection();

    return new Promise((resolve, reject) => {
      connection.execute({
        sqlText,
        binds,
        complete: (err, stmt, rows) => {
          if (err) {
            console.error('Query failed:', err);
            reject(err);
          } else {
            resolve(rows as T[]);
          }
        }
      });
    });
  }

  async executeUpdate(sqlText: string, binds: any[] = []): Promise<number> {
    const connection = await this.getConnection();

    return new Promise((resolve, reject) => {
      connection.execute({
        sqlText,
        binds,
        complete: (err, stmt) => {
          if (err) {
            console.error('Update failed:', err);
            reject(err);
          } else {
            resolve(stmt.getNumUpdatedRows() || 0);
          }
        }
      });
    });
  }

  async checkTableExists(tableName: string): Promise<boolean> {
    try {
      const results = await this.executeQuery<any>(
        `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES 
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
        [this.config.schema.toUpperCase(), tableName.toUpperCase()]
      );
      return results[0]?.COUNT > 0;
    } catch (error) {
      console.error(`Error checking if table ${tableName} exists:`, error);
      return false;
    }
  }

  async createTables(): Promise<void> {
    
    const tables = [
      {
        name: 'users',
        sql: `CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(255) PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          first_name VARCHAR(255) NOT NULL,
          last_name VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL,
          "AUTH_TYPE" VARCHAR(50) NOT NULL,
          password_hash VARCHAR(255),
          is_active BOOLEAN DEFAULT TRUE,
          is_temporary_password BOOLEAN DEFAULT FALSE,
          password_changed_at TIMESTAMP_NTZ,
          created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
          updated_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
        )`
      },
      {
        name: 'teams',
        sql: `CREATE TABLE IF NOT EXISTS teams (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description VARCHAR(2000),
          created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
        )`
      },
      {
        name: 'user_teams',
        sql: `CREATE TABLE IF NOT EXISTS user_teams (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          team_id VARCHAR(255) NOT NULL,
          created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (team_id) REFERENCES teams(id)
        )`
      },
      {
        name: 'deals',
        sql: `CREATE TABLE IF NOT EXISTS deals (
          id VARCHAR(255) PRIMARY KEY,
          account_name VARCHAR(255) NOT NULL,
          stakeholders VARCHAR(1000),
          renewal_date DATE,
          arr NUMBER(15,2),
          tam NUMBER(15,2),
          deal_priority VARCHAR(50),
          deal_stage VARCHAR(50),
          products_in_use VARCHAR(1000),
          growth_opportunities VARCHAR(1000),
          company_domain VARCHAR(255),
          eb VARCHAR(255),
          team_id VARCHAR(255) NOT NULL,
          created_by VARCHAR(255) NOT NULL,
          created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
          updated_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
          FOREIGN KEY (team_id) REFERENCES teams(id),
          FOREIGN KEY (created_by) REFERENCES users(id)
        )`
      },
      {
        name: 'tasks',
        sql: `CREATE TABLE IF NOT EXISTS tasks (
          id VARCHAR(255) PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description VARCHAR(2000),
          status VARCHAR(50) NOT NULL,
          priority VARCHAR(50),
          due_date DATE,
          blocked_reason VARCHAR(1000),
          blocked_date TIMESTAMP_NTZ,
          expected_unblock_date TIMESTAMP_NTZ,
          position INTEGER DEFAULT 0,
          deal_id VARCHAR(255) NOT NULL,
          assignee_id VARCHAR(255),
          created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
          updated_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
          FOREIGN KEY (deal_id) REFERENCES deals(id),
          FOREIGN KEY (assignee_id) REFERENCES users(id)
        )`
      },
      {
        name: 'subtasks',
        sql: `CREATE TABLE IF NOT EXISTS subtasks (
          id VARCHAR(255) PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          status VARCHAR(50) NOT NULL,
          blocked_reason VARCHAR(1000),
          position INTEGER DEFAULT 0,
          task_id VARCHAR(255) NOT NULL,
          created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
          updated_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
          FOREIGN KEY (task_id) REFERENCES tasks(id)
        )`
      },
      {
        name: 'activity_logs',
        sql: `CREATE TABLE IF NOT EXISTS activity_logs (
          id VARCHAR(255) PRIMARY KEY,
          action VARCHAR(255) NOT NULL,
          entity_type VARCHAR(50) NOT NULL,
          entity_id VARCHAR(255) NOT NULL,
          user_id VARCHAR(255) NOT NULL,
          details TEXT,
          created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
          FOREIGN KEY (user_id) REFERENCES users(id)
        )`
      }
    ];

    for (const table of tables) {
      try {
        await this.executeUpdate(table.sql);
      } catch (error) {
        console.error(`Error creating table ${table.name}:`, error);
        throw error;
      }
    }
  }

  async addPasswordColumns(): Promise<void> {
    try {
      // Add new password-related columns to existing users table
      const alterQueries = [
        'ALTER TABLE users ADD COLUMN IF NOT EXISTS is_temporary_password BOOLEAN DEFAULT FALSE',
        'ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP_NTZ'
      ];

      for (const query of alterQueries) {
        try {
          await this.executeUpdate(query);
        } catch (error) {
          // Column may already exist, skipping
        }
      }
    } catch (error) {
      console.error('Error adding password columns:', error);
      throw error;
    }
  }

  async addCompanyDomainColumn(): Promise<void> {
    try {
      // Add company_domain column to deals table if it doesn't exist
      const query = 'ALTER TABLE deals ADD COLUMN IF NOT EXISTS company_domain VARCHAR(255)';
      
      try {
        await this.executeUpdate(query);
      } catch (error) {
        // Column may already exist, skip
      }

      // Add eb column to deals table if it doesn't exist
      const ebQuery = 'ALTER TABLE deals ADD COLUMN IF NOT EXISTS eb VARCHAR(255)';
      
      try {
        await this.executeUpdate(ebQuery);
      } catch (error) {
        // Column may already exist, skip
      }
    } catch (error) {
      console.error('Error adding company_domain column:', error);
      throw error;
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    try {
      // Check if tables exist, create if they don't
      const usersExists = await this.checkTableExists('users');
      if (!usersExists) {
        await this.createTables();
      } else {
        await this.addPasswordColumns();
        await this.addCompanyDomainColumn();
      }
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing Snowflake database:', error);
      throw error;
    }
  }
}

export const snowflakeService = new SnowflakeService();
