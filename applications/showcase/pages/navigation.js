// @flow
import * as React from "react";

import {
  Styles,
  state as stateModule,
  themes,
  PureTitleBar,
  PureNewNotebookNavigation
} from "@nteract/core";

import { List, Map, Record } from "immutable";

const availableNotebooks = List([
  {
    kernelspec: {
      name: "python3",
      language: "python",
      displayName: "Python 3",
      metadata: Map(),
      env: Map(),
      argv: List(),
      resources: Map(),
      interruptMode: "yes"
    }
  },
  {
    kernelspec: {
      name: "scala211",
      language: "scala",
      displayName: "Scala 2.11",
      metadata: Map(),
      env: Map(),
      argv: List(),
      resources: Map(),
      interruptMode: "yes"
    }
  },
  {
    kernelspec: {
      name: "python2",
      language: "python",
      displayName: "Python 2",
      metadata: Map(),
      env: Map(),
      argv: List(),
      resources: Map(),
      interruptMode: "yes"
    }
  }
]);

class NavigationDemo extends React.Component<*, *> {
  static defaultProps = {
    theme: "light"
  };

  render() {
    return (
      <Styles>
        <PureTitleBar />
        <PureNewNotebookNavigation
          availableNotebooks={availableNotebooks}
          onClick={ks => console.log(ks)}
        />
        <div className="directory-listing">
          <p>Directory Listing</p>
          <pre>...</pre>
        </div>
        <style jsx>{`
          .directory-listing {
            padding-left: 20px;
          }
        `}</style>
        <style>{`
          :root {
            ${themes[this.props.theme]}
          }

          html {
            overflow: hidden;
            height: 100%;
          }

          body {
            overflow: auto;
            height: 100%;
            width: 100%;
            margin: 0;
            font-family: var(--nt-font-family-normal);
          }
      `}</style>
      </Styles>
    );
  }
}

export default NavigationDemo;
