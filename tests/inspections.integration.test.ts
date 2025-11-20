// Set environment variables BEFORE importing modules
process.env.FIXLE_API_URL = process.env.FIXLE_API_URL || 'http://localhost:3000';
process.env.FIXLE_API_KEY = process.env.FIXLE_API_KEY || 'c0bcf41ec2566cbcb921e16b0196a5647be5697a791af780def5a57b9177b93b';

import { setupPolly } from './setup/polly';
import * as https from 'https';
import * as http from 'http';

describe('Fixle API - Inspections Integration Tests', () => {
  let polly: any;
  let testPropertyId: number;

  beforeEach(() => {
    polly = setupPolly('fixle-inspections-integration');
  });

  afterEach(async () => {
    await polly.stop();
  });

  const makeApiRequest = (method: string, path: string, data?: object): Promise<any> => {
    return new Promise((resolve, reject) => {
      const url = new URL(`${process.env.FIXLE_API_URL}${path}`);
      const postData = data ? JSON.stringify(data) : '';
      const protocol = url.protocol === 'https:' ? https : http;

      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname,
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-API-Key': process.env.FIXLE_API_KEY,
          ...(postData && { 'Content-Length': Buffer.byteLength(postData) }),
        },
      };

      const req = protocol.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(body));
          } else {
            reject(new Error(`API error: ${res.statusCode} - ${body}`));
          }
        });
      });

      req.on('error', reject);
      if (postData) req.write(postData);
      req.end();
    });
  };

  const createTestProperty = async (): Promise<number> => {
    const propertyData = {
      property: {
        street_address: `${Date.now()} Test Street`,
        city: 'Test City',
        state: 'TS',
        zip_code: '12345',
        country: 'US',
      },
    };
    const response = await makeApiRequest('POST', '/api/v1/properties', propertyData);
    return parseInt(response.data.id);
  };

  it('should create an inspection for a property', async () => {
    testPropertyId = await createTestProperty();
    const uniqueId = Date.now();

    const inspectionData = {
      inspection: {
        external_id: `INSP-${uniqueId}`,
        inspection_date: '2024-11-20',
        inspector_name: 'John Doe',
      },
    };

    const response = await makeApiRequest(
      'POST',
      `/api/v1/properties/${testPropertyId}/inspections`,
      inspectionData
    );

    expect(response.data).toBeDefined();
    expect(response.data.id).toBeDefined();
    expect(response.data.type).toBe('inspections');
    expect(response.data.attributes.external_id).toBe(`INSP-${uniqueId}`);
  }, 30000);

  it('should create an inspection with minimal data', async () => {
    testPropertyId = await createTestProperty();
    const uniqueId = Date.now() + 1;

    const inspectionData = {
      inspection: {
        external_id: `INSP-${uniqueId}`,
      },
    };

    const response = await makeApiRequest(
      'POST',
      `/api/v1/properties/${testPropertyId}/inspections`,
      inspectionData
    );

    expect(response.data).toBeDefined();
    expect(response.data.attributes.external_id).toBe(`INSP-${uniqueId}`);
  }, 30000);

  it('should fail when creating inspection with duplicate external_id', async () => {
    testPropertyId = await createTestProperty();
    const uniqueId = Date.now() + 2;

    const inspectionData = {
      inspection: {
        external_id: `INSP-${uniqueId}`,
      },
    };

    // Create first inspection
    await makeApiRequest(
      'POST',
      `/api/v1/properties/${testPropertyId}/inspections`,
      inspectionData
    );

    // Try to create duplicate
    await expect(
      makeApiRequest(
        'POST',
        `/api/v1/properties/${testPropertyId}/inspections`,
        inspectionData
      )
    ).rejects.toThrow(/422|already been taken/);
  }, 30000);

  it('should fail when property does not exist', async () => {
    const inspectionData = {
      inspection: {
        external_id: `INSP-${Date.now()}`,
      },
    };

    await expect(
      makeApiRequest('POST', '/api/v1/properties/99999999/inspections', inspectionData)
    ).rejects.toThrow(/404|Not Found/);
  }, 30000);
});

