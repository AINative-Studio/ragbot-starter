// Polyfill fetch globals for Jest environment
// This file must be loaded BEFORE any other setup files
const nodeFetch = require('node-fetch')
const { TextEncoder, TextDecoder } = require('util')

// Polyfill all fetch-related globals
global.fetch = nodeFetch.default
global.Headers = nodeFetch.Headers
global.Request = nodeFetch.Request
global.Response = nodeFetch.Response
global.FormData = nodeFetch.FormData
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Also set on globalThis for compatibility
globalThis.fetch = nodeFetch.default
globalThis.Headers = nodeFetch.Headers
globalThis.Request = nodeFetch.Request
globalThis.Response = nodeFetch.Response
globalThis.FormData = nodeFetch.FormData
globalThis.TextEncoder = TextEncoder
globalThis.TextDecoder = TextDecoder
