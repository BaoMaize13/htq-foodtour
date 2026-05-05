const crypto = require('crypto');
const Narration = require('../models/narration.model');

const jobs = new Map();

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const queueBatchGeneration = async ({ requestedBy, status = 'pending' }) => {
  const narrations = await Narration.find({ status }).select('_id title language status');

  const queuedJobs = narrations.map((narration) => {
    const id = crypto.randomUUID();
    const job = {
      id,
      narrationId: String(narration._id),
      title: narration.title,
      language: narration.language,
      status: 'queued',
      createdAt: new Date().toISOString(),
      requestedBy,
    };

    jobs.set(id, job);
    return job;
  });

  return {
    queuedCount: queuedJobs.length,
    jobs: queuedJobs,
  };
};

const cancelBatchJob = async ({ jobId }) => {
  const job = jobs.get(jobId);
  if (!job) {
    throw createHttpError(404, 'Audio job not found');
  }

  if (job.status === 'cancelled' || job.status === 'completed') {
    return { job };
  }

  const updated = {
    ...job,
    status: 'cancelled',
    cancelledAt: new Date().toISOString(),
  };

  jobs.set(jobId, updated);
  return { job: updated };
};

const listBatchJobs = () => {
  return {
    data: Array.from(jobs.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  };
};

module.exports = {
  queueBatchGeneration,
  cancelBatchJob,
  listBatchJobs,
};
