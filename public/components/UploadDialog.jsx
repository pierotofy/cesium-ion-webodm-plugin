import React, { Component, Fragment } from "react";
import FormDialog from "webodm/components/FormDialog";
import { Formik } from "formik";
import * as Yup from "yup";
import { Row, Col } from "react-bootstrap";

import BootstrapField from "./BootstrapField";
import { ImplicitIonFetcher as IonFetcher } from "./Fetcher";
import { AssetType, SourceType } from "../defaults";

export default class UploadDialog extends Component {
	static AssetSourceType = {
		[AssetType.ORTHOPHOTO]: SourceType.RASTER_IMAGERY,
		[AssetType.TERRAIN_MODEL]: SourceType.RASTER_TERRAIN,
		[AssetType.SURFACE_MODEL]: SourceType.RASTER_TERRAIN,
		[AssetType.POINTCLOUD]: SourceType.POINTCLOUD,
		[AssetType.TEXTURED_MODEL]: SourceType.CAPTURE
	};

	static defaultProps = {
		show: true,
		reset: () => {},
		getFormData: () => {},
		initialValues: {
			name: "",
			description: "",
			attribution: ""
		}
	};

	state = {
		sourceType: null
	};

	constructor(props) {
		super(props);
		this.state.sourceType = UploadDialog.AssetSourceType[props.assetType];
	}

	componentWillReceiveProps(nextProps) {
		const { assetType, show } = nextProps;
		if (assetType !== this.props.assetType)
			this.setState({
				sourceType: UploadDialog.AssetSourceType[assetType]
			});
	}

	handleError = msg => error => {
		this.props.onHide("Uploader failed to load!");
		console.error(error);
	};

	getSourceFields() {
		switch (this.state.sourceType) {
			case SourceType.RASTER_TERRAIN:
				const loadOptions = ({ isLoading, isError, data }) => {
					if (isLoading || isError)
						return <option disabled>LOADING...</option>;
					const userItems = data.items
						.filter(item => item.type === "TERRAIN")
						.map(item => (
							<option key={item.id} value={item.id}>
								{item.name}
							</option>
						));
					return userItems;
				};
				const dynamicTerrainTypeComponent = (
					<BootstrapField
						name={"toMeters"}
						label={"Height Unit: "}
						componentClass={"select"}
					>
						<IonFetcher
							path="assets"
							onError={this.handleError(
								"Failed to load terrain options!"
							)}
						>
							{loadOptions}
						</IonFetcher>
					</BootstrapField>
				);

				return (
					<Fragment>
						<Row style={{ marginLeft: -15, marginRight: -15 }}>
							<Col md={6} sm={12}>
								{dynamicTerrainTypeComponent}
							</Col>
							<Col md={6} sm={12}>
								<BootstrapField
									name={"baseTerrainId"}
									label={"Height Reference: "}
									componentClass={"select"}
								>
									<option value={"MEAN_SEA_LEVEL"}>
										Mean Sea Level (EGM96)
									</option>
									<option value={"WGS84"}>
										Ellipsoid (WGS84)
									</option>
								</BootstrapField>
							</Col>
						</Row>
					</Fragment>
				);
			default:
				return null;
		}
	}

	getValidation() {
		const schema = {
			name: Yup.string().required("A name is required!")
		};

		return Yup.object().shape(schema);
	}

	render() {
		const { initialValues, ...options } = this.props;

		return (
			<Formik
				initialValues={initialValues}
				validationSchema={this.getValidation()}
			>
				{({ handleSubmit = () => {} }) => (
					<FormDialog
						title={"Upload to Cesium Ion"}
						saveLabel={"Upload"}
						saveIcon={"fa fa-upload"}
						saveAction={handleSubmit}
						{...this.props}
					>
						<form>
							<BootstrapField
								name={"name"}
								label={"Name: "}
								type={"text"}
							/>
							<BootstrapField
								name={"description"}
								label={"Description: "}
								componentClass={"textarea"}
								rows={"3"}
							/>
							<BootstrapField
								name={"attribution"}
								label={"Attribution: "}
								type={"text"}
							/>
							{this.getSourceFields()}
						</form>
					</FormDialog>
				)}
			</Formik>
		);
	}
}
