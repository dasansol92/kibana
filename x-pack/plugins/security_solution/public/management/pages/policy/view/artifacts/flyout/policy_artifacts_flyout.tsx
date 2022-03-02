/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from 'react-query';
import { isEmpty, without } from 'lodash/fp';
import { ExceptionListItemSchema } from '@kbn/securitysolution-io-ts-list-types';
import {
  EuiTitle,
  EuiFlyout,
  EuiSpacer,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonEmpty,
  EuiButton,
  EuiCallOut,
  EuiEmptyPrompt,
} from '@elastic/eui';
import { SearchExceptions } from '../../../../../components/search_exceptions';
import { ImmutableObject, PolicyData } from '../../../../../../../common/endpoint/types';
import { useToasts } from '../../../../../../common/lib/kibana';
import { PolicyArtifactsAssignableList } from '../../artifacts/assignable';
import { ExceptionsListApiClient } from '../../../../../services/exceptions_list/exceptions_list_api_client';
import { useListArtifact, useBulkUpdateArtifact } from '../../../../../hooks/artifacts';
import { POLICY_ARTIFACT_FLYOUT_LABELS } from './translations';

interface PolicyArtifactsFlyoutProps {
  policyItem: ImmutableObject<PolicyData>;
  apiClient: ExceptionsListApiClient;
  searcheableFields: string[];
  onClose: () => void;
  labels: typeof POLICY_ARTIFACT_FLYOUT_LABELS;
}

const MAX_ALLOWED_RESULTS = 100;

export const PolicyArtifactsFlyout = React.memo<PolicyArtifactsFlyoutProps>(
  ({ policyItem, apiClient, searcheableFields, onClose, labels }) => {
    const toasts = useToasts();
    const queryClient = useQueryClient();
    const [selectedArtifactIds, setSelectedArtifactIds] = useState<string[]>([]);
    const [currentFilter, setCurrentFilter] = useState<string>('');

    const bulkUpdateMutation = useBulkUpdateArtifact(apiClient, {
      onSuccess: (updatedExceptions: ExceptionListItemSchema[]) => {
        toasts.addSuccess({
          title: labels.flyoutSuccessMessageTitle,
          text: labels.flyoutSuccessMessageText(updatedExceptions),
        });
      },
      onError: () => {
        toasts.addDanger(labels.flyoutErrorMessage);
      },
      onSettled: () => {
        queryClient.invalidateQueries(['list', apiClient]);
        onClose();
      },
    });

    const {
      data: artifacts,
      isLoading: isLoadingArtifacts,
      isRefetching: isRefetchingArtifacts,
    } = useListArtifact(apiClient, searcheableFields, {
      perPage: MAX_ALLOWED_RESULTS,
      filter: currentFilter,
      excludedPolicies: [policyItem.id, 'global'],
    });

    const { data: allNotAssigned, isLoading: isLoadingAllNotAssigned } = useListArtifact(
      apiClient,
      searcheableFields,
      {
        excludedPolicies: [policyItem.id, 'global'],
      },
      {
        enabled: currentFilter !== '' && artifacts?.total === 0,
      }
    );

    const handleOnSearch = useCallback((query) => {
      setSelectedArtifactIds([]);
      setCurrentFilter(query);
    }, []);

    const handleOnConfirmAction = useCallback(() => {
      if (!artifacts) {
        return;
      }
      const artifactssToUpdate: ExceptionListItemSchema[] = [];
      selectedArtifactIds.forEach((selectedId) => {
        const artifact = artifacts.data.find((current) => current.id === selectedId);
        if (artifact) {
          artifact.tags = [...artifact.tags, `policy:${policyItem.id}`];
          artifactssToUpdate.push(artifact);
        }
      });
      bulkUpdateMutation.mutate(artifactssToUpdate);
    }, [bulkUpdateMutation, artifacts, policyItem.id, selectedArtifactIds]);

    const handleSelectArtifacts = (artifactId: string, selected: boolean) => {
      setSelectedArtifactIds((currentSelectedArtifactIds) =>
        selected
          ? [...currentSelectedArtifactIds, artifactId]
          : without([artifactId], currentSelectedArtifactIds)
      );
    };

    const searchWarningMessage = useMemo(
      () => (
        <>
          <EuiCallOut
            data-test-subj="artifacts-too-many-results"
            color="warning"
            size="s"
            heading="h4"
            title={labels.flyoutWarningCalloutTitle}
          >
            {labels.flyoutWarningCalloutMessage}
          </EuiCallOut>
          <EuiSpacer size="m" />
        </>
      ),
      [labels.flyoutWarningCalloutTitle, labels.flyoutWarningCalloutMessage]
    );

    const noItemsMessage = useMemo(() => {
      if (isLoadingArtifacts || isRefetchingArtifacts || isLoadingAllNotAssigned) {
        return null;
      }

      // there are no artifacts assignable to this policy
      if (allNotAssigned?.total === 0 || (artifacts?.total === 0 && currentFilter === '')) {
        return (
          <EuiEmptyPrompt
            data-test-subj="artifacts-no-assignable-items"
            title={<p>{labels.flyoutNoArtifactsToBeAssignedMessage}</p>}
          />
        );
      }

      // there are no results for the current search
      if (artifacts?.total === 0) {
        return (
          <EuiEmptyPrompt
            data-test-subj="artifacts-no-items-found"
            title={<p>{labels.flyoutNoSearchResultsMessage}</p>}
          />
        );
      }
    }, [
      isLoadingArtifacts,
      isRefetchingArtifacts,
      isLoadingAllNotAssigned,
      allNotAssigned?.total,
      artifacts?.total,
      currentFilter,
      labels.flyoutNoArtifactsToBeAssignedMessage,
      labels.flyoutNoSearchResultsMessage,
    ]);

    return (
      <EuiFlyout onClose={onClose} data-test-subj="artifacts-assign-flyout">
        <EuiFlyoutHeader hasBorder>
          <EuiTitle size="m">
            <h2>{labels.flyoutTitle}</h2>
          </EuiTitle>
          <EuiSpacer size="m" />
          {labels.flyoutSubtitle(policyItem.name)}
        </EuiFlyoutHeader>
        <EuiFlyoutBody>
          {(artifacts?.total || 0) > MAX_ALLOWED_RESULTS ? searchWarningMessage : null}
          <SearchExceptions
            onSearch={handleOnSearch}
            placeholder={labels.flyoutSearchPlaceholder}
            hideRefreshButton
          />
          <EuiSpacer size="m" />

          <PolicyArtifactsAssignableList
            data-test-subj="artifacts-assignable-list"
            artifacts={artifacts}
            selectedArtifactIds={selectedArtifactIds}
            isListLoading={isLoadingArtifacts || isRefetchingArtifacts}
            selectedArtifactsUpdated={handleSelectArtifacts}
          />

          {noItemsMessage}
        </EuiFlyoutBody>
        <EuiFlyoutFooter>
          <EuiFlexGroup justifyContent="spaceBetween">
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty data-test-subj="artifacts-assign-cancel-button" onClick={onClose}>
                {labels.flyoutCancelButtonTitle}
              </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton
                className="eui-textTruncate"
                style={{ maxWidth: '300px' }}
                data-test-subj="artifacts-assign-confirm-button"
                fill
                onClick={handleOnConfirmAction}
                isLoading={
                  bulkUpdateMutation.isLoading || isLoadingArtifacts || isRefetchingArtifacts
                }
                disabled={isEmpty(selectedArtifactIds)}
                title={policyItem.name}
              >
                {labels.flyoutSubmitButtonTitle(policyItem.name)}
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlyoutFooter>
      </EuiFlyout>
    );
  }
);

PolicyArtifactsFlyout.displayName = 'PolicyArtifactsFlyout';
