import React, { Component, Fragment } from "react";

import { DropdownButton, MenuItem } from "react-bootstrap";
import ErrorMessage from "webodm/components/ErrorMessage";

import { AssetType, SourceType } from "./defaults";
import UploadDialog from "./components/UploadDialog";
import AppContext from "./components/AppContext";
import { ImplicitTaskFetcher as TaskFetcher } from "./components/Fetcher";

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
		shareTitle: "Upload to Cesium ion",
		shareIcon: "fa-cesium",
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
			<AppContext.Provider value={context}>
				<ErrorMessage bind={[this, "error"]} />
				<DropdownButton
					id={"cesiumIonUploadDropdown"}
					bsStyle={"primary"}
					bsSize={"small"}
					title={
						<Fragment>
							<i className={`fa ${shareIcon}`} />
							{`  ${shareTitle}`}
						</Fragment>
					}
				>
					<TaskFetcher path={"share"}>
						{({ data: { available = [] } = {} }) =>
							available.map(asset => (
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
				{currentAsset !== null && dialog}
			</AppContext.Provider>
		);
	}
}
