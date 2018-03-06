// @flow

import * as React from 'react';
import { render } from 'react-dom';

import './style.css'

import * as ui from './ui';

class FlightSearchForm extends React.Component {
  render() {
    return (
      <div>
        <p>Search or flight!</p>
        <div>
          <span>From: </span>
          <input placeholder="Where are you?" />
        </div>
        <div>
          <span>To: </span>
          <input placeholder="Where do you go?" />
        </div>
        <div>
          <span>Date: </span>
          <input placeholder="When do you fly away?" />
        </div>
        <button type="submit">Search</button>
      </div>
    );
  }
}

class ResultItem extends React.Component {
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

class SearchResults extends React.Component {
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

class FlightSearchPage extends React.Component {
  render() {
    return (
      <div>
        <FlightSearchForm />
        <ui.VerticalPadding />
        <SearchResults />
      </div>
    );
  }
}

const el = document.getElementById('app');
render(<FlightSearchPage />, el);
