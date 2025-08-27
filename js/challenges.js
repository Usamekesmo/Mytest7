import { startQuizWithScope } from './main.js';

let challenges = [];

/**
 * دالة التهيئة، تقوم بتخزين بيانات التحديات.
 * @param {Array} challengesData - بيانات التحديات من قاعدة البيانات.
 */
export function initialize(challengesData) {
    challenges = challengesData || [];
    console.log("Challenges module initialized.");
}

/**
 * يعيد قائمة بالتحديات المتاحة حاليًا.
 * @returns {Array}
 */
export function getAvailableChallenges() {
    const now = new Date();
    return challenges.filter(c => {
        const startTime = new Date(c.start_time);
        const endTime = new Date(c.end_time);
        return now >= startTime && now <= endTime;
    });
}

/**
 * يبدأ تحديًا معينًا.
 * @param {string} challengeId - معرف التحدي.
 */
export function startChallenge(challengeId) {
    const challenge = challenges.find(c => c.challenge_id === challengeId);
    if (!challenge) {
        alert("هذا التحدي لم يعد متاحاً.");
        return;
    }
    alert(`سيتم الآن بدء تحدي "${challenge.title}"! استعد.`);
    
    // بدء الاختبار بنطاق وعدد أسئلة التحدي
    startQuizWithScope(
        challenge.scope_type, 
        challenge.scope_value, 
        challenge.questions_count
    );
}


