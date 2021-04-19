/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { AppAction } from '../../../../common/store/actions';
import {
  ImmutableMiddleware,
  ImmutableMiddlewareAPI,
  ImmutableMiddlewareFactory,
} from '../../../../common/store';

import { EventFilterHttpService, EventFilterService } from '../service';

import { EventFilterListPageState } from '../state';
import { getLastLoadedResourceState } from '../../../state/async_resource_state';
import {
  CreateExceptionListItemSchema,
  transformNewItemOutput,
} from '../../../../../public/shared_imports';

const eventFilterCreate = async (
  store: ImmutableMiddlewareAPI<EventFilterListPageState, AppAction>,
  eventFilterService: EventFilterService
) => {
  const submissionResourceState = store.getState().form.submissionResourceState;
  try {
    const formEntry = store.getState().form.entry;
    if (!formEntry) return;
    store.dispatch({
      type: 'eventFilterFormStateChanged',
      payload: {
        type: 'LoadingResourceState',
        previousState: { type: 'UninitialisedResourceState' },
      },
    });

    const sanitizedEntry = transformNewItemOutput(formEntry as CreateExceptionListItemSchema);

    const exception = await eventFilterService.addEventFilter(sanitizedEntry);
    store.dispatch({
      type: 'eventFilterFormStateChanged',
      payload: {
        type: 'LoadedResourceState',
        data: exception,
      },
    });
  } catch (error) {
    store.dispatch({
      type: 'eventFilterFormStateChanged',
      payload: {
        type: 'FailedResourceState',
        error: error.body || error,
        lastLoadedState: getLastLoadedResourceState(submissionResourceState),
      },
    });
  }
};

export const createEventFilterPageMiddleware = (
  eventFilterService: EventFilterService
): ImmutableMiddleware<EventFilterListPageState, AppAction> => {
  return (store) => (next) => async (action) => {
    next(action);

    if (action.type === 'eventFilterCreateStart') {
      await eventFilterCreate(store, eventFilterService);
    }
  };
};

export const eventFilterPageMiddlewareFactory: ImmutableMiddlewareFactory<EventFilterListPageState> = (
  coreStart
) => createEventFilterPageMiddleware(new EventFilterHttpService(coreStart.http));
