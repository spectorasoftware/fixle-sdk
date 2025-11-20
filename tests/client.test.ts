import { FixleClient, ExtractedData } from '../src/client';

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

  describe('sendToFixleApi', () => {
    it('should handle empty appliances array', async () => {
      const mockData: ExtractedData = {
        inspection_id: 12345,
        address: '123 Main St, City, ST 12345',
        appliances: [],
      };

      // Mock the HTTP requests
      const mockRequest = jest.fn();
      const mockResponse = {
        statusCode: 201,
        on: jest.fn((event, handler) => {
          if (event === 'data') handler('{"data":{"id":"1"}}');
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

      const result = await client.sendToFixleApi(mockData);
      expect(result).toBe(0);
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
});

