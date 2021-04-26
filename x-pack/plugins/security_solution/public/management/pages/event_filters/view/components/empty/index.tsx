/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { memo } from 'react';
import { EuiButton, EuiEmptyPrompt } from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n/react';

export const Empty = memo<{
  onAdd: () => void;
  /** Should the Add button be disabled */
  isAddDisabled?: boolean;
}>(({ onAdd, isAddDisabled = false }) => {
  return (
    <EuiEmptyPrompt
      data-test-subj="eventFiltersEmpty"
      iconType="plusInCircle"
      title={
        <h2>
          <FormattedMessage
            id="xpack.securitySolution.eventFilters.listEmpty.title"
            defaultMessage="Add your first Endpoint Event Filter"
          />
        </h2>
      }
      body={
        <FormattedMessage
          id="xpack.securitySolution.eventFilters.listEmpty.message"
          defaultMessage="There are currently no Endpoint Event Filters on your endpoint."
        />
      }
      actions={
        <EuiButton
          fill
          isDisabled={isAddDisabled}
          onClick={onAdd}
          data-test-subj="eventFiltersListAddButton"
        >
          <FormattedMessage
            id="xpack.securitySolution.eventFilters.list.addButton"
            defaultMessage="Add Endpoint Event Filter"
          />
        </EuiButton>
      }
    />
  );
});

Empty.displayName = 'Empty';
