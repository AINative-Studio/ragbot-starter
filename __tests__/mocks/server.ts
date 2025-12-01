import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Setup MSW server with default handlers
export const server = setupServer(...handlers);

// Enable request interception
export const setupMockServer = () => {
  // Enable API mocking before all tests
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'warn' });
  });

  // Reset any request handlers that are added during tests
  afterEach(() => {
    server.resetHandlers();
  });

  // Clean up after tests are done
  afterAll(() => {
    server.close();
  });
};
