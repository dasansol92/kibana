/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useMemo } from 'react';
import type { QuerySuggestionGetFn } from '@kbn/unified-search-plugin/public/autocomplete';
import type { ValueSuggestionsGetFn } from '@kbn/unified-search-plugin/public/autocomplete/providers/value_suggestion_provider';

interface EndpointAutocompleteService {
  getQuerySuggestions: QuerySuggestionGetFn;
  hasQuerySuggestions: (language: string) => boolean;
  getValueSuggestions: ValueSuggestionsGetFn;
}

/**
 * Hook to get a memoized suggestions interface
 */
export function useSuggestions(fn: ValueSuggestionsGetFn): EndpointAutocompleteService {
  return useMemo(
    () => ({
      getQuerySuggestions: () => undefined,
      hasQuerySuggestions: (_) => false,
      getValueSuggestions: fn,
    }),
    [fn]
  );
}
