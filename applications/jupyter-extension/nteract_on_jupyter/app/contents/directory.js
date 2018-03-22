// @flow

import * as React from "react";
import * as Immutable from "immutable";
const urljoin = require("url-join");

import { Link } from "react-router-dom";

import TimeAgo from "@nteract/timeago";
import { Book, FileText, FileDirectory } from "@nteract/octicons";

import { selectors, actions, state as stateModule } from "@nteract/core";

// Workaround flow limitation for getting these types
type ContentRef = stateModule.ContentRef;
type ContentRecord = stateModule.ContentRecord;
type DirectoryContentRecord = stateModule.DirectoryContentRecord;

import { connect } from "react-redux";

type DirectoryEntryProps = {
  type: "unknown" | "notebook" | "directory" | "file",
  href: string,
  displayName: string
};

/**
 * Note: the URLs we create for clicking have to take into account:
 *    Server base URL   e.g. https://j.nteract.io/user/kylek/
 *    Route path        e.g. /edit/
 *    Filepath          e.g. Untitled.ipynb
 */

class DirectoryEntry extends React.PureComponent<DirectoryEntryProps, *> {
  render() {
    const { href, type, displayName } = this.props;

    let Icon = FileText;

    switch (type) {
      case "notebook":
        Icon = Book;
        break;
      case "directory":
        Icon = FileDirectory;
        break;
      case "file":
        Icon = FileText;
        break;
    }

    return (
      <React.Fragment>
        <Icon />
        <Link
          to={href}
          // When it's a notebook, we open a new tab
          target={type === "notebook" ? "_blank" : undefined}
        >
          {displayName}
        </Link>
        <style jsx>{`
          a {
            padding-left: 10px;
            text-decoration: none;
            color: var(--theme-app-fg);
            background-color: var(--theme-app-bg);
          }
        `}</style>
      </React.Fragment>
    );
  }
}

const mapStateToEntryProps = (
  state: stateModule.AppState,
  ownProps: { contentRef: ContentRef }
): DirectoryEntryProps => {
  const host = selectors.currentHost(state);
  if (host.type !== "jupyter") {
    throw new Error("This component only works with jupyter servers");
  }

  const entry = selectors.contentByRef(state, ownProps);
  if (!entry) {
    // TODO: Determine what we do if we try to load content that isn't in the byRef structure
    return {
      type: "unknown",
      href: "",
      displayName: "Unknown Content"
    };
  }

  const displayName = entry.filepath.split("/").pop() || "";
  const href = urljoin("/edit/", entry.filepath);

  let type = entry.type;
  if (entry.type === "dummy") {
    type = entry.assumedType;
  }

  return {
    type,
    href,
    displayName
  };
};

const ConnectedEntry = connect(mapStateToEntryProps)(DirectoryEntry);

type DirectoryProps = {
  content: DirectoryContentRecord
};

export class Directory extends React.PureComponent<DirectoryProps, *> {
  render() {
    const atRoot = this.props.content.filepath === "/";

    const dotdothref = urljoin(
      "/edit/",
      urljoin(this.props.content.filepath, "..")
    );

    return (
      <ul>
        {atRoot ? null : (
          // TODO: Create a contentRef for `..`, even though it's a placeholder
          // When we're not at the root of the tree, show `..`
          <DirectoryEntry href={dotdothref} displayName=".." type="directory" />
        )}
        {this.props.content.model.items.map(contentRef => (
          <li key={contentRef}>
            <ConnectedEntry contentRef={contentRef} />
          </li>
        ))}
        <style jsx>{`
          ul {
            list-style-type: none;
          }
        `}</style>
      </ul>
    );
  }
}

const mapStateToDirectoryProps = (
  state: stateModule.AppState,
  ownProps: { contentRef: ContentRef }
): DirectoryProps => {
  const host = selectors.currentHost(state);
  if (host.type !== "jupyter") {
    throw new Error("This component only works with jupyter servers");
  }

  return {
    content: selectors.contentByRef(state, ownProps)
  };
};

export const ConnectedDirectory = connect(mapStateToDirectoryProps)(Directory);

export default ConnectedDirectory;
