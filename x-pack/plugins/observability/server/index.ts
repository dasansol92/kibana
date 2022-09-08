/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

// TODO: https://github.com/elastic/kibana/issues/110905
/* eslint-disable @kbn/eslint/no_export_all */

import { schema, TypeOf } from '@kbn/config-schema';
import { PluginConfigDescriptor, PluginInitializerContext } from '@kbn/core/server';
import { ObservabilityPlugin, ObservabilityPluginSetup } from './plugin';
import { createOrUpdateIndex, Mappings } from './utils/create_or_update_index';
import { ScopedAnnotationsClient } from './lib/annotations/bootstrap_annotations';
import {
  unwrapEsResponse,
  WrappedElasticsearchClientError,
} from '../common/utils/unwrap_es_response';
export { rangeQuery, kqlQuery, termQuery, termsQuery } from './utils/queries';
export { getInspectResponse } from '../common/utils/get_inspect_response';

export * from './types';

const configSchema = schema.object({
  annotations: schema.object({
    enabled: schema.boolean({ defaultValue: true }),
    index: schema.string({ defaultValue: 'observability-annotations' }),
  }),
  unsafe: schema.object({
    slo: schema.object({
      enabled: schema.boolean({ defaultValue: false }),
    }),
    alertDetails: schema.object({
      enabled: schema.boolean({ defaultValue: false }),
    }),
  }),
});

export const config: PluginConfigDescriptor = {
  exposeToBrowser: {
    unsafe: true,
  },
  schema: configSchema,
};

export type ObservabilityConfig = TypeOf<typeof configSchema>;

export const plugin = (initContext: PluginInitializerContext) =>
  new ObservabilityPlugin(initContext);

export type { Mappings, ObservabilityPluginSetup, ScopedAnnotationsClient };
export { createOrUpdateIndex, unwrapEsResponse, WrappedElasticsearchClientError };
