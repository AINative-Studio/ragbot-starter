// Fetch polyfills loaded via jest.polyfills.js (setupFiles)
import '@testing-library/jest-dom'
import { setupMockServer } from './__tests__/mocks/server'

// Mock environment variables
process.env.META_API_KEY = 'test-meta-api-key'
process.env.META_BASE_URL = 'https://api.llama.com/compat/v1'
process.env.META_MODEL = 'Llama-4-Maverick-17B-128E-Instruct-FP8'
process.env.ZERODB_API_URL = 'https://api.ainative.studio'
process.env.ZERODB_PROJECT_ID = 'test-project-id'
process.env.ZERODB_EMAIL = 'test@example.com'
process.env.ZERODB_PASSWORD = 'test-password'
process.env.ZERODB_API_KEY = 'test-api-key'

// Setup MSW server for API mocking
setupMockServer()

// Mock localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString()
    }),
    removeItem: jest.fn((key) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    }),
  }
})()

global.localStorage = localStorageMock

// Mock crypto.randomUUID
global.crypto = {
  randomUUID: () => 'test-uuid-' + Math.random().toString(36).substring(7),
}

// Reset mocks before each test
beforeEach(() => {
  localStorageMock.clear()
})
