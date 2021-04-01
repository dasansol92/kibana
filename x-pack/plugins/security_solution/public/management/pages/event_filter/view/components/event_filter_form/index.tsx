/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/* eslint complexity: ["error", 30]*/

import React, { memo, useEffect, useState, useCallback, useMemo } from 'react';
import {
  ExceptionListItemSchema,
  CreateExceptionListItemSchema,
  ExceptionListType,
} from '../../../../../../../public/lists_plugin_deps';
import { useKibana } from '../../../../../../common/lib/kibana';
import { ExceptionBuilderComponent } from '../../../../../../common/components/exceptions/builder';
import { useRuleAsync } from '../../../../../../detections/containers/detection_engine/rules/use_rule_async';
import { useFetchOrCreateRuleExceptionList } from '../../../../../../common/components/exceptions/use_fetch_or_create_rule_exception_list';
import {
  defaultEndpointExceptionItems,
  entryHasListType,
  entryHasNonEcsType,
} from '../../../../../../common/components/exceptions/helpers';
import { ErrorInfo } from '../../../../../../common/components/exceptions/error_callout';
import {
  AlertData,
  ExceptionsBuilderExceptionItem,
} from '../../../../../../common/components/exceptions/types';
import { useFetchIndex } from '../../../../../../common/containers/source';
import { useGetInstalledJob } from '../../../../../../common/components/ml/hooks/use_get_jobs';
import { useSignalIndex } from '../../../../../../detections/containers/detection_engine/alerts/use_signal_index';

export interface EventFilterFormProps {
  ruleName: string;
  ruleId: string;
  exceptionListType: ExceptionListType;
  ruleIndices: string[];
  alertData?: AlertData;
  onRuleChange?: () => void;
}

export const EventFilterForm = memo(
  ({
    ruleName,
    ruleId,
    exceptionListType,
    ruleIndices,
    alertData,
    onRuleChange,
  }: EventFilterFormProps) => {
    const { http, data } = useKibana().services;
    const [errorsExist, setErrorExists] = useState(false);
    const { rule: maybeRule, loading: isRuleLoading } = useRuleAsync(ruleId);
    const [shouldBulkCloseAlert, setShouldBulkCloseAlert] = useState(false);
    const [shouldDisableBulkClose, setShouldDisableBulkClose] = useState(false);
    const [exceptionItemsToAdd, setExceptionItemsToAdd] = useState<
      Array<ExceptionListItemSchema | CreateExceptionListItemSchema>
    >([]);
    const [fetchOrCreateListError, setFetchOrCreateListError] = useState<ErrorInfo | null>(null);
    const { loading: isSignalIndexLoading, signalIndexName } = useSignalIndex();
    const memoSignalIndexName = useMemo(() => (signalIndexName !== null ? [signalIndexName] : []), [
      signalIndexName,
    ]);
    const [isSignalIndexPatternLoading, { indexPatterns: signalIndexPatterns }] = useFetchIndex(
      memoSignalIndexName
    );

    const memoMlJobIds = useMemo(
      () => (maybeRule?.machine_learning_job_id != null ? [maybeRule.machine_learning_job_id] : []),
      [maybeRule]
    );
    const { loading: mlJobLoading, jobs } = useGetInstalledJob(memoMlJobIds);

    const memoRuleIndices = useMemo(() => {
      if (jobs.length > 0) {
        return jobs[0].results_index_name ? [`.ml-anomalies-${jobs[0].results_index_name}`] : [];
      } else {
        return ruleIndices;
      }
    }, [jobs, ruleIndices]);

    const [isIndexPatternLoading, { indexPatterns }] = useFetchIndex(memoRuleIndices);

    const handleBuilderOnChange = useCallback(
      ({
        exceptionItems,
        errorExists,
      }: {
        exceptionItems: Array<ExceptionListItemSchema | CreateExceptionListItemSchema>;
        errorExists: boolean;
      }) => {
        setExceptionItemsToAdd(exceptionItems);
        setErrorExists(errorExists);
      },
      [setExceptionItemsToAdd]
    );

    const handleRuleChange = useCallback(
      (ruleChanged: boolean): void => {
        if (ruleChanged && onRuleChange) {
          onRuleChange();
        }
      },
      [onRuleChange]
    );

    const handleFetchOrCreateExceptionListError = useCallback(
      (error: Error, statusCode: number | null, message: string | null): void => {
        setFetchOrCreateListError({
          reason: error.message,
          code: statusCode,
          details: message,
          listListId: null,
        });
      },
      [setFetchOrCreateListError]
    );

    const [isLoadingExceptionList, ruleExceptionList] = useFetchOrCreateRuleExceptionList({
      http,
      ruleId,
      exceptionListType,
      onError: handleFetchOrCreateExceptionListError,
      onSuccess: handleRuleChange,
    });

    const initialExceptionItems = useMemo((): ExceptionsBuilderExceptionItem[] => {
      if (exceptionListType === 'endpoint' && alertData != null && ruleExceptionList) {
        return defaultEndpointExceptionItems(ruleExceptionList.list_id, ruleName, alertData);
      } else {
        return [];
      }
    }, [exceptionListType, ruleExceptionList, ruleName, alertData]);

    useEffect((): void => {
      if (isSignalIndexPatternLoading === false && isSignalIndexLoading === false) {
        setShouldDisableBulkClose(
          entryHasListType(exceptionItemsToAdd) ||
            entryHasNonEcsType(exceptionItemsToAdd, signalIndexPatterns) ||
            exceptionItemsToAdd.every((item) => item.entries.length === 0)
        );
      }
    }, [
      setShouldDisableBulkClose,
      exceptionItemsToAdd,
      isSignalIndexPatternLoading,
      isSignalIndexLoading,
      signalIndexPatterns,
    ]);

    useEffect((): void => {
      if (shouldDisableBulkClose === true) {
        setShouldBulkCloseAlert(false);
      }
    }, [shouldDisableBulkClose]);

    if (!ruleExceptionList) return null;
    return (
      <ExceptionBuilderComponent
        httpService={http}
        autocompleteService={data.autocomplete}
        exceptionListItems={initialExceptionItems}
        listType={exceptionListType}
        listId={ruleExceptionList.list_id}
        listNamespaceType={ruleExceptionList.namespace_type}
        ruleName={ruleName}
        indexPatterns={indexPatterns}
        isOrDisabled={false}
        isAndDisabled={false}
        isNestedDisabled={false}
        data-test-subj="alert-exception-builder"
        id-aria="alert-exception-builder"
        onChange={handleBuilderOnChange}
        ruleType={maybeRule?.type}
      />
    );
  }
);

EventFilterForm.displayName = 'EventFilterForm';
