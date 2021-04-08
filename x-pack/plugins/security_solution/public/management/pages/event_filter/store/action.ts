/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { Action } from 'redux';
import {
  ExceptionListItemSchema,
  CreateExceptionListItemSchema,
} from '../../../../../public/shared_imports';

export type EventFilterInitForm = Action<'eventFilterInitForm'> & {
  payload: {
    entry: ExceptionListItemSchema | CreateExceptionListItemSchema;
  };
};

export type EventFilterCreateStart = Action<'eventFilterCreateStart'> & {
  payload: {
    entry: ExceptionListItemSchema | CreateExceptionListItemSchema;
  };
};

export type EventFiltersPageAction = EventFilterCreateStart | EventFilterInitForm;
