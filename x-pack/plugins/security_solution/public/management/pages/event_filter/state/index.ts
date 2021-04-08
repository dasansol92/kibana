/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  ExceptionListItemSchema,
  CreateExceptionListItemSchema,
} from '../../../../../public/shared_imports';
export interface EventFiltersListPageState {
  entries: ExceptionListItemSchema[];
  form: {
    entry: CreateExceptionListItemSchema | ExceptionListItemSchema | undefined;
    hasError: boolean;
    isLoadingAction: boolean;
    isLoadingEntry: boolean;
  };
}
