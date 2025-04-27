import "obsidian";

declare module "obsidian"{
	interface FrontmatterProperty { 
		name: string; 
		count: number; 
		type: string; 
	}
	
	export type FrontmatterValue = string | string[] | number | boolean | Date | object;
	
	interface TypeWidget {
		icon: string;
		type: string;
		name(): string;
		default(): FrontmatterValue;
		validate(value: FrontmatterValue): boolean;
	}
	
	interface MetadataTypeManager {
		properties: Record<string, FrontmatterProperty>;
		registeredTypeWidgets: Record<string, TypeWidget>;
	}
	
	interface App {
		metadataTypeManager: MetadataTypeManager;
		plugins: {
			plugins: Record<string, Plugin>;
		} 
	}
}
