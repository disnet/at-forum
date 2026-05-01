import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		// atproto OAuth loopback flow requires the literal 127.0.0.1 redirect URI;
		// default Vite resolution prefers ::1 which would mismatch the client_id.
		host: '127.0.0.1',
		port: 5173,
		strictPort: true
	}
});
