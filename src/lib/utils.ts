import { exec } from "child_process";
import { platform } from "os";
import { resolve } from "path";

export function shutdown() {
	switch (platform()) {
		case "linux":
			exec("poweroff -i");
			break;
		case "win32":
			exec("shutdown -s -t 0")
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
