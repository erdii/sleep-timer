import * as React from "react";

interface IAuxProps {
	children: any;
}

export default class Aux extends React.Component<IAuxProps, {}> {
	public render() {
		return this.props.children;
	}
}
