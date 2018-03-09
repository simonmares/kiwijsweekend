// @flow weak

import * as React from 'react';
import { render } from 'react-dom';
import Downshift from 'downshift';

import idx from 'idx';

import './style.css';

import * as ui from './ui';
import { searchFlights, searchLocations } from './requests';
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
      fromCode: '',
      toCode: '',
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

  onSearchSubmit = () => {
    const { fromCode, toCode, fromDate, toDate } = this.state;
    this.props.onSearch({ fromCode, toCode, fromDate, toDate });
  };

  isFormValid() {
    return ['fromCode', 'toCode', 'fromDate', 'toDate'].every(key => !!this.state[key]);
  }

  render() {
    const { fromDate, toDate } = this.state;
    const { isSearching, searchFailed } = this.getSearchStates();
    const { locations, onLocationSearch } = this.props;
    const isValid = this.isFormValid();

    return (
      <div className="FlightSearchForm">
        <p>Search or flight!</p>
        <ui.InputRow>
          <span>From: </span>
          <ui.HorizontalTextSpacing />
          <SearchLocations
            onSearch={onLocationSearch}
            onLocationChoose={locationId => {
              this.setState({ fromCode: locationId });
            }}
            items={locations}
            placeholder="Where are you e.g. Prague"
          />
        </ui.InputRow>
        <ui.InputRow>
          <span>To: </span>
          <ui.HorizontalTextSpacing />
          <SearchLocations
            onSearch={onLocationSearch}
            onLocationChoose={locationId => {
              this.setState({ toCode: locationId });
            }}
            items={locations}
            placeholder="Where to go e.g. London"
          />
        </ui.InputRow>
        <ui.InputRow>
          <span>From Date: </span>
          <DateInput
            value={fromDate}
            onChange={e => {
              this.setState({ fromDate: e.target.value });
            }}
          />
        </ui.InputRow>
        <ui.InputRow>
          <span>Till Date: </span>
          <DateInput
            value={toDate}
            onChange={e => {
              this.setState({ toDate: e.target.value });
            }}
            placeholder="..."
          />
        </ui.InputRow>
        <ui.VerticalSpacing />
        <button type="submit" disabled={isSearching || !isValid} onClick={this.onSearchSubmit}>
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

class SearchLocations extends React.Component<
  {
    onLocationChoose: (locationId: string) => any,
    onSearch: (query: string) => any,
    items: Array<{ id: string, title: string }>,
    placeholder: string,
  },
  void
> {
  searchTimer: *;

  filterItem = inputValue => item =>
    !inputValue || item.title.toLowerCase().startsWith(inputValue.toLowerCase());

  itemToString = (item: ?Object) => (item ? item.title : '');

  onItemChange = item => {
    this.props.onLocationChoose(item.id);
  };

  onInputValueChange = (inputValue: string) => {
    this.searchTimer && clearTimeout(this.searchTimer);
    if (!inputValue.length) {
      return;
    }
    // Note: it should not trigger search for selected item as it does now.
    // When user selects an item, its title is set as inputValue and triggers unnecessary search.
    this.searchTimer = setTimeout(() => this.props.onSearch(inputValue), 350);
  };

  onRenderDownshift = ({
    getInputProps,
    getItemProps,
    isOpen,
    inputValue,
    selectedItem,
    highlightedIndex,
  }) => {
    // Note (empty array): If there is no input to filter with, do not show everything.
    // Rather show nothing.
    const filteredItems = inputValue ? this.props.items.filter(this.filterItem(inputValue)) : [];
    const { placeholder } = this.props;

    return (
      <span className="AutocompleteBox">
        <input {...getInputProps({ placeholder })} className="AutocompleteInput" />
        {isOpen ? (
          <div className="OverlayPositionBox">
            <div className="AutocompleteOverlay">
              {filteredItems.map((item, index) => (
                <div
                  {...getItemProps({ item })}
                  key={item.id}
                  style={{
                    backgroundColor: highlightedIndex === index ? 'lightgreen' : 'white',
                    fontWeight: selectedItem === item ? 'bold' : 'normal',
                  }}
                >
                  {item.title}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </span>
    );
  };

  render() {
    return (
      <div>
        <Downshift
          defaultHighlightedIndex={0}
          itemToString={this.itemToString}
          onInputValueChange={this.onInputValueChange}
          onChange={this.onItemChange}
          render={this.onRenderDownshift}
          breakingChanges={{ resetInputOnSelection: true }}
        />
      </div>
    );
  }
}

type LocationItem = { id: string, title: string };

class FlightSearchPage extends React.Component<
  *,
  {
    searchResults: Array<*>,
    locationsMap: { [string]: LocationItem },
    locations: Array<LocationItem>,
    searchStatus: 'idle' | 'fetching' | 'fetched' | 'failed',
  }
> {
  searchedLocations: Set<string>;

  constructor(props) {
    super(props);

    this.state = {
      searchResults: [],
      searchStatus: 'idle',
      locationsMap: {},
      locations: [],
    };

    this.searchedLocations = new Set();
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

  onLocationSearch = query => {
    if (this.searchedLocations.has(query)) {
      return;
    }

    this.searchedLocations.add(query);

    const onOk = result => {
      const locationsMap = { ...this.state.locationsMap };
      for (const item of result) {
        locationsMap[item.locationId] = { title: this.getLocationTitle(item), id: item.locationId };
      }

      // Note: locations is pre-computed state...
      const locations = Object.keys(locationsMap).map(id => locationsMap[id]);
      this.setState({ locationsMap, locations });
    };

    searchLocations(query).then(onOk);
  };

  getLocationTitle(location) {
    // Note: prefer short ISO code if available
    const countryName =
      idx(location, _ => _.country.locationId) || idx(location, _ => _.country.name) || '';
    return `${location.name} (${countryName})`;
  }

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
    const { searchStatus, locations } = this.state;
    const resultsFetched = searchStatus === 'fetched';
    return (
      <div>
        <FlightSearchForm
          onLocationSearch={this.onLocationSearch}
          onSearch={this.onSearch}
          searchStatus={searchStatus}
          locations={locations}
        />
        <ui.VerticalSpacing />
        {resultsFetched && this.renderResults()}
      </div>
    );
  }
}

const el = document.getElementById('app');
render(<FlightSearchPage />, el);
