// @flow
import * as React from "react";

import { connect } from "react-redux";

import { Logo } from "./logos";

import * as selectors from "../../selectors";
import type { AppState } from "../../state";

type TitleBarProps = {
  title: string,
  theme: "light" | "dark",
  onTitleChange?: (title: string) => void,
  logoHref?: string,
  logoTitle?: string
};

export const TitleBar = (props: TitleBarProps) => (
  <React.Fragment>
    <header>
      <span className="left">
        <a href={props.logoHref} title={props.logoTitle}>
          <Logo height={20} theme={props.theme} />
        </a>
        <p>{props.title}</p>
      </span>
      <span className="center" />
      <span className="right">
        <p>Last Saved WTF</p>
      </span>
    </header>
    <style jsx>{`
      header {
        background-color: var(--theme-title-bar-bg, rgb(250, 250, 250));
        padding: var(--nt-spacing-m) var(--nt-spacing-xl);
        display: flex;
      }

      header * {
        box-sizing: border-box;
      }

      .left * {
        display: inline-block;
        margin: 0px var(--nt-spacing-xl) 0px 0px;
      }

      p {
        vertical-align: top;
        line-height: normal;
        margin: 0px var(--nt-spacing-xl) 0px 0px;
      }

      .left,
      .center,
      .right {
        display: inline-block;
        vertical-align: top;
        width: 33.33333%;
      }

      .left {
        text-align: left;
      }

      .center {
        text-align: center;
      }

      .right {
        text-align: right;
      }
    `}</style>
  </React.Fragment>
);

const mapStateToProps = (
  state: AppState,
  ownProps: { logoHref?: string }
): TitleBarProps => ({
  title: selectors
    .currentFilepath(state)
    .split("/")
    .pop()
    .split(".ipynb")
    .shift(),
  theme: selectors.currentTheme(state),
  logoHref: ownProps.logoHref
});

const mapDispatchToProps = dispatch => ({
  onTitleChange: (title: string) => {
    // TODO: Once the content refs PR is finished use the ref to change
    // the filename, noting that the URL path should also change
    console.error("not implemented yet");
  }
});

TitleBar.defaultProps = {
  title: "",
  theme: "light"
};

export default connect(mapStateToProps, mapDispatchToProps)(TitleBar);
