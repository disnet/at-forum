import type {
	NodeSavedSession,
	NodeSavedSessionStore,
	NodeSavedState,
	NodeSavedStateStore
} from '@atproto/oauth-client-node';

// TODO: persistent store — sessions are lost on restart and don't sync across processes.
// For production, replace with a Redis/SQLite-backed implementation of these interfaces.
class MemoryStore<V extends NonNullable<unknown>> {
	#data = new Map<string, V>();

	async get(key: string): Promise<V | undefined> {
		return this.#data.get(key);
	}

	async set(key: string, value: V): Promise<void> {
		this.#data.set(key, value);
	}

	async del(key: string): Promise<void> {
		this.#data.delete(key);
	}
}

export const stateStore: NodeSavedStateStore = new MemoryStore<NodeSavedState>();
export const sessionStore: NodeSavedSessionStore = new MemoryStore<NodeSavedSession>();
