// @flow weak

import * as React from 'react';
import { render } from 'react-dom';

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
            placeholder="Where are you? e.g. PRG"
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
            placeholder="Where do you go? e.g. BCN"
          />
        </div>
        <div>
          <span>From Date: </span>
          <DateInput
            value={fromDate}
            onChange={e => {
              this.setState({ fromDate: e.target.value });
            }}
            placeholder="When do you fly away?"
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

class ResultItem extends React.Component<*, *> {
  render() {
    return (
      <div>
        <div>
          <ui.HairlineText>From: </ui.HairlineText>
          <span>...</span>
        </div>
        <div>
          <ui.HairlineText>To: </ui.HairlineText>
          <span>...</span>
        </div>
        <div>
          <ui.HairlineText>When: </ui.HairlineText>
          <span>...</span>
        </div>
        <div>
          <ui.HairlineText>Price: </ui.HairlineText>
          <span>...&nbsp;€</span>
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
    const maxPage = Math.ceil(props.results.length / 5);

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
        {itemsToShow.map(item => {
          return (
            <React.Fragment key={item.id}>
              <ResultItem item={item} />
              <ui.BottomSpacing />
            </React.Fragment>
          );
        })}
        <ui.VisibilityHidden isVisible={hasPrev}>
          <button onClick={this.onPrevPage}>Previous</button>
        </ui.VisibilityHidden>
        <ui.HorizontalTextSpacing />
        Results {curPage + 1}/{maxPage + 1}
        <ui.HorizontalTextSpacing />
        {hasNext ? <button onClick={this.onNextPage}>Next</button> : this.renderAllPaginated()}
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

    return <span>No results for search terms.</span>;
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
