// @flow weak

import * as React from 'react';

// Generic UI

export function VerticalSpacing() {
  return <div className="VerticalSpacing" />;
}

export function HorizontalTextSpacing() {
  return <span className="HorizontalTextSpacing" />;
}

export function BottomSpacing() {
  return <div className="BottomSpacing" />;
}

export function HairlineText(props) {
  return <span className="HairlineText">{props.children}</span>;
}

export function VisibilityHidden(props) {
  return <span className={props.isVisible ? '' : 'VisibilityHidden'}>{props.children}</span>;
}

// App UI

export function InputRow(props) {
  return <div className="InputRow">{props.children}</div>;
}
