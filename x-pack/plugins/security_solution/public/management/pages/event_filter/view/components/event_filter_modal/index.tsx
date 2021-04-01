/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/* eslint complexity: ["error", 30]*/

import React, { memo } from 'react';
import styled, { css } from 'styled-components';
import {
  EuiModal,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiModalFooter,
  EuiButton,
  EuiButtonEmpty,
} from '@elastic/eui';
import { EventFilterForm, EventFilterFormProps } from '../event_filter_form';

export interface EventFilterModalProps {
  onCancel: () => void;
  onConfirm: () => void;
}

const Modal = styled(EuiModal)`
  ${({ theme }) => css`
    width: ${theme.eui.euiBreakpoints.l};
    max-width: ${theme.eui.euiBreakpoints.l};
  `}
`;

const ModalHeader = styled(EuiModalHeader)`
  flex-direction: column;
  align-items: flex-start;
`;

const ModalHeaderSubtitle = styled.div`
  ${({ theme }) => css`
    color: ${theme.eui.euiColorMediumShade};
  `}
`;

const ModalBodySection = styled.section`
  ${({ theme }) => css`
    padding: ${theme.eui.euiSizeS} ${theme.eui.euiSizeL};

    &.builder-section {
      overflow-y: scroll;
    }
  `}
`;

export const EventFilterModal = memo(
  ({
    ruleName,
    ruleId,
    ruleIndices,
    exceptionListType,
    alertData,
    onCancel,
    onConfirm,
    onRuleChange,
  }: EventFilterModalProps & EventFilterFormProps) => (
    <Modal onClose={onCancel} data-test-subj="add-exception-modal">
      <ModalHeader>
        <EuiModalHeaderTitle>{'Message'}</EuiModalHeaderTitle>
        <ModalHeaderSubtitle className="eui-textTruncate" title={'Rule name'}>
          {'Subtitle'}
        </ModalHeaderSubtitle>
      </ModalHeader>

      <ModalBodySection className="builder-section">
        <EventFilterForm
          ruleName={ruleName}
          ruleId={ruleId}
          exceptionListType={exceptionListType}
          ruleIndices={ruleIndices}
          alertData={alertData}
          onRuleChange={onRuleChange}
        />
      </ModalBodySection>

      <EuiModalFooter>
        <EuiButtonEmpty data-test-subj="cancelExceptionAddButton" onClick={onCancel}>
          {'Cancel'}
        </EuiButtonEmpty>

        <EuiButton data-test-subj="add-exception-confirm-button" fill onClick={onConfirm}>
          {'Event filter confirm message'}
        </EuiButton>
      </EuiModalFooter>
    </Modal>
  )
);

EventFilterModal.displayName = 'EventFilterModal';
