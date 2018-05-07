// @flow
import * as React from "react";

type ColorsState = {
  data: null | Object
};

class Colors extends React.Component<null, ColorsState> {
  constructor(props: null) {
    super(props);
    this.state = {
      data: null
    };
  }

  componentDidMount() {
    import("@nteract/styles").then(mod => {
      debugger;
    });
  }

  render() {
    return null;
  }
}

export default class DevModeBanner extends React.Component<null, null> {
  render() {
    if (process.env.NODE_ENV === "production") {
      return null;
    }
    return (
      <React.Fragment>
        <div className="banner">
          <h3>Dev Mode</h3>
          <details>
            <summary>Behind the scenes</summary>
            <div className="details" />
          </details>
        </div>
        <style jsx>{`
          .banner {
            padding: 20px 20px 20px 20px;
          }
        `}</style>
      </React.Fragment>
    );
  }
}
