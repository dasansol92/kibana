/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { ScopedClusterClientMock } from '@kbn/core/server/mocks';
import { loggingSystemMock, httpServerMock, httpServiceMock } from '@kbn/core/server/mocks';
import type { KibanaResponseFactory, SavedObjectsClientContract } from '@kbn/core/server';

import {
  createMockEndpointAppContextServiceStartContract,
  createRouteHandlerContext,
} from '../../mocks';
import type { EndpointAuthz } from '../../../../common/endpoint/types/authz';

import { createMockConfig } from '../../../lib/detection_engine/routes/__mocks__';

import { getEndpointAuthzInitialStateMock } from '../../../../common/endpoint/service/authz/mocks';

import { EndpointAppContextService } from '../../endpoint_app_context_services';
import { parseExperimentalConfigValue } from '../../../../common/experimental_features';

import { registerActionStateRoutes } from './state';
import type { RouterMock } from '@kbn/core-http-router-server-mocks';
import { ACTION_STATE_ROUTE } from '../../../../common/endpoint/constants';

interface CallRouteInterface {
  authz?: Partial<EndpointAuthz>;
}

describe('when calling the Actions state route handler', () => {
  let mockScopedEsClient: ScopedClusterClientMock;
  let mockSavedObjectClient: jest.Mocked<SavedObjectsClientContract>;
  let mockResponse: jest.Mocked<KibanaResponseFactory>;
  let callRoute: (
    routerMock: RouterMock,
    routePrefix: string,
    opts: CallRouteInterface,
    indexExists?: { endpointDsExists: boolean }
  ) => Promise<void>;

  beforeEach(() => {
    const startContract = createMockEndpointAppContextServiceStartContract();
    mockResponse = httpServerMock.createResponseFactory();
    // define a convenience function to execute an API call for a given route
    callRoute = async (
      routerMock: RouterMock,
      routePrefix: string,
      { authz = {} }: CallRouteInterface
    ): Promise<void> => {
      const superUser = {
        username: 'superuser',
        roles: ['superuser'],
      };
      (startContract.security.authc.getCurrentUser as jest.Mock).mockImplementationOnce(
        () => superUser
      );

      const ctx = createRouteHandlerContext(mockScopedEsClient, mockSavedObjectClient);

      ctx.securitySolution.getEndpointAuthz.mockResolvedValue(
        getEndpointAuthzInitialStateMock(authz)
      );

      const mockRequest = httpServerMock.createKibanaRequest();
      const [, routeHandler] = routerMock.get.mock.calls.find(([{ path }]) =>
        path.startsWith(routePrefix)
      )!;

      await routeHandler(ctx, mockRequest, mockResponse);
    };
  });
  describe('with having right privileges', () => {
    it('when can encrypt is set to true', async () => {
      const routerMock: RouterMock = httpServiceMock.createRouter();
      const endpointAppContextService = new EndpointAppContextService();
      registerActionStateRoutes(
        routerMock,
        {
          logFactory: loggingSystemMock.create(),
          service: endpointAppContextService,
          config: () => Promise.resolve(createMockConfig()),
          experimentalFeatures: parseExperimentalConfigValue(createMockConfig().enableExperimental),
        },
        true
      );

      await callRoute(routerMock, ACTION_STATE_ROUTE, {
        authz: { canIsolateHost: true },
      });

      expect(mockResponse.ok).toHaveBeenCalledWith({ body: { data: { canEncrypt: true } } });
    });

    it('when can encrypt is set to false', async () => {
      const routerMock: RouterMock = httpServiceMock.createRouter();
      const endpointAppContextService = new EndpointAppContextService();
      registerActionStateRoutes(
        routerMock,
        {
          logFactory: loggingSystemMock.create(),
          service: endpointAppContextService,
          config: () => Promise.resolve(createMockConfig()),
          experimentalFeatures: parseExperimentalConfigValue(createMockConfig().enableExperimental),
        },
        false
      );

      await callRoute(routerMock, ACTION_STATE_ROUTE, {
        authz: { canIsolateHost: true },
      });

      expect(mockResponse.ok).toHaveBeenCalledWith({ body: { data: { canEncrypt: false } } });
    });
  });
  describe('without having right privileges', () => {
    it('when can encrypt is set to true', async () => {
      const routerMock: RouterMock = httpServiceMock.createRouter();
      const endpointAppContextService = new EndpointAppContextService();
      registerActionStateRoutes(
        routerMock,
        {
          logFactory: loggingSystemMock.create(),
          service: endpointAppContextService,
          config: () => Promise.resolve(createMockConfig()),
          experimentalFeatures: parseExperimentalConfigValue(createMockConfig().enableExperimental),
        },
        true
      );

      await callRoute(routerMock, ACTION_STATE_ROUTE, {
        authz: {
          canIsolateHost: false,
          canUnIsolateHost: false,
          canKillProcess: false,
          canSuspendProcess: false,
          canGetRunningProcesses: false,
          canAccessResponseConsole: false,
          canWriteExecuteOperations: false,
          canWriteFileOperations: false,
        },
      });

      expect(mockResponse.forbidden).toHaveBeenCalled();
    });
  });
});
