import React, { Component, Fragment } from "react";

import { DropdownButton, MenuItem } from "react-bootstrap";
import ErrorMessage from "webodm/components/ErrorMessage";

import { AssetType, SourceType } from "./defaults";
import UploadDialog from "./components/UploadDialog";
import AppContext from "./components/AppContext";
import {
	ImplicitTaskFetcher as TaskFetcher,
	APIFetcher
} from "./components/Fetcher";

const flattenProp = (key, obj) =>
	Object.assign(...Object.entries(obj).map(([k, v]) => ({ [k]: v[key] })));

const UploadDropdownItem = ({ icon, title, onClick = () => {} }) => (
	<MenuItem tag={"a"} onClick={onClick}>
		<i className={`fa ${icon}`} />
		{"  "}
		{title}
	</MenuItem>
);

export default class ShareButton extends Component {
	static defaultAssetProps = {
		[AssetType.ORTHOPHOTO]: {
			name: "Orthophoto",
			icon: "fa-map-o"
		},
		[AssetType.TERRAIN_MODEL]: {
			name: "Terrain Model",
			icon: "fa-area-chart"
		},
		[AssetType.SURFACE_MODEL]: {
			name: "Surface Model",
			icon: "fa-table"
		},
		[AssetType.POINTCLOUD]: {
			name: "Pointcloud",
			icon: "fa-cube"
		},
		[AssetType.TEXTURED_MODEL]: {
			name: "Texture Model",
			icon: "fa-connectdevelop"
		}
	};

	static defaultProps = {
		assetNames: flattenProp("name", ShareButton.defaultAssetProps),
		assetIcons: flattenProp("icon", ShareButton.defaultAssetProps)
	};

	state = {
		error: "",
		currentAsset: null,
		dropdownOpen: false
	};

	handleClick = asset => () => this.setState({ currentAsset: asset });

	onHide = (error = "") => this.setState({ currentAsset: null, error });

	onToggleDropdown = () =>
		this.setState({ isDropdownOpen: !this.state.isDropdownOpen });

	getDialog() {
		const { assetNames, task } = this.props;
		const { currentAsset } = this.state;

		if (currentAsset === null) return;

		const DialogTitle = (
			<Fragment>
				<i className={"fa fa-cesium"} />
				{` Upload to Cesium ion ⁠— ${assetNames[currentAsset]}`}
			</Fragment>
		);

		const getDialogWithDefaults = ({ isLoading, isError, data }) => {
			const initialValues = {};

			if (!isLoading && !isError && data.results.length > 0) {
				const project = data.results[0];
				initialValues.name = `${project.name} | ${task.name} ⁠— ${assetNames[currentAsset]}`;
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
		};

		return (
			<APIFetcher path={"projects"} params={{ id: task.project }}>
				{getDialogWithDefaults}
			</APIFetcher>
		);
	}

	render() {
		const { currentAsset } = this.state;
		const {
			apiURL,
			ionURL,
			task,
			token,
			shareTitle,
			shareIcon,
			assetNames,
			assetIcons
		} = this.props;

		const context = {
			apiURL: apiURL,
			ionURL: ionURL,
			task: task,
			token: token
		};

		return (
			<AppContext.Provider value={context}>
				<ErrorMessage bind={[this, "error"]} />
				<DropdownButton
					id={"cesiumIonUploadDropdown"}
					bsStyle={"primary"}
					bsSize={"small"}
					title={
						<Fragment>
							<i className={`fa ${shareIcon}`} />
							{"   "} Upload to Cesium ion
						</Fragment>
					}
				>
					<TaskFetcher path={"share"}>
						{({ data: { available = [] } = {} }) =>
							available
								.sort((a, b) =>
									assetNames[a].localeCompare(assetNames[b])
								)
								.map(asset => (
									<UploadDropdownItem
										key={asset}
										title={assetNames[asset]}
										icon={assetIcons[asset]}
										onClick={this.handleClick(asset)}
									/>
								))
						}
					</TaskFetcher>
				</DropdownButton>
				{currentAsset !== null && this.getDialog()}
			</AppContext.Provider>
		);
	}
}
