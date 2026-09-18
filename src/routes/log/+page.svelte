<script lang="ts">
    import { supabase } from '$lib/supabase';
    import { PUBLIC_TMDB_TOKEN } from '$env/static/public';
    import { app } from '$lib/state.svelte';
    import { Search, Ticket, Sparkles, Plus, Calendar, PopcornIcon, X } from 'lucide-svelte';
    import { fade, slide } from 'svelte/transition';
    import { goto } from '$app/navigation';

    let searchQuery = $state('');
    let searchResults = $state<any[]>([]);
    let isSaving = $state(false);

    let selectedMovieForLog = $state<any>(null);
    let logDate = $state(new Date().toISOString().split('T')[0]);
    let logTicketPrice = $state(10.50);
    let logSnacksPrice = $state(0.00);

    async function searchMovies() {
        if (searchQuery.trim() === '') { searchResults = []; return; }
        const res = await fetch(`https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(searchQuery)}&language=en-US&page=1`, {
            headers: { Authorization: `Bearer ${PUBLIC_TMDB_TOKEN}`, accept: 'application/json' }
        });
        const data = await res.json();
        searchResults = data.results.slice(0, 4);
    }

    function openLogModal(tmdbMovie: any) {
        selectedMovieForLog = tmdbMovie;
        logDate = new Date().toISOString().split('T')[0];
        logTicketPrice = 10.50;
        logSnacksPrice = 0.00;
    }

    async function saveMovie() {
        if (isSaving || !selectedMovieForLog || !app.activeProfile) return;
        isSaving = true;
        try {
            const detailRes = await fetch(`https://api.themoviedb.org/3/movie/${selectedMovieForLog.id}?language=en-US`, {
                headers: { Authorization: `Bearer ${PUBLIC_TMDB_TOKEN}`, accept: 'application/json' }
            });
            const detailData = await detailRes.json();

            const newMovie = {
                profile_id: app.activeProfile.id,
                title: selectedMovieForLog.title,
                release_year: selectedMovieForLog.release_date ? parseInt(selectedMovieForLog.release_date.substring(0, 4)) : null,
                runtime: detailData.runtime || null,
                poster_path: selectedMovieForLog.poster_path ? `https://image.tmdb.org/t/p/w500${selectedMovieForLog.poster_path}` : null,
                ticket_price: logTicketPrice,
                snacks_cost: logSnacksPrice,
                watched_at: new Date(logDate).toISOString()
            };

            const { data, error } = await supabase.from('movies').insert(newMovie).select().single();
            if (error) throw error;

            app.movies = [data, ...app.movies];
            goto('/dashboard');
        } catch (err: any) {
            alert(`Error saving movie: ${err.message}`);
        } finally {
            isSaving = false;
        }
    }
</script>

<div in:fade={{ duration: 200, delay: 100 }} class="space-y-6 pt-6 px-4 pb-28 max-w-md mx-auto">
    <div class="bg-white/70 backdrop-blur-md rounded-[2rem] p-6 shadow-lg border border-white/50 text-center">
        <h1 class="text-2xl font-bold {app.theme.textPrimary} mb-2">Find a Movie</h1>
        <div class="relative">
            <Search class="w-5 h-5 absolute left-4 top-3.5 text-slate-300" />
            <label for="searchInput" class="sr-only">Search movies</label>
            <input id="searchInput" type="text" bind:value={searchQuery} oninput={searchMovies} placeholder="Search TMDB..." class="w-full pl-11 pr-4 py-3 rounded-full {app.theme.bgApp} border-none outline-none text-slate-700 shadow-inner focus:ring-2 {app.theme.ring} transition-all placeholder:text-slate-400" />
        </div>
    </div>

    {#if searchResults.length > 0}
        <div class="space-y-3">
            {#each searchResults as movie (movie.id)}
                <button aria-label={`Log ${movie.title}`} onclick={() => openLogModal(movie)} class="w-full text-left bg-white/60 backdrop-blur-md rounded-[1.5rem] p-3 shadow-sm hover:shadow-md hover:bg-white/80 transition-all flex gap-4 items-center border border-white/50">
                    {#if movie.poster_path}
                        <img src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`} alt={movie.title} class="w-12 h-16 object-cover rounded-lg shadow-sm" />
                    {:else}
                        <div class="w-12 h-16 {app.theme.bgElement} rounded-lg flex items-center justify-center {app.theme.textLight}"><Ticket class="w-5 h-5" /></div>
                    {/if}
                    <div class="flex-1">
                        <h2 class="font-bold text-slate-700 text-sm line-clamp-1">{movie.title}</h2>
                        <p class="text-xs text-slate-400">{movie.release_date?.substring(0,4) || ''}</p>
                    </div>
                    <div class="{app.theme.bgPrimary} text-white p-2 rounded-full shadow-md shrink-0"><Plus class="w-4 h-4" /></div>
                </button>
            {/each}
        </div>
    {/if}
</div>

{#if selectedMovieForLog}
    <!-- Added z-[60] to sit above the z-50 navigation bar -->
    <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-end justify-center sm:items-center sm:p-4" transition:fade>
        <!-- Added pb-10 for extra padding at the bottom of the screen -->
        <div class="bg-white rounded-t-[2rem] sm:rounded-[2rem] w-full max-w-md p-6 pb-10 sm:pb-6 shadow-2xl" in:slide={{ duration: 300, axis: 'y' }}>
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h2 class="text-xl font-bold text-slate-700 line-clamp-1">{selectedMovieForLog.title}</h2>
                    <p class="text-sm text-slate-400">Log your ticket details</p>
                </div>
                <button aria-label="Close modal" onclick={() => selectedMovieForLog = null} class="bg-slate-100 p-2 rounded-full text-slate-500 hover:bg-slate-200"><X class="w-4 h-4"/></button>
            </div>

            <div class="space-y-4 mb-6">
                <div>
                    <label for="logDate" class="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><Calendar class="w-3 h-3"/> Date Watched</label>
                    <input id="logDate" type="date" bind:value={logDate} class="w-full p-3 rounded-xl bg-slate-50 border-none outline-none text-slate-700 shadow-inner focus:ring-2 {app.theme.ring}" />
                </div>
                <div class="flex gap-4">
                    <div class="flex-1">
                        <label for="logTicket" class="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><Ticket class="w-3 h-3"/> Ticket Cost</label>
                        <div class="relative">
                            <span class="absolute left-3 top-3 text-slate-400 font-bold">€</span>
                            <input id="logTicket" type="number" step="0.50" bind:value={logTicketPrice} class="w-full pl-8 pr-3 py-3 rounded-xl bg-slate-50 border-none outline-none text-slate-700 shadow-inner focus:ring-2 {app.theme.ring}" />
                        </div>
                    </div>
                    <div class="flex-1">
                        <label for="logSnacks" class="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><PopcornIcon class="w-3 h-3"/> Snacks</label>
                        <div class="relative">
                            <span class="absolute left-3 top-3 text-slate-400 font-bold">€</span>
                            <input id="logSnacks" type="number" step="0.50" bind:value={logSnacksPrice} class="w-full pl-8 pr-3 py-3 rounded-xl bg-slate-50 border-none outline-none text-slate-700 shadow-inner focus:ring-2 {app.theme.ring}" />
                        </div>
                    </div>
                </div>
            </div>

            <button onclick={saveMovie} disabled={isSaving} class="w-full {app.theme.bgPrimary} text-white font-bold py-4 rounded-2xl shadow-md transition-colors disabled:opacity-50 flex justify-center gap-2">
                {#if isSaving} Saving... {:else} <Sparkles class="w-5 h-5"/> Save to Tracker {/if}
            </button>
        </div>
    </div>
{/if}