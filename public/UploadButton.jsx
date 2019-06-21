import React, { Component, Fragment } from "react";

import UploadDialog from "./components/UploadDialog";
import TaskContext from "./components/TaskContext";
import TaskFetcher from "./components/TaskFetcher";

export default class ShareButton extends Component {
	state = {
		showDialog: false
	};

	onClick = () => this.setState({ showDialog: true });

	onHide = () => this.setState({ showDialog: false });

	render() {
		const { showDialog } = this.state;
		const { apiURL, task } = this.props;

		const context = {
			url: `${apiURL}/task`,
			task: task
		};

		console.log(showDialog);

		return (
			<TaskContext.Provider value={context}>
				<button
					className={"btn btn-sm btn-primary"}
					onClick={this.onClick}
				>
					<i className={"fa fa-cesium"} />
					<span> Upload to Cesium ion</span>
				</button>
				<TaskFetcher method={"GET"} path={"share"}>
					{({ data: { available, exported } = {}, loading }) => (
						<UploadDialog
							show={showDialog}
							loading={loading}
							availableAssets={available}
							exportedAssets={exported}
							onHide={this.onHide}
						/>
					)}
				</TaskFetcher>
			</TaskContext.Provider>
		);
	}
}
