import React, { PureComponent } from "react";

import TaskContext from "./TaskContext";

export function getCookie(name) {
	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${name}=`);
	if (parts.length == 2)
		return parts
			.pop()
			.split(";")
			.shift();
}

export function csrfFetch(url, csrfToken, options = null) {
	if (options === null) options = {};
	options = {
		credentials: "same-origin",
		headers: {
			"X-CSRFToken": csrfToken,
			Accept: "application/json",
			"Content-Type": "application/json"
		},
		...options
	};

	return fetch(url, options);
}

export class TaskFetcher extends PureComponent {
	static defaultProps = {
		path: "",
		crsfToken: getCookie("csrftoken"),
		method: "POST"
	};

	state = {
		isLoading: false
	};

	componentDidMount() {
		this.setState({ isLoading: true });
		const {
			url,
			path,
			csrfToken,
			taskId,
			children,
			...options
		} = this.props;

		csrfFetch(`${url}/${taskId}/${path}`, csrfToken, options)
			.then(res => res.json())
			.then(data => this.setState({ data, isLoading: false }))
			.catch(error => this.setState({ error, isLoading: false }));
	}

	render() {
		const { children } = this.props;
		if (typeof children !== "function")
			return React.cloneElement(children, this.state);
		else return children(this.state);
	}
}

const ImplicitTaskFetcher = ({ children, ...options }) => (
	<TaskContext.Consumer>
		{({ url, task }) => (
			<TaskFetcher url={url} taskId={task.id} {...options}>
				{children}
			</TaskFetcher>
		)}
	</TaskContext.Consumer>
);
export default ImplicitTaskFetcher;
