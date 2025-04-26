import { App, FrontMatterCache, TFile, FrontmatterValue, MetadataTypeManager, TypeWidget } from "obsidian";

export default class FrontmatterInfo implements Iterable<[string, FrontmatterValue]> {
	#app: App;
	#file: TFile;
	#fontmatter: Record<string, FrontmatterValue>;
	#typeManager: MetadataTypeManager;

	constructor(app: App, file: TFile, fontmatterCache: FrontMatterCache, typeManager: MetadataTypeManager) {
		this.#app = app;
		this.#file = file;
		this.#typeManager = typeManager;
		this.#fontmatter = {};

		for (const [name, value] of Object.entries(fontmatterCache)) {
			this.#fontmatter[name] = value;
		}
	}

	#getTypeWidget(name: string): TypeWidget | null {
		if (Object.hasOwn(this.#typeManager.properties, name)) {
			const property = this.#typeManager.properties[name];

			if (Object.hasOwn(this.#typeManager.registeredTypeWidgets, property.type)) {
				return this.#typeManager.registeredTypeWidgets[property.type];
			}
		}

		return null;
	}

	*validate(): Generator<[string, boolean | null]> {
		for (const [name, value] of this) {
			const typeWidget = this.#getTypeWidget(name);
			if (typeWidget) {
				yield [name, typeWidget.validate(value)];
			} else {
				yield [name, null];
			}
		}
	}

	*[Symbol.iterator](): Generator<[string, FrontmatterValue]> {
		for (const item of Object.entries(this.#fontmatter)) {
			yield item;
		}
	}

	contains(key: string): boolean {
		return this.#fontmatter[key] !== undefined;
	}

	get(key: string): FrontmatterValue {
		if (this.contains(key)) {
			return this.#fontmatter[key]
		}

		throw "The specified Key was not found."
	}

	set(key: string, value: FrontmatterValue): void {
		this.#fontmatter[key] = value;
	}

	apply(): Promise<void> {
		return this.#app.fileManager.processFrontMatter(this.#file, (frontmatter) => {
			Object.entries(frontmatter).filter(x => {
				const [name] = x;
				return !this.contains(name);
			}).forEach(x => {
				const [name] = x;
				delete frontmatter[name];
			});

			for (const [name, value] of this) {
				frontmatter[name] = value;
			}
		});
	}
}
