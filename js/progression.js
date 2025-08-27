let levels = [];
let rules = {};

/**
 * دالة التهيئة، تقوم بتخزين بيانات التقدم وقواعد اللعبة.
 * @param {Array} progressionData - بيانات المستويات من جدول 'progression'.
 * @param {Array} gameRulesData - بيانات القواعد من جدول 'game_rules'.
 */
export function initialize(progressionData, gameRulesData) {
    levels = progressionData || [];
    // تحويل مصفوفة القواعد إلى كائن للوصول السريع
    rules = (gameRulesData || []).reduce((acc, rule) => {
        acc[rule.rule_id] = rule.value;
        return acc;
    }, {});
    
    // التأكد من أن المستويات مرتبة دائمًا
    levels.sort((a, b) => a.level - b.level);
    
    console.log("Progression module initialized.");
}

/**
 * يعيد قيمة قاعدة معينة من قواعد اللعبة.
 * @param {string} ruleId - معرف القاعدة.
 * @returns {string|null} - قيمة القاعدة أو null إذا لم توجد.
 */
export function getRuleValue(ruleId) {
    return rules[ruleId] || null;
}

/**
 * يحسب معلومات المستوى الحالية للاعب بناءً على نقاط خبرته.
 * @param {number} currentXp - نقاط الخبرة الحالية للاعب.
 * @returns {object} - كائن يحتوي على معلومات المستوى.
 */
export function getLevelInfo(currentXp) {
    if (!levels || levels.length === 0) {
        // قيمة افتراضية في حال عدم تحميل المستويات
        return { level: 1, title: 'لاعب جديد', progress: 0, xpForNextLevel: 100, currentLevelXp: currentXp };
    }

    let currentLevelInfo = levels[0];
    // البحث عن المستوى الحالي من الأعلى إلى الأسفل لضمان الدقة
    for (let i = levels.length - 1; i >= 0; i--) {
        if (currentXp >= levels[i].xp_required) {
            currentLevelInfo = levels[i];
            break;
        }
    }

    const nextLevelInfo = levels.find(l => l.level === currentLevelInfo.level + 1);
    
    const xpForCurrentLevel = currentLevelInfo.xp_required;
    const xpForNextLevel = nextLevelInfo ? nextLevelInfo.xp_required : currentXp; // إذا كان آخر مستوى، فالهدف هو XP الحالي

    let progress = 100;
    if (nextLevelInfo && xpForNextLevel > xpForCurrentLevel) {
        const xpInCurrentLevel = currentXp - xpForCurrentLevel;
        const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
        progress = (xpInCurrentLevel / xpNeededForNextLevel) * 100;
    }

    return {
        level: currentLevelInfo.level,
        title: currentLevelInfo.title,
        progress: Math.min(100, progress), // لا تتجاوز 100%
        xpForNextLevel: xpForNextLevel,
        currentLevelXp: currentXp
    };
}

/**
 * يتحقق مما إذا كان اللاعب قد وصل إلى مستوى جديد.
 * @param {number} oldXp - نقاط الخبرة القديمة.
 * @param {number} newXp - نقاط الخبرة الجديدة.
 * @returns {object|null} - معلومات المستوى الجديد ومكافأته، أو null.
 */
export function checkForLevelUp(oldXp, newXp) {
    const oldLevelInfo = getLevelInfo(oldXp);
    const newLevelInfo = getLevelInfo(newXp);

    if (newLevelInfo.level > oldLevelInfo.level) {
        const newLevelData = levels.find(l => l.level === newLevelInfo.level);
        return {
            ...newLevelInfo,
            reward: newLevelData ? newLevelData.diamonds_reward : 0
        };
    }
    
    return null;
}


