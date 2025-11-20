# Fixle SDK

TypeScript SDK for interacting with the Fixle API.

## Installation

```bash
npm install @spectora/fixle-sdk
```

Or for local development:
```bash
npm install ../fixle-sdk
```

## Usage

```typescript
import { FixleClient } from '@spectora/fixle-sdk';

// Initialize the client
const client = new FixleClient({
  apiUrl: 'https://fixle-api.example.com',
  apiKey: 'your-api-key-here',
});

// Send inspection data to Fixle
const result = await client.sendToFixleApi({
  inspection_id: 12345,
  address: '123 Main Street, Portland, OR 97201',
  appliances: [
    {
      item_name: 'Water Heater',
      section_name: 'Plumbing',
      brand: 'Rheem',
      model: 'XE50M06ST45U1',
      serial_number: 'ABC123456',
      manufacturer: 'Rheem Manufacturing',
      year: '2020',
    },
  ],
});

console.log(`Created ${result} appliances`);
```

## API

### `FixleClient`

#### Constructor

```typescript
new FixleClient(config: FixleClientConfig)
```

**Parameters:**
- `config.apiUrl` (string): Base URL of the Fixle API
- `config.apiKey` (string): API key for authentication

#### Methods

##### `sendToFixleApi(data: ExtractedData): Promise<number>`

Sends inspection data to Fixle API. Creates property, inspection, and appliances.

**Returns:** Number of appliances successfully created

##### `findOrCreateProperty(address: string): Promise<number>`

Finds or creates a property by address.

**Returns:** Property ID

##### `createInspection(propertyId: number, inspectionId: number): Promise<void>`

Creates an inspection for a property.

##### `createPropertyAppliance(propertyId: number, appliance: Appliance): Promise<void>`

Creates a property appliance.

## Types

```typescript
interface ExtractedData {
  inspection_id: number;
  address: string;
  appliances: Appliance[];
}

interface Appliance {
  item_name: string;
  section_name: string;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  manufacturer: string | null;
  year: string | null;
}
```

## Documentation

Full API documentation is available at: https://spectorasoftware.github.io/fixle-sdk/

To generate docs locally:

```bash
npm run docs
```

Then open `docs/index.html` in your browser.

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Watch mode
npm run test:watch

# Generate docs
npm run docs
```

## License

MIT

