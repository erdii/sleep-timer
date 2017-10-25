import * as React from "react";

interface ITitleProps {
	text: string;
}


export default class Title extends React.Component<ITitleProps, {}> {
	public componentWillReceiveProps(nextProps: ITitleProps) {
		if (this.props.text !== nextProps.text) {
			document.title = nextProps.text;
		}
	}

	public componentWillMount() {
		document.title = this.props.text;
	}

	public render() {
		return null;
	}
}
