import { FileSystemAdapter, ListedFiles, normalizePath, Plugin } from 'obsidian';

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
			.map(x => x.split('\\').pop()?.split('/').pop() || x);
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
		const typeFilename = "simple-script-api.d.ts";
		const sourcePath = this.#makePath(".obsidian\\plugins", this.#plugin.manifest.id, typeFilename);
		const destinationPath = this.#makePath(this.#scriptsPath, "@types", typeFilename);
		let copyFile = false;

		if (await adapter.exists(destinationPath)) {
			const source = await adapter.stat(sourcePath);
			const destination = await adapter.stat(destinationPath);

			copyFile = (source?.mtime ?? 0) > (destination?.mtime ?? 0);
			if (copyFile) {
				await adapter.remove(destinationPath);
			}
		} else {
			copyFile = true;
		}

		if (copyFile) {
			adapter.copy(sourcePath, destinationPath);
		}
	}

	async #ensureDirectoryExists(directoryPath: string) {
		console.log(`ensureDirectoryExists: ${directoryPath}`)
		if (!(await this.#plugin.app.vault.adapter.exists(directoryPath))) {
			this.#plugin.app.vault.adapter.mkdir(directoryPath);
		}
	}
}
