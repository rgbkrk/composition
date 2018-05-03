// @flow

// NOTE: We can safely install and use react-hot-loader as a regular dependency
// instead of a dev dependency as it automatically ensures it is not executed
// in production and the footprint is minimal.
import { hot } from "react-hot-loader";

import * as React from "react";
import * as Immutable from "immutable";

import {
  state as stateModule,
  selectors,
  actions,
  TitleBar,
  NewNotebookNavigation
} from "@nteract/core";

import { CompositeTitle, TitleSection } from "../composite";

// TODO: Make a proper epic
import { contents, sessions } from "rx-jupyter";
const urljoin = require("url-join");
import { first, map, mergeMap } from "rxjs/operators";
import { forkJoin } from "rxjs/observable/forkJoin";

import { dirname } from "path";

import { default as Directory } from "./directory";
import { default as File } from "./file";
import { default as Notebook } from "./notebook";

type ContentRef = stateModule.ContentRef;

import { connect } from "react-redux";

type ContentsProps = {
  contentType: "dummy" | "notebook" | "directory" | "file",
  contentRef: ContentRef,
  filepath: string,
  appPath: string,
  serverConfig: *,
  appVersion: string,
  baseDir: string
};

const mapStateToProps = (
  state: stateModule.AppState,
  ownProps: *
): ContentsProps => {
  const contentRef = selectors.currentContentRef(state);
  const host = state.app.host;
  if (host.type !== "jupyter") {
    throw new Error("this component only works with jupyter apps");
  }
  const serverConfig = selectors.serverConfig(host);

  if (!contentRef) {
    throw new Error("cant display without a contentRef");
  }

  const content = selectors.content(state, { contentRef });
  if (!content) {
    throw new Error("need content to view content, check your contentRefs");
  }

  const appVersion = selectors.appVersion(state);

  // Our base directory is the literal directory we're in otherwise it's relative
  // to the file being viewed.
  const baseDir =
    content.type === "directory" ? content.filepath : dirname(content.filepath);

  return {
    contentType: content.type,
    contentRef,
    filepath: content.filepath,
    appPath: host.basePath,
    serverConfig,
    appVersion,
    baseDir
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

class Contents extends React.Component<ContentsProps, null> {
  constructor(props) {
    super(props);
    (this: any).openNotebook = this.openNotebook.bind(this);
  }

  openNotebook(ks: stateModule.KernelspecRecord | stateModule.KernelspecProps) {
    const serverConfig = this.props.serverConfig;

    // The notebook they get to start with
    const notebook = {
      cells: [
        {
          cell_type: "code",
          execution_count: null,
          metadata: {},
          outputs: [],
          source: []
        }
      ],
      metadata: {
        kernelspec: {
          display_name: ks.displayName,
          language: ks.language,
          name: ks.name
        },
        nteract: {
          version: this.props.appVersion
        }
      },
      nbformat: 4,
      nbformat_minor: 2
    };

    // NOTE: For the sake of expediency, all the logic to launch a new is
    //       happening here instead of an epic
    contents
      // Create UntitledXYZ.ipynb by letting the server do it
      .create(this.props.serverConfig, this.props.baseDir, {
        type: "notebook"
        // NOTE: The contents API appears to ignore the content field for new
        // notebook creation.
        //
        // It would be nice if it could take it. Instead we'll create a new
        // notebook for the user and redirect them after we've put in the
        // content we want.
        //
        // Amusingly, this could be used for more general templates to, as
        // well as introduction notebooks.
      })
      .pipe(
        // We only expect one response, it's ajax and we want this subscription
        // to finish so we don't have to unsubscribe
        first(),
        mergeMap(({ response, status }) => {
          const filepath = response.path;

          const sessionPayload = {
            kernel: {
              id: null,
              name: ks.name
            },
            name: "",
            path: filepath,
            type: "notebook"
          };

          return forkJoin(
            // Get their kernel started up
            sessions.create(this.props.serverConfig, sessionPayload),
            // Save the initial notebook document
            contents.save(this.props.serverConfig, filepath, {
              type: "notebook",
              content: notebook
            })
          );
        }),
        first(),
        map(([session, content]) => {
          const { response, status } = content;

          const url = urljoin(
            // User path
            this.props.appPath,
            // nteract edit path
            "/nteract/edit",
            // Actual file
            response.path
          );

          // Always open new notebooks in new windows
          const win = window.open(url, "_blank");

          // If they block pop-ups, then we weren't allowed to open the window
          if (win === null) {
            // TODO: Show a link at the top to let the user open the notebook directly
            window.location = url;
          }
        })
      )
      .subscribe();
  }

  render() {
    switch (this.props.contentType) {
      case "notebook":
        return (
          <React.Fragment>
            <TitleBar
              logoHref={urljoin(
                this.props.appPath,
                "/nteract/edit/",
                this.props.baseDir
              )}
              logoTitle="Home"
            />
            <Notebook contentRef={this.props.contentRef} />
          </React.Fragment>
        );
      case "file":
        return (
          <React.Fragment>
            <CompositeTitle>
              <TitleSection>
                <a>nteract</a>
              </TitleSection>
              <TitleSection>
                <span>1</span>
              </TitleSection>
              <TitleSection>
                <span>2</span>
              </TitleSection>
              <TitleSection>
                <span>3</span>
              </TitleSection>
              <TitleSection>
                <span>4</span>
              </TitleSection>
              <TitleSection>
                <span>5</span>
              </TitleSection>
              <TitleSection>
                <span>6</span>
              </TitleSection>
              <TitleSection>
                <span>7</span>
              </TitleSection>
            </CompositeTitle>
            <TitleBar
              logoHref={urljoin(
                this.props.appPath,
                "/nteract/edit/",
                this.props.baseDir
              )}
              logoTitle="Home"
            />
            <Container>
              <File contentRef={this.props.contentRef} />
            </Container>
          </React.Fragment>
        );
      case "dummy":
        return (
          <React.Fragment>
            <TitleBar
              logoHref={urljoin(
                this.props.appPath,
                "/nteract/edit/",
                this.props.baseDir
              )}
              logoTitle="Home"
            />
          </React.Fragment>
        );
      case "directory":
        return (
          <React.Fragment>
            <TitleBar
              logoHref={urljoin(this.props.appPath, "/nteract/edit/")}
              logoTitle="Home"
            />
            <NewNotebookNavigation onClick={this.openNotebook} />
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

export default hot(module)(connect(mapStateToProps)(Contents));
