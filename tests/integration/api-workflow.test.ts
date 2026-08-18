/**
 * Integration Test Suite: End-to-End API Workflow
 * Executes complete lifecycle across live Express server endpoints with zero account/login dependencies.
 */

import { TestSuiteRunner, expect } from '../helpers/assertions.js';
import { startTestServer, TestServerInstance } from '../helpers/test-server.js';
import { JobRecord } from '../../server/types.js';

export function createApiWorkflowTestSuite(): TestSuiteRunner {
  const suite = new TestSuiteRunner('API End-to-End Workflow Integration Tests', 'integration');
  let testServer: TestServerInstance;

  suite.test('Workflow Setup: Boots ephemeral test server and resets store', async () => {
    testServer = await startTestServer();
    testServer.resetStore();
    expect(testServer.baseUrl.startsWith('http://127.0.0.1:')).toBe(true);
  });

  suite.test('Step 1: System Health Check via GET /api/health', async () => {
    const res = await testServer.request('/health');
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('ok');
    expect(body.data.service).toBe('background-remover-api');
    expect(typeof body.data.uptimeSeconds).toBe('number');
    expect(typeof body.data.memoryUsage.rssMb).toBe('number');
  });

  suite.test('Step 2: Fetch Default Preferences via GET /api/preferences', async () => {
    const res = await testServer.request('/preferences');
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.accuracy).toBe('medium');
    expect(body.data.backgroundStyle).toBe('transparent');
    expect(body.data.gradientPreset).toBe('morning_mist');
  });

  suite.test('Step 3: Update Preferences via PUT /api/preferences', async () => {
    const payload = {
      backgroundStyle: 'gradient',
      gradientPreset: 'aurora_blue',
      shadow: 'neon',
      exportFormat: 'image/webp',
      maxResolution: 2048,
    };

    const res = await testServer.request('/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.backgroundStyle).toBe('gradient');
    expect(body.data.gradientPreset).toBe('aurora_blue');
    expect(body.data.shadow).toBe('neon');
    expect(body.data.exportFormat).toBe('image/webp');
  });

  suite.test('Step 4: Verify Updated Preferences Persisted via GET /api/preferences', async () => {
    const res = await testServer.request('/preferences');
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.backgroundStyle).toBe('gradient');
    expect(body.data.gradientPreset).toBe('aurora_blue');
    expect(body.data.exportFormat).toBe('image/webp');
  });

  suite.test('Step 5: Fetch Backdrop Presets Catalog via GET /api/tools/presets', async () => {
    const res = await testServer.request('/tools/presets');
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.solidStudio)).toBe(true);
    expect(body.data.solidStudio.length).toBe(8);
    expect(Array.isArray(body.data.gradients)).toBe(true);
    expect(body.data.gradients.length).toBe(6);
    expect(Array.isArray(body.data.blurFilters)).toBe(true);
    expect(Array.isArray(body.data.aspectRatios)).toBe(true);
    expect(Array.isArray(body.data.shadowPresets)).toBe(true);
  });

  suite.test('Step 6: Update Preferences with custom_image Background Style via PUT /api/preferences', async () => {
    const customPayload = {
      backgroundStyle: 'custom_image',
      shadow: 'studio',
      exportFormat: 'image/png',
    };

    const res = await testServer.request('/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customPayload),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.backgroundStyle).toBe('custom_image');
    expect(body.data.shadow).toBe('studio');
  });

  let createdBatch: JobRecord[] = [];

  suite.test('Step 7: Enqueue Batch of 3 Processing Jobs via POST /api/jobs', async () => {
    const batchPayload = [
      {
        name: 'batch-product-watch.jpg',
        fileSize: 1200000,
        fileType: 'image/jpeg',
        settingsSnapshot: { backgroundStyle: 'gradient', gradientPreset: 'aurora_blue' },
      },
      {
        name: 'batch-portrait-exec.png',
        fileSize: 2400000,
        fileType: 'image/png',
        settingsSnapshot: { backgroundStyle: 'blur', shadow: 'soft' },
      },
      {
        name: 'batch-sneaker-lifestyle.webp',
        fileSize: 950000,
        fileType: 'image/webp',
        settingsSnapshot: { backgroundStyle: 'custom_image', shadow: 'studio' },
      },
    ];

    const res = await testServer.request('/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batchPayload),
    });
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBe(3);

    createdBatch = body.data;
    expect(createdBatch[0].status).toBe('queued');
    expect(createdBatch[1].status).toBe('queued');
    expect(createdBatch[2].status).toBe('queued');
  });

  suite.test('Step 8: Transition Job 1: queued -> processing -> done', async () => {
    const job1Id = createdBatch[0].id;

    // 1. Update to processing
    const progRes = await testServer.request(`/jobs/${job1Id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'processing', progress: 50 }),
    });
    const progBody = await progRes.json();
    expect(progRes.status).toBe(200);
    expect(progBody.data.status).toBe('processing');
    expect(progBody.data.progress).toBe(50);

    // 2. Update to done
    const doneRes = await testServer.request(`/jobs/${job1Id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'done',
        progress: 100,
        resultUrl: 'data:image/jpeg;base64,mockResultWatch',
        processingTimeMs: 1350,
      }),
    });
    const doneBody = await doneRes.json();
    expect(doneRes.status).toBe(200);
    expect(doneBody.data.status).toBe('done');
    expect(doneBody.data.progress).toBe(100);
    expect(doneBody.data.resultUrl).toBe('data:image/jpeg;base64,mockResultWatch');
    expect(typeof doneBody.data.completedAt).toBe('number');
  });

  suite.test('Step 9: Transition Job 2: queued -> processing -> error', async () => {
    const job2Id = createdBatch[1].id;

    const errorRes = await testServer.request(`/jobs/${job2Id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'error',
        errorMessage: 'ONNX runtime inference failure: Out of memory buffer',
      }),
    });
    const errorBody = await errorRes.json();
    expect(errorRes.status).toBe(200);
    expect(errorBody.data.status).toBe('error');
    expect(errorBody.data.errorMessage).toBe('ONNX runtime inference failure: Out of memory buffer');
  });

  suite.test('Step 10: Transition Job 3: queued -> done directly', async () => {
    const job3Id = createdBatch[2].id;

    const doneRes = await testServer.request(`/jobs/${job3Id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'done',
        progress: 100,
        resultUrl: 'data:image/webp;base64,mockResultSneaker',
        processingTimeMs: 980,
      }),
    });
    const doneBody = await doneRes.json();
    expect(doneRes.status).toBe(200);
    expect(doneBody.data.status).toBe('done');
  });

  suite.test('Step 11: Query Filtered Job Lists (done vs error) via GET /api/jobs', async () => {
    const doneRes = await testServer.request('/jobs?status=done');
    const doneBody = await doneRes.json();
    expect(doneRes.status).toBe(200);
    expect(doneBody.data.every((j: JobRecord) => j.status === 'done')).toBe(true);

    const errorRes = await testServer.request('/jobs?status=error');
    const errorBody = await errorRes.json();
    expect(errorRes.status).toBe(200);
    expect(errorBody.data.some((j: JobRecord) => j.id === createdBatch[1].id)).toBe(true);
  });

  suite.test('Step 12: Delete Single Job Record via DELETE /api/jobs/:id', async () => {
    const jobToDelete = createdBatch[0].id;
    const deleteRes = await testServer.request(`/jobs/${jobToDelete}`, { method: 'DELETE' });
    const deleteBody = await deleteRes.json();

    expect(deleteRes.status).toBe(200);
    expect(deleteBody.success).toBe(true);

    // Confirm job is gone
    const verifyRes = await testServer.request(`/jobs/${jobToDelete}`);
    expect(verifyRes.status).toBe(404);
  });

  suite.test('Step 13: Clear All Jobs via DELETE /api/jobs and verify empty state', async () => {
    const clearRes = await testServer.request('/jobs', { method: 'DELETE' });
    const clearBody = await clearRes.json();

    expect(clearRes.status).toBe(200);
    expect(typeof clearBody.count).toBe('number');

    const emptyRes = await testServer.request('/jobs');
    const emptyBody = await emptyRes.json();
    expect(emptyBody.data.length).toBe(0);
    expect(emptyBody.count).toBe(0);
  });

  suite.test('Workflow Teardown: Closes test server cleanly', async () => {
    await testServer.close();
  });

  return suite;
}
