import { App } from "obsidian";
import * as Iconize from "./IconizeConnector"

export default class Connectors{
	#plugins:Record<string, object>;

    constructor(app:App){
		this.#plugins = {};

        const connector = Iconize.getConnector(app);
		if(connector){
			this.#plugins["obsidian-icon-folder"] = connector;
		}
    }

	get keys():string[]{
		return Object.keys(this.#plugins);
	}

	contains(pluginId:string):boolean{
		return Object.hasOwn(this.#plugins, pluginId);
	}

	get(pluginId:string):object{
		if(Object.hasOwn(this.#plugins, pluginId)){
			return this.#plugins[pluginId];
		}

		throw `No plugin was found with the id '${pluginId}'.`;
	}
}
