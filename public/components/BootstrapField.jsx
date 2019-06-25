import { Formik, Field } from "formik";

import {
	FormGroup,
	ControlLabel,
	FormControl,
	HelpBlock
} from "react-bootstrap";

const BootstrapFieldComponent = ({
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
			validationState={isError ? "error" : null}
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

const BootstrapField = props => (
	<Field component={BootstrapFieldComponent} {...props} />
);

export { BootstrapFieldComponent };
export default BootstrapField;
