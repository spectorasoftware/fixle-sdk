import { FixleClient } from '../src/client';

// Mock http module
jest.mock('http', () => ({
  request: jest.fn(),
}));

describe('FixleClient', () => {
  let client: FixleClient;
  let mockRequest: jest.Mock;
  let capturedBody: string;

  beforeEach(() => {
    capturedBody = '';
    client = new FixleClient({
      apiUrl: 'http://localhost:3000',
      apiKey: 'test-api-key',
    });

    // Reset the mock before each test
    const http = require('http');
    mockRequest = http.request as jest.Mock;
    mockRequest.mockReset();
  });

  const setupHttpMock = (responseBody: string, statusCode = 201) => {
    const mockResponse = {
      statusCode,
      on: jest.fn((event: string, handler: (data?: string) => void) => {
        if (event === 'data') handler(responseBody);
        if (event === 'end') handler();
      }),
    };

    mockRequest.mockImplementation((options: unknown, callback: (res: typeof mockResponse) => void) => {
      callback(mockResponse);
      return {
        on: jest.fn(),
        write: jest.fn((data: string) => { capturedBody = data; }),
        end: jest.fn(),
      };
    });
  };

  describe('constructor', () => {
    it('should create a client with config', () => {
      expect(client).toBeInstanceOf(FixleClient);
    });
  });

  describe('findOrCreateProperty', () => {
    it('should parse address correctly', async () => {
      setupHttpMock('{"data":{"id":"123"}}');

      const propertyId = await client.findOrCreateProperty('123 Main St, Portland, OR 97201');
      expect(propertyId).toBe(123);
    });
  });

  describe('createInspection', () => {
    it('should create inspection without inspectorImageUrl', async () => {
      setupHttpMock('{"data":{"id":"456"}}');

      await client.createInspection(123, 45678);

      const parsedBody = JSON.parse(capturedBody);
      expect(parsedBody.inspection.external_id).toBe('45678');
      expect(parsedBody.inspection.inspector_image_url).toBeUndefined();
    });

    it('should create inspection with inspectorImageUrl', async () => {
      setupHttpMock('{"data":{"id":"456"}}');

      await client.createInspection(123, 45678, 'https://example.com/inspector.jpg');

      const parsedBody = JSON.parse(capturedBody);
      expect(parsedBody.inspection.external_id).toBe('45678');
      expect(parsedBody.inspection.inspector_image_url).toBe('https://example.com/inspector.jpg');
    });

    it('should include empty string inspectorImageUrl when explicitly provided', async () => {
      setupHttpMock('{"data":{"id":"456"}}');

      await client.createInspection(123, 45678, '');

      const parsedBody = JSON.parse(capturedBody);
      expect(parsedBody.inspection.external_id).toBe('45678');
      expect(parsedBody.inspection.inspector_image_url).toBe('');
    });
  });

  describe('createAppliance', () => {
    const testAppliance = {
      item_name: 'Water Heater',
      section_name: 'Basement',
      brand: 'Rheem',
      model: 'XE50M06ST45U1',
      serial_number: 'ABC123456',
      manufacturer: 'Rheem Manufacturing',
      year: '2020',
    };

    it('should create appliance without inspectionId', async () => {
      setupHttpMock('{"data":{"id":"789"}}');

      await client.createAppliance(123, testAppliance);

      const parsedBody = JSON.parse(capturedBody);
      expect(parsedBody.property_appliance.model).toBe('XE50M06ST45U1');
      expect(parsedBody.property_appliance.serial).toBe('ABC123456');
      expect(parsedBody.property_appliance.year).toBe('2020');
      expect(parsedBody.property_appliance.appliance_id).toBe(1);
      expect(parsedBody.property_appliance.inspection_id).toBeUndefined();
    });

    it('should create appliance with inspectionId', async () => {
      setupHttpMock('{"data":{"id":"789"}}');

      await client.createAppliance(123, testAppliance, 45678);

      const parsedBody = JSON.parse(capturedBody);
      expect(parsedBody.property_appliance.model).toBe('XE50M06ST45U1');
      expect(parsedBody.property_appliance.serial).toBe('ABC123456');
      expect(parsedBody.property_appliance.inspection_id).toBe(45678);
    });

    it('should include notes with item_name and brand', async () => {
      setupHttpMock('{"data":{"id":"789"}}');

      await client.createAppliance(123, testAppliance);

      const parsedBody = JSON.parse(capturedBody);
      expect(parsedBody.property_appliance.notes).toBe('Water Heater - Brand: Rheem');
    });

    it('should include location from section_name', async () => {
      setupHttpMock('{"data":{"id":"789"}}');

      await client.createAppliance(123, testAppliance);

      const parsedBody = JSON.parse(capturedBody);
      expect(parsedBody.property_appliance.location).toBe('Basement');
    });
  });
});
