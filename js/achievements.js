import * as api from './api.js';
import * as player from './player.js';
import * as ui from './ui.js';
import { playSound } from './audio.js';

let allAchievements = [];
let playerAchievements = new Set();

/**
 * يقوم بتهيئة الوحدة بجلب كل الإنجازات الممكنة وتلك التي يمتلكها اللاعب.
 */
export async function initialize() {
    const [achievementsData, playerAchievementsData] = await Promise.all([
        api.fetchAllAchievements(),
        api.fetchPlayerAchievements()
    ]);
    allAchievements = achievementsData;
    playerAchievements = new Set(playerAchievementsData);
    console.log("Achievements module initialized.");
}

/**
 * يعيد قائمة بكل الإنجازات مع تحديد ما إذا كان اللاعب يمتلكها أم لا.
 * @returns {Array}
 */
export function getAchievementsForDisplay() {
    return allAchievements.map(ach => ({
        ...ach,
        unlocked: playerAchievements.has(ach.id)
    })).sort((a, b) => {
        if (a.unlocked && !b.unlocked) return -1;
        if (!a.unlocked && b.unlocked) return 1;
        return 0;
    });
}

/**
 * الدالة المركزية للتحقق من الإنجازات بعد وقوع حدث معين.
 * @param {string} eventType - نوع الحدث (e.g., 'quiz_completed', 'item_purchased').
 * @param {object} data - البيانات المتعلقة بالحدث.
 */
export async function checkAchievements(eventType, data) {
    if (!allAchievements.length) return;

    const achievementsToGrant = [];

    for (const ach of allAchievements) {
        // تخطي الإنجازات التي تم تحقيقها بالفعل
        if (playerAchievements.has(ach.id)) continue;

        let shouldGrant = false;
        switch (ach.id) {
            case 'first_quiz':
                if (eventType === 'quiz_completed') shouldGrant = true;
                break;
            case 'perfect_score':
                if (eventType === 'quiz_completed' && data.score === data.totalQuestions) {
                    shouldGrant = true;
                }
                break;
            case 'ten_quizzes':
                if (eventType === 'quiz_completed' && data.totalQuizzesCompleted >= 10) {
                    shouldGrant = true;
                }
                break;
            case 'first_purchase':
                if (eventType === 'item_purchased') shouldGrant = true;
                break;
            // يمكنك إضافة المزيد من حالات التحقق هنا لإنجازات مستقبلية
            // case 'level_10':
            //     if (eventType === 'level_up' && data.newLevel >= 10) shouldGrant = true;
            //     break;
        }

        if (shouldGrant) {
            achievementsToGrant.push(ach);
        }
    }

    // منح كل الإنجازات التي تم تحقيقها في هذا الحدث
    if (achievementsToGrant.length > 0) {
        for (const ach of achievementsToGrant) {
            await grant(ach);
        }
        // حفظ بيانات اللاعب بعد إضافة المكافآت
        await player.savePlayer();
    }
}

/**
 * يمنح إنجازًا معينًا للاعب.
 * @param {object} achievement - كائن الإنجاز المراد منحه.
 */
async function grant(achievement) {
    console.log(`Granting achievement: ${achievement.title}`);

    // 1. إضافة المكافآت للاعب
    player.addXp(achievement.reward_xp || 0);
    player.addDiamonds(achievement.reward_diamonds || 0);

    // 2. تسجيل الإنجاز في قاعدة البيانات
    const result = await api.grantAchievement(achievement.id);
    if (!result) return; // فشل المنح (ربما تم منحه في عملية متزامنة أخرى)

    // 3. تحديث الحالة المحلية
    playerAchievements.add(achievement.id);

    // 4. عرض إشعار مرئي
    playSound('achievement');
    ui.showAchievementNotification(achievement);

    // 5. تحديث عرض معلومات اللاعب فورًا لإظهار المكافآت
    const levelInfo = player.getLevelInfo(player.playerData.xp);
    ui.updatePlayerDisplay(player.playerData, levelInfo);
}


