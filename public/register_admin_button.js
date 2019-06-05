PluginsAPI.App.ready(() => {
    const ADMIN_BUTTON = `
            <li>
                <a href="/plugins/cesium-ion/admin" class="active">
                    <i class="fa fa-cesium fa-fw"></i>
                    Cesium ion
                </a>
            </li>
        `;
    $(`#side-menu a[href*="/admin/"]`)
        .last()
        .closest('ul')
        .append(ADMIN_BUTTON)
})
