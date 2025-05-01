import FolderInfo from "./FolderInfo";
import FileInfo from "./FileInfo";
import FrontmatterInfo from "./FrontmatterInfo";
import Connectors from "PluginConnectors/Connectors";
import SimpleScriptsPlugin from "main";
import ScriptInstance from "Scripts/ScriptInstance";
import { Notice } from "obsidian";

export default class VaultInfo {
	#plugin: SimpleScriptsPlugin;
	#instance:ScriptInstance;
	#pluginConnectors: Connectors;

	constructor(plugin: SimpleScriptsPlugin, instance:ScriptInstance) {
		this.#plugin = plugin;
		this.#instance = instance;
		this.#pluginConnectors = new Connectors(plugin.app);
	}

	get root(): FolderInfo {
		return new FolderInfo(this.#plugin.app.vault.getRoot(), this.#plugin.app.vault);
	}

	get plugins(): Connectors {
		return this.#pluginConnectors;
	}

	exists(path: string): Promise<boolean> {
		return this.#plugin.app.vault.adapter.exists(path);
	}

	getFile(path: string): FileInfo {
		const tFile = this.#plugin.app.vault.getFileByPath(path);
		if (tFile == null) {
			throw new Error(`File not found: '${path}'`);
		}

		return new FileInfo(tFile, this.#plugin.app.vault);
	}

	async createFile(path: string, data: string): Promise<FileInfo> {
		if (await this.exists(path)) {
			throw new Error(`File already exists: '${path}'`);
		}

		const tFile = await this.#plugin.app.vault.create(path, data);
		return new FileInfo(tFile, this.#plugin.app.vault);
	}

	async createBinaryFile(path: string, data: ArrayBuffer): Promise<FileInfo> {
		if (await this.exists(path)) {
			throw new Error(`File already exists: '${path}'`);
		}

		const tFile = await this.#plugin.app.vault.createBinary(path, data);
		return new FileInfo(tFile, this.#plugin.app.vault);
	}

	getFolder(path: string): FolderInfo {
		const tFile = this.#plugin.app.vault.getFolderByPath(path);
		if (tFile == null) {
			throw new Error(`Folder not found: '${path}'`);
		}

		return new FolderInfo(tFile, this.#plugin.app.vault);
	}

	async createFolder(path: string): Promise<FolderInfo> {
		if (await this.exists(path)) {
			throw new Error(`Folder already exists: '${path}'`);
		}

		const tFolder = await this.#plugin.app.vault.createFolder(path);
		return new FolderInfo(tFolder, this.#plugin.app.vault);
	}

	getFrontmatter(path: string): Promise<FrontmatterInfo | null>;
	getFrontmatter(file: FileInfo): Promise<FrontmatterInfo | null>;
	async getFrontmatter(fileOrPath: FileInfo | string): Promise<FrontmatterInfo | null> {
		const path = fileOrPath instanceof FileInfo ? fileOrPath.path : fileOrPath;
		const cache = this.#plugin.app.metadataCache.getCache(path);
		const tFile = this.#plugin.app.vault.getFileByPath(path);
		if (tFile == null) {
			throw new Error(`File not found: '${path}'`);
		}

		if (cache?.frontmatter == null) {
			return null;
		} else {
			return new FrontmatterInfo(this.#plugin.app, tFile, cache.frontmatter, this.#plugin.app.metadataTypeManager);
		}
	}

	addCommand(name:string, callback:()=>void):void;
	addCommand(name:string, callback:(checking:boolean)=>void, performCheck:true):void;
	addCommand(name:string, callback:()=>void, performCheck:false):void;
	addCommand(name:string, callback:(()=>void)|((checking:boolean)=>void), performCheck?: boolean):void{
		this.#instance.addCommand(name,callback);	
	}

	notify(message:string):void{
		new Notice(message);
	}
}
