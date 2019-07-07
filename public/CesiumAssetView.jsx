import React, { Component } from "react";

import { CesiumWidget } from "resium";
import { Row, Col, ListGroup, ListGroupItem } from "react-bootstrap";

import AppContext from "./components/AppContext";
import "./CesiumAssetView.scss";

export default class CesiumAssetView extends Component {
	render() {
		return (
			<AppContext.Provider value={this.props}>
				<Row id={"ion-container"}>
					<Col xs={3} id={"ion-sidebar"}>
						<i id={"ion-tab"} className={"fa fa-arrow-right"} />
						<ListGroup>
							<ListGroupItem className={"title"}>
								Asset Layers
							</ListGroupItem>
							<ListGroupItem>Item 2</ListGroupItem>
							<ListGroupItem>...</ListGroupItem>
						</ListGroup>
					</Col>
					<Col xs={9} id={"ion-cesium"}>
						<CesiumWidget full></CesiumWidget>
					</Col>
				</Row>
			</AppContext.Provider>
		);
	}
}
