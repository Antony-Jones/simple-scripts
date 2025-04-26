import { TFile, TFolder, Vault } from "obsidian";
import FileInfo from "./FileInfo";

export default class FolderInfo {
    #folder: TFolder;
    #vault: Vault;

    constructor(folder: TFolder, vault: Vault) {
        this.#folder = folder;
        this.#vault = vault;
    }

    get name(): string {
        return this.#folder.name;
    }

    get path(): string {
        return this.#folder.path;
    }

    get isRoot(): boolean {
        return this.#folder.isRoot();
    }
	
    files():Generator<FileInfo>;
    files(recursive:boolean):Generator<FileInfo>;
    *files(recursive = false):Generator<FileInfo>{
        for (const child of this.#folder.children) {
            if (child instanceof TFile) {
                yield new FileInfo(child, this.#vault);
            }

            if (recursive && child instanceof TFolder) {
                yield* new FolderInfo(child, this.#vault).files(recursive);
            }
        }
    }

    folders():Generator<FolderInfo>;
    folders(recursive:boolean):Generator<FolderInfo>;
    *folders(recursive = false):Generator<FolderInfo>{
        for (const child of this.#folder.children) {
            if (child instanceof TFolder) {
                const folder = new FolderInfo(child, this.#vault);
                yield folder;

                if(recursive){
                    yield* folder.folders(recursive);
                }
            }
        }
    }

    async copy(to: string): Promise<FolderInfo> {
        const newFolder = await this.#vault.copy(this.#folder, to);

        return new FolderInfo(newFolder, this.#vault);
    }

    rename(newPath: string): Promise<void> {
        return this.#vault.rename(this.#folder, newPath);
    }

    delete(sendToTrash:true): Promise<void>;
    delete(sendToTrash:false, force?:boolean): Promise<void>;
    delete(sendToTrash: boolean, force?:boolean): Promise<void> {
        if (sendToTrash) {
            return this.#vault.trash(this.#folder, true);
        } else {
            return this.#vault.delete(this.#folder, force);
        }
    }
}
