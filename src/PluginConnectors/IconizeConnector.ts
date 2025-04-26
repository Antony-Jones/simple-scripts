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
// interface SetIconForNodeOptions {
// 	color?: string;
// 	shouldApplyAllStyles?: boolean;
// }
interface CreateOptions {
	container?: HTMLElement;
	color?: string;
}
interface RemoveOptions {
	container?: HTMLElement;
}
type dom = {
	// setIconForNode(plugin: IconizePlugin, iconName: string, node: HTMLElement, options?: SetIconForNodeOptions): void;
	createIconNode(plugin: IconizePlugin, path: string, iconName: string, options?: CreateOptions,): void;
	// doesElementHasIconNode(element: HTMLElement): boolean;
	// getIconFromElement(element: HTMLElement): string | undefined;
	// getIconNodeFromPath(path: string): HTMLElement | undefined;
	//removeIconInNode(el: HTMLElement): void;
	removeIconInPath(path: string, options?: RemoveOptions): void;
}
// type svg = {
// 	extract(svgString: string): string;
// 	colorize(svgString: string, fontSize: number): string;
// 	setFontSizecolorize(svgString: string, color: string | undefined | null): string;
// };
// interface Icon {
// 	name: string;
// 	prefix: string;
// 	displayName: string;
// 	iconPackName: string | null;
// 	filename: string;
// 	svgContent: string;
// 	svgViewbox: string;
// 	svgElement: string;
// }
// type IconPack = {
// 	delete(): Promise<void>;
// 	addIcon(iconName: string, iconContent: string): Icon | undefined;
// 	removeIcon(path: string, iconName: string): Promise<void>;
// 	getIcon(iconName: string): Icon | undefined;
// 	setIcons(icons: Icon[]): void;
// 	getName(): string;
// 	getPrefix(): string;
// 	getIcons(): Icon[];
// }
interface IconizeAPI {
	// getIconByName(iconNameWithPrefix: string): Icon | null;
	// setIconForNode(iconName: string, node: HTMLElement, color?: string): void;
	// doesElementHasIconNode: dom["doesElementHasIconNode"];
	// getIconFromElement: dom["getIconFromElement"];
	// removeIconInNode: dom["removeIconInNode"];
	// removeIconInPath: dom["removeIconInPath"];
	saveIconToIconPack(iconNameWithPrefix: string): void;
	// removeIconFromIconPack(iconNameWithPrefix: string): void;
	// getIconPacks(): IconPack[];
	util: {
		dom: dom;
		// svg: svg;
	};
	// version: {
	// 	current: string;
	// };
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
