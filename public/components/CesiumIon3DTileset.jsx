import React from "react";

import { Resource } from "cesium";
import { Cesium3DTileset } from "resium";

// Handles state management and passing a url and token to the application
const CesiumIon3DTileset = React.memo(({ url, token, ...props }) => {
	const resource = new Resource({
		url: url,
		queryParameters: {
			access_token: token
		}
	});

	return <Cesium3DTileset key={url} url={resource} {...props} />;
});

export default CesiumIon3DTileset;
