/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import pMap from 'p-map';

import {
  ENDPOINT_TRUSTED_APPS_LIST_ID,
  ENDPOINT_EVENT_FILTERS_LIST_ID,
  ENDPOINT_HOST_ISOLATION_EXCEPTIONS_LIST_ID,
} from '@kbn/securitysolution-list-constants';
import { ExceptionListClient } from '../../../../lists/server';
import { PostPackagePolicyDeleteCallback } from '../../../../fleet/server';

export const ARTIFACT_LISTS_IDS_TO_REMOVE = [
  ENDPOINT_TRUSTED_APPS_LIST_ID,
  ENDPOINT_EVENT_FILTERS_LIST_ID,
  ENDPOINT_HOST_ISOLATION_EXCEPTIONS_LIST_ID,
];

/**
 * Removes policy from artifacts
 */
export const removePolicyFromArtifacts = async (
  exceptionsClient: ExceptionListClient,
  policy: Parameters<PostPackagePolicyDeleteCallback>[0][0]
) => {
  let page = 1;

  const findArtifactsByPolicy = async (currentPage: number) => {
    return exceptionsClient.findExceptionListsItem({
      listId: ARTIFACT_LISTS_IDS_TO_REMOVE,
      filter: ARTIFACT_LISTS_IDS_TO_REMOVE.map(
        () => `exception-list-agnostic.attributes.tags:"policy:${policy.id}"`
      ),
      namespaceType: ARTIFACT_LISTS_IDS_TO_REMOVE.map(() => 'agnostic'),
      page: currentPage,
      perPage: 50,
      sortField: undefined,
      sortOrder: undefined,
    });
  };

  let findResponse = await findArtifactsByPolicy(page);
  if (!findResponse) {
    return;
  }
  const artifacts = findResponse.data;

  while (findResponse && (artifacts.length < findResponse.total || findResponse.data.length)) {
    page += 1;
    findResponse = await findArtifactsByPolicy(page);
    if (findResponse) {
      artifacts.push(...findResponse.data);
    }
  }

  await pMap(
    artifacts,
    async (artifact) =>
      exceptionsClient.updateExceptionListItem({
        ...artifact,
        itemId: artifact.item_id,
        namespaceType: artifact.namespace_type,
        osTypes: artifact.os_types,
        tags: artifact.tags.filter((currentPolicy) => currentPolicy !== `policy:${policy.id}`),
      }),
    {
      concurrency: 5,
      /** When set to false, instead of stopping when a promise rejects, it will wait for all the promises to
       * settle and then reject with an aggregated error containing all the errors from the rejected promises. */
      stopOnError: false,
    }
  );
};
