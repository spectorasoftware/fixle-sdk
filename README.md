# @spectorasoftware/fixle-sdk

TypeScript SDK for the Fixle API. Manage properties, inspections, and appliances.

## Installation

```bash
npm install @spectorasoftware/fixle-sdk
```

### Installing from GitHub Packages

Add to your `.npmrc`:

```
@spectorasoftware:registry=https://npm.pkg.github.com
```

Then install:

```bash
npm install @spectorasoftware/fixle-sdk
```

### Installing from Git

```bash
npm install git+https://github.com/spectorasoftware/fixle-sdk.git
```

## Quick Start

```typescript
import { FixleClient } from '@spectorasoftware/fixle-sdk';

const client = new FixleClient({
  apiUrl: 'https://api.fixle.com',
  apiKey: 'your-api-key'
});

// Create a property
const propertyId = await client.findOrCreateProperty('123 Main St, Portland, OR 97201');

// Create an inspection
await client.createInspection(propertyId, 12345);

// Create an inspection with inspector image
await client.createInspection(propertyId, 12345, 'https://example.com/inspector.jpg');

// Add an appliance
await client.createAppliance(propertyId, {
  item_name: 'Water Heater',
  section_name: 'Basement',
  brand: 'Rheem',
  model: 'XE50M06ST45U1',
  serial_number: 'ABC123',
  manufacturer: 'Rheem Manufacturing',
  year: '2020'
});
```

## API Reference

### `FixleClient`

#### Constructor

```typescript
new FixleClient(config: FixleClientConfig)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `config.apiUrl` | `string` | Base URL of the Fixle API |
| `config.apiKey` | `string` | API key for authentication |

#### Methods

##### `findOrCreateProperty(address: string): Promise<number>`

Creates a new property from an address string.

```typescript
const propertyId = await client.findOrCreateProperty('123 Main St, Portland, OR 97201');
```

##### `createInspection(propertyId: number, inspectionId: number, inspectorImageUrl?: string): Promise<void>`

Creates an inspection record for a property.

```typescript
// Without inspector image
await client.createInspection(123, 45678);

// With inspector image
await client.createInspection(123, 45678, 'https://example.com/inspector.jpg');
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `propertyId` | `number` | ID of the property |
| `inspectionId` | `number` | External inspection ID |
| `inspectorImageUrl` | `string` (optional) | URL to inspector's profile image |

##### `createAppliance(propertyId: number, appliance: Appliance): Promise<void>`

Creates an appliance record for a property.

```typescript
await client.createAppliance(123, {
  item_name: 'Water Heater',
  section_name: 'Basement',
  brand: 'Rheem',
  model: 'XE50M06ST45U1',
  serial_number: 'ABC123',
  manufacturer: 'Rheem Manufacturing',
  year: '2020'
});
```

### `Appliance`

| Field | Type | Description |
|-------|------|-------------|
| `item_name` | `string` | Name of the appliance |
| `section_name` | `string` | Location/section where found |
| `brand` | `string \| null` | Brand name |
| `model` | `string \| null` | Model number |
| `serial_number` | `string \| null` | Serial number |
| `manufacturer` | `string \| null` | Manufacturer name |
| `year` | `string \| null` | Year of manufacture |

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run unit tests only
npm run test:unit

# Run tests with coverage
npm run test:coverage
```

## License

MIT
