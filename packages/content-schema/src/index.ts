/**
 * Role: public API of @skyline/content-schema. Zod schemas of game content (actions, needs, place types, jobs, items) and their generated JSON Schemas.
 * Owner: backend
 */

export { ContentIdSchema, GameTimeSchema, I18nKeySchema, NEEDS, NeedIdSchema, TimeWindowSchema, type NeedId } from './content-ids.ts';
export { NeedPenaltySchema, NeedRuleSchema, NeedsConfigSchema, type NeedPenalty, type NeedRule, type NeedsConfig } from './needs-schema.ts';
export { EFFECT_TYPES, EffectSchema, type Effect, type EffectType } from './effect-schemas.ts';
export { ACTOR_STATES, ActionSchema, INTERRUPT_SETTLEMENTS, type Action, type ActionInput, type InterruptSettlement } from './action-schema.ts';
export { PlaceTypeSchema, SITE_PLACEMENTS, type PlaceType, type SitePlacement } from './place-type-schema.ts';
export { ItemSchema, JobSchema, type Item, type Job } from './job-item-schemas.ts';
export { CONTENT_SCHEMAS, jsonSchemaOf, type ContentKind } from './json-schemas.ts';
