/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
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
import { EventFiltersHttpService } from '../../../../event_filters/service';
import { useHttp } from '../../../../../../common/lib/kibana';
import {
  useSearchNotAssignedEventFilters,
  useGetAllAssignedEventFilters,
  useBulkUpdateEventFilters,
} from '../hooks';
import { PolicyArtifactsAssignableList } from '../../artifacts/assignable';

interface PolicyEventFiltersFlyoutProps {
  policyItem: ImmutableObject<PolicyData>;
  onClose: () => void;
}

const MAX_ALLOWED_RESULTS = 100;

export const PolicyEventFiltersFlyout = React.memo<PolicyEventFiltersFlyoutProps>(
  ({ policyItem, onClose }) => {
    const [selectedArtifactIds, setSelectedArtifactIds] = useState<string[]>([]);
    const [currentFilter, setCurrentFilter] = useState<string>('');
    const http = useHttp();
    const eventFiltersService = useMemo(() => new EventFiltersHttpService(http), [http]);

    const bulkUpdateMutation = useBulkUpdateEventFilters();
    const { data: eventFilters, isLoading: isLoadingEventFilters } =
      useSearchNotAssignedEventFilters(eventFiltersService, policyItem.id, {
        filter: currentFilter,
      });

    const { data: allAssigned, isLoading: isLoadingAllAssigned } = useGetAllAssignedEventFilters(
      policyItem.id,
      currentFilter !== '' && eventFilters?.total === 0,
      'assignmentFlyout'
    );

    const handleOnSearch = useCallback((query) => {
      setSelectedArtifactIds([]);
      setCurrentFilter(query);
    }, []);

    const handleOnConfirmAction = useCallback(() => {
      if (!eventFilters) {
        return;
      }
      const eventFiltersToUpdate: ExceptionListItemSchema[] = [];
      selectedArtifactIds.forEach((selectedId) => {
        const eventFilter = eventFilters.data.find((current) => current.id === selectedId);
        if (eventFilter) {
          eventFilter.tags = [...eventFilter.tags, `policy:${policyItem.id}`];
          eventFiltersToUpdate.push(eventFilter);
        }
      });
      bulkUpdateMutation.mutate(eventFiltersToUpdate);
    }, [bulkUpdateMutation, eventFilters, policyItem.id, selectedArtifactIds]);

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
            data-test-subj="eventFilters-too-many-results"
            color="warning"
            size="s"
            heading="h4"
            title={i18n.translate(
              'xpack.securitySolution.endpoint.policy.eventFilters.layout.flyout.searchWarning.title',
              {
                defaultMessage: 'Limited search results',
              }
            )}
          >
            {i18n.translate(
              'xpack.securitySolution.endpoint.policy.eventFilters.layout.flyout.searchWarning.text',
              {
                defaultMessage:
                  'Only the first 100 event filters are displayed. Please use the search bar to refine the results.',
              }
            )}
          </EuiCallOut>
          <EuiSpacer size="m" />
        </>
      ),
      []
    );

    const noItemsMessage = useMemo(() => {
      if (isLoadingEventFilters || isLoadingAllAssigned) {
        return null;
      }

      // there are no event filters assignable to this policy
      if (allAssigned?.total === 0 || (eventFilters?.total === 0 && currentFilter === '')) {
        return (
          <EuiEmptyPrompt
            data-test-subj="eventFilters-no-assignable-items"
            title={
              <FormattedMessage
                id="xpack.securitySolution.endpoint.policy.eventFilters.layout.flyout.noAssignable"
                defaultMessage="There are no event filters that can be assigned to this policy."
              />
            }
          />
        );
      }

      // there are no results for the current search
      if (eventFilters?.total === 0) {
        return (
          <EuiEmptyPrompt
            data-test-subj="eventFilters-no-items-found"
            title={
              <FormattedMessage
                id="xpack.securitySolution.endpoint.policy.eventFilters.layout.flyout.noResults"
                defaultMessage="No items found"
              />
            }
          />
        );
      }
    }, [
      allAssigned?.total,
      currentFilter,
      eventFilters?.total,
      isLoadingAllAssigned,
      isLoadingEventFilters,
    ]);

    return (
      <EuiFlyout onClose={onClose} data-test-subj="eventFilters-assign-flyout">
        <EuiFlyoutHeader hasBorder>
          <EuiTitle size="m">
            <h2>
              <FormattedMessage
                id="xpack.securitySolution.endpoint.policy.eventFilters.layout.flyout.title"
                defaultMessage="Assign event filters"
              />
            </h2>
          </EuiTitle>
          <EuiSpacer size="m" />
          <FormattedMessage
            id="xpack.securitySolution.endpoint.policy.eventFilters.layout.flyout.subtitle"
            defaultMessage="Select event filters to add to {policyName}"
            values={{ policyName: policyItem.name }}
          />
        </EuiFlyoutHeader>
        <EuiFlyoutBody>
          {(eventFilters?.total || 0) > MAX_ALLOWED_RESULTS ? searchWarningMessage : null}
          <SearchExceptions
            onSearch={handleOnSearch}
            placeholder={i18n.translate(
              'xpack.securitySolution.endpoint.policy.eventFilters.layout.searh.label',
              {
                defaultMessage: 'Search event filters',
              }
            )}
            hideRefreshButton
          />
          <EuiSpacer size="m" />

          <PolicyArtifactsAssignableList
            data-test-subj="eventFilters-assignable-list"
            artifacts={eventFilters}
            selectedArtifactIds={selectedArtifactIds}
            isListLoading={isLoadingEventFilters}
            selectedArtifactsUpdated={handleSelectArtifacts}
          />

          {noItemsMessage}
        </EuiFlyoutBody>
        <EuiFlyoutFooter>
          <EuiFlexGroup justifyContent="spaceBetween">
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty data-test-subj="eventFilters-assign-cancel-button" onClick={onClose}>
                <FormattedMessage
                  id="xpack.securitySolution.endpoint.policy.eventFilters.layout.flyout.cancel"
                  defaultMessage="Cancel"
                />
              </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton
                className="eui-textTruncate"
                style={{ maxWidth: '300px' }}
                data-test-subj="eventFilters-assign-confirm-button"
                fill
                onClick={handleOnConfirmAction}
                isLoading={bulkUpdateMutation.isLoading || isLoadingEventFilters}
                disabled={isEmpty(selectedArtifactIds)}
                title={policyItem.name}
              >
                <FormattedMessage
                  id="xpack.securitySolution.endpoint.policy.eventFilters.layout.flyout.confirm"
                  defaultMessage="Assign to {policyName}"
                  values={{
                    policyName: policyItem.name,
                  }}
                />
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlyoutFooter>
      </EuiFlyout>
    );
  }
);

PolicyEventFiltersFlyout.displayName = 'PolicyEventFiltersFlyout';
