// @flow
import * as React from "react";
import ReactDOM from "react-dom";

import { Provider } from "react-redux";

import NotificationSystem from "react-notification-system";

import configureStore from "./store";

import type { JupyterConfigData } from "./store";

import {
  ModalController,
  NotebookApp,
  NotebookMenu,
  Styles,
  TitleBar,
  actions,
  state
} from "@nteract/core";

function createApp(jupyterConfigData: JupyterConfigData) {
  const store = configureStore({ config: jupyterConfigData });
  window.store = store;

  class App extends React.Component<*> {
    notificationSystem: NotificationSystem;

    componentDidMount(): void {
      const hostRef = state.createHostRef();
      const kernelspecsRef = state.createKernelspecsRef();
      const kernelRef = state.createKernelRef();

      store.dispatch(
        actions.addHost({
          hostRef,

          // TODO: are we missing some host info here?
          host: {
            id: null,
            type: "jupyter",
            defaultKernelName: "python",
            kernelIds: null,
            token: jupyterConfigData.token,
            serverUrl: location.origin + jupyterConfigData.baseUrl
          }
        })
      );

      // TODO: we should likely be passing in a hostRef to fetchContent too.
      // TODO: provide a KernelRef
      store.dispatch(
        actions.fetchContent({
          path: jupyterConfigData.contentsPath,
          params: {},
          kernelRef
        })
      );
      store.dispatch(actions.fetchKernelspecs({ hostRef, kernelspecsRef }));
    }

    render(): React$Element<any> {
      return (
        <Provider store={store}>
          <React.Fragment>
            <Styles>
              <TitleBar />
              <NotebookMenu />
              <NotebookApp />
              <NotificationSystem
                ref={notificationSystem => {
                  this.notificationSystem = notificationSystem;
                }}
              />
              <ModalController />
            </Styles>
            <style jsx global>{`
              body {
                font-family: "Source Sans Pro";
                font-size: 16px;
                line-height: 22px;
                background-color: var(--theme-app-bg);
                color: var(--theme-app-fg);
                /* All the old theme setups declared this, putting it back for consistency */
                line-height: 1.3 !important;
                margin: 0;
              }

              #app {
                padding-top: 20px;
              }

              @keyframes fadeOut {
                from {
                  opacity: 1;
                }
                to {
                  opacity: 0;
                }
              }

              div#loading {
                animation-name: fadeOut;
                animation-duration: 0.25s;
                animation-fill-mode: forwards;
              }
            `}</style>
          </React.Fragment>
        </Provider>
      );
    }
  }

  return App;
}

function main(rootEl: Element, dataEl: Node | null) {
  // When the data element isn't there, provide an error message
  // Primarily for development usage
  const ErrorPage = (props: { error?: Error }) => (
    <React.Fragment>
      <h1>ERROR</h1>
      <pre>Unable to parse / process the jupyter config data.</pre>
      {props.error ? props.error.message : null}
    </React.Fragment>
  );

  if (!dataEl) {
    ReactDOM.render(<ErrorPage />, rootEl);
    return;
  }

  let jupyterConfigData: JupyterConfigData;

  try {
    jupyterConfigData = JSON.parse(dataEl.textContent);
  } catch (err) {
    ReactDOM.render(<ErrorPage error={err} />, rootEl);
    return;
  }

  const App = createApp(jupyterConfigData);
  ReactDOM.render(<App />, rootEl);
}

const rootEl = document.querySelector("#root");
const dataEl = document.querySelector("#jupyter-config-data");

if (!rootEl || !dataEl) {
  alert("Something drastic happened, and we don't have config data");
} else {
  main(rootEl, dataEl);
}
