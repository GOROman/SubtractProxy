import { z } from 'zod';

// プロンプトテンプレートのスキーマ定義
export const PromptTemplateSchema = z.object({
  system: z.string(),
  user: z.string().optional(),
  variables: z.record(z.string()).optional(),
});

export type PromptTemplate = z.infer<typeof PromptTemplateSchema>;

export const ConfigSchema = z.object({
  port: z.number().default(8080),
  host: z.string().default('127.0.0.1'),
  ignoreRobotsTxt: z.boolean().default(false),
  timeout: z.number().default(30000),
  userAgent: z.object({
    enabled: z.boolean().default(false),
    value: z.string().optional(),
    rotate: z.boolean().default(false),
    presets: z.array(z.string()).optional(),
  }).optional().default({
    enabled: false,
    rotate: false,
  }),
  llm: z.object({
    enabled: z.boolean().default(true),
    type: z.enum(['ollama', 'openrouter']).default('ollama'),
    model: z.string().default('gemma'),
    apiKey: z.string().optional(),
    baseUrl: z.string().optional(),
    prompt: PromptTemplateSchema.optional().default({
      system: 'あなたはWebコンテンツフィルターです。以下のコンテンツを分析し、不要な情報を削除または要約してください。',
      variables: {}
    }),
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
