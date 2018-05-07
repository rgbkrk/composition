// @flow

/**
 * A simple contentRef aware component that renders a little lastSaved
 * display.
 *
 * import LastSaved from "./last-saved.js"
 * <LastSaved contentRef={someRef} />
 *
 * If the contentRef is available and has a lastSaved, will render something like:
 *
 * Last Saved: 2 minutes ago
 *
 */

import * as React from "react";

import { selectors } from "@nteract/core";
import type {
  ContentRef,
  AppState,
  ContentsCommunicationRecordProps
} from "@nteract/core";

import moment from "moment";

import { connect } from "react-redux";

type LastSavedProps = {
  date: string | number | Date | null,
  status: ContentsCommunicationRecordProps
};

const Check = (props: { color: string, title: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 600 600"
  >
    <path
      fill={props.color}
      d="M7.7 404.6s115.2 129.7 138.2 182.68h99c41.5-126.7 202.7-429.1 340.92-535.1 28.6-36.8-43.3-52-101.35-27.62-87.5 36.7-252.5 317.2-283.3 384.64-43.7 11.5-89.8-73.7-89.84-73.7z"
    />
  </svg>
);

Check.defaultProps = {
  color: "red"
};

const Ellipses = (props: { color: string, title: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">
    <path
      fill={props.color}
      d="M8 13c0 .6-.2 1-.6 1.4-.4.4-.9.6-1.4.6-.6 0-1-.2-1.4-.6-.4-.4-.6-.9-.6-1.4s.2-1 .6-1.4c.4-.4.9-.6 1.4-.6s1 .2 1.4.6c.4.4.6.9.6 1.4zm6 0c0 .6-.2 1-.6 1.4-.4.4-.9.6-1.4.6-.6 0-1-.2-1.4-.6-.4-.4-.6-.9-.6-1.4s.2-1 .6-1.4c.4-.4.9-.6 1.4-.6s1 .2 1.4.6c.4.4.6.9.6 1.4zm6 0c0 .6-.2 1-.6 1.4-.4.4-.9.6-1.4.6-.6 0-1-.2-1.4-.6-.4-.4-.6-.9-.6-1.4s.2-1 .6-1.4c.4-.4.9-.6 1.4-.6s1 .2 1.4.6c.4.4.6.9.6 1.4z"
    />
  </svg>
);

Ellipses.defaultProps = {
  color: "green"
};

const ErrorOutline = (props: { color: string, title: string }) => (
  <svg
    display="block"
    pointerEvents="none"
    style={{
      width: "100%",
      height: "100%"
    }}
    viewBox="0 0 24 24"
  >
    <path
      fill={props.color}
      d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"
    />
  </svg>
  // {/* <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" style="pointer-events: none; display: block; width: 100%; height: 100%;"><g><path d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"></path></g></svg> */}
);

ErrorOutline.defaultProps = {
  color: "red"
};

const StatusIcon = (props: { status: ContentsCommunicationRecordProps }) => {
  const status = props.status;

  if (!status) {
    return null;
  }

  if (status.error) {
    return "E";
  } else if (status.saving) {
    return <Ellipses title="saving" />;
  } else if (status.loading) {
    return <Ellipses title="loading" />;
  } else {
    return <Check color="#00c752" />;
  }
};

class LastSaved extends React.Component<LastSavedProps, null> {
  intervalId: IntervalID;
  isStillMounted: boolean;

  constructor(props: LastSavedProps) {
    super(props);
    this.isStillMounted = false;
  }

  tick() {
    if (this.isStillMounted && this.props.date !== null) {
      this.forceUpdate();
    }
  }

  componentDidMount() {
    this.isStillMounted = true;
    this.intervalId = setInterval(this.tick, 30 * 1000);
  }

  componentWillUnmount() {
    this.isStillMounted = false;
    clearInterval(this.intervalId);
  }

  render() {
    if (!this.props.date) {
      return null;
    }

    const precious = moment(this.props.date);

    let text = "just now";

    if (moment().diff(precious) > 25000) {
      text = precious.fromNow();
    }

    const title = precious.format("MMMM Do YYYY, h:mm:ss a");

    return (
      <React.Fragment>
        <span className="pretext" title={title}>
          Last Saved:{" "}
        </span>
        <span className="timetext" title={title}>
          {text}
        </span>
        <span style={{ height: "24px", width: "24px" }}>
          <StatusIcon status={this.props.status} />
        </span>
        <style jsx>{`
          span {
            padding-left: 10px;
          }
          .pretext {
            font-weight: var(--nt-font-weight-bolder);
          }
          span {
            margin: 0 auto;
            font-size: 15px;
            color: var(--nt-nav-dark);
          }
          :global(svg) {
            margin: 0 auto;
          }
        `}</style>
      </React.Fragment>
    );
  }
}

const ConnectedLastSaved = connect(
  (
    state: AppState,
    ownProps: { contentRef: ContentRef }
  ): { date: string | number | Date | null } => {
    const status = state.core.communication.contents.byRef.get(
      ownProps.contentRef
    );

    const content = selectors.content(state, ownProps);
    if (!content || !content.lastSaved) {
      return { date: null };
    }
    return { date: content.lastSaved, status };
  }
)(LastSaved);

export default ConnectedLastSaved;
