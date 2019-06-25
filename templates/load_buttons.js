PluginsAPI.Dashboard.addTaskActionButton(
	["${app_name}/build/UploadButton.js"],
	function(args, UploadButton) {
		console.log("${ion_url}");
		return React.createElement(UploadButton, {
			task: args.task,
			token: "${token}",
			apiURL: "${api_url}",
			ionURL: "${ion_url}"
		});
	}
);
