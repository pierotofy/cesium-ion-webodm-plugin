import React from "react";

import { withCesium } from "resium";
import { Resource, CesiumTerrainProvider } from "cesium";

const CesiumIonTerrain = React.memo(
	withCesium(({ cesium, url, token, ...props }) => {
		const resource = new Resource({
			url: url,
			queryParameters: {
				access_token: token
			}
		});

		const provider = new CesiumTerrainProvider({
			url: resource,
			...props
		});

		cesium.terrainProvider = provider;

		return null;
	})
);

export default CesiumIonTerrain;
