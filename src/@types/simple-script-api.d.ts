declare module "simple-script" {
	abstract class SimpleScriptBase {
		readonly vault: VaultInfo;

		constructor(vault: VaultInfo);

		onLoad(): Promise<void>;
		onUnload(): Promise<void>;

		onFileCreated(file: FileInfo): void;
		onFileModified(file: FileInfo): void;
		onFileDeleted(file: FileInfo): void;
		onFileRenamed(file: FileInfo, oldPath: string): void;
		onFileOpened(file: FileInfo | null): void;
		onFolderCreated(folder: FolderInfo): void;
		onFolderDeleted(folder: FolderInfo): void;
		onFolderRenamed(folder: FolderInfo, oldPath: string): void;

		onFrontmatterModified(file: FileInfo, frontmatter: FrontmatterInfo): void;
	}

	interface FileInfo {
		get name(): string;
		get baseName(): string;
		get extension(): string;
		get path(): string;
		get createdDate(): Date;
		get lastModifiedDate(): Date;
		get parent(): FolderInfo;

		copy(to: string): Promise<FileInfo>;
		rename(newPath: string): Promise<void>;
		read(): Promise<string>;
		readBinary(): Promise<ArrayBuffer>;
		update(data: string): Promise<void>;
		updateBinary(data: ArrayBuffer): Promise<void>;
		append(data: string): Promise<void>;
		delete(sendToTrash: boolean): Promise<void>;

	}

	interface FolderInfo {
		get name(): string;
		get path(): string;
		get isRoot(): boolean;

		files(): Generator<FileInfo>;
		files(recursive: boolean): Generator<FileInfo>;
		folders(): Generator<FolderInfo>;
		folders(recursive: boolean): Generator<FolderInfo>;
		copy(to: string): Promise<FolderInfo>;
		rename(newPath: string): Promise<void>;
		delete(sendToTrash: true): Promise<void>;
		delete(sendToTrash: false, force?: boolean): Promise<void>;
	}

	export type FrontmatterValue = string | string[] | number | boolean | Date | object;
	interface FrontmatterInfo {
		validate(): Generator<[string, boolean | null]>;
		[Symbol.iterator](): Generator<[string, FrontmatterValue]>;
		contains(key: string): boolean;
		get(key: string): FrontmatterValue;
		set(key: string, value: FrontmatterValue): void;
		apply(): Promise<void>;
	}

	interface VaultInfo {
		get root(): FolderInfo;
		// get plugins(): Connectors;
		exists(path: string): Promise<boolean>;
		getFile(path: string): FileInfo;
		createFile(path: string, data: string): Promise<FileInfo>;
		createBinaryFile(path: string, data: ArrayBuffer): Promise<FileInfo>;
		getFolder(path: string): FolderInfo;
		createFolder(path: string): Promise<FolderInfo>;
		getFrontmatter(path: string): Promise<FrontmatterInfo | null>;
		getFrontmatter(file: FileInfo): Promise<FrontmatterInfo | null>;

		addCommand(name:string, callback:()=>void):void;
		addCommand(name:string, callback:()=>void, performCheck:false):void;
		addCommand(name:string, callback:(checking:boolean)=>void, performCheck:true):void;
	}

	// ----------------------------------- //
	//               Plugins               //
	// ----------------------------------- //
	export interface Connectors {
		keys(): Generator<string>;
		contains(id:string):boolean;
		get(id:string):unknown;
		get(id:"obsidian-icon-folder"):IconizeConnector
	}

	// Iconize
	export type IconizeIcon = {
		name: string;
		color?: string | undefined;
	}

	export type IconizeConnector = {
		getIcon(file: FileInfo): IconizeIcon;
		getIcon(folder: FolderInfo): IconizeIcon;

		setIcon(file: FileInfo, iconName: string): void;
		setIcon(folder: FolderInfo, iconName: string): void;
		setIcon(file: FileInfo, icon: IconizeIcon): void;
		setIcon(folder: FolderInfo, icon: IconizeIcon): void;

		removeIcon(file: FileInfo): void;
		removeIcon(folder: FolderInfo): void;
	}
}
