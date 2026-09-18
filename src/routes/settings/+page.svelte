<script lang="ts">
    import { app, THEMES } from '$lib/state.svelte';
    import { Settings, User, Palette, LogOut, CheckCircle2 } from 'lucide-svelte';
    import { fade, scale } from 'svelte/transition';

    // Clone the active profile into the form
    let profileForm = $state(app.activeProfile ? { ...app.activeProfile } : { name: '', theme: 'rose', monthly_cost: 24 });
    let showConfirmModal = $state(false);
    let pendingTheme = $state<string | null>(null);

    function promptThemeChange(themeKey: string) {
        if (profileForm.theme === themeKey) return; // Do nothing if it's already selected
        pendingTheme = themeKey;
        showConfirmModal = true;
    }

    async function confirmThemeChange() {
        if (pendingTheme) {
            profileForm.theme = pendingTheme;
            await app.saveProfile(profileForm);
        }
        showConfirmModal = false;
        pendingTheme = null;
    }

    async function handleUpdate() {
        await app.saveProfile(profileForm);
        alert("Settings Updated!");
    }
</script>

<div in:fade={{ duration: 200, delay: 100 }} class="space-y-6 pt-6 px-4 pb-28 max-w-md mx-auto">
    <div class="bg-white/70 backdrop-blur-md rounded-[2rem] p-6 shadow-lg border border-white/50">
        <h1 class="text-2xl font-bold {app.theme.textPrimary} mb-6 flex items-center gap-2"><Settings class="w-6 h-6"/> Settings</h1>

        <div class="space-y-6">
            <!-- Profile Banner -->
            <div class="flex items-center justify-between p-4 bg-white/50 rounded-2xl border {app.theme.border}">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-full {app.theme.bgElement} {app.theme.textPrimary} flex items-center justify-center"><User class="w-6 h-6"/></div>
                    <div>
                        <p class="font-bold text-slate-700">{app.activeProfile?.name}</p>
                        <p class="text-xs text-slate-400">Active Profile</p>
                    </div>
                </div>
                <button aria-label="Sign out" onclick={() => app.switchProfile()} class="p-2 text-slate-400 hover:text-slate-700 transition-colors bg-white rounded-full shadow-sm">
                    <LogOut class="w-4 h-4" />
                </button>
            </div>

            <!-- Theme Changer -->
            <div>
                <p class="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1"><Palette class="w-4 h-4"/> Color Theme</p>
                <div class="flex gap-3 mt-3">
                    {#each Object.entries(THEMES) as [key, themeData]}
                        <button
                                aria-label={`Switch to ${themeData.name} theme`}
                                onclick={() => promptThemeChange(key)}
                                class="w-10 h-10 rounded-full {themeData.bgPrimary} shadow-sm transition-transform {profileForm.theme === key ? 'scale-110 ring-4 ring-offset-2 ' + themeData.ring : 'hover:scale-105'}"
                        ></button>
                    {/each}
                </div>
            </div>

            <!-- Cost Updater -->
            <div>
                <label for="updateCost" class="block text-sm font-bold text-slate-700 mb-2">Monthly Subscription Cost (€)</label>
                <input id="updateCost" type="number" bind:value={profileForm.monthly_cost} class="w-full px-4 py-3 rounded-2xl {app.theme.bgApp} border-none outline-none text-slate-700 shadow-inner focus:ring-2 {app.theme.ring}" />
            </div>

            <button aria-label="Update Settings" onclick={handleUpdate} class="w-full {app.theme.bgPrimary} text-white font-bold py-4 rounded-2xl shadow-md transition-colors">
                Update Subscription Rate
            </button>
        </div>
    </div>
</div>

<!-- THEME CHANGE CONFIRMATION MODAL -->
{#if showConfirmModal}
    <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center px-4" transition:fade>
        <div class="bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-2xl text-center" in:scale={{ duration: 200, start: 0.95 }}>
            <div class="w-16 h-16 {app.theme.bgElement} {app.theme.textPrimary} rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 class="w-8 h-8" />
            </div>
            <h2 class="text-xl font-bold text-slate-700 mb-2">Change Theme?</h2>
            <p class="text-sm text-slate-500 mb-6">Do you want to switch your active profile's color theme to <strong>{pendingTheme ? THEMES[pendingTheme].name : ''}</strong>?</p>

            <div class="flex gap-3">
                <button onclick={() => { showConfirmModal = false; pendingTheme = null; }} class="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                <button onclick={confirmThemeChange} class="flex-1 {app.theme.bgPrimary} text-white font-bold py-3 rounded-xl shadow-md transition-colors">Confirm</button>
            </div>
        </div>
    </div>
{/if}