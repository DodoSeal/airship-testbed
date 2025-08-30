import { AudioManager } from "@Easy/Core/Shared/Audio/AudioManager";
import { Dependency } from "@Easy/Core/Shared/Flamework";
import { Game } from "@Easy/Core/Shared/Game";
import { Protected } from "@Easy/Core/Shared/Protected";
import { Bin } from "@Easy/Core/Shared/Util/Bin";
import { ProtectedUtil } from "@Easy/Core/Shared/Util/ProtectedUtil";
import { MainMenuSingleton } from "../../Singletons/MainMenuSingleton";
import {
	InternalGameSetting,
	InternalGameSettingType,
	InternalSliderGameSetting,
} from "../../Singletons/Settings/InternalGameSetting";
import SettingsSlider from "./Controls/SettingsSlider";
import SettingsToggle from "./Controls/SettingsToggle";
import { SettingsTab } from "./SettingsPageName";
import SettingsSidebar from "./SettingsSidebar";

export default class SettingsPage extends AirshipBehaviour {
	public sidebar!: SettingsSidebar;
	public tabs!: RectTransform;
	public scrollView!: RectTransform;
	public canvasScalar: CanvasScaler;
	public verticalLayoutGroup: VerticalLayoutGroup;
	public rightSection: RectTransform;
	public mobileHeader: RectTransform;
	public desktopCloseButtonWrapper: RectTransform;
	public mobileCloseButtonWrapper: RectTransform;
	public gamePageSettingsContainer: Transform;

	@Header("Toggles")
	public sprintToggle: SettingsToggle;
	public chatMuteToggle: SettingsToggle;

	@Header("Sliders")
	public mouseSensitivitySlider!: SettingsSlider;
	public mouseSmoothingSlider!: SettingsSlider;
	public touchSensitibitySlider!: SettingsSlider;
	public volumeSlider!: SettingsSlider;

	@Header("Prefabs")
	public sliderPrefab: GameObject;
	public togglePrefab: GameObject;
	public spacerPrefab: GameObject;

	// public mobilePages!: RectTransform[];

	private bin = new Bin();

	public OnEnable(): void {
		if (!Game.IsClient()) return;

		// const rect = this.transform as RectTransform;
		const mainMenu = Dependency<MainMenuSingleton>();
		this.bin.Add(() => {
			mainMenu.SetHideMobileEscapeButton(false);
		});

		mainMenu.SetHideMobileEscapeButton(true);
		this.bin.Add(
			mainMenu.ObserveScreenSize((size) => {
				if (size === "sm" || (size === "md" && Game.IsMobile())) {
					if (Game.IsPortrait()) {
						this.canvasScalar.referenceResolution = new Vector2(458, 1125);
						this.canvasScalar.matchWidthOrHeight = 0;
						this.verticalLayoutGroup.padding.right = 30;
						this.verticalLayoutGroup.padding.left = 30;
					} else {
						this.canvasScalar.referenceResolution = new Vector2(1125, 458);
						this.canvasScalar.matchWidthOrHeight = 0;

						const safeArea = Screen.safeArea;
						// print(
						// 	"safe area: " +
						// 		safeArea +
						// 		", yMax: " +
						// 		safeArea.yMax +
						// 		", yMin: " +
						// 		safeArea.yMin +
						// 		", screenHeight: " +
						// 		Screen.height,
						// );
						// print(`safeArea.min: ${safeArea.min}, safeArea.max: ${safeArea.max}`);
						// todo: this is wrong but works on iPhone... I cannot figure out how to make it work correctly with safeArea max.
						// - Luke
						this.verticalLayoutGroup.padding.left = safeArea.min.y + 20;
						this.verticalLayoutGroup.padding.right = safeArea.min.y + 20;
						this.mobileCloseButtonWrapper.anchoredPosition = new Vector2(
							120,
							this.mobileCloseButtonWrapper.anchoredPosition.y,
						);
					}
					this.verticalLayoutGroup.spacing = 60;
					// this.verticalLayoutGroup.padding.left = 15;
					// this.verticalLayoutGroup.padding.top = 20;
					// this.verticalLayoutGroup.padding.bottom = 80;

					const notchHeight = ProtectedUtil.GetNotchHeight();

					this.sidebar.gameObject.SetActive(false);
					// this.scrollView.offsetMax = new Vector2(-5, -7);
					// this.scrollView.offsetMin = new Vector2(5, 0);
					// this.scrollView.anchoredPosition = new Vector2(0, -96);

					this.scrollView.offsetMax = new Vector2(0, -notchHeight - 40);
					this.scrollView.offsetMin = new Vector2(0, 0);

					this.mobileHeader.gameObject.SetActive(true);
					this.mobileHeader.sizeDelta = new Vector2(this.mobileHeader.sizeDelta.x, notchHeight + 60);

					this.desktopCloseButtonWrapper.gameObject.SetActive(false);
					this.rightSection.anchorMin = new Vector2(0, 0);
					this.rightSection.anchoredPosition = new Vector2(0, 0);

					if (Game.deviceType === AirshipDeviceType.Phone) {
						this.tabs.GetChild(1).gameObject.SetActive(true); // Profile
						this.tabs.GetChild(2).gameObject.SetActive(true); // Input
						this.tabs.GetChild(3).gameObject.SetActive(true); // Sound

						this.tabs.GetChild(7).gameObject.SetActive(true); // Blocked
						this.tabs.GetChild(8).gameObject.SetActive(true); // Developer
						this.tabs.GetChild(9).gameObject.SetActive(true); // Other
					}
				} else {
					this.tabs.anchorMax = new Vector2(0, 1);
					this.tabs.offsetMax = new Vector2(800, 0);
					// this.tabs.anchoredPosition = new Vector2(800, 0);
					this.mobileHeader.gameObject.SetActive(false);
					this.desktopCloseButtonWrapper.gameObject.SetActive(true);
					for (let child of this.tabs) {
						child.gameObject.SetActive(true);
					}
				}
			}),
		);

		this.gamePageSettingsContainer.gameObject.ClearChildren();
		if (Protected.Settings.gameSettings.size() > 0) {
			for (let gameSetting of Protected.Settings.gameSettingsOrdered) {
				if (gameSetting === "space") {
					Object.Instantiate(this.spacerPrefab, this.gamePageSettingsContainer);
					continue;
				}

				// Slider
				if (gameSetting.type === InternalGameSettingType.Slider) {
					const setting = gameSetting as InternalSliderGameSetting;
					const go = Object.Instantiate(this.sliderPrefab, this.gamePageSettingsContainer);
					const settingsSlider = go.GetAirshipComponent<SettingsSlider>()!;
					settingsSlider.Init(gameSetting.name, setting.value as number, setting.min, setting.max, setting.increment);
					this.bin.Add(
						settingsSlider.onChange.Connect((val) => {
							Protected.Settings.SetGameSetting(setting.name, val);
						}),
					);
				}

				// Toggle
				if (gameSetting.type === InternalGameSettingType.Toggle) {
					const setting = gameSetting as InternalGameSetting;
					const go = Object.Instantiate(this.togglePrefab, this.gamePageSettingsContainer);
					const toggle = go.GetAirshipComponent<SettingsToggle>()!;
					toggle.Init(gameSetting.name, gameSetting.value as boolean);
					this.bin.Add(
						toggle.toggle.onValueChanged.Connect((val) => {
							Protected.Settings.SetGameSetting(setting.name, val);
						}),
					);
				}
			}
		}
	}

	protected Start(): void {
		const settings = Protected.Settings;

		this.sprintToggle.Init("Toggle Sprint", settings.IsSprintToggleEnabled());
		this.sprintToggle.toggle.onValueChanged.Connect((val) => {
			settings.SetSprintToggleEnabled(val);
		});

		this.chatMuteToggle.Init("Mute Game Chat", settings.IsChatMuteEnabled());
		this.chatMuteToggle.toggle.onValueChanged.Connect((val) => {
			settings.SetChatMuteEnabled(val);
		});

		this.mouseSensitivitySlider.Init("Mouse Sensitivity", settings.GetMouseSensitivity(), 0.01, 2, 0.01);
		this.mouseSensitivitySlider.onChange.Connect((val) => {
			settings.SetMouseSensitivity(val);
		});

		this.mouseSmoothingSlider.Init("Mouse Smoothing", settings.GetMouseSmoothing(), 0, 2, 0.01);
		this.mouseSmoothingSlider.onChange.Connect((val) => {
			settings.SetMouseSmoothing(val);
		});

		if (Game.IsMobile()) {
			this.touchSensitibitySlider.Init("Touch Sensitivity", settings.GetTouchSensitivity(), 0.01, 2, 0.01);
			this.touchSensitibitySlider.onChange.Connect((val) => {
				settings.SetTouchSensitivity(val);
			});
		} else {
			this.touchSensitibitySlider.gameObject.SetActive(false);
		}

		this.volumeSlider.Init("Global Volume", settings.GetGlobalVolume(), 0, 2, 0.01);
		this.volumeSlider.onChange.Connect((val) => {
			settings.SetGlobalVolume(val);
		});
	}

	public SetTab(settingsTab: SettingsTab): void {
		if (ProtectedUtil.IsPhoneMode()) return;

		const sidebar = this.sidebar.gameObject.GetAirshipComponent<SettingsSidebar>()!;
		for (let tabBtn of sidebar.tabBtns) {
			let name = tabBtn.gameObject.name;
			if (name === settingsTab) {
				sidebar.SetSelectedTab(tabBtn);
				continue;
			}
		}
	}

	private PlaySelectSound() {
		AudioManager.PlayGlobal("AirshipPackages/@Easy/Core/Sound/UI_Select.wav");
	}

	public OnDisable(): void {
		this.bin.Clean();
	}
}
