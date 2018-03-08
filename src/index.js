// @flow weak

import * as React from 'react';
import { render } from 'react-dom';

import idx from 'idx';

import './style.css';

import * as ui from './ui';
import { searchFlights } from './requests';
import { strDateOnly, addMonth } from './dateutils';

function DateInput(props) {
  return <input className="DateInput" type="date" {...props} />;
}

function InlineHint(props) {
  return (
    <span title="Hint">
      <ui.HairlineText>{props.children}</ui.HairlineText>
    </span>
  );
}

class FlightSearchForm extends React.Component<*, *> {
  constructor(props) {
    super(props);

    const today = new Date();
    this.state = {
      fromCode: 'PRG',
      toCode: 'BCN',
      fromDate: strDateOnly(today),
      toDate: strDateOnly(addMonth(today)),
    };
  }

  getSearchStates() {
    const { searchStatus } = this.props;
    const isSearching = searchStatus === 'fetching';
    const searchFailed = searchStatus === 'failed';
    return {
      searchFailed,
      isSearching,
    };
  }

  render() {
    const { fromCode, toCode, fromDate, toDate } = this.state;

    const { isSearching, searchFailed } = this.getSearchStates();
    return (
      <div>
        <p>Search or flight!</p>
        <div>
          <span>From: </span>
          <input
            value={fromCode}
            onChange={e => {
              this.setState({ fromCode: e.target.value });
            }}
            className="AirportInput"
            placeholder="e.g. PRG"
          />
        </div>
        <div>
          <span>To: </span>
          <input
            value={toCode}
            onChange={e => {
              this.setState({ toCode: e.target.value });
            }}
            className="AirportInput"
            placeholder="e.g. BCN"
          />
        </div>
        <div>
          <span>From Date: </span>
          <DateInput
            value={fromDate}
            onChange={e => {
              this.setState({ fromDate: e.target.value });
            }}
          />
        </div>
        <div>
          <span>Till Date: </span>
          <DateInput
            value={toDate}
            onChange={e => {
              this.setState({ toDate: e.target.value });
            }}
            placeholder="..."
          />
        </div>
        <ui.VerticalSpacing />
        <button
          type="submit"
          disabled={isSearching}
          onClick={() => {
            this.props.onSearch({ fromCode, toCode, fromDate, toDate });
          }}
        >
          {isSearching ? 'Searching ...' : 'Search'}
        </button>
        {searchFailed && (
          <React.Fragment>
            <ui.HorizontalTextSpacing />
            <span>
              Search failed. <InlineHint>Change search terms and/or try again.</InlineHint>
            </span>
          </React.Fragment>
        )}
      </div>
    );
  }
}

class FlightResult extends React.Component<{ flight: Object }, *> {
  formatDateTime = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).format;

  getCityName(routeStop) {
    return idx(routeStop, _ => _.airport.city.name) || '';
  }

  getAirportName(routeStop) {
    return idx(routeStop, _ => _.airport.name) || '';
  }

  getDepartureTime(flight) {
    return idx(flight, _ => _.departure.time) || '';
  }

  getFormattedCurrency(flight) {
    const currency = idx(flight, _ => _.price.currency) || '';
    return currency === 'EUR' ? '€' : currency;
  }

  getPrice(flight) {
    return idx(flight, _ => _.price.amount) || '';
  }

  render() {
    const { flight } = this.props;

    return (
      <div>
        <div>
          <ui.HairlineText>From: </ui.HairlineText>
          <span title={this.getCityName(flight.departure)}>
            {this.getAirportName(flight.departure)}
          </span>
        </div>
        <div>
          <ui.HairlineText>To: </ui.HairlineText>
          <span title={this.getCityName(flight.arrival)}>
            {this.getAirportName(flight.arrival)}
          </span>
        </div>
        <div>
          <ui.HairlineText>When: </ui.HairlineText>
          <span>{this.formatDateTime(this.getDepartureTime(flight))}</span>
        </div>
        <div>
          <ui.HairlineText>Price: </ui.HairlineText>
          <span>
            {this.getPrice(flight)}&nbsp;{this.getFormattedCurrency(flight)}
          </span>
        </div>
      </div>
    );
  }
}

class SearchResults extends React.Component<{ results: Array<*> }, *> {
  static pageSize = 5;

  constructor(props) {
    super(props);

    this.state = {
      ...this.getPaginationState(props),
    };
  }

  componentWillReceiveProps(nextProps) {
    const paginationState = this.getPaginationState(nextProps);
    this.setState(paginationState);
  }

  getPaginationState(props) {
    if (!props.results.length) {
      return { curPage: 0, maxPage: 0 };
    }

    // - 1 because first page is 0 not 1
    const maxPage = Math.ceil(props.results.length / SearchResults.pageSize) - 1;
    return {
      curPage: 0,
      maxPage,
    };
  }

  getOffsetAndLimit() {
    const { pageSize } = SearchResults;
    const offset = this.state.curPage * pageSize;
    const limit = offset + pageSize;
    return [offset, limit];
  }

  hasNextPage() {
    return this.state.curPage !== this.state.maxPage;
  }

  onNextPage = () => {
    const { maxPage } = this.state;
    const nextPage = this.state.curPage + 1;
    this.setState({ curPage: nextPage <= maxPage ? nextPage : maxPage });
  };

  onPrevPage = () => {
    const prevPage = this.state.curPage - 1;
    this.setState({ curPage: prevPage >= 0 ? prevPage : 0 });
  };

  renderAllPaginated() {
    return <InlineHint>You can ease your search terms to find more.</InlineHint>;
  }

  render() {
    const { curPage, maxPage } = this.state;
    const { results } = this.props;

    const hasNext = this.hasNextPage();
    const hasPrev = curPage !== 0;

    const [offset, limit] = this.getOffsetAndLimit();
    const itemsToShow = results.slice(offset, limit);

    return (
      <div>
        <ui.VisibilityHidden isVisible={hasPrev}>
          <button onClick={this.onPrevPage}>Previous</button>
        </ui.VisibilityHidden>
        <ui.HorizontalTextSpacing />
        Results {curPage + 1}/{maxPage + 1}
        <ui.HorizontalTextSpacing />
        {hasNext ? <button onClick={this.onNextPage}>Next</button> : this.renderAllPaginated()}
        <ui.VerticalSpacing />
        {itemsToShow.map(item => {
          return (
            <React.Fragment key={item.id}>
              <FlightResult flight={item} />
              <ui.BottomSpacing />
            </React.Fragment>
          );
        })}
      </div>
    );
  }
}

class FlightSearchPage extends React.Component<
  *,
  {
    searchResults: Array<*>,
    searchStatus: 'idle' | 'fetching' | 'fetched' | 'failed',
  }
> {
  constructor(props) {
    super(props);

    this.state = { searchResults: [], searchStatus: 'idle' };
  }

  onSearch = params => {
    this.setState({ searchStatus: 'fetching' });

    const onErr = () => {
      this.setState({ searchStatus: 'failed' });
    };

    const onOk = data => {
      this.setState({ searchStatus: 'fetched' });
      this.setState({ searchResults: data });
    };

    searchFlights(params).then(onOk, onErr);
  };

  renderResults() {
    const { searchResults } = this.state;

    if (searchResults.length) {
      return <SearchResults results={searchResults} />;
    }

    return (
      <span>
        No flights found. <InlineHint>Ease your terms to find something for you.</InlineHint>
      </span>
    );
  }

  render() {
    const { searchStatus } = this.state;
    const resultsFetched = searchStatus === 'fetched';
    return (
      <div>
        <FlightSearchForm onSearch={this.onSearch} searchStatus={searchStatus} />
        <ui.VerticalSpacing />
        {resultsFetched && this.renderResults()}
      </div>
    );
  }
}

const el = document.getElementById('app');
render(<FlightSearchPage />, el);
