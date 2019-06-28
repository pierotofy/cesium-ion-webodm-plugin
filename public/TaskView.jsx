import React, { Component, Fragment } from "react";

import ErrorMessage from "webodm/components/ErrorMessage";
import { Button } from "react-bootstrap";

import IonAssetButton from "./components/IonAssetButton";
import UploadDialog from "./components/UploadDialog";
import TasksDialog from "./components/TasksDialog";
import AppContext from "./components/AppContext";
import {
	ImplicitTaskFetcher as TaskFetcher,
	APIFetcher
} from "./components/Fetcher";
import { AssetStyles } from "./defaults";
import { fetchCancelable, getCookie } from "./utils";

export default class TaskView extends Component {
	state = {
		error: "",
		currentAsset: null,
		isTasksDialog: false
	};

	cancelableFetch = null;
	refreshTasks = null;
	refreshAssets = null;

	onOpenAssetDropdown = asset => this.setState({ currentAsset: asset });

	onHideUploadDialog = () => this.setState({ currentAsset: null, error: "" });

	onUploadAsset = data => {
		const { task, token, apiURL } = this.props;
		const { currentAsset } = this.state;
		const payload = Object.assign({}, data);

		if (currentAsset === null) {
			console.warning("Submissions on invalid asset");
			return;
		}

		payload.token = token;
		payload.asset_type = currentAsset;

		this.cancelableFetch = fetchCancelable(
			`/api${apiURL}/task/${task.id}/share`,
			{
				method: "POST",
				credentials: "same-origin",
				headers: {
					"X-CSRFToken": getCookie("csrftoken"),
					Accept: "application/json",
					"Content-Type": "application/json"
				},
				body: JSON.stringify(payload)
			}
		)
			.promise.then(this.refreshTasks)
			.finally(this.onHideUploadDialog);
	};

	showTaskDialog = () => this.setState({ isTasksDialog: true });

	hideTaskDialog = () => this.setState({ isTasksDialog: false });

	onTasksRefreshed = ({ items = [] }) => {
		if (items.length <= 0) {
			this.hideTaskDialog();
			return;
		}
		setTimeout(this.refreshTasks, 5000);
	};

	getUploadDialog() {
		const { task } = this.props;
		const { currentAsset } = this.state;
		const show = currentAsset !== null;
		const assetName = show ? AssetStyles[currentAsset].name : "";

		return (
			<APIFetcher path={"projects"} params={{ id: task.project }}>
				{({ isLoading, isError, data }) => {
					const initialValues = {};

					if (!isLoading && !isError && data.results.length > 0) {
						const project = data.results[0];
						initialValues.name = `${project.name} | ${task.name} ⁠— ${assetName}`;
						initialValues.description = project.description;
					}

					return (
						<UploadDialog
							title={`Tile in Cesium ion — ${assetName}`}
							initialValues={initialValues}
							show={currentAsset !== null}
							asset={currentAsset}
							onHide={this.onHideUploadDialog}
							onSubmit={this.onUploadAsset}
						/>
					);
				}}
			</APIFetcher>
		);
	}

	componentWillUnmount() {
		if (this.cancelableFetch === null) return;
		this.cancelableFetch.cancel();
	}

	render() {
		const { isTasksDialog, isRefreshTask } = this.state;

		return (
			<AppContext.Provider value={this.props}>
				<ErrorMessage bind={[this, "error"]} />
				<div className={"ion-dropdowns"}>
					<TaskFetcher
						path={"share"}
						onBindRefresh={method => (this.refreshAssets = method)}
					>
						{({ isLoading, isError, data = {} }) => (
							<Fragment>
								<IonAssetButton
									assets={data.available}
									onSelect={this.onOpenAssetDropdown}
								>
									Tile in Cesium ion
								</IonAssetButton>

								{data.exported && data.exported.length > 0 && (
									<IonAssetButton
										assets={data.exported}
										onSelect={this.onOpenAssetDropdown}
									>
										View in Cesium ion
									</IonAssetButton>
								)}
							</Fragment>
						)}
					</TaskFetcher>

					{this.getUploadDialog()}

					<TaskFetcher
						path={"status"}
						onBindRefresh={method => (this.refreshTasks = method)}
						onLoad={this.onTasksRefreshed}
						onError={() =>
							this.setState({ error: "Failed to load tasks!" })
						}
					>
						{({ isLoading, isError, data }) => {
							if (isLoading || isError) return null;
							const isTasksButton =
								data.items && data.items.length > 0;

							return (
								<Fragment>
									{isTasksButton && (
										<Button
											className={"ion-btn"}
											bsStyle={"primary"}
											bsSize={"small"}
											onClick={this.showTaskDialog}
										>
											<i className={"fa fa-cesium"} />
											View ion Tasks
										</Button>
									)}
									<TasksDialog
										show={isTasksDialog}
										onHide={this.hideTaskDialog}
										tasks={data.items}
									/>
								</Fragment>
							);
						}}
					</TaskFetcher>
				</div>
			</AppContext.Provider>
		);
	}
}
