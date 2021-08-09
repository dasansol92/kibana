/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { keyBy } from 'lodash';
import { kqlQuery, rangeQuery } from '../../../../../observability/server';
import {
  SERVICE_NAME,
  TRANSACTION_TYPE,
} from '../../../../common/elasticsearch_fieldnames';
import {
  TRANSACTION_PAGE_LOAD,
  TRANSACTION_REQUEST,
} from '../../../../common/transaction_types';
import { environmentQuery } from '../../../../common/utils/environment_query';
import { getOffsetInMs } from '../../../../common/utils/get_offset_in_ms';
import {
  getDocumentTypeFilterForAggregatedTransactions,
  getProcessorEventForAggregatedTransactions,
  getTransactionDurationFieldForAggregatedTransactions,
} from '../../helpers/aggregated_transactions';
import { calculateThroughput } from '../../helpers/calculate_throughput';
import { getBucketSizeForAggregatedTransactions } from '../../helpers/get_bucket_size_for_aggregated_transactions';
import { Setup, SetupTimeRange } from '../../helpers/setup_request';
import {
  calculateTransactionErrorPercentage,
  getOutcomeAggregation,
} from '../../helpers/transaction_error_rate';

export async function getServiceTransactionDetailedStatistics({
  serviceNames,
  environment,
  kuery,
  setup,
  searchAggregatedTransactions,
  offset,
}: {
  serviceNames: string[];
  environment?: string;
  kuery?: string;
  setup: Setup & SetupTimeRange;
  searchAggregatedTransactions: boolean;
  offset?: string;
}) {
  const { apmEventClient, start, end } = setup;
  const { offsetInMs, startWithOffset, endWithOffset } = getOffsetInMs({
    start,
    end,
    offset,
  });

  const outcomes = getOutcomeAggregation();

  const metrics = {
    avg_duration: {
      avg: {
        field: getTransactionDurationFieldForAggregatedTransactions(
          searchAggregatedTransactions
        ),
      },
    },
    outcomes,
  };

  const response = await apmEventClient.search(
    'get_service_transaction_stats',
    {
      apm: {
        events: [
          getProcessorEventForAggregatedTransactions(
            searchAggregatedTransactions
          ),
        ],
      },
      body: {
        size: 0,
        query: {
          bool: {
            filter: [
              ...getDocumentTypeFilterForAggregatedTransactions(
                searchAggregatedTransactions
              ),
              ...rangeQuery(startWithOffset, endWithOffset),
              ...environmentQuery(environment),
              ...kqlQuery(kuery),
            ],
          },
        },
        aggs: {
          services: {
            terms: {
              field: SERVICE_NAME,
              include: serviceNames,
              size: serviceNames.length,
            },
            aggs: {
              transactionType: {
                terms: {
                  field: TRANSACTION_TYPE,
                },
                aggs: {
                  ...metrics,
                  timeseries: {
                    date_histogram: {
                      field: '@timestamp',
                      fixed_interval: getBucketSizeForAggregatedTransactions({
                        start: startWithOffset,
                        end: endWithOffset,
                        numBuckets: 20,
                        searchAggregatedTransactions,
                      }).intervalString,
                      min_doc_count: 0,
                      extended_bounds: {
                        min: startWithOffset,
                        max: endWithOffset,
                      },
                    },
                    aggs: metrics,
                  },
                },
              },
            },
          },
        },
      },
    }
  );

  return keyBy(
    response.aggregations?.services.buckets.map((bucket) => {
      const topTransactionTypeBucket =
        bucket.transactionType.buckets.find(
          ({ key }) =>
            key === TRANSACTION_REQUEST || key === TRANSACTION_PAGE_LOAD
        ) ?? bucket.transactionType.buckets[0];

      return {
        serviceName: bucket.key as string,
        latency: topTransactionTypeBucket.timeseries.buckets.map(
          (dateBucket) => ({
            x: dateBucket.key + offsetInMs,
            y: dateBucket.avg_duration.value,
          })
        ),
        transactionErrorRate: topTransactionTypeBucket.timeseries.buckets.map(
          (dateBucket) => ({
            x: dateBucket.key + offsetInMs,
            y: calculateTransactionErrorPercentage(dateBucket.outcomes),
          })
        ),
        throughput: topTransactionTypeBucket.timeseries.buckets.map(
          (dateBucket) => ({
            x: dateBucket.key + offsetInMs,
            y: calculateThroughput({
              start,
              end,
              value: dateBucket.doc_count,
            }),
          })
        ),
      };
    }) ?? [],
    'serviceName'
  );
}
