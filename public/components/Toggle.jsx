import "./Toggle.css";

const Toggle = ({
	checked,
	onToggle,
	background = "success",
	style = "rounded"
}) => (
	<label className={`switch form-control ${style}`}>
		<input value={checked} type={"checkbox"} />
		<span className={`slider bg-${background} ${style}`} />
	</label>
);

export default Toggle;
