PluginsAPI.Dashboard.addTaskActionButton([
        'cesium-ion/build/ShareButton.js'
    ],function(args, ShareButton){
        var task = args.task;
        console.log(task)
        return React.createElement(ShareButton, {task: task, token: "${token}"});
    }
);
