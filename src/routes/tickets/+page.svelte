<script lang="ts">
    import { app } from '$lib/state.svelte';
    import { Filter, Film, PopcornIcon, Trash2, TrendingUp, AlertCircle } from 'lucide-svelte';
    import { fade, slide, scale } from 'svelte/transition';

    let sortBy = $state<'recent' | 'alpha' | 'cost'>('recent');
    let movieToDelete = $state<any>(null);

    let sortedMovies = $derived([...app.movies].sort((a, b) => {
        if (sortBy === 'recent') return new Date(b.watched_at).getTime() - new Date(a.watched_at).getTime();
        if (sortBy === 'alpha') return a.title.localeCompare(b.title);
        if (sortBy === 'cost') return (Number(b.ticket_price) + Number(b.snacks_cost||0)) - (Number(a.ticket_price) + Number(a.snacks_cost||0));
        return 0;
    }));

    let groupedMovies = $derived(() => {
        const groups: Record<string, any[]> = {};
        sortedMovies.forEach(m => {
            const date = new Date(m.watched_at);
            const key = date.toLocaleString('default', { month: 'long', year: 'numeric' });
            if (!groups[key]) groups[key] = [];
            groups[key].push(m);
        });
        return groups;
    });

    // Totals for the mini-tracker
    let totalTicketValue = $derived(app.movies.reduce((sum, m) => sum + Number(m.ticket_price), 0));
    let targetCost = $derived((() => {
        if (!app.activeProfile) return 24;
        if (app.movies.length === 0) return app.activeProfile.monthly_cost;
        const oldestDate = new Date(Math.min(...app.movies.map(m => new Date(m.watched_at).getTime())));
        const now = new Date();
        const monthsActive = Math.max(1, (now.getFullYear() - oldestDate.getFullYear()) * 12 + (now.getMonth() - oldestDate.getMonth()) + 1);
        return monthsActive * app.activeProfile.monthly_cost;
    })());
    let netSavings = $derived(totalTicketValue - targetCost);

    async function confirmDelete() {
        if (!movieToDelete) return;
        await app.deleteMovie(movieToDelete.id);
        movieToDelete = null;
    }
</script>

<div in:fade={{ duration: 200, delay: 100 }} class="pb-28">
    <!-- Fixed Header -->
    <div class="fixed top-0 left-0 right-0 z-40 px-4 pt-4 {app.theme.bgApp} border-b border-white/50 shadow-sm">
        <div class="max-w-md mx-auto">
            <div class="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-sm mb-4 border border-white/50 p-4 flex items-center justify-between">
                <div class="flex items-center gap-3 w-full">
                    <div class="{app.theme.bgElement} p-2 rounded-xl {app.theme.textPrimary}"><TrendingUp class="w-5 h-5"/></div>
                    <div class="flex-1">
                        <h1 class="text-sm font-bold text-slate-700 capitalize leading-tight">All Savings</h1>
                        <p class="text-xs text-slate-400">€{totalTicketValue.toFixed(2)} / €{targetCost}</p>
                    </div>
                    <div class="text-right">
						<span class="text-lg font-extrabold {netSavings >= 0 ? 'text-emerald-500' : app.theme.textPrimary}">
							{netSavings >= 0 ? '+' : ''}€{netSavings.toFixed(2)}
						</span>
                    </div>
                </div>
            </div>

            <div class="flex justify-between items-center pb-4">
                <h2 class="text-lg font-bold text-slate-700 ml-1">Logged Tickets</h2>
                <div class="flex items-center gap-2 text-xs font-bold text-slate-500 bg-white/50 px-3 py-1.5 rounded-full backdrop-blur-md">
                    <Filter class="w-3 h-3" />
                    <label for="sortSelect" class="sr-only">Sort tickets</label>
                    <select id="sortSelect" bind:value={sortBy} class="bg-transparent outline-none cursor-pointer">
                        <option value="recent">Recent</option>
                        <option value="alpha">A-Z</option>
                        <option value="cost">Highest Cost</option>
                    </select>
                </div>
            </div>
        </div>
    </div>

    <!-- List -->
    <div class="pt-[160px] space-y-4 px-4 max-w-md mx-auto">
        {#if app.isLoading}
            <p class="text-center text-slate-400 text-sm animate-pulse">Loading tickets...</p>
        {:else if sortedMovies.length === 0}
            <div class="text-center p-8 bg-white/40 rounded-3xl text-slate-400 text-sm border-2 border-dashed {app.theme.border}">
                No movies found.
            </div>
        {/if}

        {#each Object.entries(groupedMovies()) as [monthYear, monthMovies]}
            {#if sortBy === 'recent'}
                <h3 class="text-xs font-bold text-slate-400 tracking-wider uppercase mt-6 ml-2">{monthYear}</h3>
            {/if}

            {#each monthMovies as movie (movie.id)}
                <div transition:slide|local={{ duration: 300 }} class="bg-white/60 backdrop-blur-md rounded-[1.5rem] p-3 shadow-sm flex gap-4 items-center relative overflow-hidden border border-white/50 hover:shadow-md transition-shadow">
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
                        {#if movie.snacks_cost > 0}
                            <p class="text-[10px] {app.theme.textPrimary} font-bold mt-1 flex items-center gap-1">
                                <PopcornIcon class="w-3 h-3"/> +€{Number(movie.snacks_cost).toFixed(2)} snacks
                            </p>
                        {/if}
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
        {/each}
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