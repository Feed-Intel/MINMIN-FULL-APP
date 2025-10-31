import { registerAs } from '@nestjs/config';

type AppConfig = {
  name: string;
  environment: string;
  port: number;
  globalPrefix: string;
};

export const appConfig = registerAs<AppConfig>('app', () => ({
  name: process.env.APP_NAME ?? 'MinMin Node Backend',
  environment: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  globalPrefix: process.env.GLOBAL_PREFIX ?? 'api',
}));
