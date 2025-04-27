import { App, Plugin, PluginManifest } from 'obsidian';
import SettingsProvider from 'Settings/SettingsProvider';
import SettingsTab from 'Settings/SettingsTab';
import ScriptsIO from 'Scripts/ScriptsIO'
import ScriptManager from 'Scripts/ScriptManager';

export default class SimpleScriptsPlugin extends Plugin {
	#settings: SettingsProvider;
	#scriptsIO: ScriptsIO;
	#scriptManager: ScriptManager;

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);

		this.#scriptsIO = new ScriptsIO(this);
		this.#settings = new SettingsProvider(this);
		this.#scriptManager = new ScriptManager(this, this.#scriptsIO, this.#settings);
	}

	async onload() {
		console.log("onload")
		await this.#scriptsIO.initializeScriptsPath();
		await this.#settings.load();

		this.addSettingTab(new SettingsTab(this, this.#settings, this.#scriptsIO, this.#scriptManager));
		this.#scriptManager.onLoad();
	}

	onUnload() {
		this.#scriptManager.onUnload();
	}
}

