/* @flow */

import { Observable } from "rxjs/Observable";
import { of } from "rxjs/observable/of";
import { empty } from "rxjs/observable/empty";
import { merge } from "rxjs/observable/merge";
import { from } from "rxjs/observable/from";

import { createMessage, childOf, ofMessageType } from "@nteract/messaging";

import type { Notebook, ImmutableNotebook } from "@nteract/commutable";
import type { KernelRef } from "../state/refs";

const path = require("path");

import {
  filter,
  map,
  tap,
  mergeMap,
  concatMap,
  catchError,
  first,
  pluck,
  switchMap
} from "rxjs/operators";

import { ActionsObservable, ofType } from "redux-observable";

import * as uuid from "uuid";

import type {
  NewKernelAction,
  RestartKernel,
  SetNotebookAction
} from "../actionTypes";

import * as selectors from "../selectors";
import * as actions from "../actions";
import * as actionTypes from "../actionTypes";

/**
 * Sets the execution state after a kernel has been launched.
 *
 * @oaram  {ActionObservable}  action$ ActionObservable for LAUNCH_KERNEL_SUCCESSFUL action
 */
export const watchExecutionStateEpic = (action$: ActionsObservable<*>) =>
  action$.pipe(
    ofType(actionTypes.LAUNCH_KERNEL_SUCCESSFUL),
    switchMap((action: NewKernelAction) =>
      action.payload.kernel.channels.pipe(
        filter(msg => msg.header.msg_type === "status"),
        map(msg =>
          actions.setExecutionState({
            kernelStatus: msg.content.execution_state,
            ref: action.payload.ref
          })
        )
      )
    )
  );

/**
 * Send a kernel_info_request to the kernel.
 *
 * @param  {Object}  channels  A object containing the kernel channels
 * @returns  {Observable}  The reply from the server
 */
export function acquireKernelInfo(channels: Channels, ref: KernelRef) {
  const message = createMessage("kernel_info_request");

  const obs = channels.pipe(
    childOf(message),
    ofMessageType("kernel_info_reply"),
    first(),
    pluck("content", "language_info"),
    map(langInfo => actions.setLanguageInfo({ langInfo, ref }))
  );

  return Observable.create(observer => {
    const subscription = obs.subscribe(observer);
    channels.next(message);
    return subscription;
  });
}

/**
 * Gets information about newly launched kernel.
 *
 * @param  {ActionObservable}  The action type
 */
export const acquireKernelInfoEpic = (action$: ActionsObservable<*>) =>
  action$.pipe(
    ofType(actionTypes.LAUNCH_KERNEL_SUCCESSFUL),
    switchMap((action: NewKernelAction) => {
      const { payload: { kernel: { channels }, ref } } = action;
      return acquireKernelInfo(channels, ref);
    })
  );

export const extractNewKernel = (
  filename: ?string,
  notebook: ImmutableNotebook
) => {
  // TODO: There's some incongruence between desktop and web app here, regarding path vs. filename
  const cwd = (filename && path.dirname(filename)) || "/";

  const kernelSpecName = notebook.getIn(
    ["metadata", "kernelspec", "name"],
    notebook.getIn(["metadata", "language_info", "name"], "python3")
  );

  return {
    cwd,
    kernelSpecName
  };
};

export const launchKernelWhenNotebookSetEpic = (
  action$: ActionsObservable<*>
) =>
  action$.pipe(
    ofType(actionTypes.SET_NOTEBOOK),
    map((action: SetNotebookAction) => {
      const { cwd, kernelSpecName } = extractNewKernel(
        action.payload.filename,
        action.payload.notebook
      );

      return actions.launchKernelByName({
        kernelSpecName,
        cwd,
        ref: action.payload.kernelRef
      });
    })
  );

export const restartKernelEpic = (action$: ActionsObservable<*>, store: *) =>
  action$.pipe(
    ofType(actionTypes.RESTART_KERNEL),
    concatMap((action: RestartKernel) => {
      const state = store.getState();
      const kernel = selectors.currentKernel(state);
      const notificationSystem = selectors.notificationSystem(state);

      if (!kernel) {
        notificationSystem.addNotification({
          title: "Failure to Restart",
          message: `Unable to restart kernel, please select a new kernel.`,
          dismissible: true,
          position: "tr",
          level: "error"
        });

        // TODO: Wow do we need to send notifications through our store for
        // consistency
        return empty();
      }

      // TODO: Incorporate this into each of the launchKernelByName
      //       actions...
      //       This only mirrors the old behavior of restart kernel (for now)
      notificationSystem.addNotification({
        title: "Kernel Restarted",
        message: `Kernel ${kernel.kernelSpecName} has been restarted.`,
        dismissible: true,
        position: "tr",
        level: "success"
      });

      return of(
        actions.killKernel({ restarting: true, ref: action.payload.ref }),
        actions.launchKernelByName({
          kernelSpecName: kernel.kernelSpecName,
          cwd: kernel.cwd,
          ref: action.payload.ref
        })
      );
    })
  );
