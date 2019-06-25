import React, { PureComponent } from "react";

import AppContext from "./AppContext";
import makeCancelable from "./makeCancelable";

export function getCookie(name) {
	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${name}=`);
	if (parts.length == 2)
		return parts
			.pop()
			.split(";")
			.shift();
}

export class Fetcher extends PureComponent {
	static defaultProps = {
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
		const { url, path, onError, children, ...options } = this.props;

		this.cancelableFetch = makeCancelable(fetch(`${url}/${path}`, options));
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

export { ImplicitTaskFetcher, ImplicitIonFetcher };
