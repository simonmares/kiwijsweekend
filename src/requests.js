// @flow weak

const graphqlURL = 'https://graphql.kiwi.com/';

const searchFlightsQuery = `
query search($fromCode: String, $toCode: String, $fromDate: Date, $toDate: Date) {
  allFlights(search: {from: {location: $fromCode}, to: {location: $toCode}, date: {from: $fromDate, to: $toDate}}) {
    pageInfo {
      hasNextPage
      hasPreviousPage
    }
    edges {
      cursor
      node {
        id
        departure {
          time
          airport {
            name
            city {
              name
            }
          }
        }
        price {
          amount
          currency
        }
      }
    }
  }
}
`;

function postGraphQL(query, variables) {
  return fetch(graphqlURL, {
    method: 'POST',
    body: JSON.stringify({ query, variables }),
    headers: { 'content-type': 'application/json' },
  }).then(response => response.json());
}

function processSearchQuery(gqlResult) {
  return gqlResult.data.allFlights.edges.map(e => e.node);
}

export function searchFlights(params: {
  fromCode: string,
  toCode: string,
  fromDate: string,
  toDate: string,
}): Promise<Array<any>> {
  const variables = {
    fromCode: params.fromCode,
    toCode: params.toCode,
    fromDate: params.fromDate,
    toDate: params.toDate,
  };
  return postGraphQL(searchFlightsQuery, variables).then(processSearchQuery);
}
