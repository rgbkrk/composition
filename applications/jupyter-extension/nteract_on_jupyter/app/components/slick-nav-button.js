// @flow
import * as React from "react";

const SlickNavButton = () => {
  return (
    <React.Fragment>
      <button>Save</button>
      <style jsx>{`
        button {
          vertical-align: middle;
        }

        button {
          padding: 0px 16px;
          border: none;
          outline: none;
          border-radius: unset;
          background-color: rgba(0, 0, 0, 0);
          color: black;
          /* height: var(--header-height); */
          font-family: Monaco, monospace;
        }

        button:active,
        button:focus {
          /* background-color: rgba(255, 255, 255, 0.1); */
        }

        button:hover {
          /* background-color: rgba(255, 255, 255, 0.2); */
          /* color: #d7d7d7; */
          background-color: black;
          color: white;
        }

        button:disabled {
          /* background-color: rgba(255, 255, 255, 0.1); */
          /* color: rgba(255, 255, 255, 0.1); */
          background-color: black;
          color: white;
        }
      `}</style>
    </React.Fragment>
  );
};

export default SlickNavButton;
