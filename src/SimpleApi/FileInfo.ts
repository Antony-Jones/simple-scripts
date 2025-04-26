import { TFile, Vault } from "obsidian";
import FolderInfo from "./FolderInfo";

export default class FileInfo {
    #file: TFile;
    #vault: Vault;

    constructor(file: TFile, vault: Vault) {
        this.#file = file;
        this.#vault = vault;
    }

    get name(): string {
        return this.#file.name;
    }

    get baseName(): string {
        return this.#file.basename;
    }

    get extension(): string {
        return this.#file.extension;
    }

    get path(): string {
        return this.#file.path;
    }

    get createdDate(): Date {
        return new Date(this.#file.stat.ctime * 1000);
    }

    get lastModifiedDate(): Date {
        return new Date(this.#file.stat.mtime * 1000);
    }

    get parent(): FolderInfo {
        if (this.#file.parent == null) {
            throw new Error(`File pointer for '${this.#file.path}' has no parent.`);
        }

        return new FolderInfo(this.#file.parent, this.#vault);
    }

    async copy(to: string): Promise<FileInfo> {
        const newFile = await this.#vault.copy(this.#file, to);

        return new FileInfo(newFile, this.#vault);
    }

    rename(newPath: string): Promise<void> {
        return this.#vault.rename(this.#file, newPath);
    }

    read(): Promise<string> {
        return this.#vault.read(this.#file);
    }

    readBinary(): Promise<ArrayBuffer> {
        return this.#vault.readBinary(this.#file);
    }

    update(data: string): Promise<void> {
        return this.#vault.modify(this.#file, data);
    }
    
    updateBinary(data: ArrayBuffer): Promise<void> {
        return this.#vault.modifyBinary(this.#file, data);
    }

    append(data: string): Promise<void> {
        return this.#vault.append(this.#file, data);
    }

    delete(sendToTrash: boolean): Promise<void> {
        if (sendToTrash) {
            return this.#vault.trash(this.#file, true);
        } else {
            return this.#vault.delete(this.#file);
        }
    }
}
