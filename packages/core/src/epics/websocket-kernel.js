// @flow
import type {
  InterruptKernel,
  KillKernelAction,
  LaunchKernelByNameAction
} from "../actionTypes";

import { ofType } from "redux-observable";

import {
  catchError,
  map,
  mergeMap,
  switchMap,
  concatMap,
  filter
} from "rxjs/operators";
import { of } from "rxjs/observable/of";
import { from } from "rxjs/observable/from";
import { merge } from "rxjs/observable/merge";

import { kernels, shutdown } from "rx-jupyter";
import { v4 as uuid } from "uuid";

import * as actions from "../actions";
import * as selectors from "../selectors";
import * as actionTypes from "../actionTypes";

import { executeRequest, kernelInfoRequest } from "@nteract/messaging";

export const startSessionEpic = (action$: *, store: *) =>
  action$.pipe(
    // TODO: Could this use a "load contents"
    ofType(actionTypes.SET_NOTEBOOK)
  );

export const launchWebSocketKernelEpic = (action$: *, store: *) =>
  action$.pipe(
    ofType(actionTypes.LAUNCH_KERNEL_BY_NAME),
    // Only accept jupyter servers for the host with this epic
    filter(() => selectors.isCurrentHostJupyter(store.getState())),
    // TODO: When a switchMap happens, we need to close down the originating
    // kernel, likely by sending a different action. Right now this gets
    // coordinated in a different way.
    switchMap((action: LaunchKernelByNameAction) => {
      const { payload: { kernelSpecName, cwd, ref } } = action;
      const config = selectors.serverConfig(store.getState());

      return kernels.start(config, kernelSpecName, cwd).pipe(
        mergeMap(data => {
          const session = uuid();

          const kernel = Object.assign({}, data.response, {
            type: "websocket",
            cwd,
            channels: kernels.connect(config, data.response.id, session),
            kernelSpecName
          });

          kernel.channels.next(kernelInfoRequest());

          return of(actions.launchKernelSuccessful({ kernel, ref }));
        })
      );
    })
  );

export const interruptKernelEpic = (action$: *, store: *) =>
  action$.pipe(
    ofType(actionTypes.INTERRUPT_KERNEL),
    // This epic can only interrupt kernels on jupyter websockets
    filter(() => selectors.isCurrentHostJupyter(store.getState())),
    // If the user fires off _more_ interrupts, we shouldn't interrupt the in-flight
    // interrupt, instead doing it after the last one happens
    concatMap((action: InterruptKernel) => {
      const state = store.getState();
      const serverConfig = selectors.serverConfig(state);
      const kernel = selectors.currentKernel(state);
      const id = kernel.id;

      return kernels.interrupt(serverConfig, id).pipe(
        map(() =>
          actions.interruptKernelSuccessful({ ref: action.payload.ref })
        ),
        catchError(err =>
          of(
            actions.interruptKernelFailed({
              error: err,
              ref: action.payload.ref
            })
          )
        )
      );
    })
  );

export const killKernelEpic = (action$: *, store: *) =>
  action$.pipe(
    ofType(actionTypes.KILL_KERNEL),
    // This epic can only interrupt kernels on jupyter websockets
    filter(() => selectors.isCurrentHostJupyter(store.getState())),
    // If the user fires off _more_ kills, we shouldn't interrupt the in-flight
    // kill, instead doing it after the last one happens
    concatMap((action: KillKernelAction) => {
      const state = store.getState();
      const serverConfig = selectors.serverConfig(state);
      const kernel = selectors.currentKernel(state);
      const id = kernel.id;

      return kernels
        .kill(serverConfig, id)
        .pipe(
          map(() => actions.killKernelSuccessful({ ref: action.payload.ref })),
          catchError(err =>
            of(
              actions.killKernelFailed({ error: err, ref: action.payload.ref })
            )
          )
        );
    })
  );
