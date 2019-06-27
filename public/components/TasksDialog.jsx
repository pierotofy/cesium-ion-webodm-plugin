import React, { Component, Fragment } from "react";

import { Row, Col, Modal, Button } from "react-bootstrap";

export default class TaskDialog extends Component {
	render() {
		const { onHide, ...options } = this.props;
		return (
			<Modal className={"csm"} onHide={onHide} {...options}>
				<Modal.Header closeButton>
					<Modal.Title>
						<i className={"fa fa-cesium"} /> Cesium ion Tasks
					</Modal.Title>
				</Modal.Header>
				<Modal.Body></Modal.Body>

				<Modal.Footer>
					<Button onClick={onHide}>Close</Button>
				</Modal.Footer>
			</Modal>
		);
	}
}
