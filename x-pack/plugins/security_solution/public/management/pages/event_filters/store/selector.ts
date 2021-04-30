/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EventFiltersListPageState, EventFiltersPageLocation } from '../types';
import { ExceptionListItemSchema, UpdateExceptionListItemSchema } from '../../../../shared_imports';
import { ServerApiError } from '../../../../common/types';
import {
  isLoadingResourceState,
  isLoadedResourceState,
  isFailedResourceState,
} from '../../../state/async_resource_state';

export const getFormEntry = (
  state: EventFiltersListPageState
): UpdateExceptionListItemSchema | ExceptionListItemSchema | undefined => {
  return state.form.entry;
};

export const getNewComment = (state: EventFiltersListPageState): string => {
  return state.form.newComment;
};

export const getHasNameError = (state: EventFiltersListPageState): boolean => {
  return state.form.hasNameError;
};

export const getFormHasError = (state: EventFiltersListPageState): boolean => {
  return state.form.hasItemsError || state.form.hasNameError || state.form.hasOSError;
};

export const isCreationInProgress = (state: EventFiltersListPageState): boolean => {
  return isLoadingResourceState(state.form.submissionResourceState);
};

export const isCreationSuccessful = (state: EventFiltersListPageState): boolean => {
  return isLoadedResourceState(state.form.submissionResourceState);
};

export const getActionError = (state: EventFiltersListPageState): ServerApiError | undefined => {
  const submissionResourceState = state.form.submissionResourceState;

  return isFailedResourceState(submissionResourceState) ? submissionResourceState.error : undefined;
};

export const getCurrentLocation = (state: EventFiltersListPageState): EventFiltersPageLocation =>
  state.location;
