/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useMemo } from 'react';
import { EuiContextMenuItem } from '@elastic/eui';
import { ACTION_ADD_EVENT_FILTER } from '../translations';
import { useUserPrivileges } from '../../../../common/components/user_privileges';

export const useEventFilterAction = ({
  onAddEventFilterClick,
  disabled = false,
}: {
  onAddEventFilterClick: () => void;
  disabled?: boolean;
}) => {
  const { loading, canAccessEndpointManagement } = useUserPrivileges().endpointPrivileges;

  const eventFilterActionItems = useMemo(
    () =>
      !loading && canAccessEndpointManagement
        ? [
            <EuiContextMenuItem
              key="add-event-filter-menu-item"
              data-test-subj="add-event-filter-menu-item"
              onClick={onAddEventFilterClick}
              disabled={disabled}
            >
              {ACTION_ADD_EVENT_FILTER}
            </EuiContextMenuItem>,
          ]
        : [],
    [onAddEventFilterClick, disabled, canAccessEndpointManagement, loading]
  );
  return { eventFilterActionItems };
};
