/**
 * @packageDocumentation
 * Fixle SDK - TypeScript client for the Fixle API
 * 
 * This SDK provides a simple interface for interacting with the Fixle API,
 * allowing you to manage properties, inspections, and appliances.
 * 
 * @example
 * ```javascript
 * import { FixleClient } from '@spectora/fixle-sdk';
 * 
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
 * // Add appliances
 * await client.createAppliance(propertyId, {
 *   item_name: 'Water Heater',
 *   section_name: 'Basement',
 *   brand: 'Rheem',
 *   model: 'XE50M06ST45U1',
 *   serial_number: 'ABC123',
 *   manufacturer: null,
 *   year: '2020'
 * });
 * ```
 */

export { FixleClient, FixleClientConfig, Appliance } from './client';

