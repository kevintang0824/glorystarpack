import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const inquiryHandler = require('../api/inquiry.js');
const originalFetch = globalThis.fetch;
const originalResendApiKey = process.env.RESEND_API_KEY;

function validPayload(overrides = {}) {
  return {
    name: 'Test Buyer',
    email: 'buyer@example.com',
    country: 'Test Country',
    product: 'Test Packaging',
    quantity: '1000',
    startedAt: String(Date.now() - 5_000),
    ...overrides
  };
}

async function invoke({ method = 'POST', body = {}, headers = {} } = {}) {
  let responseBody = '';
  const responseHeaders = new Map();
  const response = {
    statusCode: 200,
    setHeader(name, value) {
      responseHeaders.set(String(name).toLowerCase(), String(value));
    },
    end(value = '') {
      responseBody += String(value);
    }
  };

  await inquiryHandler({
    method,
    body,
    headers: {
      origin: 'https://www.glorystarpack.com',
      'content-type': 'application/json',
      ...headers
    }
  }, response);

  return {
    status: response.statusCode,
    headers: responseHeaders,
    json: JSON.parse(responseBody)
  };
}

async function expectError(input, expected) {
  const result = await invoke(input);
  assert.equal(result.status, expected.status);
  assert.equal(result.json.ok, false);
  assert.equal(result.json.errorType, expected.errorType);
  assert.equal(result.json.errorCode, expected.errorCode);
  assert.equal(result.headers.get('cache-control'), 'no-store, max-age=0');
}

try {
  delete process.env.RESEND_API_KEY;

  await expectError({ method: 'GET' }, {
    status: 405,
    errorType: 'request',
    errorCode: 'method_not_allowed'
  });
  await expectError({ headers: { 'content-length': '16385' } }, {
    status: 413,
    errorType: 'request',
    errorCode: 'payload_too_large'
  });
  await expectError({ headers: { origin: 'https://example.com' } }, {
    status: 403,
    errorType: 'request',
    errorCode: 'origin_not_allowed'
  });
  await expectError({ body: '{bad json' }, {
    status: 400,
    errorType: 'request',
    errorCode: 'invalid_json'
  });
  await expectError({ body: {} }, {
    status: 400,
    errorType: 'validation',
    errorCode: 'required_fields'
  });
  await expectError({ body: validPayload({ email: 'invalid' }) }, {
    status: 400,
    errorType: 'validation',
    errorCode: 'invalid_email'
  });
  await expectError({ body: validPayload({ startedAt: String(Date.now()) }) }, {
    status: 429,
    errorType: 'rate_limit',
    errorCode: 'submitted_too_fast'
  });
  await expectError({ body: validPayload() }, {
    status: 503,
    errorType: 'service',
    errorCode: 'email_service_unavailable'
  });

  process.env.RESEND_API_KEY = 'test-only-key';
  globalThis.fetch = async () => ({ ok: false });
  await expectError({ body: validPayload() }, {
    status: 502,
    errorType: 'delivery',
    errorCode: 'provider_rejected'
  });

  globalThis.fetch = async () => {
    throw new Error('simulated provider network failure');
  };
  await expectError({ body: validPayload() }, {
    status: 502,
    errorType: 'delivery',
    errorCode: 'provider_request_failed'
  });

  globalThis.fetch = async () => ({ ok: true });
  const accepted = await invoke({ body: validPayload() });
  assert.equal(accepted.status, 200);
  assert.deepEqual(accepted.json, { ok: true, accepted: true });

  const honeypot = await invoke({ body: validPayload({ website: 'bot.example' }) });
  assert.equal(honeypot.status, 200);
  assert.deepEqual(honeypot.json, { ok: true, accepted: false });

  console.log('Inquiry API checks passed for validation, service, provider and accepted-response outcomes.');
} finally {
  globalThis.fetch = originalFetch;
  if (originalResendApiKey === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = originalResendApiKey;
}
