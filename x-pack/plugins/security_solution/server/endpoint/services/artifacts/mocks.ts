/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { SavedObjectsClientContract } from '@kbn/core/server';
import { savedObjectsClientMock, elasticsearchServiceMock } from '@kbn/core/server/mocks';
import type { ElasticsearchClientMock } from '@kbn/core-elasticsearch-client-server-mocks';
// Because mocks are for testing only, should be ok to import the FleetArtifactsClient directly
import { appContextService, FleetArtifactsClient } from '@kbn/fleet-plugin/server/services';
import {
  createAppContextStartContractMock,
  createArtifactsClientMock,
} from '@kbn/fleet-plugin/server/mocks';
import type { FleetConfigType } from '@kbn/fleet-plugin/server';

import type { EndpointArtifactClientInterface } from './artifact_client';
import { EndpointArtifactClient } from './artifact_client';
import { ManifestClient } from './manifest_client';

export const getManifestClientMock = (
  savedObjectsClient?: SavedObjectsClientContract
): ManifestClient => {
  if (savedObjectsClient !== undefined) {
    return new ManifestClient(savedObjectsClient, 'v1');
  }
  return new ManifestClient(savedObjectsClientMock.create(), 'v1');
};

/**
 * Returns back a mocked EndpointArtifactClient along with the internal FleetArtifactsClient and the Es Clients that are being used
 * @param esClient
 */
export const createEndpointArtifactClientMock = (
  esClient: ElasticsearchClientMock = elasticsearchServiceMock.createScopedClusterClient()
    .asInternalUser
): jest.Mocked<EndpointArtifactClientInterface> & {
  _esClient: ElasticsearchClientMock;
} => {
  const fleetArtifactClientMocked = createArtifactsClientMock();
  const endpointArtifactClientMocked = new EndpointArtifactClient(fleetArtifactClientMocked);

  appContextService.start(createAppContextStartContractMock());
  const fleetConfig = appContextService.getConfig() as FleetConfigType;
  // Return the interface mocked with jest.fn() that fowards calls to the real instance
  return {
    createArtifact: jest.fn(async (...args) => {
      const fleetArtifactClient = new FleetArtifactsClient(esClient, 'endpoint', fleetConfig);
      const endpointArtifactClient = new EndpointArtifactClient(fleetArtifactClient);
      const response = await endpointArtifactClient.createArtifact(...args);
      return response;
    }),
    bulkCreateArtifacts: jest.fn(async (...args) => {
      const fleetArtifactClient = new FleetArtifactsClient(esClient, 'endpoint', fleetConfig);
      const endpointArtifactClient = new EndpointArtifactClient(fleetArtifactClient);
      const response = await endpointArtifactClient.bulkCreateArtifacts(...args);
      return response;
    }),
    listArtifacts: jest.fn((...args) => endpointArtifactClientMocked.listArtifacts(...args)),
    getArtifact: jest.fn((...args) => endpointArtifactClientMocked.getArtifact(...args)),
    deleteArtifact: jest.fn((...args) => endpointArtifactClientMocked.deleteArtifact(...args)),
    _esClient: esClient,
  };
};
