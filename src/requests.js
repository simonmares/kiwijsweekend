// @flow weak

import idx from 'idx';

const graphqlURL = 'https://graphql.kiwi.com/';

function postGraphQL(query, variables) {
  return fetch(graphqlURL, {
    method: 'POST',
    body: JSON.stringify({ query, variables }),
    headers: { 'content-type': 'application/json' },
  }).then(response => response.json());
}

//
// Search flights
//

const searchFlightsQuery = `
query search($fromCode: String!, $toCode: String!, $fromDate: Date!, $toDate: Date!) {
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
          ...DestinationInfo
        }
        arrival {
          ...DestinationInfo
        }
        price {
          amount
          currency
        }
      }
    }
  }
}

fragment DestinationInfo on RouteStop {
  time
  airport {
    name
    city {
      name
    }
  }
}
`;

export function searchFlights(params: {
  fromCode: string,
  toCode: string,
  fromDate: string,
  toDate: string,
}): Promise<Array<any>> {
  function transformNode(node) {
    const { departure } = node;
    return {
      ...node,
      departure: {
        ...departure,
        time: new Date(departure.time),
      },
    };
  }

  const onOk = result => result.data.allFlights.edges.map(e => transformNode(e.node));

  const variables = {
    fromCode: params.fromCode,
    toCode: params.toCode,
    fromDate: params.fromDate,
    toDate: params.toDate,
  };
  return postGraphQL(searchFlightsQuery, variables).then(onOk);
}

//
// Search destinations
//

const searchLocationsQuery = `
query searchCityLocations($search: String!) {
  allLocations(search: $search, options: {locationType: city}) {
    edges {
      cursor
      node {
        locationId
        name
        country {
          locationId
          name
        }
      }
    }
  }
}
`;

export function searchLocations(query: string): Promise<Array<any>> {
  const variables = {
    search: query,
  };

  const onOk = result => idx(result, _ => _.data.allLocations.edges.map(e => e.node)) || [];
  return postGraphQL(searchLocationsQuery, variables).then(onOk);
}
