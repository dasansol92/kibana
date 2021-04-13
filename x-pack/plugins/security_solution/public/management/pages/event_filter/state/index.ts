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
import { AsyncResourceState } from '../../../state/async_resource_state';
export interface EventFilterListPageState {
  entries: ExceptionListItemSchema[];
  form: {
    entry: CreateExceptionListItemSchema | ExceptionListItemSchema | undefined;
    hasError: boolean;
    submissionResourceState: AsyncResourceState<ExceptionListItemSchema>;
  };
}
