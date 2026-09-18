<script lang="ts">
    import { app, THEMES } from '$lib/state.svelte';
    import { User, Plus } from 'lucide-svelte';
    import { fade, scale } from 'svelte/transition';
    import { goto } from '$app/navigation';

    let showProfileForm = $state(false);
    let profileForm = $state({ name: '', theme: 'rose', monthly_cost: 24 });

    async function handleSave() {
        if (!profileForm.name.trim()) return alert("Enter a name!");
        await app.saveProfile(profileForm);
        showProfileForm = false;
        goto('/dashboard');
    }

    function selectProfile(profile: any) {
        app.activeProfile = profile;
        localStorage.setItem('kinoActiveProfileId', profile.id);
        app.fetchMovies();
        goto('/dashboard');
    }
</script>

<div class="flex flex-col items-center justify-center min-h-screen p-6" in:fade>

    {#if app.isProfilesLoading}
        <p class="text-slate-400 font-bold animate-pulse">Loading profiles...</p>

        <!-- Declaratively check if the database is empty or the user clicked "Add New" -->
    {:else if app.profiles.length === 0 || showProfileForm}
        <div class="w-full max-w-sm bg-white/70 backdrop-blur-md rounded-[2rem] p-6 shadow-xl" in:scale={{start: 0.95}}>
            <h2 class="text-xl font-bold text-slate-700 mb-4">{app.profiles.length > 0 ? 'Add New Profile' : 'Create Your Profile'}</h2>

            <div class="space-y-4">
                <div>
                    <label for="profileName" class="block text-xs font-bold text-slate-500 mb-1">Name</label>
                    <input id="profileName" type="text" bind:value={profileForm.name} class="w-full p-3 rounded-xl bg-slate-50 border-none outline-none text-slate-700 focus:ring-2 {app.theme.ring}" placeholder="e.g. Tony Chopper" />
                </div>
                <div>
                    <p class="block text-xs font-bold text-slate-500 mb-2">Theme Color</p>
                    <div class="flex gap-2">
                        {#each Object.entries(THEMES) as [key, themeData]}
                            <button
                                    aria-label={`Select ${themeData.name} theme`}
                                    onclick={() => profileForm.theme = key}
                                    class="w-10 h-10 rounded-full {themeData.bgPrimary} shadow-sm transition-transform {profileForm.theme === key ? 'scale-110 ring-4 ring-offset-2 ' + themeData.ring : 'hover:scale-105'}"
                            ></button>
                        {/each}
                    </div>
                </div>
                <div>
                    <label for="profileCost" class="block text-xs font-bold text-slate-500 mb-1">Monthly Abo Cost (€)</label>
                    <input id="profileCost" type="number" bind:value={profileForm.monthly_cost} class="w-full p-3 rounded-xl bg-slate-50 border-none outline-none text-slate-700 focus:ring-2 {app.theme.ring}" />
                </div>

                <div class="pt-2 flex gap-3">
                    {#if app.profiles.length > 0}
                        <button aria-label="Cancel profile creation" onclick={() => showProfileForm = false} class="flex-1 bg-slate-100 text-slate-600 font-bold py-4 rounded-xl hover:bg-slate-200 transition-colors">
                            Cancel
                        </button>
                    {/if}
                    <button aria-label="Save profile" onclick={handleSave} class="flex-[2] {profileForm.theme === 'rose' ? 'bg-rose-400' : profileForm.theme === 'sky' ? 'bg-sky-400' : profileForm.theme === 'emerald' ? 'bg-emerald-400' : 'bg-violet-400'} text-white font-bold py-4 rounded-xl shadow-md transition-colors">
                        Save Profile
                    </button>
                </div>
            </div>
        </div>

        <!-- Show existing profiles if they exist and the form is not open -->
    {:else}
        <h1 class="text-3xl font-bold text-slate-700 mb-8">Who's watching?</h1>
        <div class="grid grid-cols-2 gap-4 w-full max-w-sm mb-8">
            {#each app.profiles as profile}
                <button
                        aria-label={`Select profile ${profile.name}`}
                        onclick={() => selectProfile(profile)}
                        class="bg-white/60 backdrop-blur-md p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-3 border-2 border-transparent hover:{THEMES[profile.theme].border}"
                >
                    <div class="w-16 h-16 rounded-full {THEMES[profile.theme].bgElement} {THEMES[profile.theme].textPrimary} flex items-center justify-center">
                        <User class="w-8 h-8"/>
                    </div>
                    <span class="font-bold text-slate-700">{profile.name}</span>
                </button>
            {/each}

            <button
                    aria-label="Add new profile"
                    onclick={() => showProfileForm = true}
                    class="bg-white/40 backdrop-blur-md p-6 rounded-[2rem] shadow-sm hover:bg-white/60 transition-all flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-200 hover:border-slate-300 text-slate-400 hover:text-slate-500"
            >
                <Plus class="w-8 h-8"/>
                <span class="font-bold text-sm">Add New</span>
            </button>
        </div>
    {/if}
</div>