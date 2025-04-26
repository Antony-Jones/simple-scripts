import { App, Plugin, PluginSettingTab, Setting, sanitizeHTMLToDom } from 'obsidian';
import * as childProcess from 'child_process';
import SettingsProvider from './SettingsProvider';
import ScriptsIO from 'Scripts/ScriptsIO';
import ScriptManager from 'Scripts/ScriptManager';

export default class SettingsTab extends PluginSettingTab {
	#settings:SettingsProvider;
	#io:ScriptsIO;
	#scriptManager: ScriptManager;

	constructor(app: App, plugin: Plugin, settings: SettingsProvider, io: ScriptsIO, scriptManager:ScriptManager) {
		super(app, plugin);

		this.#settings = settings;
		this.#io = io;
		this.#scriptManager = scriptManager;
	}

	async #enableScript(fileName: string): Promise<void> {
		this.#settings.enabledScripts.add(fileName);
		this.#scriptManager.enableScript(fileName);

		await this.#settings.save();
	}

	async #disableScript(fileName: string): Promise<void> {
		this.#settings.enabledScripts.remove(fileName);
		this.#scriptManager.unloadScript(fileName);

		await this.#settings.save();
	}

	async #loadScripts(): Promise<{ fileName: string; enabled: boolean; missingFile: boolean }[]> {
		const fileNames = await this.#io.listFiles();
		const enabled = this.#settings.enabledScripts;

		const scripts = fileNames.map(x => {
			return {
				fileName: x,
				enabled: enabled.contains(x),
				missingFile: false
			}
		});

		for (const script of enabled) {
			if (!fileNames.contains(script)) {
				scripts.push({
					fileName: script,
					enabled: true,
					missingFile: true
				});
			}
		}

		return scripts.sort((a, b) => {
			return a.fileName.localeCompare(b.fileName);
		})
	}

	async #displayScripts(containerEl: HTMLElement): Promise<void> {
		containerEl.empty();

		const scriptFiles = await this.#loadScripts();

		for (const scriptFile of scriptFiles) {
			const setting = new Setting(containerEl)
				.setName(scriptFile.fileName)
				.addToggle(toggle => {
					toggle.setValue(scriptFile.enabled);

					toggle.onChange(enabled => {
						if (enabled) {
							this.#enableScript(scriptFile.fileName);
						} else {
							this.#disableScript(scriptFile.fileName);
						}
					})
				});

			if (scriptFile.missingFile) {
				const fragment = sanitizeHTMLToDom("<span class='mod-warning'>This script file is missing.</span>");

				setting.setDesc(fragment);
			}
		}
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Simple Scripts")
			.setHeading()
			.addButton(btn => {
				btn.setIcon("refresh-cw")
				btn.setTooltip("Reload scripts")
				btn.onClick(async () => {
					this.#displayScripts(scriptsEl);
				})
			})
			.addButton(btn => {
				btn.setIcon("folder-open")
				btn.setTooltip("Open scripts folder")
				btn.onClick(async () => {
					childProcess.exec((`start "" "${this.#io.ScriptsPath}"`))
				})
			});

		const scriptsEl: HTMLElement = containerEl.createDiv();
		this.#displayScripts(scriptsEl);
	}
}
