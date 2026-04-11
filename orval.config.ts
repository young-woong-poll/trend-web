import { defineConfig } from 'orval';

// */* content-type을 application/json으로 변환 + Admin 스키마 제거 transformer
const transformSchema = (inputSchema: Record<string, unknown>) => {
  const transformResponses = (responses: Record<string, unknown>) => {
    for (const statusCode in responses) {
      const response = responses[statusCode] as {
        content?: { '*/*'?: unknown; 'application/json'?: unknown };
      };
      if (response?.content?.['*/*']) {
        response.content['application/json'] = response.content['*/*'];
        delete response.content['*/*'];
      }
    }
  };

  if (inputSchema.paths) {
    for (const path in inputSchema.paths) {
      const pathItem = inputSchema.paths[path] as Record<string, unknown>;
      for (const method in pathItem) {
        const operation = pathItem[method] as { responses?: Record<string, unknown> };
        if (operation?.responses) {
          transformResponses(operation.responses);
        }
      }
    }
  }

  // Admin 관련 스키마 제거
  const schemas = (inputSchema.components as Record<string, unknown>)?.schemas as
    | Record<string, unknown>
    | undefined;
  if (schemas) {
    for (const key of Object.keys(schemas)) {
      if (/^Admin|Admin/.test(key)) {
        delete schemas[key];
      }
    }
  }

  return inputSchema;
};

export default defineConfig({
  // Client API (Axios 기반) - React Query hooks 없이 함수만 생성
  // Admin 태그는 hotpick-admin 레포에서 관리
  clientApi: {
    input: {
      target: './swagger.json',
      override: {
        transformer: transformSchema,
      },
      filters: {
        mode: 'exclude',
        tags: [/^Admin/],
      },
    },
    output: {
      mode: 'tags-split',
      target: './src/generated/api/client',
      schemas: './src/generated/models',
      client: 'axios-functions',
      clean: true,
      override: {
        mutator: {
          path: './src/lib/axios-mutator.ts',
          name: 'customInstance',
        },
      },
      prettier: true,
      tsconfig: './tsconfig.json',
    },
  },

  // Server API (Next.js fetch 기반) - ISR 캐싱 지원
  serverApi: {
    input: {
      target: './swagger.json',
      override: {
        transformer: transformSchema,
      },
      filters: {
        mode: 'exclude',
        tags: [/^Admin/],
      },
    },
    output: {
      mode: 'tags-split',
      target: './src/generated/api/server',
      client: 'fetch',
      clean: true,
      override: {
        mutator: {
          path: './src/lib/server-fetch-mutator.ts',
          name: 'serverFetchInstance',
        },
      },
      prettier: true,
      tsconfig: './tsconfig.json',
    },
  },
});
