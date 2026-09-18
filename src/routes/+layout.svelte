<script lang="ts">
	import '../app.css';
	let { children } = $props();
	import { app } from '$lib/state.svelte';
	import { onMount } from 'svelte';
	import { Home, List, Plus, Settings } from 'lucide-svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	let currentPath = $derived($page.url.pathname);

	onMount(() => {
		app.init();
		import('virtual:pwa-register').then(({ registerSW }) => {
			registerSW({ immediate: true });
		});
	});

	// Strict Route Protection
	$effect(() => {
		// Do not enforce routing until the database fetch completes
		if (app.isProfilesLoading) return;

		if (!app.activeProfile && currentPath !== '/') {
			goto('/'); // Force unauthorized users back to selection screen
		} else if (app.activeProfile && currentPath === '/') {
			goto('/dashboard'); // Auto-route logged-in users to the app
		}
	});
</script>

<div class="min-h-screen {app.theme.bgApp} text-slate-800 font-sans transition-colors duration-500 overflow-x-hidden">

	<main class="max-w-md mx-auto relative min-h-screen">
		<!-- Wait for data before rendering children -->
		{#if app.isProfilesLoading}
			<div class="flex items-center justify-center min-h-screen">
				<p class="text-slate-400 font-bold animate-pulse">Loading profiles...</p>
			</div>
		{:else}
			{@render children()}
		{/if}
	</main>

	{#if app.activeProfile && currentPath !== '/' && !app.isProfilesLoading}
		<div class="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-white/80 backdrop-blur-xl rounded-full p-2 flex justify-between shadow-xl border border-white z-50">
			<a href="/dashboard" aria-label="Dashboard Tab" class="flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-full transition-all {currentPath === '/dashboard' ? app.theme.textPrimary : 'text-slate-400 hover:text-slate-600'}">
				<Home class="w-5 h-5" /> <span class="text-[10px] font-bold">Dash</span>
			</a>
			<a href="/tickets" aria-label="Tickets Tab" class="flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-full transition-all {currentPath === '/tickets' ? app.theme.textPrimary : 'text-slate-400 hover:text-slate-600'}">
				<List class="w-5 h-5" /> <span class="text-[10px] font-bold">Tickets</span>
			</a>
			<a href="/log" aria-label="Add Movie Tab" class="flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-full transition-all {currentPath === '/log' ? app.theme.textPrimary : 'text-slate-400 hover:text-slate-600'}">
				<Plus class="w-5 h-5" /> <span class="text-[10px] font-bold">Log</span>
			</a>
			<a href="/settings" aria-label="Settings Tab" class="flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-full transition-all {currentPath === '/settings' ? app.theme.textPrimary : 'text-slate-400 hover:text-slate-600'}">
				<Settings class="w-5 h-5" /> <span class="text-[10px] font-bold">Set</span>
			</a>
		</div>
	{/if}
</div>