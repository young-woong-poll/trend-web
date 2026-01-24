import { defineConfig } from 'orval';

export default defineConfig({
  trendApi: {
    input: {
      target: './docs/swagger.json',
      override: {
        transformer: (inputSchema) => {
          // */* content-type을 application/json으로 변환
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
        },
      },
    },
    output: {
      mode: 'tags-split',
      target: './src/generated/api',
      schemas: './src/generated/models',
      client: 'react-query',
      httpClient: 'axios',
      mock: true,
      override: {
        mutator: {
          path: './src/lib/axios-mutator.ts',
          name: 'customInstance',
        },
        query: {
          useQuery: true,
          useInfinite: true,
          useMutation: true,
          version: 5,
        },
      },
      prettier: true,
      tsconfig: './tsconfig.json',
    },
  },
});
