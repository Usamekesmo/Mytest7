import { supabase } from './supabaseClient.js';
const ALQURAN_API_BASE_URL = "https://api.alquran.cloud/v1";

// --- دوال المصادقة ---
export async function login(email, password) {
    return await supabase.auth.signInWithPassword({ email, password });
}

export async function logout() {
    return await supabase.auth.signOut();
}

// --- دوال إدارة البيانات الأساسية ---
export async function saveStoreItem(itemData) {
    const { data, error } = await supabase.from('store_items').upsert(itemData, { onConflict: 'item_id' }).select();
    if (error) { console.error("API Error (saveStoreItem):", error); alert(`خطأ: ${error.message}`); return null; }
    return data;
}

export async function saveChallenge(challengeData) {
    const { data, error } = await supabase.from('challenges').upsert(challengeData, { onConflict: 'challenge_id' }).select();
    if (error) { console.error("API Error (saveChallenge):", error); alert(`خطأ: ${error.message}`); return null; }
    return data;
}

export async function fetchGameConfig() {
    try {
        const [{ data: progression }, { data: gameRules }, { data: questionsConfig }, { data: storeItems }, { data: challenges }] = await Promise.all([
            supabase.from('progression').select('*'),
            supabase.from('game_rules').select('*'),
            supabase.from('questions_config').select('*'),
            supabase.from('store_items').select('*'),
            supabase.from('challenges').select('*')
        ]);
        return { progression, gameRules, questionsConfig, storeItems, challenges };
    } catch (error) {
        console.error("API Error (fetchGameConfig):", error);
        return null;
    }
}

// --- دوال إدارة اللاعب ---
export async function fetchPlayer(userName) {
    // يفترض أن جدول اللاعبين اسمه 'players'
    const { data, error } = await supabase.from('players').select('*').eq('name', userName).single();
    if (error && error.code !== 'PGRST116') { // تجاهل خطأ "لم يتم العثور على صف"
        console.error("API Error (fetchPlayer):", error);
        return null;
    }
    return data;
}

export async function savePlayer(playerData) {
    const { data, error } = await supabase.from('players').upsert(playerData, { onConflict: 'name' }).select();
    if (error) { console.error("API Error (savePlayer):", error); return null; }
    return data;
}

// --- دوال جلب بيانات الاختبار ---
export async function fetchAyahsForScope(scopeType, scopeValue) {
    let endpoint = '';
    switch (scopeType) {
        case 'PAGE': endpoint = `/page/${scopeValue}/quran-uthmani`; break;
        case 'JUZ': endpoint = `/juz/${scopeValue}/quran-uthmani`; break;
        case 'SURAH': endpoint = `/surah/${scopeValue}`; break;
        case 'PAGE_RANGE':
            const [start, end] = scopeValue.split('-').map(Number);
            let allAyahs = [];
            for (let i = start; i <= end; i++) {
                const pageAyahs = await fetchAyahsForScope('PAGE', i);
                if (pageAyahs) allAyahs = allAyahs.concat(pageAyahs);
            }
            return allAyahs;
        default: return null;
    }
    try {
        const response = await fetch(`${ALQURAN_API_BASE_URL}${endpoint}`);
        const data = await response.json();
        return (data.code === 200) ? data.data.ayahs : null;
    } catch (error) {
        console.error("API Error (fetchAyahsForScope):", error);
        return null;
    }
}

// --- دوال الميزات الجديدة (إحصائيات، لوحة صدارة، إنجازات) ---

export async function saveQuizStat(statData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.log("Stat not saved: User is not authenticated.");
        return null;
    }
    const dataToSave = { ...statData, player_id: user.id };
    const { data, error } = await supabase.from('player_stats').insert(dataToSave);
    if (error) { console.error("API Error (saveQuizStat):", error); return null; }
    return data;
}

export async function fetchPlayerStats() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase.from('player_stats').select('*').eq('player_id', user.id).order('completed_at', { ascending: false });
    if (error) { console.error("API Error (fetchPlayerStats):", error); return []; }
    return data;
}

export async function fetchLeaderboard(limit = 100) {
    const { data, error } = await supabase.from('public_players').select('name, xp').order('xp', { ascending: false }).limit(limit);
    if (error) { console.error("API Error (fetchLeaderboard):", error); return null; }
    return data;
}

export async function fetchAllAchievements() {
    const { data, error } = await supabase.from('achievements').select('*');
    if (error) { console.error("API Error (fetchAllAchievements):", error); return []; }
    return data;
}

export async function fetchPlayerAchievements() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase.from('player_achievements').select('achievement_id').eq('player_id', user.id);
    if (error) { console.error("API Error (fetchPlayerAchievements):", error); return []; }
    return data.map(a => a.achievement_id);
}

export async function grantAchievement(achievementId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase.from('player_achievements').insert({ player_id: user.id, achievement_id: achievementId }).select();
    if (error) { console.log("Could not grant achievement (maybe already owned):", error.message); return null; }
    return data;
}

export async function fetchSfxAssets() {
    const { data, error } = await supabase.from('sfx_assets').select('id, file_path');
    if (error) {
        console.error("API Error (fetchSfxAssets):", error);
        return null;
    }
    return data.reduce((acc, asset) => {
        acc[asset.id] = asset.file_path;
        return acc;
    }, {});
}


