import { FrontMatterCache, TFile, TFolder, MetadataTypeManager } from "obsidian";
import FileInfo from "SimpleApi/FileInfo";
import FolderInfo from "SimpleApi/FolderInfo";
import FrontmatterInfo from "SimpleApi/FrontmatterInfo";
import SimpleScriptBase from "SimpleApi/SimpleScriptBase";
import ScriptsIO from "./ScriptsIO";
import ScriptInstance from "./ScriptInstance";
import SimpleScriptsPlugin from "main";

export default class ScriptList {
    #scripts: Record<string, ScriptInstance> = {};
    #io: ScriptsIO;
    #plugin: SimpleScriptsPlugin;

    constructor(plugin: SimpleScriptsPlugin, io: ScriptsIO) {
        this.#plugin = plugin;
        this.#io = io;
    }

    async enableScript(fileName: string): Promise<void> {
        if (Object.hasOwn(this.#scripts, fileName)) {
            throw new Error(`The script '${fileName}' was already loaded.`);
        }
		
        let instance: ScriptInstance;
        try {
            instance = await ScriptInstance.create(fileName,this.#plugin,this.#io)
        } catch (e) {
            this.#plugin.displayErrorNotice("Create Instance", fileName, e);
            return;
        }

        this.#scripts[fileName] = instance;

        try {
            await instance.onLoad();
        } catch (e) {
            this.#plugin.displayErrorNotice("Event: On Load", fileName, e);
        }
    }

    async unloadScript(fileName: string): Promise<void> {
        if (!Object.hasOwn(this.#scripts, fileName)) {
            throw new Error(`Could not unload '${fileName}', the script was not loaded.`);
        }

        try {
            await this.#scripts[fileName].onUnload();
        } catch (e) {
            this.#plugin.displayErrorNotice("Event: On Unload", fileName, e);
        }

        delete this.#scripts[fileName];
    }

    #forEachScript(eventName: string, callback: (instance: SimpleScriptBase) => void): void {
        for (const fileName of Object.keys(this.#scripts)) {
            try {
                callback(this.#scripts[fileName].instance);
            }
            catch (e) {
                this.#plugin.displayErrorNotice(`Event: ${eventName}`, fileName, e);
            }
        }
    }

    onFileCreated(file: TFile) {
        const info = new FileInfo(file, this.#plugin.app.vault);

        this.#forEachScript("On File Created", x => x.onFileCreated(info));
    }
    onFileModified(file: TFile) {
        const info = new FileInfo(file, this.#plugin.app.vault);

        this.#forEachScript("On File Modified", x => x.onFileModified(info));
    }
    onFileRenamed(file: TFile, oldPath: string) {
        const info = new FileInfo(file, this.#plugin.app.vault);

        this.#forEachScript("On File Renamed", x => x.onFileRenamed(info, oldPath));
    }
    onFileOpened(file: TFile | null) {
        const info = file != null ? new FileInfo(file, this.#plugin.app.vault) : null;

        this.#forEachScript("On File Opened", x => x.onFileOpened(info));
    }
    onFileDeleted(file: TFile) {
        const info = new FileInfo(file, this.#plugin.app.vault);

        this.#forEachScript("On File Deleted", x => x.onFileDeleted(info));
    }
    onFolderCreated(folder: TFolder) {
        const info = new FolderInfo(folder, this.#plugin.app.vault);

        this.#forEachScript("On Folder Created", x => x.onFolderCreated(info));
    }
    onFolderRenamed(folder: TFolder, oldPath: string) {
        const info = new FolderInfo(folder, this.#plugin.app.vault);

        this.#forEachScript("On Folder Renamed", x => x.onFolderRenamed(info, oldPath));
    }
    onFolderDeleted(folder: TFolder) {
        const info = new FolderInfo(folder, this.#plugin.app.vault);

        this.#forEachScript("On Folder Deleted", x => x.onFolderDeleted(info));
    }
    onFrontmatterModified(file: TFile, cache: FrontMatterCache, metadataTypeManager: MetadataTypeManager) {
        const fileInfo = new FileInfo(file, this.#plugin.app.vault);
        const frontMatterInfo = new FrontmatterInfo(this.#plugin.app, file, cache, metadataTypeManager);

        this.#forEachScript("On Frontmatter Modified", x => x.onFrontmatterModified(fileInfo, frontMatterInfo));
    }
}
