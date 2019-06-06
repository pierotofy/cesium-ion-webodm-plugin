import React, { Fragment } from "react";
import PropTypes from "prop-types";

export default class AdminPanel extends React.Component {
    static defaultProps = {
        isStaff: PropTypes.bool,
        apiKey: ""
    };

    static propTypes = {
        isStaff: PropTypes.bool,
        apiKey: PropTypes.string
    };

    constructor(props) {
        super(props);

        this.state = {
            isStaff: props.isStaff,
            apiKey: props.apiKey
        };
    }

    handleLogin = apiKey => {
        this.setState({ apiKey });
    };

    handleLogout = () => {
        this.setState({ apiKey: "" });
    };

    render() {
        const { isStaff } = this.state;

        let content;

        if (isStaff) {
        } else {
            content = (
                <div className={"alert alert-warning"}>
                    Sorry you do not have access to this webpage!
                </div>
            );
        }

        return (
            <Fragment>
                <h4>
                    <i className="fa fa-cesium fixed-icon" /> Cesium ion
                </h4>
                <p>
                    Use Cesium ion's simple workflow to create 3D maps of your
                    geospatial data for visualization, analysis, and sharing
                </p>

                <div className="row">
                    <div className="col-md-6 col-md-offset-3 col-sm-12">
                        {content}
                    </div>
                </div>
            </Fragment>
        );
    }
}
