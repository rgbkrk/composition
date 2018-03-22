// @flow

import * as React from "react";
import * as Immutable from "immutable";

import {
  state as stateModule,
  selectors,
  actions,
  TitleBar,
  NotebookApp,
  NotebookMenu
} from "@nteract/core";

import { default as Directory } from "./directory";
import { default as File } from "./file";

import { withRouter } from "react-router-dom";

type ContentRef = stateModule.ContentRef;

import { connect } from "react-redux";

const mapStateToProps = (state: *, ownProps: *): * => {
  return {
    contentType: selectors.currentContentType(state),
    contentRef: selectors.currentContentRef(state)
  };
};

class Contents extends React.Component<*, *> {
  render() {
    switch (this.props.contentType) {
      case "notebook":
        return (
          <React.Fragment>
            <TitleBar />
            <NotebookMenu />
            <NotebookApp />
          </React.Fragment>
        );
      case "file":
        return (
          <React.Fragment>
            <TitleBar />
            <File contentRef={this.props.contentRef} />
          </React.Fragment>
        );
      case "dummy":
        return (
          <React.Fragment>
            <TitleBar />
            <div>loading...</div>
          </React.Fragment>
        );
      case "directory":
        return (
          <React.Fragment>
            <TitleBar />
            <Directory contentRef={this.props.contentRef} />
          </React.Fragment>
        );
      default:
        return (
          <div>{`content type ${this.props.contentType} not implemented`}</div>
        );
    }
  }
}

export default withRouter(connect(mapStateToProps)(Contents));
