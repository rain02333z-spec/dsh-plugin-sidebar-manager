import { Remote, TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";
//#region lib/types/protection.js
/** Module specifier of this manager, which cannot safely mutate itself. */
const PLUGIN_MANAGER_MODULE = "dsh-plugin-sidebar-manager";
/**
* Whether a module is read-only in the runtime manager.
* Official DSH and Cordis modules are system infrastructure; only user-added
* packages may be changed through the browser-facing Remote.
* @param moduleName - Exact Loader module specifier.
* @returns True when the module must not be changed.
*/
function isProtectedModule(moduleName) {
	return moduleName === PLUGIN_MANAGER_MODULE || moduleName.startsWith("@deepseek-ai/") || moduleName.startsWith("cordis:");
}
//#endregion
//#region lib/types/index.js
var __runInitializers = function(thisArg, initializers, value) {
	var useValue = arguments.length > 2;
	for (var i = 0; i < initializers.length; i++) value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
	return useValue ? value : void 0;
};
var __esDecorate = function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
	function accept(f) {
		if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected");
		return f;
	}
	var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
	var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
	var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
	var _, done = false;
	for (var i = decorators.length - 1; i >= 0; i--) {
		var context = {};
		for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
		for (var p in contextIn.access) context.access[p] = contextIn.access[p];
		context.addInitializer = function(f) {
			if (done) throw new TypeError("Cannot add initializers after decoration has completed");
			extraInitializers.push(accept(f || null));
		};
		var result = (0, decorators[i])(kind === "accessor" ? {
			get: descriptor.get,
			set: descriptor.set
		} : descriptor[key], context);
		if (kind === "accessor") {
			if (result === void 0) continue;
			if (result === null || typeof result !== "object") throw new TypeError("Object expected");
			if (_ = accept(result.get)) descriptor.get = _;
			if (_ = accept(result.set)) descriptor.set = _;
			if (_ = accept(result.init)) initializers.unshift(_);
		} else if (_ = accept(result)) if (kind === "field") initializers.unshift(_);
		else descriptor[key] = _;
	}
	if (target) Object.defineProperty(target, contextIn.name, descriptor);
	done = true;
};
/** Trusted Host Remote that toggles already-configured Loader entries. */
let PluginManagerGateway = (() => {
	let _classSuper = TypertRemoteService;
	let _instanceExtraInitializers = [];
	let _setEnabled_decorators;
	return class PluginManagerGateway extends _classSuper {
		static {
			const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
			_setEnabled_decorators = [Remote("setEnabled")];
			__esDecorate(this, null, _setEnabled_decorators, {
				kind: "method",
				name: "setEnabled",
				static: false,
				private: false,
				access: {
					has: (obj) => "setEnabled" in obj,
					get: (obj) => obj.setEnabled
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			if (_metadata) Object.defineProperty(this, Symbol.metadata, {
				enumerable: true,
				configurable: true,
				writable: true,
				value: _metadata
			});
		}
		static inject = ["loader"];
		constructor(ctx) {
			super(ctx, "pluginManager");
			__runInitializers(this, _instanceExtraInitializers);
		}
		/**
		* Apply a runtime enablement transition without writing the profile patch.
		* A restart restores the configured value from cordis.patch.yml.
		* @param request - entry identity and desired enablement.
		* @returns whether the requested transition completed.
		*/
		async setEnabled(request) {
			const entry = this.resolveEntry(request.entryId);
			if (entry === void 0) return {
				ok: false,
				message: "plugin entry not found: " + request.entryId
			};
			if (entry.options.group) return {
				ok: false,
				message: "plugin groups cannot be changed"
			};
			if (isProtectedModule(entry.options.name)) return {
				ok: false,
				message: "protected plugin cannot be changed: " + entry.options.name
			};
			const desiredDisabled = !request.enabled;
			if (request.enabled && !entry.disabled) return { ok: true };
			if (desiredDisabled && entry.options.disabled === true) return { ok: true };
			const previousDisabled = entry.options.disabled;
			try {
				await entry.update({ disabled: desiredDisabled });
				if (entry.disabled !== desiredDisabled) {
					await entry.update({ disabled: previousDisabled ?? null });
					return {
						ok: false,
						message: "plugin effective state is controlled by an ancestor group"
					};
				}
			} catch (error) {
				return {
					ok: false,
					message: error instanceof Error ? error.message : String(error)
				};
			}
			return { ok: true };
		}
		/** Resolve a public Loader-tree id while tolerating a concurrent removal. */
		resolveEntry(entryId) {
			try {
				return this.ctx.loader.resolve(entryId);
			} catch {
				return;
			}
		}
	};
})();
//#endregion
export { PluginManagerGateway, PluginManagerGateway as default };
