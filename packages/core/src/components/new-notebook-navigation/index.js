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

import type { KernelspecRecord } from "../../state/entities/kernelspecs";

import { default as Logo } from "./logos";

import * as Immutable from "immutable";

export type AvailableNotebook = {
  kernelspec: KernelspecRecord
};

export type AvailableNotebooks = Immutable.List<AvailableNotebook>;

export const NewNotebook = (
  props: AvailableNotebook & {
    href?: string,
    onClick?: (ks: KernelspecRecord) => void
  }
) => {
  const inner = (
    <React.Fragment>
      <div className="display-name">{props.kernelspec.displayName}</div>
      <div className="logo">
        <Logo language={props.kernelspec.language} />
      </div>
    </React.Fragment>
  );

  const onClick = () => {
    if (props.onClick) {
      props.onClick(props.kernelspec);
    }
  };

  return (
    <React.Fragment>
      {props.href ? (
        <a className="newNotebook" href={props.href}>
          {inner}
        </a>
      ) : (
        <button className="newNotebook" onClick={onClick}>
          {inner}
        </button>
      )}
      <style jsx>{`
        .newNotebook :global(*) {
          color: var(--nt-color-midnight-light);
        }

        a {
          padding-top: 20px;
        }

        .newNotebook {
          font-size: 20px;
          text-align: center;
          font-family: var(--nt-font-family-normal);
          background-color: var(--nt-color-midnight-lightest);
          height: 212px;
          width: 150px;
          color: var(--nt-color-midnight-light);

          margin-right: 20px;

          flex: 0 0 auto;

          --logo-off: currentColor;
        }

        .newNotebook:focus,
        .newNotebook:hover {
          --logo-off: unset;
        }

        .newNotebook:focus {
          outline: 1px solid var(--nt-color-midnight-lighter);
        }

        .newNotebook:hover {
          background-color: var(--nt-color-midnight-lighter);
        }

        .display-name {
          padding-bottom: 30px;
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
        margin: 20px 0px 20px 0px;
        height: 240px;

        display: flex;
        flex-wrap: nowrap;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        -ms-overflow-style: -ms-autohiding-scrollbar;
      }
    `}</style>
  </div>
);

export const NewNotebookNavigation = (props: {
  availableNotebooks: AvailableNotebooks,
  onClick?: (ks: KernelspecRecord) => void
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

export default connect(mapStateToProps, mapDispatchToProps)(
  NewNotebookNavigation
);
