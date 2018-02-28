/* @flow */
import { unlinkObservable } from "fs-observable";

import type { ChildProcess } from "child_process";

import { Observable } from "rxjs/Observable";
import { of } from "rxjs/observable/of";
import { from } from "rxjs/observable/from";
import { empty } from "rxjs/observable/empty";
import { fromEvent } from "rxjs/observable/fromEvent";
import { merge } from "rxjs/observable/merge";

import * as fs from "fs";

import {
  filter,
  map,
  mapTo,
  tap,
  mergeMap,
  catchError,
  pluck,
  switchMap,
  concatMap,
  timeout,
  first,
  concat
} from "rxjs/operators";

import { launchSpec } from "spawnteract";

import { ActionsObservable, ofType } from "redux-observable";

import * as uuid from "uuid";

import { ipcRenderer as ipc } from "electron";

import { createMainChannel } from "enchannel-zmq-backend";
import * as jmp from "jmp";

import type {
  NewKernelAction,
  InterruptKernel,
  LaunchKernelAction,
  LaunchKernelByNameAction,
  KillKernelAction
} from "@nteract/core/src/actionTypes";

import type {
  KernelRef,
  OldKernelInfo,
  OldLocalKernelProps
} from "@nteract/core/src/state";

import { selectors, actions, actionTypes, state } from "@nteract/core";

import {
  createMessage,
  childOf,
  ofMessageType,
  shutdownRequest
} from "@nteract/messaging";

/**
 * Instantiate a connection to a new kernel.
 *
 * @param  {OldKernelInfo}  kernelSpec The kernel specs - name,language, etc
 * @param  {String}  cwd The working directory to launch the kernel in
 */
export function launchKernelObservable(
  kernelSpec: OldKernelInfo,
  cwd: string,
  ref: KernelRef
) {
  const spec = kernelSpec.spec;

  return Observable.create(observer => {
    launchSpec(spec, { cwd, stdio: ["ignore", "pipe", "pipe"] }).then(c => {
      const { config, spawn, connectionFile } = c;

      spawn.stdout.on("data", data => {
        observer.next(actions.kernelRawStdout({ text: data.toString(), ref }));
      });
      spawn.stderr.on("data", data => {
        observer.next(actions.kernelRawStderr({ text: data.toString(), ref }));
      });

      // do dependency injection of jmp to make it match our ABI version of node
      createMainChannel(config, undefined, undefined, jmp)
        .then((channels: Channels) => {
          observer.next(actions.setNotebookKernelInfo(kernelSpec));

          const kernel: OldLocalKernelProps = {
            // TODO: Include the ref when we need it here
            ref: state.createKernelRef(),
            type: "zeromq",
            channels,
            connectionFile,
            spawn,
            cwd,
            kernelSpecName: kernelSpec.name,
            lastActivity: null,
            status: "launched" // TODO: Determine our taxonomy
          };

          observer.next(actions.launchKernelSuccessful({ kernel, ref }));
          // TODO: Request status right after
          observer.next(
            actions.setExecutionState({ kernelStatus: "launched", ref })
          );
          observer.complete();
        })
        .catch(error => {
          observer.error({ type: "ERROR", payload: error, err: true });
        });
    });
  });
}

/**
 * Get kernel specs from main process
 *
 * @returns  {Observable}  The reply from main process
 */
export const kernelSpecsObservable = Observable.create(observer => {
  ipc.on("kernel_specs_reply", (event, specs) => {
    observer.next(specs);
    observer.complete();
  });
  ipc.send("kernel_specs_request");
});

export const launchKernelByNameEpic = (
  action$: ActionsObservable<*>
): Observable<Action> =>
  action$.pipe(
    ofType(actionTypes.LAUNCH_KERNEL_BY_NAME),
    tap((action: LaunchKernelByNameAction) => {
      if (!action.payload.kernelSpecName) {
        throw new Error("launchKernelByNameEpic requires a kernel name");
      }
    }),
    mergeMap((action: LaunchKernelByNameAction) =>
      kernelSpecsObservable.pipe(
        mergeMap(specs =>
          // Defer to a launchKernel action to _actually_ launch
          of(
            actions.launchKernel({
              kernelSpec: specs[action.payload.kernelSpecName],
              cwd: action.payload.cwd,
              ref: action.payload.ref
            })
          )
        )
      )
    )
  );

/**
 * Launches a new kernel.
 *
 * @param  {ActionObservable} action$  ActionObservable for LAUNCH_KERNEL action
 */
export const launchKernelEpic = (
  action$: ActionsObservable<*>,
  store: *
): Observable<Action> =>
  action$.pipe(
    ofType(actionTypes.LAUNCH_KERNEL),
    tap((action: LaunchKernelAction) => {
      if (!action.payload.kernelSpec) {
        throw new Error("launchKernel needs a kernelSpec");
      }
      ipc.send("nteract:ping:kernel", action.payload.kernelSpec);
    }),
    // We must kill the previous kernel now
    // Then launch the next one
    switchMap((action: LaunchKernelAction) => {
      const kernel = selectors.currentKernel(store.getState());

      return merge(
        launchKernelObservable(
          action.payload.kernelSpec,
          action.payload.cwd,
          action.payload.ref
        ),
        // Was there a kernel before (?) -- kill it if so, otherwise nothing else
        kernel ? killKernel({ kernel, ref: action.payload.ref }) : empty()
      );
    }),
    catchError((error: Error, source: rxjs$Observable<*>) => {
      // TODO: we need to get the KernelRef into this failure action.
      return merge(of(actions.launchKernelFailed({ error })), source);
    })
  );

export const interruptKernelEpic = (action$: *, store: *): Observable<Action> =>
  action$.pipe(
    ofType(actionTypes.INTERRUPT_KERNEL),
    // This epic can only interrupt direct zeromq connected kernels
    filter(() => selectors.isCurrentKernelZeroMQ(store.getState())),
    // If the user fires off _more_ interrupts, we shouldn't interrupt the in-flight
    // interrupt, instead doing it after the last one happens
    concatMap((action: InterruptKernel) => {
      const kernel = selectors.currentKernel(store.getState());

      const spawn = kernel.spawn;

      //
      // From the node.js docs
      //
      // > The ChildProcess object may emit an 'error' event if the signal cannot be delivered.
      //
      // This is instead handled in the watchSpawnEpic below
      spawn.kill("SIGINT");

      return merge(
        of(actions.interruptKernelSuccessful({ ref: action.payload.ref }))
      );
    })
  );

export function killKernelImmediately(kernel: *): void {
  kernel.channels.complete();

  // Clean up all the terminal streams
  // "pause" stdin, which puts it back in its normal state
  if (kernel.spawn.stdin) {
    kernel.spawn.stdin.pause();
  }
  kernel.spawn.stdout.destroy();
  kernel.spawn.stderr.destroy();

  // Kill the process fully
  kernel.spawn.kill("SIGKILL");

  fs.unlinkSync(kernel.connectionFile);
}

function killKernel(input: {
  kernel: Object,
  ref?: KernelRef
}): Observable<Action> {
  const request = shutdownRequest({ restart: false });
  const { kernel, ref } = input;

  // Try to make a shutdown request
  // If we don't get a response within X time, force a shutdown
  // Either way do the same cleanup
  const shutDownHandling = kernel.channels.pipe(
    childOf(request),
    ofMessageType("shutdown_reply"),
    first(),
    // If we got a reply, great! :)
    map(msg => actions.shutdownReplySucceeded({ text: msg.content, ref })),
    // If we don't get a response within 2s, assume failure :(
    timeout(1000 * 2),
    catchError(err => of(actions.shutdownReplyTimedOut({ error: err, ref }))),
    mergeMap(action => {
      // End all communication on the channels
      kernel.channels.complete();

      // Clean up all the terminal streams
      // "pause" stdin, which puts it back in its normal state
      if (kernel.spawn.stdin) {
        kernel.spawn.stdin.pause();
      }
      kernel.spawn.stdout.destroy();
      kernel.spawn.stderr.destroy();

      // Kill the process fully
      kernel.spawn.kill("SIGKILL");

      // Delete the connection file
      const del$ = unlinkObservable(kernel.connectionFile).pipe(
        map(() => actions.deleteConnectionFileSuccessful({ ref })),
        catchError(err =>
          of(actions.deleteConnectionFileFailed({ error: err, ref }))
        )
      );

      return merge(
        // Pass on our intermediate action
        of(action),
        // Inform about the state
        of(actions.setExecutionState({ kernelStatus: "shutting down", ref })),
        // and our connection file deletion
        del$
      );
    }),
    catchError(err =>
      // Catch all, in case there were other errors here
      of(actions.killKernelFailed({ error: err, ref }))
    )
  );

  // On subscription, send the message
  return Observable.create(observer => {
    const subscription = shutDownHandling.subscribe(observer);
    kernel.channels.next(request);
    return subscription;
  });
}

// TODO: Switch this to a ref based setup
//
// Yet another "would be nice to have a ref" setup, since we may be switching
// from one kernel to another
//
export const killKernelEpic = (action$: *, store: *): Observable<Action> =>
  action$.pipe(
    ofType(actionTypes.KILL_KERNEL),
    // This epic can only interrupt direct zeromq connected kernels
    filter(() => selectors.isCurrentKernelZeroMQ(store.getState())),
    concatMap((action: KillKernelAction) => {
      const kernel = selectors.currentKernel(store.getState());
      return killKernel({ kernel, ref: action.payload.ref });
    })
  );

export function watchSpawn(action$: *, store: *) {
  return action$.pipe(
    ofType(actionTypes.LAUNCH_KERNEL_SUCCESSFUL),
    switchMap((action: NewKernelAction) => {
      if (!action.payload.kernel.type === "zeromq") {
        throw new Error("kernel.type is not zeromq.");
      }
      if (!action.payload.kernel.spawn) {
        throw new Error("kernel.spawn is not provided.");
      }
      // $FlowFixMe: spawn's type seems not to be defined.
      const spawn: ChildProcess = action.payload.kernel.spawn;
      return Observable.create(observer => {
        spawn.on("error", error => {
          // We both set the state and make it easy for us to log the error
          observer.next(
            actions.setExecutionState({
              kernelStatus: "errored",
              ref: action.payload.ref
            })
          );
          observer.error({ type: "ERROR", payload: error, err: true });
          observer.complete();
        });
        spawn.on("exit", () => {
          observer.next(
            actions.setExecutionState({
              kernelStatus: "exited",
              ref: action.payload.ref
            })
          );
          observer.complete();
        });
        spawn.on("disconnect", () => {
          observer.next(
            actions.setExecutionState({
              kernelStatus: "disconnected",
              ref: action.payload.ref
            })
          );
          observer.complete();
        });
      });
    })
  );
}
