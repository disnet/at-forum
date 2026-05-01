import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.agent || !locals.did) {
		return { profile: null };
	}
	try {
		const res = await locals.agent.getProfile({ actor: locals.did });
		return { profile: res.data };
	} catch {
		return { profile: null };
	}
};
