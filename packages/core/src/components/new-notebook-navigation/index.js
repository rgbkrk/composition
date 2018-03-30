// @flow

/**
 * Plan:
 *
 * Create a 1-dimensional grid of new notebook types for clicking
 * to create new notebooks
 *
 * Create a listing of running notebooks
 * Showcase the directory navigator
 */

import * as React from "react";

import { connect } from "react-redux";

import type { AppState } from "../../state";

import type {
  KernelspecRecord,
  KernelspecProps
} from "../../state/entities/kernelspecs";

import { default as Logo } from "./logos";

import * as Immutable from "immutable";

export type AvailableNotebook = {
  kernelspec: KernelspecRecord | KernelspecProps
};

export type AvailableNotebooks =
  | Immutable.List<AvailableNotebook>
  | Array<AvailableNotebook>;

export const NewNotebook = (
  props: AvailableNotebook & {
    href?: string,
    onClick?: (ks: KernelspecRecord | KernelspecProps) => void
  }
) => {
  const onClick = () => {
    if (props.onClick) {
      props.onClick(props.kernelspec);
    }
  };

  return (
    <React.Fragment>
      <div tabIndex={0} className="new-notebook" onClick={onClick}>
        <div className="logo-box">
          <div className="logo">
            <Logo language={props.kernelspec.language} />
          </div>
        </div>
        <div className="text-box">
          <p className="display-name-short" title={props.kernelspec.language}>
            {props.kernelspec.language}
          </p>
          <p className="display-name-long" title={props.kernelspec.displayName}>
            {props.kernelspec.displayName}
          </p>
        </div>
      </div>
      <style jsx>{`
        .new-notebook :global(*) {
          color: var(--nt-color-midnight-light);
          cursor: pointer;
        }

        a {
          padding-top: 20px;
        }

        .new-notebook {
          font-family: var(--nt-font-family-normal);
          color: var(--nt-color-midnight-light);
          margin: 20px 20px 0 0;
          flex: 0 0 auto;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          height: 220px;
          width: 150px;
        }

        .new-notebook:hover {
          box-shadow: var(--theme-primary-shadow-hover);
        }

        .new-notebook:focus {
          box-shadow: var(--theme-primary-shadow-focus);
        }
        .logo {
          width: 3em;
          box-sizing: border-box;
          margin: 0 auto;
        }

        .logo-box {
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 30px;
          background-color: var(--theme-app-bg);
          flex: 1;
        }

        .text-box {
          padding: 8px 6px 8px 6px;
          font-size: 0.8em;
          width: 150px;
          box-sizing: border-box;
          background-color: var(--theme-primary-bg);
          border-top: 1px solid var(--theme-app-border);
        }

        .display-name-short {
          text-transform: capitalize;
          margin: 0 5px 0 0;
          font-weight: 600;
          color: var(--theme-app-fg);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .display-name-long {
          margin: 0;
          color: var(--theme-primary-fg);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .new-notebook:hover .display-name-long,
        .new-notebook:focus .display-name-long {
          white-space: initial;
          overflow: initial;
          text-overflow: initial;
        }
      `}</style>
    </React.Fragment>
  );
};

NewNotebook.defaultProps = {
  onClick: () => {}
};

const NotebookCollection = (props: { children: React.Node }) => (
  <div className="collection">
    {props.children}
    <style jsx>{`
      .collection {
        padding: 0 0 20px 0;
        box-sizing: border-box;
        min-width: 0;
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: flex-start;
        -webkit-overflow-scrolling: touch;
        -ms-overflow-style: -ms-autohiding-scrollbar;
      }
    `}</style>
  </div>
);

export const PureNewNotebookNavigation = (props: {
  availableNotebooks: AvailableNotebooks,
  onClick?: (ks: KernelspecRecord | KernelspecProps) => void
}) => (
  <React.Fragment>
    <div className="banner">
      <div>Start a new notebook</div>
      <NotebookCollection>
        {props.availableNotebooks.map(an => (
          <NewNotebook
            kernelspec={an.kernelspec}
            key={an.kernelspec.name}
            onClick={props.onClick}
          />
        ))}
      </NotebookCollection>
    </div>
    <style jsx>{`
      .banner {
        background-color: var(--nt-color-grey-light);
        color: var(--nt-color-midnight);

        box-sizing: border-box;

        width: 100vw;
        padding-top: 20px;
        padding-left: 20px;
      }
    `}</style>
  </React.Fragment>
);

const mapStateToProps = (state: AppState) => {
  const availableKernels = state.core.entities.kernelspecs.byRef
    .flatMap((kss, ksRef) => {
      return kss.byName.map((ks, name) => {
        return { kernelspec: ks };
      });
    })
    .toList();

  return {
    availableNotebooks: availableKernels
  };
};

const mapDispatchToProps = dispatch => ({});

export const NewNotebookNavigation = connect(
  mapStateToProps,
  mapDispatchToProps
)(PureNewNotebookNavigation);

export default NewNotebookNavigation;
