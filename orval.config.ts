import { defineConfig } from 'orval';

// */* content-type을 application/json으로 변환하는 transformer
const transformContentType = (inputSchema: Record<string, unknown>) => {
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
  return inputSchema;
};

export default defineConfig({
  // Client API (Axios 기반) - React Query hooks 없이 함수만 생성
  clientApi: {
    input: {
      target: './docs/swagger.json',
      override: {
        transformer: transformContentType,
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
      target: './docs/swagger.json',
      override: {
        transformer: transformContentType,
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
