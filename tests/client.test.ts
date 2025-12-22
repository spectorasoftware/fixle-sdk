import { FixleClient } from '../src/client';

// Mock http and https modules
jest.mock('http');
jest.mock('https');

describe('FixleClient', () => {
  let client: FixleClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new FixleClient({
      apiUrl: 'http://localhost:3000',
      apiKey: 'test-api-key',
    });
  });

  describe('constructor', () => {
    it('should create a client with config', () => {
      expect(client).toBeInstanceOf(FixleClient);
    });
  });


  describe('findOrCreateProperty', () => {
    it('should parse address correctly', async () => {
      const mockResponse = {
        statusCode: 201,
        on: jest.fn((event, handler) => {
          if (event === 'data') handler('{"data":{"id":"123"}}');
          if (event === 'end') handler();
        }),
      };

      const http = require('http');
      http.request = jest.fn((options, callback) => {
        callback(mockResponse);
        return {
          on: jest.fn(),
          write: jest.fn(),
          end: jest.fn(),
        };
      });

      const propertyId = await client.findOrCreateProperty('123 Main St, Portland, OR 97201');
      expect(propertyId).toBe(123);
    });
  });

  describe('createInspection', () => {
    it('should create inspection without inspectorImageUrl', async () => {
      const mockResponse = {
        statusCode: 201,
        on: jest.fn((event, handler) => {
          if (event === 'data') handler('{"data":{"id":"456"}}');
          if (event === 'end') handler();
        }),
      };

      const http = require('http');
      let capturedBody = '';
      http.request = jest.fn((options, callback) => {
        callback(mockResponse);
        return {
          on: jest.fn(),
          write: jest.fn((data: string) => { capturedBody = data; }),
          end: jest.fn(),
        };
      });

      await client.createInspection(123, 45678);

      const parsedBody = JSON.parse(capturedBody);
      expect(parsedBody.inspection.external_id).toBe('45678');
      expect(parsedBody.inspection.inspector_image_url).toBeUndefined();
    });

    it('should create inspection with inspectorImageUrl', async () => {
      const mockResponse = {
        statusCode: 201,
        on: jest.fn((event, handler) => {
          if (event === 'data') handler('{"data":{"id":"456"}}');
          if (event === 'end') handler();
        }),
      };

      const http = require('http');
      let capturedBody = '';
      http.request = jest.fn((options, callback) => {
        callback(mockResponse);
        return {
          on: jest.fn(),
          write: jest.fn((data: string) => { capturedBody = data; }),
          end: jest.fn(),
        };
      });

      await client.createInspection(123, 45678, 'https://example.com/inspector.jpg');

      const parsedBody = JSON.parse(capturedBody);
      expect(parsedBody.inspection.external_id).toBe('45678');
      expect(parsedBody.inspection.inspector_image_url).toBe('https://example.com/inspector.jpg');
    });
  });
});

