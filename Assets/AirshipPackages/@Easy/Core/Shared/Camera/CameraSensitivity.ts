import { Airship } from "../Airship";

const BASE_DPI = 96;

/** Get mouse sensitivity, corrected for the user's screen DPI. */
export function getDpiAdjustedMouseSensitivity(): number {
	const dpi = Screen.dpi;

	// If Unity cannot determine DPI, it will be zero
	if (dpi === 0) {
		return Airship.Input.GetMouseSensitivity();
	}

	return Airship.Input.GetMouseSensitivity() * (dpi / BASE_DPI);
}
