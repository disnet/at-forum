// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Agent } from '@atproto/api';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			agent?: Agent;
			did?: string;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
