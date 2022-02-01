/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { ENDPOINT_TRUSTED_APPS_LIST_ID } from '@kbn/securitysolution-list-constants';
import { HttpStart } from 'kibana/public';
import { ExceptionsListApiClient } from '../../../services/exceptionsList/exceptionsListApiClient';
import { TRUSTED_APPS_EXCEPTION_LIST_DEFINITION } from '../constants';

/**
 * Trusted apps Api client class using ExceptionsListApiClient as base class
 * It follow the Singleton pattern.
 * Please, use the getInstance method instead of creating a new instance when using this implementation.
 */
export class TrustedAppsApiClient extends ExceptionsListApiClient {
  constructor(http: HttpStart) {
    super(http, ENDPOINT_TRUSTED_APPS_LIST_ID, TRUSTED_APPS_EXCEPTION_LIST_DEFINITION);
  }

  public static getInstance(http: HttpStart): ExceptionsListApiClient {
    return super.getInstance(
      http,
      ENDPOINT_TRUSTED_APPS_LIST_ID,
      TRUSTED_APPS_EXCEPTION_LIST_DEFINITION
    );
  }
}
