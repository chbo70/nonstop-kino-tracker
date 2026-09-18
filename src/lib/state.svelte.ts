import { supabase } from '$lib/supabase';
import { browser } from '$app/environment';

export const THEMES: Record<string, any> = {
    rose: { name: 'Pink', bgApp: 'bg-rose-50', bgElement: 'bg-rose-100', textPrimary: 'text-rose-400', textLight: 'text-rose-300', bgPrimary: 'bg-rose-400', gradient: 'from-rose-300 to-rose-400', shadow: 'shadow-rose-500/15', border: 'border-rose-100', ring: 'focus:ring-rose-300' },
    sky: { name: 'Blue', bgApp: 'bg-sky-50', bgElement: 'bg-sky-100', textPrimary: 'text-sky-400', textLight: 'text-sky-300', bgPrimary: 'bg-sky-400', gradient: 'from-sky-300 to-sky-400', shadow: 'shadow-sky-500/15', border: 'border-sky-100', ring: 'focus:ring-sky-300' },
    emerald: { name: 'Green', bgApp: 'bg-emerald-50', bgElement: 'bg-emerald-100', textPrimary: 'text-emerald-400', textLight: 'text-emerald-300', bgPrimary: 'bg-emerald-400', gradient: 'from-emerald-300 to-emerald-400', shadow: 'shadow-emerald-500/15', border: 'border-emerald-100', ring: 'focus:ring-emerald-300' },
    violet: { name: 'Purple', bgApp: 'bg-violet-50', bgElement: 'bg-violet-100', textPrimary: 'text-violet-400', textLight: 'text-violet-300', bgPrimary: 'bg-violet-400', gradient: 'from-violet-300 to-violet-400', shadow: 'shadow-violet-500/15', border: 'border-violet-100', ring: 'focus:ring-violet-300' }
};

class AppState {
    profiles = $state<any[]>([]);
    activeProfile = $state<any | null>(null);
    movies = $state<any[]>([]);
    isLoading = $state(false);
    isProfilesLoading = $state(true);

    theme = $derived(this.activeProfile ? THEMES[this.activeProfile.theme] : THEMES.rose);

    async init() {
        if (!browser) return;

        // 1. Fetch profiles securely from the cloud
        const { data: fetchedProfiles, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: true });
        if (!error && fetchedProfiles) {
            this.profiles = fetchedProfiles;
        }
        this.isProfilesLoading = false;

        // 2. Restore session from local ID
        const savedActiveId = localStorage.getItem('kinoActiveProfileId');
        if (savedActiveId) {
            const found = this.profiles.find(p => p.id === savedActiveId);
            if (found) {
                this.activeProfile = found;
                this.fetchMovies();
            } else {
                localStorage.removeItem('kinoActiveProfileId');
            }
        }
    }

    switchProfile() {
        this.activeProfile = null;
        this.movies = [];
        if (browser) localStorage.removeItem('kinoActiveProfileId');
    }

    async saveProfile(profileForm: any) {
        // Prepare payload matching the exact SQL columns
        const payload = {
            name: profileForm.name,
            theme: profileForm.theme,
            monthly_cost: profileForm.monthly_cost
        };

        if (profileForm.id) Object.assign(payload, { id: profileForm.id });

        // Upsert (Update if ID exists, Insert if it's new)
        const { data, error } = await supabase.from('profiles').upsert(payload).select().single();

        if (error) {
            alert(`Error saving profile: ${error.message}`);
            return null;
        }

        // Update local state reactively
        const existingIndex = this.profiles.findIndex(p => p.id === data.id);
        if (existingIndex >= 0) this.profiles[existingIndex] = data;
        else this.profiles.push(data);

        this.activeProfile = data;
        if (browser) localStorage.setItem('kinoActiveProfileId', data.id);

        this.fetchMovies();
        return data;
    }

    async fetchMovies() {
        if (!this.activeProfile) return;
        this.isLoading = true;

        // Fetches movies using relational Foreign Key constraint
        const { data, error } = await supabase
            .from('movies')
            .select('*')
            .eq('profile_id', this.activeProfile.id)
            .order('watched_at', { ascending: false });

        if (!error && data) this.movies = data;
        this.isLoading = false;
    }

    async deleteMovie(id: string) {
        await supabase.from('movies').delete().eq('id', id);
        this.movies = this.movies.filter(m => m.id !== id);
    }
}

export const app = new AppState();