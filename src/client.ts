import * as https from 'https';
import * as http from 'http';

// Types
export interface Appliance {
  item_name: string;
  section_name: string;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  manufacturer: string | null;
  year: string | null;
}

export interface PropertyApplianceRequest {
  property_appliance: {
    appliance_id?: number | null;
    serial: string | null;
    model: string | null;
    year: string | null;
    notes: string | null;
    location: string | null;
  };
}

export interface PropertyRequest {
  property: {
    street_address: string;
    city: string;
    state: string;
    zip_code: string;
    country?: string;
  };
}

export interface InspectionRequest {
  inspection: {
    external_id: string;
    inspection_date?: string;
    inspector_name?: string;
    notes?: string;
  };
}


export interface FixleClientConfig {
  apiUrl: string;
  apiKey: string;
}

// JSON:API Response Types
interface JsonApiResponse {
  data: {
    type: string;
    id: string;
    attributes?: Record<string, any>;
  };
}

interface JsonApiError {
  status: string;
  title: string;
  detail: string;
}

interface JsonApiErrorResponse {
  errors: JsonApiError[];
}

export class FixleClient {
  private apiUrl: string;
  private apiKey: string;

  constructor(config: FixleClientConfig) {
    this.apiUrl = config.apiUrl;
    this.apiKey = config.apiKey;
  }

  // Make API request to Fixle
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

  // Create or find property
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

  // Create inspection
  async createInspection(propertyId: number, inspectionId: number): Promise<void> {
    const inspectionData: InspectionRequest = {
      inspection: {
        external_id: inspectionId.toString(),
      },
    };

    await this.makeApiRequest('POST', `/api/v1/properties/${propertyId}/inspections`, inspectionData);
  }

  // Create appliance
  async createAppliance(propertyId: number, appliance: Appliance): Promise<void> {
    const applianceData: PropertyApplianceRequest = {
      property_appliance: {
        appliance_id: 1,
        serial: appliance.serial_number,
        model: appliance.model,
        year: appliance.year,
        notes: `${appliance.item_name} - Brand: ${appliance.brand || 'Unknown'}`,
        location: appliance.section_name,
      },
    };

    await this.makeApiRequest('POST', `/api/v1/properties/${propertyId}/appliances`, applianceData);
  }

}

