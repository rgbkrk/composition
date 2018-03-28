// @flow

import * as React from "react";
import * as Immutable from "immutable";

import {
  state as stateModule,
  selectors,
  actions,
  TitleBar,
  NotebookApp,
  NotebookMenu,
  NewNotebookNavigation
} from "@nteract/core";

import { default as Directory } from "./directory";
import { default as File } from "./file";

type ContentRef = stateModule.ContentRef;

import { connect } from "react-redux";

const mapStateToProps = (state: *, ownProps: *): * => {
  return {
    contentType: selectors.currentContentType(state),
    contentRef: selectors.currentContentRef(state)
  };
};

const Container = ({ children }) => (
  <div>
    {children}
    <style jsx>{`
      div {
        padding-left: var(--nt-spacing-l, 10px);
        padding-top: var(--nt-spacing-m, 10px);
        padding-right: var(--nt-spacing-m, 10px);
      }
    `}</style>
  </div>
);

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
            <Container>
              <File contentRef={this.props.contentRef} />
            </Container>
          </React.Fragment>
        );
      case "dummy":
        return (
          <React.Fragment>
            <TitleBar />
          </React.Fragment>
        );
      case "directory":
        return (
          <React.Fragment>
            <TitleBar />
            <NewNotebookNavigation />
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

export default connect(mapStateToProps)(Contents);
