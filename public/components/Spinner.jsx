import "./Spinner.scss";

const Spinner = ({ active, ...props }) => (
	<span
		className={`glyphicon glyphicon-refresh ${active ? "spinning" : ""}`}
		{...props}
	/>
);

export default Spinner;
