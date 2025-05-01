import { App, Notice, Plugin, PluginManifest, sanitizeHTMLToDom } from 'obsidian';
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
		await this.#scriptsIO.initializeScriptsPath();
		await this.#settings.load();

		this.addSettingTab(new SettingsTab(this, this.#settings, this.#scriptsIO, this.#scriptManager));
		this.#scriptManager.onLoad();
	}

	onUnload() {
		this.#scriptManager.onUnload();
	}

	displayErrorNotice(subheader: string, filename: string, error: unknown): void {
		let message:string;
		if(error){
			if(error instanceof Error){				
				message = `[${error.name}] ${error.message}`;
			}else if(error["toString"]){
				message = error.toString();
			}else{
				message = `${error}`;
			}
		}else{
			message = "";
		}

		console.error(`Simple Script Error:\n\${subheader}\n\tFilename:${filename}\n\tMessage:${message}`);
		console.error(error);

		const html = `<div class="simple-script-notice">
			<div class="simple-script-notice-header">Simple Script Error</div>
			<div class="simple-script-notice-subheader">${subheader}</div>
			<div class="simple-script-notice-filename">${filename}</div>
			<div class="simple-script-notice-message">${message}</div>
		</div>`;

		const fragment = sanitizeHTMLToDom(html);
		new Notice(fragment);
		}
}

