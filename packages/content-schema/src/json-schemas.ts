/**
 * Role: JSON Schemas generated from the Zod schemas (never written by hand), for editor autocompletion of content files.
 * Owner: backend
 */

import { z } from 'zod';
import { ActionSchema } from './action-schema.ts';
import { ItemSchema, JobSchema } from './job-item-schemas.ts';
import { NeedsConfigSchema } from './needs-schema.ts';
import { PlaceTypeSchema } from './place-type-schema.ts';
import { TransportServiceSchema } from './transport-schemas.ts';

export const CONTENT_SCHEMAS = {
  action: ActionSchema,
  'place-type': PlaceTypeSchema,
  job: JobSchema,
  item: ItemSchema,
  needs: NeedsConfigSchema,
  'transport-service': TransportServiceSchema,
} as const;

export type ContentKind = keyof typeof CONTENT_SCHEMAS;

/** JSON Schema of the input shape (defaults optional), as authors write it. */
export const jsonSchemaOf = (kind: ContentKind): Record<string, unknown> =>
  z.toJSONSchema(CONTENT_SCHEMAS[kind], { io: 'input', unrepresentable: 'any' });
