import { Pool, PoolConfig } from 'pg';

interface DatabaseConfig extends PoolConfig {
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

export class Database {
  private pool: Pool | null = null;
  private config: DatabaseConfig;

  constructor(config?: DatabaseConfig) {
    this.config = config || {
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      database: process.env.DATABASE_NAME || 'strata',
      user: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };
  }

  async connect(): Promise<void> {
    if (this.pool) {
      return;
    }

    this.pool = new Pool(this.config);

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });

    try {
      await this.pool.query('SELECT NOW()');
      console.log('Database connected successfully');
    } catch (error) {
      console.error('Failed to connect to database:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      console.log('Database disconnected');
    }
  }

  getPool(): Pool {
    if (!this.pool) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.pool;
  }

  async query<T = any>(text: string, params?: any[]): Promise<{ rows: T[] }> {
    const client = await this.getPool().connect();
    try {
      const result = await client.query(text, params);
      return { rows: result.rows as T[] };
    } finally {
      client.release();
    }
  }

  async transaction<T>(fn: (client: any) => Promise<T>): Promise<T> {
    const client = await this.getPool().connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async setCurrentUser(userId: string): Promise<void> {
    await this.query(`SELECT set_current_user('${userId}'::uuid)`);
  }
}

export const db = new Database();
