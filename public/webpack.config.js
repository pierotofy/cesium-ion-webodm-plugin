// Magic to include node_modules of root WebODM's directory
const path = require("path");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const LiveReloadPlugin = require("webpack-livereload-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");

module.exports = {
    mode: "production",
    context: __dirname,

    /*optimization: {
        minimize: true,
        minimizer: [new UglifyJsPlugin()],
        usedExports: true,
        sideEffects: true
    },*/

    performance: {
        hints: false
    },

    entry: { UploadButton: ["./UploadButton.jsx"] },

    output: {
        path: path.join(__dirname, "./build"),
        filename: "[name].js",
        libraryTarget: "amd"
    },

    plugins: [
        new LiveReloadPlugin(),
        new ExtractTextPlugin("[name].css", {
            allChunks: true
        })
    ],

    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /(node_modules|bower_components)/,
                use: [
                    {
                        loader: "babel-loader",
                        query: {
                            plugins: [
                                "@babel/syntax-class-properties",
                                "@babel/proposal-class-properties"
                            ],
                            presets: [
                                "@babel/preset-env",
                                "@babel/preset-react"
                            ]
                        }
                    }
                ]
            },
            {
                test: /\.s?css$/,
                use: ExtractTextPlugin.extract({
                    use: "css-loader!sass-loader"
                })
            },
            {
                test: /\.(png|jpg|jpeg|svg)/,
                loader: "url-loader?limit=100000"
            }
        ]
    },

    resolve: {
        modules: ["node_modules", "bower_components"],
        extensions: [".js", ".jsx"],
        alias: {
            webodm: path.resolve(__dirname, "../../../app/static/app/js")
        }
    },

    externals: {
        jquery: "jQuery",
        SystemJS: "SystemJS",
        PluginsAPI: "PluginsAPI",
        leaflet: "leaflet",
        ReactDOM: "ReactDOM",
        React: "React"
    }
};
