/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type {
  SearchStrategyDependencies,
  DataViewsServerPluginStart,
} from '@kbn/data-plugin/server';
import { fieldsBeat as beatFields } from '@kbn/timelines-plugin/server/utils/beat_schema/fields';
import { IndexPatternsFetcher } from '@kbn/data-plugin/server';
import { requestEventFiltersFieldsSearch } from '.';
import { createMockEndpointAppContextService } from '../../endpoint/mocks';
import { getEndpointAuthzInitialStateMock } from '../../../common/endpoint/service/authz/mocks';
import { eventsIndexPattern } from '../../../common/endpoint/constants';
import { EndpointAuthorizationError } from '../../endpoint/errors';

describe('Event filters fields', () => {
  const getFieldsForWildcardMock = jest.fn();
  const esClientSearchMock = jest.fn();
  const esClientFieldCapsMock = jest.fn();
  const endpointAppContextService = createMockEndpointAppContextService();
  let IndexPatterns: DataViewsServerPluginStart;

  const deps = {
    esClient: {
      asInternalUser: { search: esClientSearchMock, fieldCaps: esClientFieldCapsMock },
    },
  } as unknown as SearchStrategyDependencies;

  const mockPattern = {
    title: 'test',
    fields: {
      toSpec: () => ({
        coolio: {
          name: 'name_test',
          type: 'type_test',
          searchable: true,
          aggregatable: true,
        },
      }),
    },
    toSpec: () => ({
      runtimeFieldMap: { runtimeField: { type: 'keyword' } },
    }),
  };
  const getStartServices = jest.fn().mockReturnValue([
    null,
    {
      data: {
        indexPatterns: {
          dataViewsServiceFactory: () => ({
            get: jest.fn().mockReturnValue(mockPattern),
          }),
        },
      },
    },
  ]);

  beforeAll(() => {
    getFieldsForWildcardMock.mockResolvedValue([]);
    esClientSearchMock.mockResolvedValue({ hits: { total: { value: 123 } } });
    esClientFieldCapsMock.mockResolvedValue({ indices: ['value'] });
    IndexPatternsFetcher.prototype.getFieldsForWildcard = getFieldsForWildcardMock;
  });

  beforeEach(async () => {
    const [
      ,
      {
        data: { indexPatterns },
      },
    ] = await getStartServices();
    IndexPatterns = indexPatterns;
    getFieldsForWildcardMock.mockClear();
    esClientSearchMock.mockClear();
    esClientFieldCapsMock.mockClear();
  });

  afterAll(() => {
    getFieldsForWildcardMock.mockRestore();
  });
  describe('with right privileges', () => {
    it('should check index exists', async () => {
      const indices = [eventsIndexPattern];
      const request = {
        indices,
        onlyCheckIfIndicesExist: true,
      };

      const response = await requestEventFiltersFieldsSearch(
        endpointAppContextService,
        request,
        deps,
        beatFields,
        IndexPatterns
      );
      expect(response.indexFields).toHaveLength(0);
      expect(response.indicesExist).toEqual(indices);
    });

    it('should search index fields', async () => {
      const indices = [eventsIndexPattern];
      const request = {
        indices,
        onlyCheckIfIndicesExist: false,
      };

      const response = await requestEventFiltersFieldsSearch(
        endpointAppContextService,
        request,
        deps,
        beatFields,
        IndexPatterns
      );

      expect(getFieldsForWildcardMock).toHaveBeenCalledWith({ pattern: indices[0] });

      expect(response.indexFields).not.toHaveLength(0);
      expect(response.indicesExist).toEqual(indices);
    });

    it('should throw when invalid index', async () => {
      const indices = ['invalid'];
      const request = {
        indices,
        onlyCheckIfIndicesExist: false,
      };

      await expect(async () => {
        await requestEventFiltersFieldsSearch(
          endpointAppContextService,
          request,
          deps,
          beatFields,
          IndexPatterns
        );
      }).rejects.toThrowError('Invalid indices request invalid');
    });
  });

  describe('without right privileges', () => {
    beforeEach(() => {
      (endpointAppContextService.getEndpointAuthz as jest.Mock).mockResolvedValue(
        getEndpointAuthzInitialStateMock({ canReadEventFilters: true, canWriteEventFilters: false })
      );
    });

    it('should throw because not enough privileges', async () => {
      const indices = [eventsIndexPattern];
      const request = {
        indices,
        onlyCheckIfIndicesExist: false,
      };

      await expect(async () => {
        await requestEventFiltersFieldsSearch(
          endpointAppContextService,
          request,
          deps,
          beatFields,
          IndexPatterns
        );
      }).rejects.toThrowError(new EndpointAuthorizationError());
    });
  });
});
