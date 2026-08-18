/**
 * Unit Test Suite: Jobs Management, Queue State Machine, Batch Operations, and CRUD Lifecycle
 */

import { TestSuiteRunner, expect } from '../helpers/assertions.js';
import { store } from '../../server/data/store.js';
import { JobRecord } from '../../server/types.js';

export function createJobsTestSuite(): TestSuiteRunner {
  const suite = new TestSuiteRunner('Jobs Module Unit Tests', 'unit');

  suite.test('Initial Seed Data: Contains pre-seeded showcase jobs in history', () => {
    store.reset();
    const jobs = store.getAllJobs();

    expect(jobs.length).toBeGreaterThanOrEqual(3);
    const sample1 = jobs.find((j) => j.id === 'job_sample_1');
    expect(sample1 !== undefined).toBe(true);
    expect(sample1?.status).toBe('done');
    expect(sample1?.progress).toBe(100);
    expect(sample1?.settingsSnapshot?.backgroundStyle).toBe('gradient');
  });

  suite.test('Job Creation: Instantiates job record with queued state and custom settings snapshot', () => {
    store.reset();
    const now = Date.now();
    const newJob: JobRecord = {
      id: 'job_unit_test_1',
      name: 'model-portrait.png',
      originalUrl: 'data:image/png;base64,mockOriginal',
      status: 'queued',
      progress: 0,
      createdAt: now,
      fileSize: 1540000,
      fileType: 'image/png',
      settingsSnapshot: {
        accuracy: 'medium',
        backgroundStyle: 'custom_image',
        shadow: 'studio',
      },
      metadata: { source: 'drag_and_drop', batchIndex: 0 },
    };

    const created = store.createJob(newJob);
    expect(created.id).toBe('job_unit_test_1');
    expect(created.status).toBe('queued');
    expect(created.progress).toBe(0);
    expect(created.settingsSnapshot?.backgroundStyle).toBe('custom_image');
    expect(created.settingsSnapshot?.shadow).toBe('studio');
    expect(created.metadata?.batchIndex).toBe(0);

    const retrieved = store.getJob('job_unit_test_1');
    expect(retrieved?.id).toBe('job_unit_test_1');
    expect(retrieved?.name).toBe('model-portrait.png');
  });

  suite.test('State Machine Transitions: queued -> processing -> done', () => {
    store.reset();
    const jobId = 'job_state_test';
    store.createJob({
      id: jobId,
      name: 'shoe-product.jpg',
      status: 'queued',
      progress: 0,
      createdAt: Date.now(),
    });

    // 1. Transition to Processing
    const processingUpdate = store.updateJob(jobId, {
      status: 'processing',
      progress: 45,
    });
    expect(processingUpdate?.status).toBe('processing');
    expect(processingUpdate?.progress).toBe(45);

    // 2. Transition to Done with results
    const doneTime = Date.now();
    const doneUpdate = store.updateJob(jobId, {
      status: 'done',
      progress: 100,
      resultUrl: 'data:image/png;base64,mockResultImage',
      completedAt: doneTime,
      processingTimeMs: 1100,
      dimensions: { width: 1920, height: 1080 },
    });

    expect(doneUpdate?.status).toBe('done');
    expect(doneUpdate?.progress).toBe(100);
    expect(doneUpdate?.resultUrl).toBe('data:image/png;base64,mockResultImage');
    expect(doneUpdate?.completedAt).toBe(doneTime);
    expect(doneUpdate?.processingTimeMs).toBe(1100);
    expect(doneUpdate?.dimensions?.width).toBe(1920);
    expect(doneUpdate?.dimensions?.height).toBe(1080);
  });

  suite.test('State Machine Direct Transition: queued -> done directly with timing calculation', () => {
    store.reset();
    const jobId = 'job_direct_done_test';
    const createdAt = Date.now() - 1500;
    store.createJob({
      id: jobId,
      name: 'fast-avatar.png',
      status: 'queued',
      progress: 0,
      createdAt,
    });

    const doneUpdate = store.updateJob(jobId, {
      status: 'done',
      progress: 100,
      resultUrl: 'data:image/png;base64,mockFastResult',
      completedAt: Date.now(),
      processingTimeMs: 1500,
    });

    expect(doneUpdate?.status).toBe('done');
    expect(doneUpdate?.progress).toBe(100);
    expect(doneUpdate?.resultUrl).toBe('data:image/png;base64,mockFastResult');
    expect(doneUpdate?.processingTimeMs).toBe(1500);
  });

  suite.test('State Machine Error Transition: processing -> error with message', () => {
    store.reset();
    const jobId = 'job_error_test';
    store.createJob({
      id: jobId,
      name: 'corrupted-image.bmp',
      status: 'queued',
      createdAt: Date.now(),
    });

    store.updateJob(jobId, { status: 'processing', progress: 15 });

    const errorUpdate = store.updateJob(jobId, {
      status: 'error',
      errorMessage: 'WebAssembly segmentation fault: Image dimensions unsupported',
      progress: 15,
    });

    expect(errorUpdate?.status).toBe('error');
    expect(errorUpdate?.errorMessage).toBe('WebAssembly segmentation fault: Image dimensions unsupported');
    expect(errorUpdate?.progress).toBe(15);
  });

  suite.test('Job Querying & Sorting: Returns jobs sorted by createdAt descending', () => {
    store.reset();
    store.clearAllJobs();

    const t1 = 1000;
    const t2 = 2000;
    const t3 = 3000;

    store.createJob({ id: 'j1', name: 'img1.png', status: 'done', createdAt: t1 });
    store.createJob({ id: 'j2', name: 'img2.png', status: 'queued', createdAt: t3 });
    store.createJob({ id: 'j3', name: 'img3.png', status: 'processing', createdAt: t2 });

    const all = store.getAllJobs();
    expect(all.length).toBe(3);
    expect(all[0].id).toBe('j2'); // t3 (newest)
    expect(all[1].id).toBe('j3'); // t2
    expect(all[2].id).toBe('j1'); // t1 (oldest)
  });

  suite.test('Job Deletion: Deletes specific job and returns true; returns false for non-existent ID', () => {
    store.reset();
    const jobId = 'job_to_delete';
    store.createJob({ id: jobId, name: 'temp.png', status: 'queued', createdAt: Date.now() });

    expect(store.getJob(jobId) !== undefined).toBe(true);

    const deleted = store.deleteJob(jobId);
    expect(deleted).toBe(true);
    expect(store.getJob(jobId)).toBeUndefined();

    // Deleting again returns false
    const deletedAgain = store.deleteJob(jobId);
    expect(deletedAgain).toBe(false);

    // Deleting unknown ID returns false
    expect(store.deleteJob('non_existent_job_xyz')).toBe(false);
  });

  suite.test('Batch Clear: Clears entire jobs table and returns count of cleared records', () => {
    store.reset();
    const initialCount = store.getAllJobs().length;
    expect(initialCount).toBeGreaterThan(0);

    const clearedCount = store.clearAllJobs();
    expect(clearedCount).toBe(initialCount);

    const afterClear = store.getAllJobs();
    expect(afterClear.length).toBe(0);
  });

  return suite;
}
