// Set environment variables BEFORE importing modules
process.env.FIXLE_API_URL = process.env.FIXLE_API_URL || 'http://localhost:3000';
process.env.FIXLE_API_KEY = process.env.FIXLE_API_KEY || 'c0bcf41ec2566cbcb921e16b0196a5647be5697a791af780def5a57b9177b93b';

import { setupPolly } from './setup/polly';
import * as https from 'https';
import * as http from 'http';

describe('Fixle API - Properties Integration Tests', () => {
  let polly: any;

  beforeEach(() => {
    polly = setupPolly('fixle-properties-integration');
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

  it('should create a property with valid address', async () => {
    const propertyData = {
      property: {
        street_address: '123 Main Street',
        city: 'Portland',
        state: 'OR',
        zip_code: '97201',
        country: 'US',
      },
    };

    const response = await makeApiRequest('POST', '/api/v1/properties', propertyData);

    expect(response.data).toBeDefined();
    expect(response.data.id).toBeDefined();
    expect(response.data.type).toBe('properties');
    expect(response.data.attributes.street_address).toBe('123 Main Street');
    expect(response.data.attributes.city).toBe('Portland');
  }, 30000);

  it('should create a property with minimal data', async () => {
    const propertyData = {
      property: {
        street_address: '456 Elm Street',
        city: 'Seattle',
        state: 'WA',
        zip_code: '98101',
        country: 'US',
      },
    };

    const response = await makeApiRequest('POST', '/api/v1/properties', propertyData);

    expect(response.data).toBeDefined();
    expect(response.data.id).toBeDefined();
    expect(response.data.attributes.street_address).toBe('456 Elm Street');
  }, 30000);

  it('should fail when country is missing', async () => {
    const propertyData = {
      property: {
        street_address: '789 Oak Avenue',
        city: 'Austin',
        state: 'TX',
        zip_code: '78701',
      },
    };

    await expect(
      makeApiRequest('POST', '/api/v1/properties', propertyData)
    ).rejects.toThrow(/422|Unprocessable/);
  }, 30000);

  it('should list properties', async () => {
    const response = await makeApiRequest('GET', '/api/v1/properties');

    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data)).toBe(true);
  }, 30000);
});

