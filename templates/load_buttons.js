PluginsAPI.Dashboard.addTaskActionButton(
	["${app_name}/build/UploadButton.js"],
	function(args, UploadButton) {
		return React.createElement(UploadButton, {
			task: args.task,
			token: "${token}",
			apiURL: "${api_url}"
		});
	}
);
