import { FileSystemAdapter, ListedFiles, normalizePath, Plugin } from 'obsidian';

declare global{
	const simpleScriptApiTypes:string;
}

export default class ScriptsIO {
	readonly #scriptsPath = ".obsidian\\scripts";
	readonly #plugin: Plugin;

	constructor(plugin: Plugin) {
		this.#plugin = plugin;
	}

	#makePath(...paths: string[]):string {
		const parts: string[] = [];
		for (const path of paths) {
			path.split(/[/\\]+/).forEach(x => {
				if (x && x.length > 0) {
					parts.push(x)
				}
			});
		}

		return normalizePath(parts.join('\\'));
	}

	get ScriptsFullPath(): string | null {
		if (this.#plugin.app.vault.adapter instanceof FileSystemAdapter) {
			return this.#plugin.app.vault.adapter.getFullPath(this.#makePath(this.#scriptsPath));
		} else {
			return null;
		}
	}

	async listFiles(): Promise<string[]> {
		const dir: ListedFiles = await this.#plugin.app.vault.adapter.list(this.#makePath(this.#scriptsPath));

		return dir.files
			.filter(x => x.endsWith(".js"))
			.map(x => x.split(/[/\\]+/).pop() || x);
	}

	readScriptFile(fileName: string): Promise<string> {
		const scriptFilePath = this.#makePath(this.#scriptsPath, fileName);

		return this.#plugin.app.vault.adapter.read(scriptFilePath);
	}

	async initializeScriptsPath() {
		console.log("initializeScriptsPath")
		this.#ensureDirectoryExists(this.#makePath(this.#scriptsPath));

		const typePath = this.#makePath(this.#scriptsPath, "@types");
		this.#ensureDirectoryExists(typePath);
		await this.#initializeTypesFile();

	}

	async #initializeTypesFile() {
		const adapter = this.#plugin.app.vault.adapter;
		const typesDirectory = this.#makePath(this.#scriptsPath, "@types");
		let shouldWriteFile = true;

		const directoryListings = await adapter.list(typesDirectory);
		for (const path of directoryListings.files) {
			const filename = path.split(/[/\\]+/).pop()
			if(filename?.startsWith("simple-script-api-")){
				const fileVersion = filename.substring(18).split(".").slice(0,3).join(".");

				if(fileVersion === this.#plugin.manifest.version){
					shouldWriteFile = false;
				}else{
					adapter.remove(path);
				}
			}
		}

		if(shouldWriteFile){
			const typeFilename = `simple-script-api-${this.#plugin.manifest.version}.d.ts`;
			adapter.write(this.#makePath(typesDirectory, typeFilename),simpleScriptApiTypes);
		}
	}

	async #ensureDirectoryExists(directoryPath: string) {
		console.log(`ensureDirectoryExists: ${directoryPath}`)
		if (!(await this.#plugin.app.vault.adapter.exists(directoryPath))) {
			this.#plugin.app.vault.adapter.mkdir(directoryPath);
		}
	}
}
