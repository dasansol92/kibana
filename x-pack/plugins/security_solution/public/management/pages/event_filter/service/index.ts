/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { HttpStart } from 'kibana/public';
import {
  ExceptionListItemSchema,
  CreateExceptionListItemSchema,
} from '../../../../../public/shared_imports';
import { Immutable } from '../../../../../common/endpoint/types';
import { EVENT_FILTER_LIST, EXCEPTION_LIST_ITEM_URL, EXCEPTION_LIST_URL } from '../constants';

export interface EventFilterService {
  addEventFilter(
    exception: Immutable<ExceptionListItemSchema | CreateExceptionListItemSchema>
  ): Promise<ExceptionListItemSchema>;
}
export class EventFilterHttpService implements EventFilterService {
  private hasCreatedList: boolean;

  constructor(private http: HttpStart) {
    this.hasCreatedList = false;
  }

  private async createEndpointEventList() {
    try {
      await this.http.post<ExceptionListItemSchema>(EXCEPTION_LIST_URL, {
        body: JSON.stringify(EVENT_FILTER_LIST),
      });
    } catch (err) {
      // Ignore 409 errors. List already created
      if (err.response.status === 409) this.hasCreatedList = true;
      else throw err;
    }
  }

  private async httpWrapper() {
    if (!this.hasCreatedList) await this.createEndpointEventList();
    return this.http;
  }

  async addEventFilter(exception: ExceptionListItemSchema | CreateExceptionListItemSchema) {
    return (await this.httpWrapper()).post<ExceptionListItemSchema>(EXCEPTION_LIST_ITEM_URL, {
      body: JSON.stringify(exception),
    });
  }
}
