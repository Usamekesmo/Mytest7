import * as api from './api.js';
import * as ui from './ui.js';

export let playerData = null;

/**
 * يقوم بتحميل بيانات اللاعب من قاعدة البيانات أو إنشاء لاعب جديد.
 * @param {string} userName - اسم المستخدم.
 * @returns {Promise<boolean>} - true عند النجاح.
 */
export async function loadPlayer(userName) {
    let fetchedData = await api.fetchPlayer(userName);

    if (!fetchedData) {
        // لاعب جديد، قم بإنشائه بالقيم الافتراضية
        const newPlayerData = {
            name: userName,
            xp: 0,
            diamonds: 10, // هدية ترحيبية
            owned_items: [] // قائمة فارغة بالممتلكات
        };
        const savedPlayerArray = await api.savePlayer(newPlayerData);
        if (savedPlayerArray && savedPlayerArray.length > 0) {
            playerData = savedPlayerArray[0];
            console.log(`New player created: ${userName}`);
        } else {
            alert("حدث خطأ أثناء إنشاء حسابك. يرجى المحاولة مرة أخرى.");
            return false;
        }
    } else {
        // لاعب حالي
        playerData = fetchedData;
        console.log(`Player loaded: ${playerData.name}`);
    }
    
    // التأكد من أن owned_items هي مصفوفة دائمًا
    if (!playerData.owned_items) {
        playerData.owned_items = [];
    }
    
    return true;
}

/**
 * يحفظ بيانات اللاعب الحالية في قاعدة البيانات.
 */
export async function savePlayer() {
    if (!playerData) return;
    
    const result = await api.savePlayer(playerData);
    if (result) {
        console.log("Player data saved successfully.");
    } else {
        console.error("Failed to save player data.");
        // يمكن عرض رسالة خطأ للمستخدم هنا إذا لزم الأمر
        ui.updateSaveMessage(false, 'خطأ في حفظ التقدم!');
    }
}

/**
 * يضيف نقاط خبرة إلى رصيد اللاعب.
 * @param {number} amount - كمية النقاط المراد إضافتها.
 */
export function addXp(amount) {
    if (!playerData || amount <= 0) return;
    playerData.xp += amount;
}

/**
 * يضيف الألماس إلى رصيد اللاعب.
 * @param {number} amount - كمية الألماس المراد إضافتها.
 */
export function addDiamonds(amount) {
    if (!playerData || amount <= 0) return;
    playerData.diamonds += amount;
}


