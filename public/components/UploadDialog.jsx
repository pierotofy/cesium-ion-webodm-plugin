import React, { Component, Fragment } from "react";
import FormDialog from "webodm/components/FormDialog";
import { Formik, Field } from "formik";
import * as Yup from "yup";
import {
	Row,
	Col,
	FormGroup,
	ControlLabel,
	FormControl,
	HelpBlock,
	FromControl
} from "react-bootstrap";

import { AssetType, SourceType } from "../defaults";

const BoostrapFieldComponent = ({
	field,
	form: { touched, errors },
	label,
	help,
	showIcon = true,
	...props
}) => {
	const isError = errors[field.name] && touched[field.name];
	const errorMsg = errors[field.name];

	return (
		<FormGroup
			controlId={field.name}
			validationState={errors[field.name] == null ? null : "error"}
			style={{ marginLeft: 0, marginRight: 0 }}
		>
			<ControlLabel>{label}</ControlLabel>
			<FormControl {...field} {...props} />
			{isError && <HelpBlock>{errorMsg}</HelpBlock>}
			{help && !isError && <HelpBlock>{help}</HelpBlock>}
			{isError && showIcon && <FormControl.Feedback />}
		</FormGroup>
	);
};

const BoostrapField = props => (
	<Field component={BoostrapFieldComponent} {...props} />
);

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
		const { assetType } = nextProps;
		if (assetType !== this.props.assetType)
			this.setState({
				sourceType: UploadDialog.AssetSourceType[assetType]
			});
	}

	getSourceFields() {
		switch (this.state.sourceType) {
			case SourceType.RASTER_TERRAIN:
				return (
					<Fragment>
						<Row style={{ marginLeft: -15, marginRight: -15 }}>
							<Col md={6} sm={12}>
								<BoostrapField
									name={"toMeters"}
									label={"Height Unit: "}
									componentClass={"select"}
								>
									<option value="MEAN_SEA_LEVEL">
										Mean Sea Level (EGM96)
									</option>
									<option value="WGS84">
										Ellipsoid (WGS84)
									</option>
								</BoostrapField>
							</Col>
							<Col md={6} sm={12}>
								<BoostrapField
									name={"baseTerrainId"}
									label={"Height Reference: "}
									componentClass={"select"}
								>
									<option value="MEAN_SEA_LEVEL">
										Mean Sea Level (EGM96)
									</option>
									<option value="WGS84">
										Ellipsoid (WGS84)
									</option>
								</BoostrapField>
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
							<BoostrapField
								name={"name"}
								label={"Name: "}
								type={"text"}
							/>
							<BoostrapField
								name={"description"}
								label={"Description: "}
								componentClass={"textarea"}
								rows={"3"}
							/>
							<BoostrapField
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
