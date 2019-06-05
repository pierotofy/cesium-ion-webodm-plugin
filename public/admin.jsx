import React from 'react';
import PropTypes from 'prop-types';
import Login from './Login';
import Dashboard from './Dashboard';
import $ from 'jquery';

export default class LightningPanel extends React.Component {
  static defaultProps = {
    apiKey: "",
  };
  static propTypes = {
    apiKey: PropTypes.string
  }

  constructor(props){
    super(props);


    this.state = {
      apiKey: props.apiKey
    }
  }

  handleLogin = (apiKey) => {
    this.setState({ apiKey });
  }

  handleLogout = () => {
      this.setState({ apiKey: ""});
  }

  render(){
    const { apiKey } = this.state;

    return (<div className="plugin-lightning">
        { !apiKey ? (
          <div>
              <h4><i className="fa fa-cesium"/> Cesium ion</h4>
              Use Cesium ion's simple workflow to create 3D maps of your geospatial data for visualization, analysis, and sharing
              <Login onLogin={this.handleLogin} />
          </div>
        ) : (
          <div>
              <Dashboard apiKey={apiKey} onLogout={this.handleLogout} />
          </div>
        ) }
    </div>);
  }
}
