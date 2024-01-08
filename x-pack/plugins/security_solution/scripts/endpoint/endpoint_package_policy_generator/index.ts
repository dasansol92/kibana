/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { v4 as uuidv4 } from 'uuid';
import pMap from 'p-map';
import { KbnClient } from '@kbn/test';
import type { RunFn } from '@kbn/dev-cli-runner';
import { run } from '@kbn/dev-cli-runner';
import { createFailError } from '@kbn/dev-cli-errors';
import { setupFleetForEndpoint } from '../../../common/endpoint/data_loaders/setup_fleet_for_endpoint';
import { getEndpointPackageInfo } from '../../../common/endpoint/utils/package';
import { indexFleetEndpointPolicy } from '../../../common/endpoint/data_loaders/index_fleet_endpoint_policy';

export const cli = () => {
  run(
    async (options) => {
      try {
        const totalCount = options.flags.count;
        const startTime = new Date().getTime();
        options.log.success(`Creating ${totalCount} endpoint package policies`);
        await endpointPackagePolicyGenerator(options);
        options.log.success(`${totalCount} endpoint package policies created`);
        const endTime = new Date().getTime();
        options.log.info(
          `Generating ${totalCount} endpoint package policies took ${endTime - startTime}ms`
        );
      } catch (e) {
        options.log.error(e);
        throw createFailError(e.message);
      }
    },
    {
      description: 'Load Endpoint Package Policies',
      flags: {
        string: ['kibana'],
        default: {
          count: 10,
          concurrency: 10,
          kibana: 'http://elastic:changeme@127.0.0.1:5601',
        },
        help: `
        --count               Number of endpoint package policies to create. Default: 10
        --concurrency         Number of concurrent endpoint package policies can be created. Default: 10
        --kibana              The URL to kibana including credentials. Default: http://elastic:changeme@127.0.0.1:5601
      `,
      },
    }
  );
};

const endpointPackagePolicyGenerator: RunFn = async ({ flags, log }) => {
  const kbn = new KbnClient({ log, url: flags.kibana as string });
  await setupFleetForEndpoint(kbn, log);
  const endpointPackage = await getEndpointPackageInfo(kbn);

  const totalPoliciesCount = flags.count as unknown as number;
  let newPoliciesCount = 0;
  await pMap(
    Array.from({ length: totalPoliciesCount }),
    () => {
      if (newPoliciesCount !== 0 && newPoliciesCount % 10 === 0) {
        log.info(
          `Created ${newPoliciesCount} endpoint package policies of ${totalPoliciesCount}. Generating ${
            totalPoliciesCount - newPoliciesCount
          } more...`
        );
      }
      newPoliciesCount++;
      return indexFleetEndpointPolicy(
        kbn,
        `Elastic Defend Policy test - ${uuidv4()}`,
        endpointPackage.version
      );
    },
    { concurrency: flags.concurrency as unknown as number }
  );
};
