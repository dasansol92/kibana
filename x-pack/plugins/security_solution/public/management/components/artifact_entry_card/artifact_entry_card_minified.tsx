/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { memo, useCallback, useState, useMemo } from 'react';
import {
  CommonProps,
  EuiPanel,
  EuiText,
  EuiAccordion,
  EuiTitle,
  EuiCheckbox,
  EuiSplitPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonEmpty,
} from '@elastic/eui';
import styled from 'styled-components';
import { getEmptyValue } from '../../../common/components/empty_value';
import { CriteriaConditions, CriteriaConditionsProps } from './components/criteria_conditions';
import { AnyArtifact } from './types';
import { useNormalizedArtifact } from './hooks/use_normalized_artifact';
import { useTestIdGenerator } from '../hooks/use_test_id_generator';

const CardContainerPanel = styled(EuiSplitPanel.Outer)`
  &.artifactEntryCardMinified + &.artifactEntryCardMinified {
    margin-top: ${({ theme }) => theme.eui.spacerSizes.l};
  }
`;

export interface ArtifactEntryCardMinifiedProps extends CommonProps {
  item: AnyArtifact;
  isSelected: boolean;
  onToggleSelectedArtifact: (selected: boolean) => void;
}

/**
 * Display Artifact Items (ex. Trusted App, Event Filter, etc) as a minified card.
 * This component is a TS Generic that allows you to set what the Item type is
 */
export const ArtifactEntryCardMinified = memo(
  ({
    item,
    isSelected = false,
    onToggleSelectedArtifact,
    'data-test-subj': dataTestSubj,
    ...commonProps
  }: ArtifactEntryCardMinifiedProps) => {
    const artifact = useNormalizedArtifact(item);
    const getTestId = useTestIdGenerator(dataTestSubj);

    const [accordionTrigger, setAccordionTrigger] = useState<'open' | 'closed'>('closed');

    const handleOnToggleAccordion = useCallback(() => {
      setAccordionTrigger((current) => (current === 'closed' ? 'open' : 'closed'));
    }, []);

    const getAccordionTitle = useCallback(
      () => (accordionTrigger === 'open' ? 'Hide details' : 'Show details'),
      [accordionTrigger]
    );

    const cardTitle = useMemo(
      () => (
        <EuiSplitPanel.Inner color="subdued">
          <EuiFlexGroup alignItems="center" gutterSize="s">
            <EuiFlexItem grow={false}>
              <EuiCheckbox
                id={artifact.name}
                checked={isSelected}
                onChange={() => onToggleSelectedArtifact(!isSelected)}
              />
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiTitle size="xxs">
                <h5 data-test-subj={getTestId('title')}>{artifact.name}</h5>
              </EuiTitle>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiSplitPanel.Inner>
      ),
      [artifact.name, getTestId, isSelected, onToggleSelectedArtifact]
    );

    return (
      <CardContainerPanel
        {...commonProps}
        data-test-subj={dataTestSubj}
        className="artifactEntryCardMinified"
        id={artifact.name}
        hasShadow={false}
        hasBorder
      >
        {cardTitle}
        <EuiSplitPanel.Inner paddingSize="s">
          <EuiPanel hasBorder={false} hasShadow={false} paddingSize="s">
            <EuiTitle size="xxs">
              <h5 data-test-subj={getTestId('descriptionTitle')}>{'Description'}</h5>
            </EuiTitle>
            <EuiText>
              <p data-test-subj={getTestId('description')}>
                {artifact.description || getEmptyValue()}
              </p>
            </EuiText>
          </EuiPanel>

          <EuiPanel hasBorder={false} hasShadow={false} paddingSize="s">
            <EuiButtonEmpty
              color="primary"
              size="s"
              flush="left"
              iconType={accordionTrigger === 'open' ? 'arrowUp' : 'arrowDown'}
              iconSide="right"
              iconSize="m"
              onClick={handleOnToggleAccordion}
              style={{ fontWeight: 400 }}
            >
              {getAccordionTitle()}
            </EuiButtonEmpty>
            <EuiAccordion id="showDetails" arrowDisplay="none" forceState={accordionTrigger}>
              <CriteriaConditions
                os={artifact.os as CriteriaConditionsProps['os']}
                entries={artifact.entries}
                data-test-subj={getTestId('criteriaConditions')}
              />
            </EuiAccordion>
          </EuiPanel>
        </EuiSplitPanel.Inner>
      </CardContainerPanel>
    );
  }
);

ArtifactEntryCardMinified.displayName = 'ArtifactEntryCardMinified';
