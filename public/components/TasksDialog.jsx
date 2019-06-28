import React, { Component, Fragment } from "react";

import {
	Row,
	Col,
	Modal,
	Button,
	ListGroup,
	ListGroupItem,
	ProgressBar
} from "react-bootstrap";

import IonAssetLabel from "./IonAssetLabel";
import "./TaskDialog.scss";

const TaskStatusItem = ({ asset, progress, task, bsStyle = "primary" }) => (
	<ListGroupItem>
		<Row>
			<Col xs={6}>
				<p style={{ fontWeight: "bold" }}>
					<IonAssetLabel asset={asset} showIcon={true} />
				</p>
			</Col>
			<Col xs={6}>
				<p className={"pull-right"}>Status: {task}</p>
			</Col>
		</Row>
		<ProgressBar active now={progress} bsStyle={bsStyle} />
	</ListGroupItem>
);

export default class TaskDialog extends Component {
	static defaultProps = {
		tasks: [],
		taskComponent: TaskStatusItem
	};

	render() {
		const {
			onHide,
			tasks,
			taskComponent: TaskComponent,
			...options
		} = this.props;

		const taskItems = tasks.map(({ type: asset, upload, process }) => {
			let progress = 0;
			let task = "Error";
			let style = "info";

			if (upload.active) {
				progress = upload.progress;
				task = "Uploading";
			} else if (process.active) {
				progress = process.progress;
				task = "Processing";
				style = "success";
			}

			return (
				<TaskStatusItem
					key={asset}
					asset={asset}
					progress={progress * 100}
					task={task}
					bsStyle={style}
				/>
			);
		});

		return (
			<Modal className={"ion-tasks"} onHide={onHide} {...options}>
				<Modal.Header closeButton>
					<Modal.Title>
						<i className={"fa fa-cesium"} /> Cesium ion Tasks
					</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<ListGroup>{taskItems}</ListGroup>
				</Modal.Body>

				<Modal.Footer>
					<Button bsStyle={"primary"} onClick={onHide}>
						Close
					</Button>
				</Modal.Footer>
			</Modal>
		);
	}
}
