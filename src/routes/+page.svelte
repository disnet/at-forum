<script lang="ts">
	let { data } = $props();
</script>

<h1>SvelteKit + atproto</h1>

{#if data.profile}
	<p>
		Signed in as <strong>{data.profile.handle}</strong>
		{#if data.profile.displayName}({data.profile.displayName}){/if}
	</p>
	<form method="POST" action="/logout">
		<button type="submit">Log out</button>
	</form>
{:else}
	<p>You are not signed in.</p>
	<p><a href="/login">Sign in with Bluesky</a></p>
{/if}
