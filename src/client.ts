import * as https from 'https';
import * as http from 'http';

/**
 * Represents an appliance with its identifying information
 */
export interface Appliance {
  /** Name of the appliance item (e.g., "Water Heater", "Dishwasher") */
  item_name: string;
  /** Section or location where the appliance is found (e.g., "Kitchen", "Basement") */
  section_name: string;
  /** Brand name of the appliance */
  brand: string | null;
  /** Model number of the appliance */
  model: string | null;
  /** Serial number of the appliance */
  serial_number: string | null;
  /** Manufacturer name */
  manufacturer: string | null;
  /** Year of manufacture */
  year: string | null;
}

/**
 * Request payload for creating a property appliance
 * @internal
 */
export interface PropertyApplianceRequest {
  property_appliance: {
    appliance_id?: number | null;
    inspection_id?: number | null;
    serial: string | null;
    model: string | null;
    year: string | null;
    notes: string | null;
    location: string | null;
  };
}

/**
 * Request payload for creating a property
 * @internal
 */
export interface PropertyRequest {
  property: {
    street_address: string;
    city: string;
    state: string;
    zip_code: string;
    country?: string;
  };
}

/**
 * Request payload for creating an inspection
 * @internal
 */
export interface InspectionRequest {
  inspection: {
    external_id: string;
    inspection_date?: string;
    inspector_name?: string;
    inspector_image_url?: string;
    notes?: string;
  };
}

/**
 * Configuration options for the Fixle API client
 */
export interface FixleClientConfig {
  /** Base URL of the Fixle API (e.g., "https://api.fixle.com" or "http://localhost:3000") */
  apiUrl: string;
  /** API key for authentication */
  apiKey: string;
}

/**
 * JSON:API formatted response
 * @internal
 */
interface JsonApiResponse {
  data: {
    type: string;
    id: string;
    attributes?: Record<string, any>;
  };
}

/**
 * JSON:API error object
 * @internal
 */
interface JsonApiError {
  status: string;
  title: string;
  detail: string;
}

/**
 * JSON:API error response
 * @internal
 */
interface JsonApiErrorResponse {
  errors: JsonApiError[];
}

/**
 * Client for interacting with the Fixle API
 * 
 * @example
 * const client = new FixleClient({
 *   apiUrl: 'https://api.fixle.com',
 *   apiKey: 'your-api-key'
 * });
 *
 * // Create a property
 * const propertyId = await client.findOrCreateProperty('123 Main St, Portland, OR 97201');
 *
 * // Create an inspection
 * await client.createInspection(propertyId, 12345);
 *
 * // Add an appliance
 * await client.createAppliance(propertyId, {
 *   item_name: 'Water Heater',
 *   section_name: 'Basement',
 *   brand: 'Rheem',
 *   model: 'XE50M06ST45U1',
 *   serial_number: 'ABC123',
 *   manufacturer: 'Rheem Manufacturing',
 *   year: '2020'
 * });
 */
export class FixleClient {
  private apiUrl: string;
  private apiKey: string;

  /**
   * Creates a new Fixle API client
   * @param config - Configuration options including API URL and key
   */
  constructor(config: FixleClientConfig) {
    this.apiUrl = config.apiUrl;
    this.apiKey = config.apiKey;
  }

  /**
   * Makes an HTTP request to the Fixle API
   * @private
   * @param method - HTTP method (GET, POST, etc.)
   * @param path - API endpoint path
   * @param data - Optional request body data
   * @returns Promise resolving to the API response
   * @throws Error if the request fails or returns an error status
   */
  private makeApiRequest(method: string, path: string, data?: object): Promise<any> {
    return new Promise((resolve, reject) => {
      const url = new URL(`${this.apiUrl}${path}`);
      const postData = data ? JSON.stringify(data) : '';

      const protocol = url.protocol === 'https:' ? https : http;

      const options: https.RequestOptions = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname,
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-API-Key': this.apiKey,
          ...(postData && { 'Content-Length': Buffer.byteLength(postData) }),
        },
      };

      const req = protocol.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsed = body ? JSON.parse(body) : {};
              if (parsed.data) {
                resolve(parsed);
              } else {
                resolve(parsed);
              }
            } catch {
              resolve(body);
            }
          } else {
            try {
              const errorResponse: JsonApiErrorResponse = JSON.parse(body);
              if (errorResponse.errors && errorResponse.errors.length > 0) {
                const error = errorResponse.errors[0];
                reject(new Error(`API error ${error.status}: ${error.title} - ${error.detail}`));
              } else {
                reject(new Error(`API error: ${res.statusCode} - ${body}`));
              }
            } catch {
              reject(new Error(`API error: ${res.statusCode} - ${body}`));
            }
          }
        });
      });

      req.on('error', reject);
      if (postData) req.write(postData);
      req.end();
    });
  }

  /**
   * Finds an existing property or creates a new one based on the address
   * 
   * The address is parsed into street address, city, state, and zip code components.
   * Currently always creates a new property; future versions may search for existing properties first.
   * 
   * @param address - Full address string (e.g., "123 Main St, Portland, OR 97201")
   * @returns Promise resolving to the property ID
   * @throws Error if the API request fails
   * 
   * @example
   * const propertyId = await client.findOrCreateProperty('123 Main St, Portland, OR 97201');
   * console.log(`Created property with ID: ${propertyId}`);
   */
  async findOrCreateProperty(address: string): Promise<number> {
    const parts = address.split(',').map(s => s.trim());
    const streetAddress = parts[0] || address;
    const cityStateZip = parts[1] || '';
    const [city, stateZip] = cityStateZip.split(/\s+(?=\w{2}\s+\d)/);
    const [state, zipCode] = (stateZip || '').split(/\s+/);

    const propertyData: PropertyRequest = {
      property: {
        street_address: streetAddress,
        city: city || 'Unknown',
        state: state || 'Unknown',
        zip_code: zipCode || '00000',
        country: 'US',
      },
    };

    const response = await this.makeApiRequest('POST', '/api/v1/properties', propertyData);
    return parseInt(response.data?.id || response.id);
  }

  /**
   * Creates an inspection record for a property
   *
   * @param propertyId - ID of the property to associate the inspection with
   * @param externalInspectionId - External inspection ID (from the source system, e.g., Spectora)
   * @param inspectorImageUrl - Optional URL to the inspector's profile image
   * @returns Promise resolving to the Fixle internal inspection ID
   * @throws Error if the API request fails or the property doesn't exist
   *
   * @example
   * const fixleInspectionId = await client.createInspection(123, 45678);
   * console.log(`Created inspection with Fixle ID: ${fixleInspectionId}`);
   *
   * @example
   * // With inspector image
   * const fixleInspectionId = await client.createInspection(123, 45678, 'https://example.com/inspector.jpg');
   */
  async createInspection(propertyId: number, externalInspectionId: number, inspectorImageUrl?: string): Promise<number> {
    const inspectionData: InspectionRequest = {
      inspection: {
        external_id: externalInspectionId.toString(),
        ...(inspectorImageUrl !== undefined && { inspector_image_url: inspectorImageUrl }),
      },
    };

    const response = await this.makeApiRequest('POST', `/api/v1/properties/${propertyId}/inspections`, inspectionData);
    return parseInt(response.data?.id || response.id);
  }

  /**
   * Creates an appliance record for a property
   *
   * The appliance is associated with a master appliance type (currently uses ID 1 as placeholder).
   * In production, you should implement logic to find or create the appropriate master appliance.
   *
   * @param propertyId - ID of the property to add the appliance to
   * @param appliance - Appliance information including brand, model, serial number, etc.
   * @param inspectionId - Optional inspection ID to link the appliance to an inspection
   * @returns Promise that resolves when the appliance is created
   * @throws Error if the API request fails or the property doesn't exist
   *
   * @example
   * await client.createAppliance(123, {
   *   item_name: 'Water Heater',
   *   section_name: 'Basement',
   *   brand: 'Rheem',
   *   model: 'XE50M06ST45U1',
   *   serial_number: 'ABC123456',
   *   manufacturer: 'Rheem Manufacturing',
   *   year: '2020'
   * }, 45678);
   */
  async createAppliance(propertyId: number, appliance: Appliance, inspectionId?: number): Promise<void> {
    const applianceData: PropertyApplianceRequest = {
      property_appliance: {
        appliance_id: 1,
        ...(inspectionId !== undefined && { inspection_id: inspectionId }),
        serial: appliance.serial_number,
        model: appliance.model,
        year: appliance.year,
        notes: `${appliance.item_name} - Brand: ${appliance.brand || 'Unknown'}`,
        location: appliance.section_name,
      },
    };

    await this.makeApiRequest('POST', `/api/v1/properties/${propertyId}/appliances`, applianceData);
  }

  /**
   * Triggers the appliance report generation for an inspection
   *
   * This should be called after all appliances have been created for an inspection.
   * It signals to Fixle that the inspection data is complete and ready for processing
   * (PDF generation, recall checking, etc.).
   *
   * @param inspectionId - Fixle internal inspection ID
   * @param reportId - Optional external report ID (from Spectora)
   * @param async - Whether to process asynchronously (default: true)
   * @returns Promise resolving to the trigger response with status and message
   * @throws Error if the API request fails or the inspection doesn't exist
   *
   * @example
   * // After creating all appliances
   * const result = await client.triggerApplianceReport(fixleInspectionId);
   * console.log(`Report status: ${result.status}, message: ${result.message}`);
   */
  async triggerApplianceReport(
    inspectionId: number,
    reportId?: string,
    async: boolean = true
  ): Promise<{ status: string; message: string }> {
    const params = new URLSearchParams();
    if (reportId) params.append('report_id', reportId);
    params.append('async', async.toString());

    const queryString = params.toString();
    const path = `/api/v1/inspections/${inspectionId}/reports/appliance${queryString ? `?${queryString}` : ''}`;

    const response = await this.makeApiRequest('POST', path);
    return {
      status: response.data?.attributes?.status || 'unknown',
      message: response.data?.attributes?.message || 'Report triggered',
    };
  }

}

