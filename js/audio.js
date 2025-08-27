import { supabase } from './supabaseClient.js';

let sfxAssets = {};
let isMuted = false; // يمكن تطويره لاحقًا لإضافة زر كتم الصوت

/**
 * يقوم بتهيئة الوحدة ببيانات المؤثرات الصوتية.
 * @param {object} assets - كائن يحتوي على معرفات وأسماء ملفات الأصوات.
 */
export function initialize(assets) {
    sfxAssets = assets || {};
    console.log("Audio module initialized.");
}

/**
 * يقوم بتشغيل مؤثر صوتي معين.
 * @param {string} soundId - معرف الصوت المراد تشغيله (e.g., 'correct', 'purchase').
 */
export function playSound(soundId) {
    if (isMuted || !sfxAssets[soundId]) {
        return;
    }

    // جلب المسار العام للملف من Supabase Storage
    const { data } = supabase.storage.from('sfx').getPublicUrl(sfxAssets[soundId]);
    
    if (data && data.publicUrl) {
        const audio = new Audio(data.publicUrl);
        audio.play().catch(error => {
            // تجاهل الأخطاء التي تحدث عندما يحاول المستخدم التفاعل قبل تحميل الصفحة بالكامل
            console.warn(`Could not play sound '${soundId}':`, error.message);
        });
    }
}

// --- دوال مستقبلية محتملة ---

/**
 * يقوم بكتم أو تفعيل الصوت.
 * @param {boolean} muteState 
 */
export function setMute(muteState) {
    isMuted = muteState;
    console.log(`Audio muted: ${isMuted}`);
}

/**
 * يعيد حالة كتم الصوت الحالية.
 * @returns {boolean}
 */
export function getMuteState() {
    return isMuted;
}


