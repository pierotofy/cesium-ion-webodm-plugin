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
	timeoutHandler = null;
	refreshAssets = null;

	onOpenUploadDialog = asset => this.setState({ currentAsset: asset });

	onHideUploadDialog = () => this.setState({ currentAsset: null });

	showTaskDialog = () => this.setState({ isTasksDialog: true });

	hideTaskDialog = () => this.setState({ isTasksDialog: false });

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
			.promise.then(this.refreshAssets)
			.finally(this.onHideUploadDialog);
	};

	onClearFailedAssets = () => {
		const { task, apiURL } = this.props;

		this.cancelableFetch = fetchCancelable(
			`/api${apiURL}/task/${task.id}/clear`,
			{
				method: "POST",
				credentials: "same-origin",
				headers: {
					"X-CSRFToken": getCookie("csrftoken")
				}
			}
		);

		this.cancelableFetch.promise.then(this.refreshAssets);
	};

	onAssetsRefreshed = ({ items = [] }) => {
		const hasTasks = items.filter(item => item.isTask).length > 0;
		if (!hasTasks) this.hideTaskDialog();
		if (!items.every(item => !item.isError)) return;
		if (items.length <= 0) {
			this.hideTaskDialog();
			this.refreshAssets();
			return;
		}
		this.timeoutHandler = setTimeout(this.refreshAssets, 5000);
	};

	onCleanStatus = ({ data: { updated = false } }) => {
		if (!updated || this.refreshAssets == null) return;
		this.refreshAssets();
	};

	onErrorUploadDialog = msg => {
		this.setState({ error: msg });
		this.onHideUploadDialog();
	};

	handleAssetSelect = data => asset => {
		const idMap = data.items
			.filter(item => item.isExported)
			.reduce((accum, item) => {
				accum[item.type] = item.id;
				return accum;
			}, {});
		window.open(`https://cesium.com/ion/assets/${idMap[asset]}`);
	};

	componentWillUnmount() {
		if (this.timeoutHandler !== null) {
			clearTimeout(this.timeoutHandler);
			this.timeoutHandler = null;
		}
		if (this.cancelableFetch !== null) {
			this.cancelableFetch.cancel();
			this.cancelableFetch = null;
		}

		this.refreshAssets = null;
	}

	render() {
		const { task, token } = this.props;
		const { isTasksDialog, isRefreshTask, currentAsset } = this.state;
		const isUploadDialog = currentAsset !== null;
		const assetName = isUploadDialog ? AssetStyles[currentAsset].name : "";

		return (
			<AppContext.Provider value={this.props}>
				<ErrorMessage bind={[this, "error"]} />
				<div className={"ion-dropdowns"}>
					<TaskFetcher
						path={"share"}
						onLoad={this.onAssetsRefreshed}
						onBindRefresh={method => (this.refreshAssets = method)}
					>
						{({ isError, data = { items: [] } }) => {
							// Asset Export and View Selector
							const available = data.items
								.filter(
									item => !item.isExported && !item.isTask
								)
								.map(item => item.type);
							const exported = data.items
								.filter(item => item.isExported)
								.map(item => item.type);
							const totalAvailable =
								available.length + exported.length;

							// Tasks Selector
							const processing = data.items.filter(
								item => item.isTask
							);
							const isTasks = processing.length > 0;

							return (
								<Fragment>
									{available.length > 0 && (
										<IonAssetButton
											assets={available}
											onSelect={this.onOpenUploadDialog}
										>
											Tile in Cesium ion
										</IonAssetButton>
									)}

									{exported.length > 0 && (
										<IonAssetButton
											assets={exported}
											onSelect={this.handleAssetSelect(
												data
											)}
										>
											View in Cesium ion
										</IonAssetButton>
									)}
									{totalAvailable <= 0 && (
										<Button
											className={"ion-btn"}
											bsStyle={"primary"}
											bsSize={"small"}
											onClick={this.refreshAssets}
										>
											<i className={"fa fa-cesium"} />
											Refresh Available ion Assets
										</Button>
									)}
									{isTasks && (
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
										tasks={processing}
										onHide={this.hideTaskDialog}
										onClearFailed={this.onClearFailedAssets}
									/>
								</Fragment>
							);
						}}
					</TaskFetcher>
				</div>

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
								show={isUploadDialog}
								asset={currentAsset}
								onHide={this.onHideUploadDialog}
								onSubmit={this.onUploadAsset}
								onError={this.onErrorUploadDialog}
							/>
						);
					}}
				</APIFetcher>
				<TaskFetcher
					method={"POST"}
					path={"refresh"}
					body={JSON.stringify({ token })}
					onLoad={this.onCleanStatus}
				/>
			</AppContext.Provider>
		);
	}
}
