import React, { Component, Fragment } from "react";

import { DropdownButton, MenuItem } from "react-bootstrap";

import { AssetType, SourceType } from "./defaults";
import UploadDialog from "./components/UploadDialog";
import TaskContext from "./components/TaskContext";
import TaskFetcher from "./components/TaskFetcher";

const DEFAULT_ASSET_PROPS = {
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
	static defaultProps = {
		shareTitle: "Upload to Cesium ion",
		shareIcon: "fa-cesium",
		assetNames: flattenProp("name", DEFAULT_ASSET_PROPS),
		assetIcons: flattenProp("icon", DEFAULT_ASSET_PROPS)
	};
	state = {
		currentAsset: null,
		dropdownOpen: false
	};

	handleClick = asset => () => this.setState({ currentAsset: asset });

	onHide = () => this.setState({ currentAsset: null });

	onToggleDropdown = () =>
		this.setState({ isDropdownOpen: !this.state.isDropdownOpen });

	getFormFields = () => {
		const { currentAsset } = this.state;
	};

	render() {
		const { currentAsset } = this.state;
		const {
			apiURL,
			task,
			shareTitle,
			shareIcon,
			assetNames,
			assetIcons
		} = this.props;

		const context = {
			url: `${apiURL}/task`,
			task: task
		};

		const dialog = (
			<UploadDialog
				title={
					<Fragment>
						<i className={`fa ${shareIcon}`} />
						{` ${shareTitle} ⁠— ${assetNames[currentAsset]}     `}
					</Fragment>
				}
				onHide={this.onHide}
				assetType={currentAsset}
			/>
		);

		return (
			<TaskContext.Provider value={context}>
				<DropdownButton
					bsStyle={"primary"}
					bsSize={"small"}
					title={
						<Fragment>
							<i className={`fa ${shareIcon}`} />
							{`  ${shareTitle}`}
						</Fragment>
					}
				>
					<TaskFetcher method={"GET"} path={"share"}>
						{({ data: { available = [] } = {} }) =>
							available.map(asset => (
								<UploadDropdownItem
									title={assetNames[asset]}
									icon={assetIcons[asset]}
									onClick={this.handleClick(asset)}
								/>
							))
						}
					</TaskFetcher>
				</DropdownButton>
				{currentAsset !== null && dialog}
			</TaskContext.Provider>
		);
	}
}
