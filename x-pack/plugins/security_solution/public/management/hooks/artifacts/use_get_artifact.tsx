/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { ExceptionListItemSchema } from '@kbn/securitysolution-io-ts-list-types';
import { QueryObserverResult, useQuery } from 'react-query';
import { ServerApiError } from '../../../common/types';
import { ExceptionsListApiClient } from '../../services/exceptions_list/exceptions_list_api_client';

export function useGetArtifact(
  exceptionListApiClient: ExceptionsListApiClient,
  id: string
): QueryObserverResult<ExceptionListItemSchema, ServerApiError> {
  return useQuery<ExceptionListItemSchema, ServerApiError>(
    ['get', exceptionListApiClient, id],
    () => {
      return exceptionListApiClient.get(id);
    },
    {
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    }
  );
}
