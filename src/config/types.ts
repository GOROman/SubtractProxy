import { z } from 'zod';

export const ConfigSchema = z.object({
  port: z.number().default(8080),
  host: z.string().default('127.0.0.1'),
  ignoreRobotsTxt: z.boolean().default(false),
  timeout: z.number().default(30000),
  llm: z.object({
    enabled: z.boolean().default(true),
    type: z.enum(['ollama', 'openrouter']).default('ollama'),
    model: z.string().default('gemma'),
    apiKey: z.string().optional(),
    baseUrl: z.string().optional(),
  }),
  logging: z.object({
    level: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    file: z.string().optional(),
  }),
  filtering: z
    .object({
      enabled: z.boolean().default(false),
      configPath: z.string().optional(),
    })
    .optional()
    .default({
      enabled: false,
    }),
});

export type Config = z.infer<typeof ConfigSchema>;
