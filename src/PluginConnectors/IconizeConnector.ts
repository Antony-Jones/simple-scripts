import { App } from "obsidian";
import FileInfo from "SimpleApi/FileInfo";
import FolderInfo from "SimpleApi/FolderInfo";

type IconizePlugin = {
	api: IconizeAPI;

	addIconColor(path: string, iconColor: string): void;
	getIconColor(path: string): string | undefined;
	removeIconColor(path: string): void;

	addFolderIcon(path: string, icon: string): void;
	removeFolderIcon(path: string): void;
	getIconNameFromPath(path: string): string | undefined;
}
interface CreateOptions {
	container?: HTMLElement;
	color?: string;
}
interface RemoveOptions {
	container?: HTMLElement;
}
type dom = {
	createIconNode(plugin: IconizePlugin, path: string, iconName: string, options?: CreateOptions,): void;
	removeIconInPath(path: string, options?: RemoveOptions): void;
}
interface IconizeAPI {
	saveIconToIconPack(iconNameWithPrefix: string): void;
	util: {
		dom: dom;
	};
}

export function getConnector(app: App): IconizeConnector | undefined {
	const plugin = app.plugins.plugins["obsidian-icon-folder"] as unknown;

	if (plugin) {
		return new IconizeConnector(plugin as IconizePlugin);
	} else {
		return undefined;
	}
}

export type IconizeIcon = {
	name: string;
	color?: string | undefined;
}

export class IconizeConnector {
	#iconize: IconizePlugin;

	constructor(plugin: IconizePlugin) {
		this.#iconize = plugin;
	}

	getIcon(file: FileInfo): IconizeIcon;
	getIcon(folder: FolderInfo): IconizeIcon;
	getIcon(fileOrFolder: FileInfo | FolderInfo): IconizeIcon | undefined {
		const iconName = this.#iconize.getIconNameFromPath(fileOrFolder.path);
		if (iconName) {
			return {
				name: iconName,
				color: this.#iconize.getIconColor(fileOrFolder.path)
			}
		} else {
			return undefined;
		}
	}

	setIcon(file: FileInfo, iconName: string): void;
	setIcon(folder: FolderInfo, iconName: string): void;
	setIcon(file: FileInfo, icon: IconizeIcon): void;
	setIcon(folder: FolderInfo, icon: IconizeIcon): void;
	setIcon(fileOrFolder: FileInfo | FolderInfo, icon: string | IconizeIcon): void {

		if (typeof icon === 'object') {
			this.#iconize.api.saveIconToIconPack(icon.name);
			this.#iconize.api.util.dom.createIconNode(this.#iconize, fileOrFolder.path, icon.name, {color: icon.color});
			this.#iconize.addFolderIcon(fileOrFolder.path, icon.name);

			if (icon.color) {
				this.#iconize.addIconColor(fileOrFolder.path, icon.color);
			} else {
				this.#iconize.removeIconColor(fileOrFolder.path);
			}
		} else {
			this.#iconize.api.saveIconToIconPack(icon);
			this.#iconize.api.util.dom.createIconNode(this.#iconize, fileOrFolder.path, icon);
			this.#iconize.addFolderIcon(fileOrFolder.path, icon);
		}
	}

	removeIcon(file: FileInfo): void;
	removeIcon(folder: FolderInfo): void;
	removeIcon(fileOrFolder: FileInfo | FolderInfo): void {
		this.#iconize.removeFolderIcon(fileOrFolder.path);
		this.#iconize.api.util.dom.removeIconInPath(fileOrFolder.path);
	}
}
