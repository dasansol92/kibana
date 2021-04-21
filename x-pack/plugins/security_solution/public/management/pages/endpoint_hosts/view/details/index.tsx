/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useEffect, memo, useMemo } from 'react';
import {
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiLoadingContent,
  EuiTitle,
  EuiText,
  EuiSpacer,
  EuiEmptyPrompt,
  EuiToolTip,
} from '@elastic/eui';
import { useHistory } from 'react-router-dom';
import { FormattedMessage } from '@kbn/i18n/react';
import { i18n } from '@kbn/i18n';
import styled from 'styled-components';
import { useToasts } from '../../../../../common/lib/kibana';
import { useEndpointSelector } from '../hooks';
import { urlFromQueryParams } from '../url_from_query_params';
import {
  uiQueryParams,
  detailsData,
  detailsError,
  showView,
  detailsLoading,
  policyResponseConfigurations,
  policyResponseActions,
  policyResponseFailedOrWarningActionCount,
  policyResponseError,
  policyResponseLoading,
  policyResponseTimestamp,
  policyVersionInfo,
  hostStatusInfo,
  policyResponseAppliedRevision,
} from '../../store/selectors';
import { EndpointDetails } from './endpoint_details';
import { PolicyResponse } from './policy_response';
import { HostMetadata } from '../../../../../../common/endpoint/types';
import { FlyoutSubHeader, FlyoutSubHeaderProps } from './components/flyout_sub_header';
import { useNavigateByRouterEventHandler } from '../../../../../common/hooks/endpoint/use_navigate_by_router_event_handler';
import { getEndpointListPath } from '../../../../common/routing';
import { SecurityPageName } from '../../../../../app/types';
import { useFormatUrl } from '../../../../../common/components/link_to';
import { PreferenceFormattedDateFromPrimitive } from '../../../../../common/components/formatted_date';

export const EndpointDetailsFlyout = memo(() => {
  const history = useHistory();
  const toasts = useToasts();
  const queryParams = useEndpointSelector(uiQueryParams);
  const {
    selected_endpoint: selectedEndpoint,
    ...queryParamsWithoutSelectedEndpoint
  } = queryParams;
  const details = useEndpointSelector(detailsData);
  const policyInfo = useEndpointSelector(policyVersionInfo);
  const hostStatus = useEndpointSelector(hostStatusInfo);
  const loading = useEndpointSelector(detailsLoading);
  const error = useEndpointSelector(detailsError);
  const show = useEndpointSelector(showView);

  const handleFlyoutClose = useCallback(() => {
    history.push(urlFromQueryParams(queryParamsWithoutSelectedEndpoint));
  }, [history, queryParamsWithoutSelectedEndpoint]);

  useEffect(() => {
    if (error !== undefined) {
      toasts.addDanger({
        title: i18n.translate('xpack.securitySolution.endpoint.details.errorTitle', {
          defaultMessage: 'Could not find host',
        }),
        text: i18n.translate('xpack.securitySolution.endpoint.details.errorBody', {
          defaultMessage: 'Please exit the flyout and select an available host.',
        }),
      });
    }
  }, [error, toasts]);

  return (
    <EuiFlyout
      onClose={handleFlyoutClose}
      style={{ zIndex: 4001 }}
      data-test-subj="endpointDetailsFlyout"
      size="m"
    >
      <EuiFlyoutHeader hasBorder>
        {loading ? (
          <EuiLoadingContent lines={1} />
        ) : (
          <EuiToolTip content={details?.host?.hostname} anchorClassName="eui-textTruncate">
            <EuiTitle size="s">
              <h2
                style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
                data-test-subj="endpointDetailsFlyoutTitle"
              >
                {details?.host?.hostname}
              </h2>
            </EuiTitle>
          </EuiToolTip>
        )}
      </EuiFlyoutHeader>
      {details === undefined ? (
        <>
          <EuiFlyoutBody>
            <EuiLoadingContent lines={3} /> <EuiSpacer size="l" /> <EuiLoadingContent lines={3} />
          </EuiFlyoutBody>
        </>
      ) : (
        <>
          {show === 'details' && (
            <>
              <EuiFlyoutBody data-test-subj="endpointDetailsFlyoutBody">
                <EndpointDetails
                  details={details}
                  policyInfo={policyInfo}
                  hostStatus={hostStatus}
                />
              </EuiFlyoutBody>
            </>
          )}
          {show === 'policy_response' && <PolicyResponseFlyoutPanel hostMeta={details} />}
        </>
      )}
    </EuiFlyout>
  );
});

EndpointDetailsFlyout.displayName = 'EndpointDetailsFlyout';

const PolicyResponseFlyoutBody = styled(EuiFlyoutBody)`
  .euiFlyoutBody__overflowContent {
    padding-top: 0;
  }
`;

const PolicyResponseFlyoutPanel = memo<{
  hostMeta: HostMetadata;
}>(({ hostMeta }) => {
  const { show, ...queryParams } = useEndpointSelector(uiQueryParams);
  const responseConfig = useEndpointSelector(policyResponseConfigurations);
  const responseActions = useEndpointSelector(policyResponseActions);
  const responseAttentionCount = useEndpointSelector(policyResponseFailedOrWarningActionCount);
  const loading = useEndpointSelector(policyResponseLoading);
  const error = useEndpointSelector(policyResponseError);
  const { formatUrl } = useFormatUrl(SecurityPageName.administration);
  const responseTimestamp = useEndpointSelector(policyResponseTimestamp);
  const responsePolicyRevisionNumber = useEndpointSelector(policyResponseAppliedRevision);
  const [detailsUri, detailsRoutePath] = useMemo(
    () => [
      formatUrl(
        getEndpointListPath({
          name: 'endpointList',
          ...queryParams,
          selected_endpoint: hostMeta.agent.id,
        })
      ),
      getEndpointListPath({
        name: 'endpointList',
        ...queryParams,
        selected_endpoint: hostMeta.agent.id,
      }),
    ],
    [hostMeta.agent.id, formatUrl, queryParams]
  );
  const backToDetailsClickHandler = useNavigateByRouterEventHandler(detailsRoutePath);
  const backButtonProp = useMemo((): FlyoutSubHeaderProps['backButton'] => {
    return {
      title: i18n.translate('xpack.securitySolution.endpoint.policyResponse.backLinkTitle', {
        defaultMessage: 'Endpoint Details',
      }),
      href: detailsUri,
      onClick: backToDetailsClickHandler,
    };
  }, [backToDetailsClickHandler, detailsUri]);

  return (
    <>
      <FlyoutSubHeader
        backButton={backButtonProp}
        data-test-subj="endpointDetailsPolicyResponseFlyoutHeader"
      />
      <PolicyResponseFlyoutBody
        data-test-subj="endpointDetailsPolicyResponseFlyoutBody"
        className="endpointDetailsPolicyResponseFlyoutBody"
      >
        <EuiText data-test-subj="endpointDetailsPolicyResponseFlyoutTitle">
          <h4>
            <FormattedMessage
              id="xpack.securitySolution.endpoint.policyResponse.title"
              defaultMessage="Policy Response"
            />
          </h4>
        </EuiText>
        <EuiSpacer size="s" />
        <EuiText size="xs" color="subdued" data-test-subj="endpointDetailsPolicyResponseTimestamp">
          <FormattedMessage
            id="xpack.securitySolution.endpoint.policyResponse.appliedOn"
            defaultMessage="Revision {rev} applied on {date}"
            values={{
              rev: responsePolicyRevisionNumber,
              date: <PreferenceFormattedDateFromPrimitive value={responseTimestamp} />,
            }}
          />
        </EuiText>
        <EuiSpacer size="s" />
        {error && (
          <EuiEmptyPrompt
            title={
              <FormattedMessage
                id="xpack.securitySolution.endpoint.details.noPolicyResponse"
                defaultMessage="No policy response available"
              />
            }
          />
        )}
        {loading && <EuiLoadingContent lines={3} />}
        {responseConfig !== undefined && responseActions !== undefined && (
          <PolicyResponse
            responseConfig={responseConfig}
            responseActions={responseActions}
            responseAttentionCount={responseAttentionCount}
          />
        )}
      </PolicyResponseFlyoutBody>
    </>
  );
});

PolicyResponseFlyoutPanel.displayName = 'PolicyResponseFlyoutPanel';
