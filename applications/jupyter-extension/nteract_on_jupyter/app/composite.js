// @flow
import { hot } from "react-hot-loader";
import * as React from "react";

export const TitleSection = (props: {
  children: React.Node,
  side: "left" | "center" | "right"
}) => {
  return (
    <React.Fragment>
      <span className="section">{props.children}</span>
      <style jsx>{`
        .section {
          display: inline-block;
          vertical-align: top;
          /* width will be based on the parent container and number of items */
          text-align: ${props.side};
        }
      `}</style>
    </React.Fragment>
  );
};

TitleSection.defaultProps = {
  side: "left"
};

export const CompositeTitle = (props: {
  children: React.ChildrenArray<React.Element<*>>
}) => {
  const count = React.Children.count(props.children);
  if (count === 0) {
    return null;
  }

  const percent = `${1 / count * 100}%`;

  return (
    <React.Fragment>
      <div className="composite">
        {React.Children.map(props.children, (child, idx) => {
          const halfway = (count - 1) / 2;

          let side = "left";
          if (idx === halfway) {
            side = "center";
          } else if (idx > halfway) {
            side = "right";
          } else {
            side = "left";
          }

          return React.cloneElement(child, {
            side
          });
        })}
      </div>
      <style jsx>{`
        .composite > *:last-child {
          text-align: right;
        }

        /* In case the last child is the first, set it back to the left */
        .composite > *:first-child {
          text-align: left;
        }

        .composite :global(*) {
          width: ${percent};
        }
      `}</style>
    </React.Fragment>
  );
};
