/**
 * Integration Test Suite: Resilience, Error Handling, and Edge Cases
 * Tests 404s, input validation rejections, large 50MB payload limits, concurrency, and error responses.
 */

import { TestSuiteRunner, expect } from '../helpers/assertions.js';
import { startTestServer, TestServerInstance } from '../helpers/test-server.js';

export function createResilienceTestSuite(): TestSuiteRunner {
  const suite = new TestSuiteRunner('Resilience & Edge Cases Integration Tests', 'integration');
  let testServer: TestServerInstance;

  suite.test('Resilience Setup: Boots ephemeral test server', async () => {
    testServer = await startTestServer();
    testServer.resetStore();
    expect(testServer.baseUrl.startsWith('http://127.0.0.1:')).toBe(true);
  });

  suite.test('404 Handling: Unmapped API route returns 404 with JSON error format', async () => {
    const res = await testServer.request('/non-existent-endpoint-98765');
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error).toContain('API Route not found');
  });

  suite.test('404 Handling: Non-existent job ID returns 404 on GET, PATCH, and DELETE', async () => {
    const fakeId = 'job_completely_unknown_999999';

    const getRes = await testServer.request(`/jobs/${fakeId}`);
    expect(getRes.status).toBe(404);
    const getBody = await getRes.json();
    expect(getBody.error).toContain('not found');

    const patchRes = await testServer.request(`/jobs/${fakeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'done' }),
    });
    expect(patchRes.status).toBe(404);

    const deleteRes = await testServer.request(`/jobs/${fakeId}`, {
      method: 'DELETE',
    });
    expect(deleteRes.status).toBe(404);
  });

  suite.test('Validation: Rejects invalid preferences with HTTP 400 Bad Request', async () => {
    // 1. Invalid accuracy
    const res1 = await testServer.request('/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accuracy: 'super_fast_ai_model' }),
    });
    expect(res1.status).toBe(400);
    const body1 = await res1.json();
    expect(body1.error).toContain('Invalid accuracy');

    // 2. Invalid background style
    const res2 = await testServer.request('/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ backgroundStyle: 'hologram_3d' }),
    });
    expect(res2.status).toBe(400);
    const body2 = await res2.json();
    expect(body2.error).toContain('Invalid backgroundStyle');

    // 3. Invalid export format
    const res3 = await testServer.request('/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exportFormat: 'image/gif' }),
    });
    expect(res3.status).toBe(400);
    const body3 = await res3.json();
    expect(body3.error).toContain('Invalid exportFormat');

    // 4. Invalid maxResolution (negative or zero)
    const res4 = await testServer.request('/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ maxResolution: -100 }),
    });
    expect(res4.status).toBe(400);
    const body4 = await res4.json();
    expect(body4.error).toContain('Invalid maxResolution');
  });

  suite.test('Validation: Rejects invalid job creation payloads with HTTP 400', async () => {
    // 1. Job without name
    const res1 = await testServer.request('/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileSize: 1000 }),
    });
    expect(res1.status).toBe(400);
    const body1 = await res1.json();
    expect(body1.error).toContain('"name"');

    // 2. Empty array
    const res2 = await testServer.request('/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([]),
    });
    expect(res2.status).toBe(400);
    const body2 = await res2.json();
    expect(body2.error).toContain('empty');

    // 3. Batch with one item missing name
    const res3 = await testServer.request('/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{ name: 'valid.png' }, { fileSize: 200 }]),
    });
    expect(res3.status).toBe(400);
    const body3 = await res3.json();
    expect(body3.error).toContain('"name"');
  });

  suite.test('Large Payloads: Safely processes high-resolution base64 image strings (5MB payload)', async () => {
    // Construct a ~5MB dummy base64 string payload
    const largeData = 'data:image/png;base64,' + 'A'.repeat(5 * 1024 * 1024);

    const res = await testServer.request('/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'ultra-hd-canvas.png',
        originalUrl: largeData,
        fileSize: 5242880,
      }),
    });
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('ultra-hd-canvas.png');
    expect(body.data.originalUrl.length).toBeGreaterThan(5000000);
  });

  suite.test('Concurrent Traffic: Handles 25 parallel asynchronous requests without race conditions', async () => {
    const tasks = Array.from({ length: 25 }, async (_, i) => {
      if (i % 3 === 0) {
        return testServer.request('/preferences');
      } else if (i % 3 === 1) {
        return testServer.request('/tools/presets');
      } else {
        return testServer.request('/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: `concurrent-job-${i}.png`, fileSize: 10000 * i }),
        });
      }
    });

    const results = await Promise.all(tasks);
    for (const r of results) {
      expect(r.status === 200 || r.status === 201).toBe(true);
    }
  });

  suite.test('Query Sanitization: Handles negative limits and unknown status filters gracefully', async () => {
    // Negative limit should not crash
    const resNeg = await testServer.request('/jobs?limit=-10');
    expect(resNeg.status).toBe(200);
    const bodyNeg = await resNeg.json();
    expect(Array.isArray(bodyNeg.data)).toBe(true);

    // Non-existent status should return empty array with 200 OK
    const resUnknown = await testServer.request('/jobs?status=non_existent_status_value');
    expect(resUnknown.status).toBe(200);
    const bodyUnknown = await resUnknown.json();
    expect(bodyUnknown.data.length).toBe(0);
  });

  suite.test('Resilience Teardown: Shuts down server', async () => {
    await testServer.close();
  });

  return suite;
}
