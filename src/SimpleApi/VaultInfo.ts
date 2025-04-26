import FolderInfo from "./FolderInfo";
import FileInfo from "./FileInfo";
import FrontmatterInfo from "./FrontmatterInfo";
import Connectors from "PluginConnectors/Connectors";
import { App } from "obsidian";

export default class VaultInfo {
	#app: App;
	#pluginConnectors: Connectors;

	constructor(app: App) {
		this.#app = app;
		this.#pluginConnectors = new Connectors(app);
	}

	get root(): FolderInfo {
		return new FolderInfo(this.#app.vault.getRoot(), this.#app.vault);
	}

	get plugins(): Connectors {
		return this.#pluginConnectors;
	}

	exists(path: string): Promise<boolean> {
		return this.#app.vault.adapter.exists(path);
	}

	getFile(path: string): FileInfo {
		const tFile = this.#app.vault.getFileByPath(path);
		if (tFile == null) {
			throw new Error(`File not found: '${path}'`);
		}

		return new FileInfo(tFile, this.#app.vault);
	}

	async createFile(path: string, data: string): Promise<FileInfo> {
		if (await this.exists(path)) {
			throw new Error(`File already exists: '${path}'`);
		}

		const tFile = await this.#app.vault.create(path, data);
		return new FileInfo(tFile, this.#app.vault);
	}

	async createBinaryFile(path: string, data: ArrayBuffer): Promise<FileInfo> {
		if (await this.exists(path)) {
			throw new Error(`File already exists: '${path}'`);
		}

		const tFile = await this.#app.vault.createBinary(path, data);
		return new FileInfo(tFile, this.#app.vault);
	}

	getFolder(path: string): FolderInfo {
		const tFile = this.#app.vault.getFolderByPath(path);
		if (tFile == null) {
			throw new Error(`Folder not found: '${path}'`);
		}

		return new FolderInfo(tFile, this.#app.vault);
	}

	async createFolder(path: string): Promise<FolderInfo> {
		if (await this.exists(path)) {
			throw new Error(`Folder already exists: '${path}'`);
		}

		const tFolder = await this.#app.vault.createFolder(path);
		return new FolderInfo(tFolder, this.#app.vault);
	}

	getFrontmatter(path: string): Promise<FrontmatterInfo | null>;
	getFrontmatter(file: FileInfo): Promise<FrontmatterInfo | null>;
	async getFrontmatter(fileOrPath: FileInfo | string): Promise<FrontmatterInfo | null> {
		const path = fileOrPath instanceof FileInfo ? fileOrPath.path : fileOrPath;
		const cache = this.#app.metadataCache.getCache(path);
		const tFile = this.#app.vault.getFileByPath(path);
		if (tFile == null) {
			throw new Error(`File not found: '${path}'`);
		}

		if (cache?.frontmatter == null) {
			return null;
		} else {
			return new FrontmatterInfo(this.#app, tFile, cache.frontmatter, this.#app.metadataTypeManager);
		}
	}
}
