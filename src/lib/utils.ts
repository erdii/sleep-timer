import { exec } from "child_process";
import { platform } from "os";
import { resolve } from "path";

export function shutdown() {
	console.log("beeeeeeeeeeeeeep");
	if (isDevelopment()) {
		throw new Error("ENODEVSHUTDOWN");
	}

	switch (platform()) {
		case "linux":
			exec("poweroff -i");
			break;
		case "win32":
			exec("shutdown -s -t 0");
			break;
		case "darwin":
			exec("osascript -e 'tell app \"System Events\" to shut down'");
			break;
		default: throw new Error("EOSNOTIMPLEMENTED");
	}
}

export function sleep(millis) {
	return new Promise(resolve => {
		setTimeout(() => resolve(), millis);
	});
}

export function isOSX() {
	return platform() == "darwin";
}

export function isDevelopment(): boolean {
	return process.env.NODE_ENV === "development";
}

export function prefixNum(value: number|string) {
	let str = value.toString();

	if (str.length < 2) {
		return "0" + value;
	} else {
		return str;
	}
}
