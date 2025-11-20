import { Polly } from '@pollyjs/core';
import NodeHttpAdapter from '@pollyjs/adapter-node-http';
import FSPersister from '@pollyjs/persister-fs';
import path from 'path';

// Register the adapters and persisters
Polly.register(NodeHttpAdapter);
Polly.register(FSPersister);

// Configure Polly for all tests
export function setupPolly(recordingName: string) {
  return new Polly(recordingName, {
    adapters: ['node-http'],
    persister: 'fs',
    persisterOptions: {
      fs: {
        recordingsDir: path.resolve(__dirname, '../recordings'),
      },
    },
    mode: (process.env.POLLY_MODE as any) || 'replay', // 'record' | 'replay' | 'passthrough' | 'stopped'
    recordIfMissing: process.env.POLLY_MODE === 'record', // Only record when explicitly in record mode
    recordFailedRequests: true, // Record failed requests (4xx, 5xx)
    matchRequestsBy: {
      method: true,
      headers: false, // Don't match by headers (API key will be different)
      body: true,
      order: false,
      url: {
        protocol: true,
        username: false,
        password: false,
        hostname: true,
        port: true,
        pathname: true,
        query: true,
        hash: false,
      },
    },
  });
}

