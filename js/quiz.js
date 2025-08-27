import * as ui from './ui.js';
import * as player from './player.js';
import * as progression from './progression.js';
import * as api from './api.js';
import * as achievements from './achievements.js';
import { allQuestionGenerators } from './questions.js';
import { playSound } from './audio.js';

let state = {
    pageAyahs: [],
    currentQuestionIndex: 0,
    score: 0,
    totalQuestions: 10,
    selectedQari: 'ar.alafasy',
    xpEarned: 0
};

let allQuestionConfigs = [];
let activeQuestionFunctions = [];
const shuffleArray = array => [...array].sort(() => 0.5 - Math.random());

/**
 * دالة التهيئة، تقوم بتخزين كل إعدادات الأسئلة الممكنة.
 * @param {Array} config - إعدادات الأسئلة من قاعدة البيانات.
 */
export function initialize(config) {
    allQuestionConfigs = config || [];
    console.log("Quiz module initialized with all possible question types.");

    // ربط مستمعي الأحداث الخاصة بإعدادات عرض الاختبار
    setupDisplaySettingsListeners();
}

/**
 * تحدث قائمة الأسئلة النشطة بناءً على مشتريات اللاعب.
 * @param {Array<string>} purchasedQuestionTypes - مصفوفة بمعرفات أنواع الأسئلة المشتراة.
 */
export function updateActiveQuestions(purchasedQuestionTypes = []) {
    const activeIds = new Set(purchasedQuestionTypes);

    activeQuestionFunctions = allQuestionConfigs
        .filter(q => q.is_basic || activeIds.has(q.id))
        .map(q => allQuestionGenerators[q.id])
        .filter(f => typeof f === 'function');

    console.log(`Updated active questions. Total: ${activeQuestionFunctions.length}`);
    if (activeQuestionFunctions.length === 0) {
        console.error("CRITICAL: No active questions! Defaulting to basic questions.");
        activeQuestionFunctions = allQuestionConfigs
            .filter(q => q.is_basic)
            .map(q => allQuestionGenerators[q.id])
            .filter(f => typeof f === 'function');
    }
}

export function start(settings) {
    state = { ...state, ...settings, score: 0, currentQuestionIndex: 0, xpEarned: 0 };
    // تطبيق إعدادات العرض المحفوظة عند بدء كل اختبار
    applySavedDisplaySettings();
    ui.showScreen('quiz');
    displayNextQuestion();
}

function displayNextQuestion() {
    if (state.currentQuestionIndex >= state.totalQuestions) {
        endQuiz();
        return;
    }
    state.currentQuestionIndex++;
    ui.updateProgress(state.currentQuestionIndex, state.totalQuestions);
    ui.feedbackArea.classList.add('hidden');

    if (activeQuestionFunctions.length === 0) {
        alert("خطأ: لا توجد أسئلة متاحة للاختبار.");
        return;
    }

    const randomGenerator = shuffleArray(activeQuestionFunctions)[0];
    const question = randomGenerator(state.pageAyahs, state.selectedQari, handleResult);

    if (question) {
        ui.questionArea.innerHTML = question.questionHTML;
        question.setupListeners(ui.questionArea);
    } else {
        console.warn("Question generator returned null. Trying next question.");
        setTimeout(displayNextQuestion, 50);
    }
}

function handleResult(isCorrect, correctAnswerText, clickedElement) {
    ui.disableQuestionInteraction();
    if (isCorrect) {
        playSound('correct');
        state.score++;
        const xpAmount = parseInt(progression.getRuleValue('xpPerCorrectAnswer') || '10', 10);
        state.xpEarned += xpAmount;
        ui.markAnswer(clickedElement, true);
    } else {
        playSound('wrong');
        ui.markAnswer(clickedElement, false);
    }
    ui.showFeedback(isCorrect, correctAnswerText);
    setTimeout(displayNextQuestion, 3000);
}

async function endQuiz() {
    ui.updateProgress(state.totalQuestions, state.totalQuestions, true);
    const oldXp = player.playerData.xp;

    // حساب مكافأة العلامة الكاملة
    if (state.score === state.totalQuestions) {
        const bonusXp = parseInt(progression.getRuleValue('xpBonusAllCorrect') || '50', 10);
        const bonusDiamonds = parseInt(progression.getRuleValue('diamondsBonusAllCorrect') || '5', 10);
        state.xpEarned += bonusXp;
        player.addDiamonds(bonusDiamonds);
    }

    player.addXp(state.xpEarned);
    const levelUpInfo = progression.checkForLevelUp(oldXp, player.playerData.xp);
    if (levelUpInfo) {
        playSound('levelUp');
        player.addDiamonds(levelUpInfo.reward);
        ui.displayLevelUp(levelUpInfo);
    }

    ui.displayFinalResult(state);
    ui.updateSaveMessage(false, 'جاري حفظ تقدمك...');

    const statData = {
        player_name: player.playerData.name,
        score: state.score,
        total_questions: state.totalQuestions,
        xp_earned: state.xpEarned
    };

    await Promise.all([
        player.savePlayer(),
        api.saveQuizStat(statData)
    ]);

    ui.updateSaveMessage(true, 'تم حفظ تقدمك بنجاح!');

    // التحقق من الإنجازات بعد حفظ كل شيء
    const stats = await api.fetchPlayerStats();
    await achievements.checkAchievements('quiz_completed', {
        score: state.score,
        totalQuestions: state.totalQuestions,
        totalQuizzesCompleted: stats.length
    });
}

// --- دوال إدارة إعدادات العرض ---
const FONT_SIZES = ['font-size-small', 'font-size-medium', 'font-size-large', 'font-size-xlarge'];
let currentSettings = {
    fontClass: 'font-amiri',
    sizeIndex: 1
};

function saveDisplaySettings() {
    localStorage.setItem('quizDisplaySettings', JSON.stringify(currentSettings));
}

function loadDisplaySettings() {
    const saved = localStorage.getItem('quizDisplaySettings');
    if (saved) {
        currentSettings = JSON.parse(saved);
    }
}

function applySavedDisplaySettings() {
    ui.applyDisplaySettings(currentSettings.fontClass, FONT_SIZES[currentSettings.sizeIndex]);
    document.getElementById('font-type-select').value = currentSettings.fontClass;
}

function setupDisplaySettingsListeners() {
    loadDisplaySettings();
    applySavedDisplaySettings();

    document.getElementById('increase-font-btn').addEventListener('click', () => {
        if (currentSettings.sizeIndex < FONT_SIZES.length - 1) {
            currentSettings.sizeIndex++;
            ui.applyDisplaySettings(null, FONT_SIZES[currentSettings.sizeIndex]);
            saveDisplaySettings();
        }
    });

    document.getElementById('decrease-font-btn').addEventListener('click', () => {
        if (currentSettings.sizeIndex > 0) {
            currentSettings.sizeIndex--;
            ui.applyDisplaySettings(null, FONT_SIZES[currentSettings.sizeIndex]);
            saveDisplaySettings();
        }
    });

    document.getElementById('font-type-select').addEventListener('change', (event) => {
        currentSettings.fontClass = event.target.value;
        ui.applyDisplaySettings(currentSettings.fontClass, null);
        saveDisplaySettings();
    });
}


