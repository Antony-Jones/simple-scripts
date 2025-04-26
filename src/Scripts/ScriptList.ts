import { App, FrontMatterCache, Notice, sanitizeHTMLToDom, TFile, TFolder, MetadataTypeManager } from "obsidian";
import FileInfo from "SimpleApi/FileInfo";
import FolderInfo from "SimpleApi/FolderInfo";
import FrontmatterInfo from "SimpleApi/FrontmatterInfo";
import SimpleScriptBase from "SimpleApi/SimpleScriptBase";
import ScriptsIO from "./ScriptsIO";
import VaultInfo from "SimpleApi/VaultInfo";
import SettingsProvider from "Settings/SettingsProvider";

export default class ScriptList {
    #scripts: Record<string, SimpleScriptBase> = {};
    #io: ScriptsIO;
    #app: App;
    #settings: SettingsProvider;

    constructor(app: App, io: ScriptsIO, settings: SettingsProvider) {
        this.#app = app;
        this.#io = io;
        this.#settings = settings;
    }

    async enableScript(fileName: string): Promise<void> {
        if (Object.hasOwn(this.#scripts, fileName)) {
            throw new Error(`The script '${fileName}' was already loaded.`);
        }

        const scriptText = await this.#io.readScriptFile(fileName);
        let instance: SimpleScriptBase;
        try {
            instance = this.#createScriptInstance(scriptText);
        } catch (e) {
            this.#handleScriptError("On Construct", fileName, e);
            return;
        }

        this.#scripts[fileName] = instance;

        try {
            await instance.onLoad();
        } catch (e) {
            this.#handleScriptError("On Load", fileName, e);
        }
    }

    async unloadScript(fileName: string): Promise<void> {
        if (!Object.hasOwn(this.#scripts, fileName)) {
            throw new Error(`Could not unload '${fileName}', the script was not loaded.`);
        }

        try {
            await this.#scripts[fileName].onUnload();
        } catch (e) {
            this.#handleScriptError("On Unload", fileName, e);
        }

        delete this.#scripts[fileName];
    }

    #handleScriptError(header: string, filename: string, error: unknown): void {
		Symbol('callsites')
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

		console.error(`Simple Script Error:\n\tEvent:${header}\n\tFilename:${filename}\n\tMessage:${message}`);

		const html = `<div class="simple-script-notice">
			<div class="simple-script-notice-header">Simple Script Error</div>
			<div class="simple-script-notice-subheader">Event: ${header}</div>
			<div class="simple-script-notice-filename">${filename}</div>
			<div class="simple-script-notice-message">${message}</div>
		</div>`;

		const fragment = sanitizeHTMLToDom(html);
        new Notice(fragment);
    }

    #createScriptInstance(code: string) {
        const innerThis = Object.create(null);

        const params = {
            "SimpleScriptBase": SimpleScriptBase,
            "global": Object.create(null),
            "globalThis": Object.create(null),
            "window": Object.create(null),
            "self": Object.create(null)
        }

        let context = Array.prototype.concat.call(innerThis, Object.keys(params), "return " + code);
        const sandbox = new (Function.prototype.bind.apply(Function, context));

        context = Array.prototype.concat.call(innerThis, Object.values(params));

        const result = Function.prototype.bind.apply(sandbox, context)();

        if (result.prototype instanceof SimpleScriptBase) {
            return new result(new VaultInfo(this.#app as App));
        } else {
            throw new Error("The script file is not a class, or does not extent SimpleScriptBase.")
        }
    }

    #forEachScript(eventName: string, callback: (instance: SimpleScriptBase) => void): void {
        for (const fileName of Object.keys(this.#scripts)) {
            try {
                callback(this.#scripts[fileName]);
            }
            catch (e) {
                this.#handleScriptError(eventName, fileName, e);
            }
        }
    }

    onFileCreated(file: TFile) {
        const info = new FileInfo(file, this.#app.vault);

        this.#forEachScript("On File Created", x => x.onFileCreated(info));
    }
    onFileModified(file: TFile) {
        const info = new FileInfo(file, this.#app.vault);

        this.#forEachScript("On File Modified", x => x.onFileModified(info));
    }
    onFileRenamed(file: TFile, oldPath: string) {
        const info = new FileInfo(file, this.#app.vault);

        this.#forEachScript("On File Renamed", x => x.onFileRenamed(info, oldPath));
    }
    onFileOpened(file: TFile | null) {
        const info = file != null ? new FileInfo(file, this.#app.vault) : null;

        this.#forEachScript("On File Opened", x => x.onFileOpened(info));
    }
    onFileDeleted(file: TFile) {
        const info = new FileInfo(file, this.#app.vault);

        this.#forEachScript("On File Deleted", x => x.onFileDeleted(info));
    }
    onFolderCreated(folder: TFolder) {
        const info = new FolderInfo(folder, this.#app.vault);

        this.#forEachScript("On Folder Created", x => x.onFolderCreated(info));
    }
    onFolderRenamed(folder: TFolder, oldPath: string) {
        const info = new FolderInfo(folder, this.#app.vault);

        this.#forEachScript("On Folder Renamed", x => x.onFolderRenamed(info, oldPath));
    }
    onFolderDeleted(folder: TFolder) {
        const info = new FolderInfo(folder, this.#app.vault);

        this.#forEachScript("On Folder Deleted", x => x.onFolderDeleted(info));
    }
    onFrontmatterModified(file: TFile, cache: FrontMatterCache, metadataTypeManager: MetadataTypeManager) {
        const fileInfo = new FileInfo(file, this.#app.vault);
        const frontMatterInfo = new FrontmatterInfo(this.#app, file, cache, metadataTypeManager);

        this.#forEachScript("On Frontmatter Modified", x => x.onFrontmatterModified(fileInfo, frontMatterInfo));
    }
}
