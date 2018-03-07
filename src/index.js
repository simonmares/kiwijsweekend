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

  render() {
    const { fromCode, toCode, fromDate, toDate } = this.state;
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
        <button
          type="submit"
          onClick={() => {
            this.props.onSearch({ fromCode, toCode, fromDate, toDate });
          }}
        >
          Search
        </button>
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

class SearchResults extends React.Component<*, *> {
  render() {
    return (
      <div>
        <ResultItem />
        <ui.BottomPadding />
        <ResultItem />
        <ui.BottomPadding />
        <ResultItem />
        <ui.BottomPadding />
        <ResultItem />
        <ui.BottomPadding />
        <ResultItem />
      </div>
    );
  }
}

class FlightSearchPage extends React.Component<*, *> {
  constructor(props) {
    super(props);
  }

  onSearch = params => {
    searchFlights(params).then(data => {
      console.log('data', data);
    });
  };

  render() {
    return (
      <div>
        <FlightSearchForm onSearch={this.onSearch} />
        <ui.VerticalPadding />
        <SearchResults />
      </div>
    );
  }
}

const el = document.getElementById('app');
render(<FlightSearchPage />, el);
