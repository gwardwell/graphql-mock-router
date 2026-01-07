function daysBetween(date1, date2) {
  let date1ts = date1;
  let date2ts = date2;
  if (date1ts instanceof Date) {
    date1ts = date1ts.getTime();
  }
  if (date2ts instanceof Date) {
    date2ts = date2ts.getTime();
  }
  let firstDate = date1ts;
  let secondDate = date2ts;
  if (date1ts < date2ts) {
    firstDate = date2ts;
    secondDate = date1ts;
  }
  const timeDiff = Math.abs(firstDate - secondDate);
  const dayInMs = 24 * 60 * 60 * 1000;
  if (timeDiff < dayInMs) {
    return 0;
  }
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  return daysDiff;
}

async function getOperationsList(startDateString, endDateString) {
  const now = new Date().setUTCHours(0, 0, 0, 0);
  const startDate = Date.parse(startDateString);
  const endDate = Date.parse(endDateString);
  const daysFromNowToStart = daysBetween(startDate, now);
  const daysFromNowToEnd = daysBetween(endDate, now);
  const from = daysFromNowToStart * 24 * 60 * 60 * -1;
  const to = daysFromNowToEnd * 24 * 60 * 60 * -1;

  // const operationsList = await query({
  //   operationName: 'OperationsListQuery',
  //   query: `
  //   query OperationsListQuery(
  //     $graphId: ID!,
  //     $variantName: String!,
  //     $after: String,
  //     $filter: OperationInsightsListFilterInput,
  //     $first: Int,
  //     $from: Timestamp!,
  //     $last: Int,
  //     $orderBy: OperationInsightsListOrderByInput,
  //     $to: Timestamp!
  //   ) {
  //     graph(id: $graphId) {
  //       __typename
  //       id
  //       variant(name: $variantName) {
  //         __typename
  //         id
  //         operationInsightsList(
  //           after: $after
  //           filter: $filter
  //           first: $first
  //           from: $from
  //           last: $last
  //           orderBy: $orderBy
  //           to: $to
  //         ) {
  //           __typename
  //           pageInfo {
  //             __typename
  //             endCursor
  //           }
  //           totalCount
  //           operations: nodes {
  //             __typename
  //             displayName
  //             errorCount
  //             errorCountPerMin
  //             errorPercentage
  //             id
  //             name
  //             requestCount
  //             requestCountPerMin
  //             signatureBytes
  //             type
  //           }
  //         }
  //       }
  //     }
  //   }`,
  //   variables: {
  //     graphId: 'engine',
  //     variantName: 'platform-api-prod',
  //     first: 1,
  //     from,
  //     to,
  //     filter: {
  //       or: [],
  //     },
  //     orderBy: {
  //       column: 'REQUEST_COUNT',
  //       direction: 'DESCENDING',
  //     },
  //   },
  // });

  const {
    data: {
      graph: {
        statsWindow: { queryStats },
      },
    },
  } = await query({
    operationName: 'TopOperations',
    query: `
    query TopOperations {
      graph(id:"engine") {
        id
        statsWindow(
          from: "2025-03-15T00:00:00Z"
          to: "2025-04-15T00:00:00Z"
        ) {
          queryStats(
            filter: { schemaTag: "platform-api-prod" }
            orderBy: [{ column: UNCACHED_REQUESTS_COUNT, direction: DESCENDING }]
          ) {
            groupBy {
              queryId
              queryName
              querySignature
            }
            metrics {
              totalRequestCount
            }
          }
        }
      }
    }`,
    variables: {
      graphId: 'engine',
      variantName: 'platform-api-prod',
      first: 1,
      from,
      to,
      filter: {
        or: [],
      },
      orderBy: {
        column: 'REQUEST_COUNT',
        direction: 'DESCENDING',
      },
    },
  });

  console.log('queryStats count:', queryStats.length);
  console.log('queryStats:', JSON.stringify(queryStats, null, 2));

  // const operation = await query({
  //   operationName: 'OperationsDetailsQuery',
  //   query: `
  //   query OperationsDetailsQuery(
  //     $graphId: ID!,
  //     $operationId: ID!
  //   ) {
  //     service(id: $graphId) {
  //       __typename
  //       id
  //       operation(id: $operationId) {
  //         __typename
  //         id
  //         name
  //         signature
  //       }
  //     }
  //   }`,
  //   variables: {
  //     graphId: 'engine',
  //     operationId: '6c3336fc64d5c279f77095b14cee2297dd69435b',
  //   },
  // });
  // console.log('operation:', JSON.stringify(operation, null, 2));
}

async function query({ operationName, query, variables }) {
  const response = await fetch(
    'https://graphql-staging.api.apollographql.com/api/graphql',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'service:engine:LfKQfzhbDab26tHOgwoSWA',
        'apollographql-client-name': 'greg-wardwell-apollo-client',
        'apollographql-client-version': '1',
      },
      body: JSON.stringify({
        operationName,
        query,
        variables,
      }),
    },
  );
  return response.json();
}

getOperationsList('2025-03-15', '2025-04-15');
