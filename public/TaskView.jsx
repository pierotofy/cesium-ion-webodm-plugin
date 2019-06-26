import React, { Component, Fragment } from "react";

import ErrorMessage from "webodm/components/ErrorMessage";

import IonAssetButton from "./components/IonAssetButton";
import UploadDialog from "./components/UploadDialog";
import AppContext from "./components/AppContext";
import {
	ImplicitTaskFetcher as TaskFetcher,
	APIFetcher
} from "./components/Fetcher";

export default class TaskView extends Component {
	state = {
		error: "",
		currentAsset: null,
		isDropdownOpen: false
	};

	onOpenAssetDropdown = asset => this.setState({ currentAsset: asset });

	onHide = (error = "") => this.setState({ currentAsset: null, error });

	onToggleDropdown = () =>
		this.setState({ isDropdownOpen: !this.state.isDropdownOpen });

	getDialog() {
		const { task } = this.props;
		const { currentAsset } = this.state;
		const assetsStyle = IonAssetButton.defaultAssetProps;

		if (currentAsset === null) return null;

		const DialogTitle = (
			<Fragment>
				<i className={"fa fa-cesium"} />
				{` Tile in Cesium ion ⁠— ${assetsStyle[currentAsset].name}`}
			</Fragment>
		);

		return (
			<APIFetcher path={"projects"} params={{ id: task.project }}>
				{({ isLoading, isError, data }) => {
					const initialValues = {};

					if (!isLoading && !isError && data.results.length > 0) {
						const project = data.results[0];
						initialValues.name = `${project.name} | ${task.name} ⁠— ${assetsStyle[currentAsset].name}`;
						initialValues.description = project.description;
					}

					return (
						<UploadDialog
							title={DialogTitle}
							initialValues={initialValues}
							assetType={currentAsset}
							onHide={this.onHide}
						/>
					);
				}}
			</APIFetcher>
		);
	}

	render() {
		const { currentAsset } = this.state;

		return (
			<AppContext.Provider value={this.props}>
				<ErrorMessage bind={[this, "error"]} />
				<TaskFetcher path={"share"}>
					{({ isLoading, isError, data = {} }) => (
						<div className={"ion-dropdowns"}>
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
						</div>
					)}
				</TaskFetcher>

				{currentAsset !== null && this.getDialog()}
			</AppContext.Provider>
		);
	}
}
