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
});
