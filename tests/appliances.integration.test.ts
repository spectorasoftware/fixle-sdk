// Set environment variables BEFORE importing modules
process.env.FIXLE_API_URL = process.env.FIXLE_API_URL || 'http://localhost:3000';
process.env.FIXLE_API_KEY = process.env.FIXLE_API_KEY || 'c0bcf41ec2566cbcb921e16b0196a5647be5697a791af780def5a57b9177b93b';

import { setupPolly } from './setup/polly';
import * as https from 'https';
import * as http from 'http';

describe('Fixle API - Appliances Integration Tests', () => {
  let polly: any;
  let testPropertyId: number;

  beforeEach(() => {
    polly = setupPolly('fixle-appliances-integration');
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

  it('should create an appliance for a property', async () => {
    testPropertyId = await createTestProperty();

    const applianceData = {
      property_appliance: {
        appliance_id: 1,
        serial: 'TEST-SERIAL-123',
        model: 'Model-X1000',
        year: '2024',
        notes: 'Water Heater - Brand: TestBrand',
        location: 'Basement',
      },
    };

    const response = await makeApiRequest(
      'POST',
      `/api/v1/properties/${testPropertyId}/appliances`,
      applianceData
    );

    expect(response.data).toBeDefined();
    expect(response.data.id).toBeDefined();
    expect(response.data.type).toBe('property_appliances');
    expect(response.data.attributes.serial).toBe('TEST-SERIAL-123');
    // Model may be populated from master appliance, just check it exists
    expect(response.data.attributes.model).toBeDefined();
  }, 30000);

  it('should create an appliance with minimal data', async () => {
    testPropertyId = await createTestProperty();

    const applianceData = {
      property_appliance: {
        appliance_id: 1,
        serial: `MIN-${Date.now()}`,
        model: null,
        year: null,
        notes: null,
        location: null,
      },
    };

    const response = await makeApiRequest(
      'POST',
      `/api/v1/properties/${testPropertyId}/appliances`,
      applianceData
    );

    expect(response.data).toBeDefined();
    expect(response.data.attributes.serial).toBe(applianceData.property_appliance.serial);
  }, 30000);

  it('should create multiple appliances for same property', async () => {
    testPropertyId = await createTestProperty();

    const appliances = [
      {
        property_appliance: {
          appliance_id: 1,
          serial: `MULTI-1-${Date.now()}`,
          model: 'Model-A',
          year: '2024',
          location: 'Kitchen',
        },
      },
      {
        property_appliance: {
          appliance_id: 1,
          serial: `MULTI-2-${Date.now()}`,
          model: 'Model-B',
          year: '2023',
          location: 'Garage',
        },
      },
    ];

    const responses = [];
    for (const applianceData of appliances) {
      const response = await makeApiRequest(
        'POST',
        `/api/v1/properties/${testPropertyId}/appliances`,
        applianceData
      );
      responses.push(response);
    }

    expect(responses).toHaveLength(2);
    expect(responses[0].data.id).toBeDefined();
    expect(responses[1].data.id).toBeDefined();
    expect(responses[0].data.id).not.toBe(responses[1].data.id);
  }, 30000);

  it('should fail when appliance_id is missing', async () => {
    testPropertyId = await createTestProperty();

    const applianceData = {
      property_appliance: {
        serial: 'NO-APPLIANCE-ID',
        model: 'TestModel',
      },
    };

    await expect(
      makeApiRequest('POST', `/api/v1/properties/${testPropertyId}/appliances`, applianceData)
    ).rejects.toThrow(/422|Appliance must exist/);
  }, 30000);

  it('should fail when property does not exist', async () => {
    const applianceData = {
      property_appliance: {
        appliance_id: 1,
        serial: 'TEST-123',
        model: 'TestModel',
      },
    };

    await expect(
      makeApiRequest('POST', '/api/v1/properties/99999999/appliances', applianceData)
    ).rejects.toThrow(/404|Not Found/);
  }, 30000);
});

