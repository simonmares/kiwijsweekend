// @flow

import * as React from 'react';

export function VerticalPadding() {
  return <div class="VerticalPadding" />;
}

export function BottomPadding() {
  return <div class="BottomPadding" />;
}

export function HairlineText(props) {
  return (
    <span class="HairlineText">
      {props.children}
    </span>
  );
}
