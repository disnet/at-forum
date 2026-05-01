<script lang="ts">
	let { form } = $props();
</script>

<h1>Sign in with Bluesky</h1>
<form method="POST">
	<label>
		Handle or DID
		<input
			name="handle"
			required
			autocomplete="username"
			placeholder="alice.bsky.social"
		/>
	</label>
	<button type="submit">Continue</button>
</form>
{#if form?.error}
	<p style="color: crimson">{form.error}</p>
{/if}
