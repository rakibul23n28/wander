import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  jwtSecret: process.env.JWT_SECRET ?? 'development-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  ownerEmail: process.env.OWNER_EMAIL ?? 'owner@example.com',
  ownerPassword: process.env.OWNER_PASSWORD ?? 'supersecret123',
  ownerName: process.env.OWNER_NAME ?? 'Blog Owner',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173').split(',').map((origin) => origin.trim()).filter(Boolean),
  publicApiUrl: process.env.PUBLIC_API_URL ?? 'http://localhost:3000',
  trustProxy: Number(process.env.TRUST_PROXY ?? 1),
  viewSaltSecret: process.env.VIEW_SALT_SECRET ?? 'development-view-salt',
  storageDriver: process.env.STORAGE_DRIVER ?? 'supabase',
  supabaseUrl: process.env.SUPABASE_URL ?? 'https://example.supabase.co',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'demo-key',
  supabaseStorageBucket: process.env.SUPABASE_STORAGE_BUCKET ?? 'blog-media',
  swaggerEnabled: String(process.env.SWAGGER_ENABLED ?? 'true').toLowerCase() === 'true',
  seedOnStart: String(process.env.SEED_ON_START ?? 'false').toLowerCase() === 'true',
}));
