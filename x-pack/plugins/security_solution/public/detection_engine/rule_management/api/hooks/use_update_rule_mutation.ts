/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { RuleUpdateProps } from '../../../../../common/api/detection_engine/model/rule_schema';
import { transformOutput } from '../../../../detections/containers/detection_engine/rules/transforms';
import { DETECTION_ENGINE_RULES_URL } from '../../../../../common/constants';
import { updateRule } from '../api';
import { useInvalidateFindRulesQuery } from './use_find_rules_query';
import { useUpdateRuleByIdCache } from './use_fetch_rule_by_id_query';
import { useInvalidateFetchRuleManagementFiltersQuery } from './use_fetch_rule_management_filters_query';
import { useInvalidateFetchCoverageOverviewQuery } from './use_fetch_coverage_overview';
import type { Rule } from '../../logic/types';

export const UPDATE_RULE_MUTATION_KEY = ['PUT', DETECTION_ENGINE_RULES_URL];

export const useUpdateRuleMutation = (
  options?: UseMutationOptions<Rule, Error, RuleUpdateProps>
) => {
  const invalidateFindRulesQuery = useInvalidateFindRulesQuery();
  const invalidateFetchRuleManagementFilters = useInvalidateFetchRuleManagementFiltersQuery();
  const invalidateFetchCoverageOverviewQuery = useInvalidateFetchCoverageOverviewQuery();
  const updateRuleCache = useUpdateRuleByIdCache();

  return useMutation<Rule, Error, RuleUpdateProps>(
    (rule: RuleUpdateProps) => updateRule({ rule: transformOutput(rule) }),
    {
      ...options,
      mutationKey: UPDATE_RULE_MUTATION_KEY,
      onSettled: (...args) => {
        invalidateFindRulesQuery();
        invalidateFetchRuleManagementFilters();
        invalidateFetchCoverageOverviewQuery();

        const [response] = args;

        if (response) {
          updateRuleCache(response);
        }

        options?.onSettled?.(...args);
      },
    }
  );
};
