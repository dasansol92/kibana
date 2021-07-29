/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */
import type { estypes } from '@elastic/elasticsearch';
import { get, isPlainObject } from 'lodash';
import type { Filter, FilterMeta } from './types';
import type { IndexPatternFieldBase, IndexPatternBase } from '../../es_query';
import { getConvertedValueForField } from './get_converted_value_for_field';

export type PhraseFilterMeta = FilterMeta & {
  params?: {
    query: string; // The unformatted value
  };
  field?: any;
  index?: any;
};

export type PhraseFilter = Filter & {
  meta: PhraseFilterMeta;
  script?: {
    script: {
      source?: any;
      lang?: estypes.ScriptLanguage;
      params: any;
    };
  };
};

type PhraseFilterValue = string | number | boolean;

export const isPhraseFilter = (filter: any): filter is PhraseFilter => {
  const isMatchPhraseQuery = filter && filter.query && filter.query.match_phrase;

  const isDeprecatedMatchPhraseQuery =
    filter &&
    filter.query &&
    filter.query.match &&
    Object.values(filter.query.match).find((params: any) => params.type === 'phrase');

  return Boolean(isMatchPhraseQuery || isDeprecatedMatchPhraseQuery);
};

export const isScriptedPhraseFilter = (filter: any): filter is PhraseFilter =>
  Boolean(get(filter, 'script.script.params.value'));

export const getPhraseFilterField = (filter: PhraseFilter) => {
  const queryConfig = filter.query.match_phrase || filter.query.match;
  return Object.keys(queryConfig)[0];
};

export const getPhraseFilterValue = (filter: PhraseFilter): PhraseFilterValue => {
  const queryConfig = filter.query.match_phrase || filter.query.match;
  const queryValue = Object.values(queryConfig)[0] as any;
  return isPlainObject(queryValue) ? queryValue.query : queryValue;
};

export const buildPhraseFilter = (
  field: IndexPatternFieldBase,
  value: any,
  indexPattern: IndexPatternBase
): PhraseFilter => {
  const convertedValue = getConvertedValueForField(field, value);

  if (field.scripted) {
    return {
      meta: { index: indexPattern.id, field: field.name } as PhraseFilterMeta,
      script: getPhraseScript(field, value),
    };
  } else {
    return {
      meta: { index: indexPattern.id },
      query: {
        match_phrase: {
          [field.name]: convertedValue,
        },
      },
    } as PhraseFilter;
  }
};

export const getPhraseScript = (field: IndexPatternFieldBase, value: string) => {
  const convertedValue = getConvertedValueForField(field, value);
  const script = buildInlineScriptForPhraseFilter(field);

  return {
    script: {
      source: script,
      lang: field.lang,
      params: {
        value: convertedValue,
      },
    },
  };
};

/**
 * @internal
 * Takes a scripted field and returns an inline script appropriate for use in a script query.
 * Handles lucene expression and Painless scripts. Other langs aren't guaranteed to generate valid
 * scripts.
 *
 * @param {object} scriptedField A Field object representing a scripted field
 * @returns {string} The inline script string
 */
export const buildInlineScriptForPhraseFilter = (scriptedField: any) => {
  // We must wrap painless scripts in a lambda in case they're more than a simple expression
  if (scriptedField.lang === 'painless') {
    return (
      `boolean compare(Supplier s, def v) {return s.get() == v;}` +
      `compare(() -> { ${scriptedField.script} }, params.value);`
    );
  } else {
    return `(${scriptedField.script}) == value`;
  }
};
