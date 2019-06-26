import React, { PureComponent, Fragment } from "react";

import { DropdownButton, MenuItem } from "react-bootstrap";

import { AssetType } from "../defaults";
import "./IonAssetButton.scss";

const flattenProp = (key, obj) =>
	Object.assign(...Object.entries(obj).map(([k, v]) => ({ [k]: v[key] })));

const UploadDropdownItem = ({ icon, title, onClick = () => {} }) => (
	<MenuItem tag={"a"} onClick={onClick}>
		<i className={`fa ${icon}`} />
		{"  "}
		{title}
	</MenuItem>
);

export default class IonAssetButton extends PureComponent {
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
		assetNames: flattenProp("name", IonAssetButton.defaultAssetProps),
		assetIcons: flattenProp("icon", IonAssetButton.defaultAssetProps),
		assets: [],
		onSelect: () => {}
	};

	handleClick = asset => () => this.props.onSelect(asset);

	render() {
		const {
			assetNames,
			assetIcons,
			assets,
			onSelect,
			children
		} = this.props;

		const menuItems = assets
			.sort((a, b) => assetNames[a].localeCompare(assetNames[b]))
			.map(asset => (
				<UploadDropdownItem
					key={asset}
					title={assetNames[asset]}
					icon={assetIcons[asset]}
					onClick={this.handleClick(asset)}
				/>
			));

		const title = (
			<Fragment>
				<i className={"fa fa-cesium"} />
				{children}
			</Fragment>
		);

		return (
			<DropdownButton
				id={"cesiumIonUploadDropdown"}
				bsStyle={"primary"}
				bsSize={"small"}
				className={"ion-btn"}
				title={title}
			>
				{menuItems}
			</DropdownButton>
		);
	}
}
