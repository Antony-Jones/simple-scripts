import { CachedMetadata,  TAbstractFile, TFile, TFolder } from "obsidian";
import ScriptsIO from "./ScriptsIO";
import ScriptList from "./ScriptList";
import SettingsProvider from "Settings/SettingsProvider";
import SimpleScriptsPlugin from "main";

export default class ScriptManager {
    #plugin: SimpleScriptsPlugin;
    #frontmatterHashCodes: Record<string, number> = {};
    #scripts: ScriptList;
    #settings: SettingsProvider;

    constructor(plugin: SimpleScriptsPlugin, io: ScriptsIO, settings:SettingsProvider) {
        this.#plugin = plugin;
        this.#scripts = new ScriptList(plugin, io);
        this.#settings = settings;
    }

    async onLoad(): Promise<void> {
        await this.#initializeHashCodes();
        this.#registerEvents();

        for(const fileName of this.#settings.enabledScripts){
            this.#scripts.enableScript(fileName);
        }
    }

    async onUnload(): Promise<void> {
        for(const fileName of this.#settings.enabledScripts){
            this.#scripts.unloadScript(fileName);
        }
    }

    async enableScript(fileName: string): Promise<void> {
        this.#scripts.enableScript(fileName);
    }

    async unloadScript(fileName: string): Promise<void>{
        this.#scripts.unloadScript(fileName);
    }

    #registerEvents() {
        this.#plugin.registerEvent(this.#plugin.app.vault.on('create', (file: TAbstractFile) => {
            if (file instanceof TFile) {
                this.#scripts.onFileCreated(file);
            } else if (file instanceof TFolder) {
                this.#scripts.onFolderCreated(file);
            }
        }));

        this.#plugin.registerEvent(this.#plugin.app.vault.on('modify', (file: TAbstractFile) => {
            if (file instanceof TFile) {
                this.#scripts.onFileModified(file);
            }
        }));

        this.#plugin.registerEvent(this.#plugin.app.vault.on('delete', (file: TAbstractFile) => {
            if (file instanceof TFile) {
                this.#scripts.onFileDeleted(file);
            } else if (file instanceof TFolder) {
                this.#scripts.onFolderDeleted(file);
            }
        }));

        this.#plugin.registerEvent(this.#plugin.app.vault.on('rename', (file: TAbstractFile, oldPath: string) => {
            if (file instanceof TFile) {
                this.#scripts.onFileRenamed(file, oldPath);
            } else if (file instanceof TFolder) {
                this.#scripts.onFolderRenamed(file, oldPath);
            }
        }));

        this.#plugin.registerEvent(this.#plugin.app.workspace.on('file-open', (file: TFile | null) => {
            this.#scripts.onFileOpened(file);
        }));

        this.#plugin.registerEvent(this.#plugin.app.metadataCache.on('changed', (file: TFile, data: string, cache: CachedMetadata) => {
            if (cache.frontmatter) {
                const cachedHashCode = this.#frontmatterHashCodes[file.path] ?? 0;
                const newHashCode = this.#getFrontmatterHashCode(data, cache);

                if (cachedHashCode != newHashCode) {
                    this.#frontmatterHashCodes[file.path] = newHashCode;
                    this.#scripts.onFrontmatterModified(file, cache.frontmatter, this.#plugin.app.metadataTypeManager);
                }
            }
        }));
    }

    async #initializeHashCodes() {
        const tasks = [];

        for (const file of this.#plugin.app.vault.getFiles()) {
            if (file instanceof TFile) {
                tasks.push(this.#getFileFrontmatterHashCode(file).then(x => this.#frontmatterHashCodes[file.path] = x));
            }
        }

        await Promise.all(tasks);
    }

    async #getFileFrontmatterHashCode(file: TFile): Promise<number> {
        const cache = this.#plugin.app.metadataCache.getFileCache(file);
        const data = await this.#plugin.app.vault.read(file);

        return this.#getFrontmatterHashCode(data, cache);
    }

	#getHashCode(data:string):number{
		return [...data].reduce(
			(hash: number, character: string) => {
				return (Math.imul(31, hash) + character.charCodeAt(0)) | 0
			},
			0
		);
	}

    #getFrontmatterHashCode(data: string, cache: CachedMetadata | null): number {
        if (cache != null && data != null) {
            const frontmatter = data.substring(cache.frontmatterPosition?.start.offset ?? 0, cache.frontmatterPosition?.end.offset ?? 0);
            return this.#getHashCode(frontmatter);
        } else {
            return 0;
        }
    }
}

