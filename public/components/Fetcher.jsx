import React, { PureComponent } from "react";

import AppContext from "./AppContext";
import { fetchCancelable, getCookie } from "../utils";

export class Fetcher extends PureComponent {
	static defaultProps = {
		url: "",
		path: "",
		method: "GET",
		onError: () => {}
	};

	state = {
		isLoading: true,
		isError: false
	};

	cancelableFetch = null;

	componentDidMount() {
		const { url, path, onError, children, params, ...options } = this.props;

		let queryURL = `${url}/${path}`;
		if (params !== undefined) {
			const serializedParams = `?${Object.keys(params)
				.map(key =>
					[key, params[key]].map(encodeURIComponent).join("=")
				)
				.join("&")}`;
			queryURL = queryURL.replace(/[\/\?]+$/, "");
			queryURL += serializedParams;
		}

		this.cancelableFetch = fetchCancelable(queryURL, options);
		this.cancelableFetch.promise
			.then(res => res.json())
			.then(data => this.setState({ data, isLoading: false }))
			.catch(out => {
				if (out.isCanceled) return;
				onError(out);
				this.setState({ error: out, isLoading: false, isError: true });
			});
	}

	componentWillUnmount() {
		if (this.cancelableFetch === null) return;
		this.cancelableFetch.cancel();
		this.cancelableFetch = null;
	}

	render() {
		const { children } = this.props;
		if (typeof children !== "function")
			return React.cloneElement(children, this.state);
		else return children(this.state);
	}
}

const ImplicitFetcher = ({
	url,
	getURL = null,
	getOptions = null,
	...options
}) => (
	<AppContext.Consumer>
		{context => (
			<Fetcher
				url={getURL !== null ? getURL(context, options) : url}
				{...(getOptions !== null ? getOptions(context, options) : {})}
				{...options}
			/>
		)}
	</AppContext.Consumer>
);

const APIFetcher = props => (
	<Fetcher
		url={"/api"}
		credentials={"same-origin"}
		headers={{
			"X-CSRFToken": getCookie("csrftoken"),
			Accept: "application/json",
			"Content-Type": "application/json"
		}}
		{...props}
	/>
);

const ImplicitTaskFetcher = props => (
	<ImplicitFetcher
		getURL={({ apiURL, task }) => `/api${apiURL}/task/${task.id}`}
		credentials={"same-origin"}
		headers={{
			"X-CSRFToken": getCookie("csrftoken"),
			Accept: "application/json",
			"Content-Type": "application/json"
		}}
		{...props}
	/>
);

const ImplicitIonFetcher = props => (
	<ImplicitFetcher
		getURL={({ ionURL }) => ionURL}
		getOptions={({ token }) => ({
			headers: {
				Authorization: `Bearer ${token}`
			}
		})}
		{...props}
	/>
);

export { APIFetcher, ImplicitTaskFetcher, ImplicitIonFetcher };
