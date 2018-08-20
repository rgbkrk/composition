// @flow
/* global MathJax */

import * as React from "react";
import PropTypes from "prop-types";
import loadScript from "./load-script";

export type MathJaxContextType = {
  MathJax: ?Object,
  loaded: boolean
};

const MathJaxContext = React.createContext<MathJaxContextType>({
  loaded: false,
  MathJax: null
});

const MathJaxConsumer = MathJaxContext.Consumer;

export { MathJaxConsumer };

// MathJax expected to be a global and may be undefined
declare var MathJax: ?Object;

export type Props = {
  src: ?string,
  children: React.Node,
  didFinishTypeset: ?() => void,
  // Provide a way to override how we load MathJax and callback to the onLoad
  // For Hydrogen, for instance we can set
  //
  //  loader={(onLoad) => loadMathJax(document, onLoad)}
  //
  loader: ?(cb: Function) => void,
  input: "ascii" | "tex",
  delay: number,
  options: Object,
  loading: React.Node,
  noGate: boolean,
  onError: (err: Error) => void,
  onLoad: ?Function
};

/**
 * Context for loading MathJax
 */
class LoadMathJax extends React.Component<Props, MathJaxContextType> {
  static defaultProps = {
    src:
      "https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/MathJax.js?config=TeX-MML-AM_CHTML",
    input: "tex",
    didFinishTypeset: null,
    loader: null,
    delay: 0,
    options: {},
    loading: null,
    noGate: false,
    onLoad: null,
    onError: (err: Error) => {
      console.error(err);
    }
  };

  constructor(props: Props) {
    super(props);
    this.state = { loaded: false };
    (this: any).onLoad = this.onLoad.bind(this);
  }

  getChildContext() {
    return {
      // Here we see if MathJax is defined globally by running a typeof on a
      // potentially not set value then explicitly setting the MathJax context
      // to undefined.
      MathJax: typeof MathJax === "undefined" ? undefined : MathJax,
      input: this.props.input,
      MathJaxContext: true
    };
  }

  componentDidMount() {
    const src = this.props.src;

    if (!src) {
      return this.onLoad();
    }

    if (!this.props.loader) {
      loadScript(src, this.onLoad);
    } else {
      this.props.loader(this.onLoad);
    }
  }

  onLoad() {
    if (!MathJax || !MathJax.Hub) {
      this.props.onError(
        new Error("MathJax not really loaded even though onLoad called")
      );
      return;
    }

    const options = this.props.options;

    MathJax.Hub.Config(options);

    MathJax.Hub.Register.StartupHook("End", () => {
      if (!MathJax) {
        this.props.onError(
          new Error("MathJax became undefined in the middle of processing")
        );
        return;
      }
      MathJax.Hub.processSectionDelay = this.props.delay;

      if (this.props.didFinishTypeset) {
        this.props.didFinishTypeset();
      }
    });

    MathJax.Hub.Register.MessageHook("Math Processing Error", message => {
      if (this.props.onError) {
        this.props.onError(message);
      }
    });

    if (this.props.onLoad) {
      this.props.onLoad();
    }

    this.setState({
      MathJax: MathJax,
      loaded: true
    });
  }

  render() {
    if (!this.state.loaded && !this.props.noGate) {
      return this.props.loading;
    }

    const children = this.props.children;

    return (
      <MathJaxContext.Provider value={this.state}>
        {children}
      </MathJaxContext.Provider>
    );
  }
}

export default LoadMathJax;
