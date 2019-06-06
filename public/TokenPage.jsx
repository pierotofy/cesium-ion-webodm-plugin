import React, { Component, Fragment } from "React";
import PropTypes from "prop-types";

function withquery(url, params) {
   const ret = [];
   for (let key in params)
     ret.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[d]));
   return ret.join('&');
}


export default class TokenPanel extends Component {
  static defaultProps = {};
  static propTypes = {
    token: PropTypes.string
  };

  constructor(props) {
    super(props);

    const { token = "" } = props;
    this.state = {
      token: token,
      isVerifyingToken: false
    };
  }

  handleTokenChange = target => this.setState({ token: event.target.value });

  handleTokenUpdate = () => {
    const { token } = this.state;
    this.setState({ isVerifyingToken: true });
    var url = new URL("https://geo.example.org/api"),
    params = {lat:35.696233, long:139.570431}
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))

    fetch(withquery('set-ion-token', { token }), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    })
    setTimeout(() => this.setState({ isVerifyingToken: false }), 500);
  };

  render() {
    const { isVerifyingToken } = this.state;

    return (
      <Fragment>
        <h5>
          <strong>Instructions</strong>
        </h5>
        <ol>
          <li>
            Generate a token at
            <a href="https://cesium.com/ion/tokens" target="_blank">
              {" cesium.com/ion/tokens "}
            </a>
            with <b>all permissions.</b>
          </li>
          <li>Copy and paste the token into the form below.</li>
        </ol>

        <div className="form-group text-left">
          <input id="next" name="next" type="hidden" value="" />
          <p>
            <label htmlFor="token">Access Token</label>
            <input
              className="form-control"
              id="token"
              name="token"
              type="text"
              value={this.state.token}
              onChange={this.handleTokenChange}
            />
          </p>
          <p>
            <button
              className="btn btn-primary"
              onClick={this.handleTokenUpdate}
            >
              {isVerifyingToken ? (
                <i className="fa fa-spin fa-circle-o-notch" />
              ) : (
                <Fragment>
                  <i className="fa fa-lock" /> Update Token
                </Fragment>
              )}
            </button>
          </p>
        </div>
      </Fragment>
    );
  }
}
