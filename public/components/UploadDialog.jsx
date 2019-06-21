import React, { Component, Fragment } from "react";

import FormDialog from "webodm/components/FormDialog";

import Toggle from "./Toggle";
import "./UploadDialog.css";

const DEFAULT_ASSET_PROPS = {
	ORTHOPHOTO: {
		name: "Orthophoto",
		icon: "fa-map-o"
	},
	TERRAIN_MODEL: {
		name: "Terrain Model",
		icon: "fa-area-chart"
	},
	SURFACE_MODEL: {
		name: "Surface Model",
		icon: "fa-table"
	},
	POINTCLOUD: {
		name: "Pointcloud",
		icon: "fa-cube"
	},
	TEXTURED_MODEL: {
		name: "Texture Model",
		icon: "fa-connectdevelop"
	}
};

const flattenProp = (key, obj) =>
	Object.assign(...Object.entries(obj).map(([k, v]) => ({ [k]: v[key] })));

export default class UploadDialog extends Component {
	static defaultProps = {
		title: "Upload to Cesium Ion",
		show: true,
		reset: () => {},
		getFormData: () => {},
		saveAction: () => {},
		assetNames: flattenProp("name", DEFAULT_ASSET_PROPS),
		assetIcons: flattenProp("icon", DEFAULT_ASSET_PROPS),
		saveLabel: "Upload",
		saveIcon: "fa fa-upload",
		descriptionLabel: "Choose what assets to upload to Cesium ion"
	};

	render() {
		const {
			title,
			show,
			loading,
			availableAssets,
			assetNames,
			assetIcons,
			descriptionLabel,
			...options
		} = this.props;

		if (!show) return null;

		let content;
		if (loading) {
			content = (
				<div class="spinner-border" role="status">
					<span class="sr-only">Loading...</span>
				</div>
			);
		} else {
			content = (
				<Fragment>
					<p class="text-muted">{descriptionLabel}</p>
					<div class={"list-group list-group-flush"}>
						{availableAssets.map(asset => (
							<div className={"form-group list-group-item"}>
								<label
									className={"col-sm-5 control-label"}
									style={{ textAlign: "left" }}
								>
									<i
										className={`fa fa-fw ${assetIcons[asset]}`}
									/>
									{"  "}
									{assetNames[asset]}
								</label>
								<div className={"col-sm-7"}>
									<Toggle />
								</div>
							</div>
						))}
					</div>
				</Fragment>
			);
		}
		return (
			<FormDialog title={title} show={show} {...options}>
				{content}
			</FormDialog>
		);
	}
}
