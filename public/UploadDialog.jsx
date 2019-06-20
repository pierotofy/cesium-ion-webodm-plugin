import React, { Component } from "react";

import FormDialog from "webodm/components/FormDialog";

export default class UploadDialog extends Component {
	static defaultProps = {
		show: false
	};

	render() {
		const { show } = this.props;

		return (
			<FormDialog
				show={show}
				ref={domNode => {
					this.dialog = domNode;
				}}
			>
				<div className="form-group">
					<label className="col-sm-3 control-label">Title</label>
					<div className="col-sm-9">
						<input type="text" className="form-control" />
					</div>
				</div>
			</FormDialog>
		);
	}
}
