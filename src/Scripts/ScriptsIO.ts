import { App, FileSystemAdapter, ListedFiles } from 'obsidian';

export default class ScriptsIO {
    #app:App;

    constructor(app: App) {
        this.#app = app;
    }

    get ScriptsPath(): string|null {
        if(this.#app.vault.adapter instanceof FileSystemAdapter){
            
            return this.#app.vault.adapter.getFullPath(".obsidian\\scripts");
        }else{
            return null;
        }
    }

    async listFiles(): Promise<string[]> {
        const dir: ListedFiles = await this.#app.vault.adapter.list(".obsidian\\scripts");

        return dir.files
            .filter(x => x.endsWith(".js"))
            .map(x => x.split('\\').pop()?.split('/').pop() || x);
    }

    readScriptFile(fileName:string):Promise<string>{
        return this.#app.vault.adapter.read(`.obsidian\\scripts\\${fileName}`)
    }
}
