import React, { Component, Fragment } from "react";

import UploadDialog from "./UploadDialog";

function getCookie(name) {
	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${name}=`);
	if (parts.length == 2)
		return parts
			.pop()
			.split(";")
			.shift();
}

export default class ShareButton extends Component {
	state = {
		showDialog: false
	};

	onClick = () =>
		this.setState({
			showDialog: true
		});

	render() {
		const { showDialog } = this.state;

		return (
			<Fragment>
				<button
					className={"btn btn-sm btn-primary"}
					onClick={this.onClick}
				>
					<i className={"fa fa-cesium"} />
					<span> Upload to Cesium ion</span>
				</button>
				<UploadDialog show={showDialog} />
			</Fragment>
		);
	}
}
