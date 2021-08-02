/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiButtonIconPropsForButton } from '@elastic/eui';
import { FilterManager } from '../../../../../../../src/plugins/data/public';

export interface FilterValueFnArgs {
  field: string;
  value: string[] | string | null | undefined;
  filterManager: FilterManager | undefined;
  onFilterAdded: (() => void) | undefined;
}

export interface HoverActionComponentProps {
  closePopOver?: () => void;
  defaultFocusedButtonRef?: EuiButtonIconPropsForButton['buttonRef'];
  field: string;
  keyboardEvent?: React.KeyboardEvent;
  ownFocus: boolean;
  showTooltip?: boolean;
  value?: string[] | string | null;
}
