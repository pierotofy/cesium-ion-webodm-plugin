# Development

Follow these steps to run the addon directly from source so that your changes will be reflected live.

## Installation

1. Clone the WebODM repository into the `plugins` folder of WebODM.

    1. `cd plugins`

    1. `git clone git@github.com:AnalyticalGraphicsInc/cesium-ion-webodm-plugin.git`

1. Setup the `public` folder inside the add-on

    1. Enter the public folder `cd public`

    1. Install all node dependencies `npm install`

    1. Run the webpack dev server for on change reloading `npm run dev`

1. Startup the WebODM docker server

    1. Ensure that docker is installed on your system; if not [follow this guide](https://docs.docker.com/v17.12/install/).

    1. In the root of WebODM run
        - **OSX - Linux** - `./webodm.sh start --dev`
        - **Windows** - No support, checkout [documentation](https://github.com/OpenDroneMap/WebODM#getting-started).

## Setup

1. Grab a token with, `assets:list, assets:read, assets:write` permissions from [Cesium ion](https://cesium.com/ion/tokens).

1. Under the Cesium ion tab in WebODM set the token to the code generated in ion.

## Testing

1. WebODM provides open datasets which can be used as a testbench for the add-on. You will have to create an account in order to access the data. Download datasets [here](https://demo.webodm.org/dashboard/).

1. To use the dataset click on a **task**, then in the **download assets** dropdown, select all. This should download a zip on to your machine.

1. In your instance of WebODM, create a project, click import in the upper-right hand corner, and selet the zip we just downloaded from the demo.

1. After the import completes and a website reload all Cesium ion functions should be available for testing.
