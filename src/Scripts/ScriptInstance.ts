import SimpleScriptBase from "SimpleApi/SimpleScriptBase"
import VaultInfo from "SimpleApi/VaultInfo";
import ScriptsIO from "./ScriptsIO";
import SimpleScriptsPlugin from "main";

export default class ScriptInstance{
	#fileName:string;
	#instance: SimpleScriptBase;
	#plugin:SimpleScriptsPlugin;
	#commandIds:string[] = [];

	private constructor(fileName:string, script: {new(vault:VaultInfo):SimpleScriptBase}, plugin: SimpleScriptsPlugin){
		this.#fileName = fileName;
		this.#instance = new script(new VaultInfo(plugin,this));
		this.#plugin = plugin;
	}

	static async create(fileName:string, plugin:SimpleScriptsPlugin, io:ScriptsIO){
		const scriptText = await io.readScriptFile(fileName);

		const innerThis = Object.create(null);
		const params = {
			"SimpleScriptBase": SimpleScriptBase,
			"global": Object.create(null),
			"globalThis": Object.create(null),
			"window": Object.create(null),
			"self": Object.create(null)
		}

		let context = Array.prototype.concat.call(innerThis, Object.keys(params), "return " + scriptText);
		const sandbox = new (Function.prototype.bind.apply(Function, context));

		context = Array.prototype.concat.call(innerThis, Object.values(params));

		const result = Function.prototype.bind.apply(sandbox, context)();

		if (result.prototype instanceof SimpleScriptBase) {
			return new this(fileName, result, plugin);
		} else {
			throw new Error("The script file is not a class, or does not extent SimpleScriptBase.")
		}

	}

	get instance(){
		return this.#instance;
	}

	#removeCommands(){
		let hasError = false;
		let errorMessage = "Failed to remove command(s) with the following Id(s): "

		for (const id of this.#commandIds) {
			try{
			this.#plugin.removeCommand(id);
			}catch(e){
				hasError = true;
				errorMessage += `\n  - ${id}: ${e.message}`
			}
		}

		if(hasError){
			this.#plugin.displayErrorNotice("Remove Commands", this.#fileName, errorMessage);
		}
	}

	async onUnload():Promise<void> {
		this.#removeCommands();

		await this.instance.onUnload()
	}

	async onLoad():Promise<void> {
		await this.#instance.onLoad();
	}

	addCommand(name:string, callback:(()=>void)|((checking:boolean)=>void), performCheck?: boolean):void{
		const id = `${this.#fileName}:${name}`.replace(/[^a-zA-Z0-9:]+/g,"-");
		const commandName = `${this.#fileName.substring(0,this.#fileName.lastIndexOf('.'))}: ${name}`
		
		if(performCheck){
			this.#plugin.addCommand({
				id:id,
				name:commandName,
				checkCallback: callback as ((checking:boolean)=>void)
			})
		}else{
			this.#plugin.addCommand({
				id:id,
				name:commandName,
				callback: callback as (()=>void)
			})
		}
		
		this.#commandIds.push(id);
	}
}
