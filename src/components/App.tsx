import Title from "./Title";
import { clearTimeout } from "timers";
import * as React from "react";
import { action, computed, observable } from "mobx";
import { observer } from "mobx-react";
import { now } from "mobx-utils";
import { prefixNum, shutdown, isOSX } from "../lib/utils";
import Aux from "./Aux";

@observer
export default class App extends React.Component<any, any> {
	private static readonly defaultHMS: [number, number, number] = [0, 10, 0];

	private inputElemH: HTMLInputElement;
	private inputElemM: HTMLInputElement;
	private inputElemS: HTMLInputElement;
	private timer: NodeJS.Timer = null;

	@observable private running = false;

	@observable private _shutdownTime: Date = new Date();

	@observable private hours: number = App.defaultHMS[0];
	@observable private minutes: number = App.defaultHMS[1];
	@observable private seconds: number = App.defaultHMS[2];
	@observable private stashHMS: [number, number, number] = App.defaultHMS;

	@computed private get shutdownTime() {
		return this._shutdownTime != null
			? this._shutdownTime.toLocaleTimeString()
			: 0;
	}

	@computed private get remainingMillis() {
		return this._shutdownTime.getTime() - now();
	}

	@computed private get remainingSeconds() {
		const value = Math.floor(this.remainingMillis / 1000) % 60;
		return prefixNum(value);
	}

	@computed private get remainingMinutes() {
		const value = Math.floor(this.remainingMillis / 60000) % 60;
		return prefixNum(value);
	}

	@computed private get remainingHours() {
		const value = Math.floor(this.remainingMillis / 3600000);
		return prefixNum(value);
	}

	@computed private get _relativeTime() {
		const currentTime = now();
		return new Date(
			currentTime +
			this.hours * 3600000 +
			this.minutes * 60000 +
			this.seconds * 1000
		);
	}

	@computed private get relativeTime() {
		return this._relativeTime.toLocaleTimeString();
	}

	@computed private get displayTime() {
		if (this.running) {
			return this.shutdownTime;
		} else {
			return this.relativeTime;
		}
	}

	@computed private get title() {
		const { running, displayTime } = this;

		let timeString = "";

		if (running) {
			timeString = this.remainingHours + ":" + this.remainingMinutes + ":" + this.remainingSeconds;
		} else {
			timeString = prefixNum(this.hours) + ":" + prefixNum(this.minutes) + ":" + prefixNum(this.seconds);
		}

		return `${this.running ? "▶" : "■"} ${timeString}`
	}

	public componentDidMount() {
		this.inputElemM.focus();
		document.addEventListener("keydown", this.handleKey, false);
	}

	public componentWillUnmount() {
		document.removeEventListener("keydown");
	}

	public render() {
		return (
			<div id="app">
				<Title text={this.title}/>

				{ !isOSX() ? (
					<div id="close">
						<button onClick={ window.close }>x</button>
					</div>
				) : null }

				<section className="timer">
					ETA: {this.displayTime}
				</section>

				{this.running ? (
					<section className="countdown">
						<span>{this.remainingHours}</span>
						<span>:</span>
						<span>{this.remainingMinutes}</span>
						<span>:</span>
						<span>{this.remainingSeconds}</span>
					</section>
				) : (
					<section className="input">
						<input type="number"
							onChange={this.handleNumberChange("H")}
							onKeyDown={this.handleKeyInput("H")}
							ref={el => this.inputElemH = el}
							value={this.hours}
							tabIndex={1}
						/>
						<input type="number"
							onChange={this.handleNumberChange("M")}
							onKeyDown={this.handleKeyInput("M")}
							ref={el => this.inputElemM = el}
							value={this.minutes}
							tabIndex={2}
						/>
						<input type="number"
							onChange={this.handleNumberChange("S")}
							onKeyDown={this.handleKeyInput("S")}
							ref={el => this.inputElemS = el}
							value={this.seconds}
							tabIndex={3}
						/>
					</section>
				)}

				<section className="button">
					{ this.running ? (
						<Aux>
							<input
								type="button"
								onClick={this.stop(false)}
								value="Stop"
								tabIndex={-1}
							/>
							&nbsp;
							<input
								type="button"
								onClick={this.stop()}
								value="Reset"
								tabIndex={-1}
							/>
						</Aux>
					) : (
						<input
							type="button"
							onClick={this.start}
							value="Start"
							tabIndex={-1}
						/>
					)}
				</section>
			</div>
		)
	}

	@action private handleKeyInput = (type: "H"|"M"|"S") => (event: any) => {
		let _type = type;

		if (event.key === "Backspace") {
			if (_type === "S") {
				if (this.seconds > 0) {
					if (this.seconds % 10 !== 0) {
						this.seconds -= this.seconds % 10;
					} else {
						this.seconds *= 0.1;
					}
				} else {
					_type = "M";
				}
			}

			if (_type === "M") {
				if (this.minutes > 0) {
					const singleMinutes = this.minutes % 10;
					if (singleMinutes !== 0) {
						this.minutes -= singleMinutes;
					} else {
						this.minutes *= 0.1;
					}
				} else {
					_type = "H";
				}
			}

			if (_type === "H") {
				if (this.hours > 0) {
					const singleHours = this.hours % 10;
					if (singleHours !== 0) {
						this.hours -= singleHours;
					} else {
						this.hours *= 0.1;
					}
				} else {
					_type = "H";
				}
			}
		}
	}

	// THIS IS A MONSTER!
	@action private handleNumberChange = (type: "H"|"M"|"S") => () => {
		let value;
		switch (type) {
			case "H":
				value = this.parseInteger(this.inputElemH.value);
				if (value >= 0) {
					this.hours = value;
					this.stashHMS[0] = value;
				}
				else return false;
				break;
			case "M":
				value = this.parseInteger(this.inputElemM.value);
				if (value >= 0 && value < 60) {
					this.minutes = value;
					this.stashHMS[1] = value;
				} else if (value === 60) {
					this.hours++;
					this.minutes = 0;
				} else if (value === -1) {
					if (this.hours > 0) {
						this.hours--;
						this.minutes = 59;
					}
				} else if (value > 60) {
					const additionalHours = Math.floor(value / 60);
					this.hours += additionalHours;
					this.minutes = value % 60;
				}
				else return false;
				break;
			case "S":
				value = this.parseInteger(this.inputElemS.value);
				if (value >= 0 && value < 60) {
					this.seconds = value;
					this.stashHMS[2] = value;
				} else if (value === 60) {
					if (this.minutes < 59) {
						this.minutes++;
					} else {
						this.hours++;
						this.minutes = 0;
					}

					this.seconds = 0;
				} else if (value === -1) {
					if (this.minutes > 0) {
						this.minutes--;
						this.seconds = 59;
					} else if (this.hours > 0) {
						this.hours--;
						this.minutes = 59;
						this.seconds = 59;
					}
				} else if (value > 60) {
					const additionalMinutes = Math.floor(value / 60);
					if (this.minutes + additionalMinutes > 60) {
						const additionalHours = Math.floor(value / 60);
						this.hours += additionalHours;
						this.minutes = additionalMinutes % 60;
					} else {
						this.minutes += additionalMinutes;
					}

					this.seconds = value % 60;
				}

				else return false;
				break;
		}
	}

	@action private start = () => {
		// don't start the timer when everything is 0
		if (this.hours === 0 && this.minutes === 0 && this.seconds === 0) {
			return;
		}

		this._shutdownTime = new Date(this._relativeTime.getTime());
		this.timer = setTimeout(this.shutdown, this._shutdownTime.getTime() - Date.now());
		this.running = true;
	}

	@action private stop = (reset = true) => () => {
		if (!reset) {
			this.hours = parseInt(this.remainingHours, 10);
			this.minutes = parseInt(this.remainingMinutes, 10);
			this.seconds = parseInt(this.remainingSeconds, 10);
		} else {
			const [ hours, minutes, seconds ] = this.stashHMS;
			this.hours = hours;
			this.minutes = minutes;
			this.seconds = seconds;
		}

		this._shutdownTime = new Date();
		clearTimeout(this.timer);
		this.timer = null;
		this.running = false;
	}

	@action private shutdown = () => {
		// remove this
		this.running = false;

		// shutdown the pc
		shutdown();
	}

	private handleKey = (event: any) => {
		if (event.key === "Enter" || event.key === " ") {
			if (!this.running) {
				setTimeout(this.start, 0);
				this.start();
			} else {
				setTimeout(this.stop(false), 0);
			}
			return;
		}

		if (event.key === "Escape") {
			if (this.running) {
				setTimeout(this.stop(true), 0);
			} else {
				this.stashHMS = App.defaultHMS;
				const [hours, minutes, seconds] = this.stashHMS;
				this.hours = hours;
				this.minutes = minutes;
				this.seconds = seconds;
			}
			return;
		}

		if (event.key === "h" && this.inputElemH != null) {
			this.inputElemH.focus();
			return;
		}

		if (event.key === "m" && this.inputElemH != null) {
			this.inputElemM.focus();
			return;
		}

		if (event.key === "s" && this.inputElemH != null) {
			this.inputElemS.focus();
			return;
		}

		if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
			if (this.inputElemH == null || this.inputElemM == null || this.inputElemS == null) return;

			if (document.activeElement === this.inputElemH) {
				if (event.key === "ArrowRight") {
					this.inputElemM.focus();
				}
			} else if (document.activeElement === this.inputElemM) {
				if (event.key === "ArrowLeft") {
					this.inputElemH.focus();
				} else if (event.key === "ArrowRight") {
					this.inputElemS.focus();
				}
			} else if (document.activeElement === this.inputElemS) {
				if (event.key === "ArrowLeft") {
					this.inputElemM.focus();
				}
			} else {
				if (event.key === "ArrowLeft") {
					this.inputElemH.focus();
				} else if (event.key === "ArrowRight") {
					this.inputElemS.focus();
				}
			}
			return;
		}
	}

	parseInteger(raw: string) {
		const value = parseInt(raw, 10);

		if (isNaN(value) && !isFinite(value)) {
			return 0;
		} else {
			return value;
		}
	}
}
