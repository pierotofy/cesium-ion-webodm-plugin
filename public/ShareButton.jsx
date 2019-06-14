import React from "react";
import PropTypes from "prop-types";
import Storage from "webodm/classes/Storage";
import ErrorMessage from "webodm/components/ErrorMessage";
import $ from "jquery";

export default class ShareButton extends React.Component {
    render() {
        return (
            <button className="btn btn-sm btn-primary" >
                <i className={"fa fa-cesium"} />
                <span> Upload to Cesium ion</span>
            </button>
        );
    }
}
