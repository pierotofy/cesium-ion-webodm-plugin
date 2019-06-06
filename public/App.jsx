import React, { Fragment } from "react";
import PropTypes from "prop-types";

import TokenPage from "./TokenPage";
import "./App.scss";

export default class AdminPanel extends React.Component {
  render() {
    let content;

    return (
      <Fragment>
        <h4>
          <i className="fa fa-cesium fixed-icon" /> <strong>Cesium ion</strong>
        </h4>
        <p className="description">
          Use Cesium ion's simple workflow to create 3D maps of your geospatial
          data for visualization, analysis, and sharing
        </p>

        <TokenPage />
      </Fragment>
    );
  }
}
