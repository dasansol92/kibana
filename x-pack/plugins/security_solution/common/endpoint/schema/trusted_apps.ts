/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { schema, Type } from '@kbn/config-schema';
import { ConditionEntry, ConditionEntryField, OperatingSystem } from '../types';
import { getDuplicateFields, isValidHash } from '../service/trusted_apps/validations';

export const DeleteTrustedAppsRequestSchema = {
  params: schema.object({
    id: schema.string(),
  }),
};

export const GetTrustedAppsRequestSchema = {
  query: schema.object({
    page: schema.maybe(schema.number({ defaultValue: 1, min: 1 })),
    per_page: schema.maybe(schema.number({ defaultValue: 20, min: 1 })),
  }),
};

const ConditionEntryTypeSchema = schema.literal('match');
const ConditionEntryOperatorSchema = schema.literal('included');

/*
 * A generic Entry schema to be used for a specific entry schema depending on the OS
 */
const CommonEntrySchema = {
  field: schema.oneOf([
    schema.literal(ConditionEntryField.HASH),
    schema.literal(ConditionEntryField.PATH),
  ]),
  type: ConditionEntryTypeSchema,
  operator: ConditionEntryOperatorSchema,
  // If field === HASH then validate hash with custom method, else validate string with minLength = 1
  value: schema.conditional(
    schema.siblingRef('field'),
    ConditionEntryField.HASH,
    schema.string({
      validate: (hash) =>
        isValidHash(hash) ? undefined : `invalidField.${ConditionEntryField.HASH}`,
    }),
    schema.conditional(
      schema.siblingRef('field'),
      ConditionEntryField.PATH,
      schema.string({
        validate: (field) =>
          field.length > 0 ? undefined : `invalidField.${ConditionEntryField.PATH}`,
      }),
      schema.string({
        validate: (field) =>
          field.length > 0 ? undefined : `invalidField.${ConditionEntryField.SIGNER}`,
      })
    )
  ),
};

const WindowsEntrySchema = schema.object({
  ...CommonEntrySchema,
  field: schema.oneOf([
    schema.literal(ConditionEntryField.HASH),
    schema.literal(ConditionEntryField.PATH),
    schema.literal(ConditionEntryField.SIGNER),
  ]),
});

const LinuxEntrySchema = schema.object({
  ...CommonEntrySchema,
});

const MacEntrySchema = schema.object({
  ...CommonEntrySchema,
});

/*
 * Entry Schema depending on Os type using schema.conditional.
 * If OS === WINDOWS then use Windows schema,
 * else if OS === LINUX then use Linux schema,
 * else use Mac schema
 */
const EntrySchemaDependingOnOS = schema.conditional(
  schema.siblingRef('os'),
  OperatingSystem.WINDOWS,
  WindowsEntrySchema,
  schema.conditional(
    schema.siblingRef('os'),
    OperatingSystem.LINUX,
    LinuxEntrySchema,
    MacEntrySchema
  )
);

/*
 * Entities array schema.
 * The validate function checks there is no duplicated entry inside the array
 */
const EntriesSchema = schema.arrayOf(EntrySchemaDependingOnOS, {
  minSize: 1,
  validate(entries) {
    return (
      getDuplicateFields(entries)
        .map((field) => `duplicatedEntry.${field}`)
        .join(', ') || undefined
    );
  },
});
const createNewTrustedAppForOsScheme = <O extends OperatingSystem, E extends ConditionEntry>(
  osSchema: Type<O>,
  entriesSchema: Type<E>,
  forUpdateFlow: boolean = false
) =>
  schema.object({
    name: schema.string({ minLength: 1, maxLength: 256 }),
    description: schema.maybe(schema.string({ minLength: 0, maxLength: 256, defaultValue: '' })),
    effectScope: schema.oneOf([
      schema.object({
        type: schema.literal('global'),
      }),
      schema.object({
        type: schema.literal('policy'),
        policies: schema.arrayOf(schema.string({ minLength: 1 })),
      }),
    ]),
    os: osSchema,
    entries: schema.arrayOf(entriesSchema, {
      minSize: 1,
      validate(entries) {
        return (
          getDuplicateFields(entries)
            .map((field) => `[${entryFieldLabels[field]}] field can only be used once`)
            .join(', ') || undefined
        );
      },
    }),
    version: forUpdateFlow ? schema.maybe(schema.string()) : schema.never(),
  });

export const PostTrustedAppCreateRequestSchema = {
  body: schema.object({
    name: schema.string({ minLength: 1, maxLength: 256 }),
    description: schema.maybe(schema.string({ minLength: 0, maxLength: 256, defaultValue: '' })),
    os: schema.oneOf([
      schema.literal(OperatingSystem.WINDOWS),
      schema.literal(OperatingSystem.LINUX),
      schema.literal(OperatingSystem.MAC),
    ]),
    entries: EntriesSchema,
  }),
};

export const PutTrustedAppUpdateRequestSchema = {
  params: schema.object({
    id: schema.string(),
  }),
  body: schema.oneOf([
    createNewTrustedAppForOsScheme(
      schema.oneOf([schema.literal(OperatingSystem.LINUX), schema.literal(OperatingSystem.MAC)]),
      schema.oneOf([HashConditionEntrySchema, PathConditionEntrySchema]),
      true
    ),
    createNewTrustedAppForOsScheme(
      schema.literal(OperatingSystem.WINDOWS),
      schema.oneOf([
        HashConditionEntrySchema,
        PathConditionEntrySchema,
        SignerConditionEntrySchema,
      ]),
      true
    ),
  ]),
};
