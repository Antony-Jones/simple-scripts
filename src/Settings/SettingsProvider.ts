import { Plugin } from 'obsidian';

interface ISimpleScriptsSettings {
    scripts: string[]
}

const DEFAULT_SETTINGS: ISimpleScriptsSettings = {
    scripts: []
}

export default class SettingsProvider {
    #plugin:Plugin;
    #enabledScripts: ScriptList;
    #settings: ISimpleScriptsSettings = DEFAULT_SETTINGS;

    constructor(plugin: Plugin) {
        this.#plugin = plugin;
        this.#enabledScripts = new ScriptList(()=> this.#settings.scripts);
    }

    get enabledScripts(): ScriptList {
        return this.#enabledScripts;
    }

    async load(): Promise<void> {
        this.#settings = Object.assign({}, DEFAULT_SETTINGS, await this.#plugin.loadData());
    }

    async save(): Promise<void> {
        await this.#plugin.saveData(this.#settings);
    }
}

class ScriptList implements Iterable<string> {
    #scriptsGetter: () => string[]

    constructor(scriptsGetter: () => string[]) {
        this.#scriptsGetter = scriptsGetter;
    }

    contains(script: string): boolean {
        return this.#scriptsGetter().contains(script);
    }

    add(script: string): boolean {
        const scripts = this.#scriptsGetter();
        
        if (scripts.contains(script)) {
            return false;
        }
        else {
            scripts.push(script);
            return true;
        }
    }

    remove(script: string): boolean {
        const scripts = this.#scriptsGetter();

        if (scripts.contains(script)) {
            const index = scripts.indexOf(script);
            scripts.splice(index, 1);

            return true;
        }
        else {
            return false;
        }
    }

    *[Symbol.iterator](): Generator<string> {
        const scripts = this.#scriptsGetter();

        for (let i = 0; i < scripts.length; i++) {
            yield scripts[i];
        } 
    }
}
