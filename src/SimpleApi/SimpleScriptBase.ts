import FileInfo from "./FileInfo";
import FolderInfo from "./FolderInfo";
import FrontmatterInfo from "./FrontmatterInfo";
import VaultInfo from "./VaultInfo";

export default abstract class SimpleScriptBase {
    readonly vault: VaultInfo;

    constructor(vault: VaultInfo) {
        this.vault = vault;
    }

    onLoad(): Promise<void> { return Promise.resolve() }
    onUnload(): Promise<void> { return Promise.resolve() }

    onFileCreated(file: FileInfo): void { }
    onFileModified(file: FileInfo): void { }
    onFileDeleted(file: FileInfo): void { }
    onFileRenamed(file: FileInfo, oldPath: string): void { }
    onFileOpened(file: FileInfo | null): void { }

    onFolderCreated(folder: FolderInfo): void { }
    onFolderDeleted(folder: FolderInfo): void { }
    onFolderRenamed(folder: FolderInfo, oldPath: string): void { }

    onFrontmatterModified(file: FileInfo, frontmatter: FrontmatterInfo): void { }
}
