<script lang="ts">
    import { app } from '$lib/state.svelte';
    import { TrendingUp, Sparkles, Film, Trash2, Popcorn as PopcornIcon, AlertCircle } from 'lucide-svelte';
    import { fade, slide, scale } from 'svelte/transition';

    let viewMode = $state<'monthly' | 'yearly' | 'all'>('all');
    let movieToDelete = $state<any>(null);

    // Animation State
    let chopperTransform = $state('translate(0px, 0px) scale(0.5) rotate(0deg)');
    let chopperOpacity = $state(0);
    let currentChopperImage = $state('/chopper_1.png');

    $effect(() => {
        const peekSpots = [
            { x: 0, y: -95, r: 0 }, { x: 70, y: -70, r: 45 }, { x: 95, y: 0, r: 90 }, { x: 70, y: 70, r: 135 },
            { x: 0, y: 95, r: 180 }, { x: -70, y: 70, r: 225 }, { x: -95, y: 0, r: -90 }, { x: -70, y: -70, r: -45 }
        ];
        const interval = setInterval(() => {
            const spot = peekSpots[Math.floor(Math.random() * peekSpots.length)];

            // Randomly pick chopper_1.png, chopper_2.png, or chopper_3.png
            const randomImgNum = Math.floor(Math.random() * 3) + 1;
            currentChopperImage = `/chopper_${randomImgNum}.png`;

            chopperOpacity = 0;
            chopperTransform = `translate(0px, 0px) scale(0.5) rotate(${spot.r}deg)`;
            setTimeout(() => {
                chopperOpacity = 1;
                chopperTransform = `translate(${spot.x}px, ${spot.y}px) scale(1) rotate(${spot.r}deg)`;
                setTimeout(() => {
                    chopperOpacity = 0;
                    chopperTransform = `translate(0px, 0px) scale(0.5) rotate(${spot.r}deg)`;
                }, 3000);
            }, 100);
        }, 5500);
        return () => clearInterval(interval);
    });

    let filteredMovies = $derived(
        app.movies.filter((m) => {
            const watchDate = new Date(m.watched_at);
            const now = new Date();
            if (viewMode === 'monthly') return watchDate.getMonth() === now.getMonth() && watchDate.getFullYear() === now.getFullYear();
            if (viewMode === 'yearly') return watchDate.getFullYear() === now.getFullYear();
            return true;
        })
    );

    let totalTicketValue = $derived(filteredMovies.reduce((sum, m) => sum + Number(m.ticket_price), 0));
    let totalSnacksValue = $derived(filteredMovies.reduce((sum, m) => sum + Number(m.snacks_cost || 0), 0));

    let targetCost = $derived((() => {
        if (!app.activeProfile) return 24;
        if (viewMode === 'monthly') return app.activeProfile.monthly_cost;
        if (viewMode === 'yearly') return app.activeProfile.monthly_cost * 12;
        if (app.movies.length === 0) return app.activeProfile.monthly_cost;
        const oldestDate = new Date(Math.min(...app.movies.map(m => new Date(m.watched_at).getTime())));
        const now = new Date();
        const monthsActive = Math.max(1, (now.getFullYear() - oldestDate.getFullYear()) * 12 + (now.getMonth() - oldestDate.getMonth()) + 1);
        return monthsActive * app.activeProfile.monthly_cost;
    })());

    let netSavings = $derived(totalTicketValue - targetCost);
    let progressPercentage = $derived(Math.min((totalTicketValue / targetCost) * 100, 100));

    async function confirmDelete() {
        if (!movieToDelete) return;
        await app.deleteMovie(movieToDelete.id);
        movieToDelete = null;
    }
</script>

<div in:fade={{ duration: 200, delay: 100 }} class="px-4 pt-4 space-y-6 pb-28">
    <!-- View Mode Toggles -->
    <div class="bg-white/60 backdrop-blur-md rounded-full p-1.5 shadow-sm flex relative border border-white/50 max-w-md mx-auto">
        {#each ['monthly', 'yearly', 'all'] as mode}
            <button aria-label={`View ${mode} stats`} onclick={() => viewMode = mode as any} class="flex-1 py-2 text-xs font-bold rounded-full transition-all duration-300 capitalize {viewMode === mode ? `bg-white ${app.theme.textPrimary} shadow-md` : 'text-slate-400 hover:text-slate-600'}">
                {mode.replace('-', ' ')}
            </button>
        {/each}
    </div>

    <!-- Big Tracker Card -->
    <div class="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-lg p-6 text-center overflow-hidden relative border border-white/50 max-w-md mx-auto">
        <div class="absolute top-0 left-0 w-full h-1.5 {app.theme.bgElement}"></div>

        <h1 class="text-xl font-bold text-slate-700 mb-1 flex justify-center items-center gap-2">
            <TrendingUp class="w-5 h-5 {app.theme.textPrimary}" /> Savings Tracker
        </h1>
        <p class="text-slate-400 text-sm mb-6 capitalize">{viewMode.replace('-', ' ')} Overview</p>

        <div class="relative w-40 h-40 mx-auto mb-6">
            <img src={currentChopperImage} alt="Chopper" class="absolute top-1/2 left-1/2 -mt-12 -ml-12 w-24 h-24 object-contain z-10 drop-shadow-md pointer-events-none transition-all duration-[1200ms] ease-in-out" style="transform: {chopperTransform}; opacity: {chopperOpacity};" />
            <div class="absolute inset-0 {app.theme.bgApp} rounded-full flex flex-col items-center justify-center border-4 border-white shadow-inner bg-opacity-95 backdrop-blur-sm z-20 transition-all duration-500">
                <span class="text-3xl font-extrabold {app.theme.textPrimary} transition-all">€{totalTicketValue.toFixed(2)}</span>
                <span class="text-[10px] text-slate-400 mt-1 font-bold tracking-wider transition-all">/ €{targetCost} TARGET</span>
            </div>
        </div>

        <div class="w-full {app.theme.bgElement} rounded-full h-3 mb-3 overflow-hidden shadow-inner relative z-30">
            <div class="bg-gradient-to-r {app.theme.gradient} h-3 rounded-full transition-all duration-1000 ease-out" style="width: {progressPercentage}%"></div>
        </div>

        {#if netSavings >= 0}
            <div class="inline-flex items-center gap-1.5 text-emerald-500 font-bold bg-emerald-50 px-4 py-1.5 rounded-full text-sm shadow-sm relative z-30">
                <Sparkles class="w-4 h-4" /> You saved €{netSavings.toFixed(2)}!
            </div>
        {:else}
            <p class="text-sm text-slate-400 font-semibold relative z-30">€{Math.abs(netSavings).toFixed(2)} left to break even!</p>
        {/if}

        {#if totalSnacksValue > 0}
            <p class="text-xs text-slate-400 mt-4 relative z-30 flex items-center justify-center gap-1">
                <PopcornIcon class="w-3 h-3"/> Extra spent on snacks: €{totalSnacksValue.toFixed(2)}
            </p>
        {/if}
    </div>

    <!-- Recently Added -->
    <div class="max-w-md mx-auto">
        <div class="flex justify-between items-end mb-3 px-1">
            <h2 class="text-lg font-bold text-slate-700">Recently Added</h2>
            <a href="/tickets" class="text-xs font-bold {app.theme.textPrimary} hover:{app.theme.textLight}">View All</a>
        </div>

        <div class="space-y-4">
            {#if app.isLoading}
                <p class="text-center text-slate-400 text-sm animate-pulse">Loading tickets...</p>
            {:else if filteredMovies.length === 0}
                <div class="text-center p-8 bg-white/40 rounded-3xl text-slate-400 text-sm border-2 border-dashed {app.theme.border}">
                    No movies logged yet.
                </div>
            {/if}

            {#each filteredMovies.slice(0, 3) as movie (movie.id)}
                <div class="bg-white/60 backdrop-blur-md rounded-[1.5rem] p-3 shadow-sm flex gap-4 items-center relative overflow-hidden border border-white/50 hover:shadow-md transition-shadow">
                    {#if movie.poster_path}
                        <img src={movie.poster_path} alt={movie.title} class="w-14 h-20 object-cover rounded-xl shadow-sm z-10" />
                    {:else}
                        <div class="w-14 h-20 {app.theme.bgElement} rounded-xl flex items-center justify-center {app.theme.textLight} z-10"><Film class="w-6 h-6" /></div>
                    {/if}

                    <div class="flex-1 z-10">
                        <h3 class="font-bold text-slate-700 line-clamp-1 pr-2">{movie.title}</h3>
                        <p class="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>{movie.release_year || 'N/A'}</span> • <span>{new Date(movie.watched_at).toLocaleDateString()}</span>
                        </p>
                    </div>

                    <div class="text-right z-10 flex flex-col items-end gap-2">
                        <div class="{app.theme.bgApp} {app.theme.textPrimary} font-bold px-2 py-1 rounded-lg text-sm shadow-sm">
                            €{Number(movie.ticket_price).toFixed(2)}
                        </div>
                        <button aria-label="Delete ticket" onclick={() => movieToDelete = movie} class="text-slate-300 hover:text-red-400 transition-colors p-1">
                            <Trash2 class="w-4 h-4" />
                        </button>
                    </div>
                </div>
            {/each}
        </div>
    </div>
</div>

<!-- DELETE MODAL -->
{#if movieToDelete}
    <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center px-4" transition:fade>
        <div class="bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-2xl text-center" in:scale={{ duration: 200, start: 0.95 }}>
            <div class="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle class="w-8 h-8" />
            </div>
            <h2 class="text-xl font-bold text-slate-700 mb-2">Delete Ticket?</h2>
            <p class="text-sm text-slate-500 mb-6">Are you sure you want to remove <strong>{movieToDelete.title}</strong> from your tracker? This action cannot be undone.</p>

            <div class="flex gap-3">
                <button onclick={() => movieToDelete = null} class="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                <button onclick={confirmDelete} class="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl shadow-md hover:bg-red-600 transition-colors">Delete</button>
            </div>
        </div>
    </div>
{/if}