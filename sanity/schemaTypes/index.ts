import { type SchemaTypeDefinition } from 'sanity';

// Import schemas from sanity-studio
import product from '../../sanity-studio/schemas/product';
import category from '../../sanity-studio/schemas/category';

export const schemaTypes: SchemaTypeDefinition[] = [product, category];
export const schema = {
  types: schemaTypes,
};
