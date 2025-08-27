// --- التأكد من أن supabase هو أول ما يتم استيراده ---
import { supabase } from './supabaseClient.js';

import * as api from './api.js';
import * as ui from './ui.js';
import * as player from './player.js';
import * as store from './store.js';
import * as challenges from './challenges.js';
import * as quiz from './quiz.js';
import * as progression from './progression.js';
import * as admin from './admin.js';
import * as achievements from './achievements.js';
import * as audio from './audio.js';

async function main() {
    ui.initializeUI();
    setupEventListeners();

    ui.toggleLoader(true, "جاري تحميل إعدادات اللعبة...");
    const [config, sfxAssets] = await Promise.all([
        api.fetchGameConfig(),
        api.fetchSfxAssets()
    ]);

    if (!config) {
        ui.toggleLoader(false);
        alert("فشل تحميل إعدادات اللعبة. يرجى التحقق من الاتصال بالإنترنت وإعدادات Supabase.");
        return;
    }

    // تهيئة الوحدات بالبيانات التي تم جلبها
    progression.initialize(config.progression, config.gameRules);
    quiz.initialize(config.questionsConfig);
    store.initialize(config.storeItems);
    challenges.initialize(config.challenges);
    if (sfxAssets) {
        audio.initialize(sfxAssets);
    }
    
    const { data: { session } } = await supabase.auth.getSession();
    admin.handleAuthStateChange(session);
    if (session) {
        await achievements.initialize();
    }

    supabase.auth.onAuthStateChange((_event, session) => {
        admin.handleAuthStateChange(session);
        if (session) {
            achievements.initialize();
        }
    });

    ui.toggleLoader(false);
    ui.updateUIState(false);
    ui.showScreen('start');
    console.log("التطبيق جاهز.");
}

function setupEventListeners() {
    // شاشة تسجيل الدخول والبداية
    ui.userNameInput.addEventListener('input', handleUserInput);
    ui.userNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleLogin();
        }
    });
    ui.loginButton.addEventListener('click', handleLogin);

    // أزرار القائمة الرئيسية
    document.getElementById('storeButton').addEventListener('click', handleShowStore);
    document.getElementById('challengesButton').addEventListener('click', () => { ui.renderChallenges(); ui.showScreen('challenges'); });
    document.getElementById('statsButton').addEventListener('click', handleShowStats);
    document.getElementById('leaderboardButton').addEventListener('click', handleShowLeaderboard);
    document.getElementById('achievementsButton').addEventListener('click', handleShowAchievements);
    
    // أزرار التنقل والعودة
    document.querySelectorAll('.back-button').forEach(btn => btn.addEventListener('click', returnToMainMenu));
    document.getElementById('reload-button').addEventListener('click', returnToMainMenu);

    // أزرار الاختبار
    document.getElementById('startButton').addEventListener('click', startSelectedQuiz);
    document.getElementById('startCustomRangeButton').addEventListener('click', startCustomRangeQuiz);

    // مستمعو أحداث المتجر والتحديات
    document.getElementById('store-items-container').addEventListener('click', handleStoreItemClick);
    document.getElementById('challenges-container').addEventListener('click', (e) => { const btn = e.target.closest('.start-challenge-button'); if (btn) challenges.startChallenge(btn.dataset.challengeId); });
    
    // لوحة تحكم المدير
    document.getElementById('adminPanelButton').addEventListener('click', () => ui.showScreen('admin-panel-screen'));
    document.getElementById('adminLogoutButton').addEventListener('click', admin.logoutAdmin);
    document.getElementById('storeItemForm').addEventListener('submit', admin.handleStoreItemSave);
    document.getElementById('challengeForm').addEventListener('submit', admin.handleChallengeSave);
}

function handleUserInput() {
    const passwordField = document.getElementById('adminPassword');
    if (ui.userNameInput.value.includes('@')) {
        passwordField.classList.remove('hidden');
    } else {
        passwordField.classList.add('hidden');
    }
}

async function handleLogin() {
    const userInput = ui.userNameInput.value.trim();
    const password = document.getElementById('adminPassword').value;
    if (!userInput) {
        alert('الرجاء إدخال اسمك أو بريدك الإلكتروني.');
        return;
    }

    if (userInput.includes('@')) {
        if (!password) {
            alert('الرجاء إدخال كلمة مرور المدير.');
            return;
        }
        ui.toggleLoader(true, "جاري التحقق من بيانات المدير...");
        const { data, error } = await api.login(userInput, password);
        ui.toggleLoader(false);

        if (error) {
            alert(`فشل تسجيل الدخول: ${error.message}`);
            return;
        }
        
        if (data.user) {
            alert("تم تسجيل دخول المدير بنجاح.");
            await loadDefaultPlayerForAdmin();
        }

    } else {
        ui.toggleLoader(true, "جاري تحميل بيانات اللاعب...");
        const playerLoaded = await player.loadPlayer(userInput);
        ui.toggleLoader(false);
        if (playerLoaded) {
            store.applyOwnedItems();
            ui.updateUIState(true);
        }
    }
}

async function loadDefaultPlayerForAdmin() {
    const playerLoaded = await player.loadPlayer("لاعب افتراضي");
    if (playerLoaded) {
        store.applyOwnedItems();
        ui.updateUIState(true);
    }
}

function returnToMainMenu() {
    if (!player.playerData) {
        location.reload();
        return;
    }
    const levelInfo = progression.getLevelInfo(player.playerData.xp);
    ui.updatePlayerDisplay(player.playerData, levelInfo);
    ui.updateUIState(true);
    ui.showScreen('start');
}

async function startSelectedQuiz() {
    const selectedValue = ui.pageSelect.value;
    if (!selectedValue) {
        alert('الرجاء اختيار صفحة أو نطاق لبدء الاختبار.');
        return;
    }
    const parts = selectedValue.split('-');
    const type = parts[0] === 'PAGE' ? 'PAGE' : 'PAGE_RANGE';
    const value = type === 'PAGE' ? parts[1] : `${parts[1]}-${parts[2]}`;
    await startQuizWithScope(type, value);
}

async function startCustomRangeQuiz() {
    const start = parseInt(ui.rangeStartInput.value, 10);
    const end = parseInt(ui.rangeEndInput.value, 10);
    if (!start || !end || start > end) {
        alert("الرجاء إدخال نطاق صحيح.");
        return;
    }
    if (!store.ownsPageRange(start, end)) {
        alert(`لا يمكنك الاختبار على هذا النطاق لأنك لا تمتلك كل الصفحات فيه.`);
        return;
    }
    await startQuizWithScope('PAGE_RANGE', `${start}-${end}`);
}

export async function startQuizWithScope(scopeType, scopeValue, questionsCountOverride = null) {
    ui.toggleLoader(true, "جاري تحضير الاختبار...");
    const ayahs = await api.fetchAyahsForScope(scopeType, scopeValue);
    ui.toggleLoader(false);
    if (ayahs && ayahs.length > 0) {
        const questionsCount = questionsCountOverride || parseInt(ui.questionsCountSelect.value, 10);
        quiz.start({
            pageAyahs: ayahs,
            totalQuestions: questionsCount,
            selectedQari: ui.qariSelect.value,
        });
    } else {
        alert("حدث خطأ أثناء تحميل بيانات الاختبار. قد يكون النطاق غير صالح أو هناك مشكلة في الاتصال.");
    }
}

// --- دوال عرض الشاشات ---

function handleShowStore() {
    ui.resetStoreCategory();
    ui.renderStore();
    ui.showScreen('store');
}

async function handleShowStats() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user && !player.playerData.isGuest) { // تعديل للسماح للضيوف لاحقًا إذا أردنا
        alert("يجب أن تكون مسجلاً بحساب لعرض الإحصائيات.");
        return;
    }
    ui.toggleLoader(true, "جاري تحميل إحصائياتك...");
    const stats = await api.fetchPlayerStats();
    ui.toggleLoader(false);
    ui.renderStats(stats);
    ui.showScreen('stats');
}

async function handleShowLeaderboard() {
    ui.toggleLoader(true, "جاري تحميل لوحة الصدارة...");
    const leaderboardData = await api.fetchLeaderboard();
    ui.toggleLoader(false);
    if (leaderboardData) {
        ui.renderLeaderboard(leaderboardData);
        ui.showScreen('leaderboard');
    } else {
        alert("حدث خطأ أثناء تحميل بيانات لوحة الصدارة.");
    }
}

function handleShowAchievements() {
    ui.renderAchievements();
    ui.showScreen('achievements');
}

function handleStoreItemClick(event) {
    const buyButton = event.target.closest('.buy-button');
    if (buyButton && !buyButton.disabled) {
        const itemId = buyButton.dataset.itemId;
        const item = store.getStoreItems().find(i => i.item_id === itemId);
        if (item) {
            const now = new Date();
            const endTime = item.discount_end_time ? new Date(item.discount_end_time) : null;
            const hasActiveDiscount = item.discount_price && endTime && endTime > now;
            const finalPrice = hasActiveDiscount ? item.discount_price : item.price;

            ui.showConfirmationModal(item.item_name, finalPrice, () => {
                store.buyItem(itemId);
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', main);


