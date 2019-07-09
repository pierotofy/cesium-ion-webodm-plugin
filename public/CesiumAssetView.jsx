import React, { Component } from "react";

import { Viewer } from "resium";
import {
	Row,
	Col,
	ListGroup,
	ListGroupItem,
	Alert,
	Button
} from "react-bootstrap";

import AppContext from "./components/AppContext";
import IonAssetLabel from "./components/IonAssetLabel";
import Spinner from "./components/Spinner";
import {
	ImplicitTaskFetcher as TaskFetcher,
	ImplicitIonFetcher as IonFetcher
} from "./components/Fetcher";
import CesiumIon3DTileset from "./components/CesiumIon3DTileset";
import CesiumIonTerrain from "./components/CesiumIonTerrain";
import "./CesiumAssetView.scss";

export default class CesiumAssetView extends Component {
	state = {
		currentAsset: null
	};

	viewer = React.createRef();

	onTilesetReady = tileset => {
		const { current } = this.viewer;
		if (!current || !current.cesiumElement) return;
		current.cesiumElement.zoomTo(tileset);
	};

	onAssetSelect = id => {
		const { currentAsset } = this.state;
		if (currentAsset !== id) this.setState({ currentAsset: id });
	};

	getAssetsItems = ({
		isLoading,
		isError,
		error,
		data: { items = [] } = {}
	}) => {
		if (isLoading)
			return (
				<ListGroupItem>
					<Spinner active style={{ marginRight: "0.5em" }} />
					Loading...
				</ListGroupItem>
			);
		if (isError)
			return (
				<Alert bsStyle={"danger"} style={{ margin: "0.5em" }}>
					<h5>Failed to load assets!</h5>
					<p>
						{this.props.task.id === null
							? "The task ID was invalid, please check your url."
							: "Check your access token or report the error."}
					</p>
				</Alert>
			);

		const exported = items.filter(item => item.isExported);
		const { currentAsset } = this.state;
		if (exported.length <= 0)
			return <ListGroupItem>No assets available!</ListGroupItem>;

		return exported.map(item => (
			<ListGroupItem
				key={item.type}
				onClick={
					currentAsset !== item.id
						? () => this.onAssetSelect(item.id)
						: null
				}
				className={currentAsset === item.id ? "clickable active" : ""}
			>
				<IonAssetLabel asset={item.type} showIcon />

				{currentAsset === item.id && (
					<div className={"options"}>
						<Button bsStyle={"secondary"} bsSize={"small"}>
							<i
								className={"fa fa-location-arrow"}
								style={{ marginRight: "0.5em" }}
							/>
							Zoom
						</Button>{" "}
						<Button bsStyle={"secondary"} bsSize={"small"}>
							<i
								className={"fa fa-cesium"}
								style={{ marginRight: "0.5em" }}
							/>
							View in ion
						</Button>
					</div>
				)}
			</ListGroupItem>
		));
	};

	getWidgetLayer = values => {
		const { data: { type, url, accessToken } = {} } = values;
		if (type === "3DTILES") {
			return (
				<CesiumIon3DTileset
					url={url}
					token={accessToken}
					onReady={this.onTilesetReady}
					pointCloudShading={{
						attenuation: true,
						eyeDomeLighting: true
					}}
				/>
			);
		} else if (type === "TERRAIN") {
			return <CesiumIonTerrain url={url} token={accessToken} />;
		}
		return null;
	};

	render() {
		const { currentAsset } = this.state;
		return (
			<AppContext.Provider value={this.props}>
				<Row id={"ion-container"}>
					<Col xs={3} id={"ion-sidebar"}>
						<i id={"ion-tab"} className={"fa fa-arrow-right"} />
						<ListGroup>
							<ListGroupItem className={"title"}>
								ion Viewer
							</ListGroupItem>
							<TaskFetcher path={"share"}>
								{this.getAssetsItems}
							</TaskFetcher>
						</ListGroup>
					</Col>
					<Col xs={9} id={"ion-cesium"}>
						<Viewer full ref={this.viewer}>
							{currentAsset !== null && (
								<IonFetcher
									path={`assets/${currentAsset}/endpoint`}
								>
									{this.getWidgetLayer}
								</IonFetcher>
							)}
						</Viewer>
					</Col>
				</Row>
			</AppContext.Provider>
		);
	}
}
