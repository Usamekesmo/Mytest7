import * as store from './store.js';
import * as challenges from './challenges.js';
import * as player from './player.js';
import * as achievements from './achievements.js';

// --- 1. تعريف المتغيرات بدون استهداف فوري ---
export let userNameInput, loginButton, pageSelect, rangeStartInput, rangeEndInput, qariSelect, questionsCountSelect, loader, questionArea, feedbackArea;
let screens = {};
let playerInfoDiv, playerInfoHr, mainMenuDiv, quizOptionsDiv;
let playerLevelEl, playerTitleEl, playerDiamondsEl, playerXpEl, xpBarEl;
let progressCounter, progressBar;
let storeItemsContainer, challengesContainer, storeDiamondsEl;
let resultNameEl, finalScoreEl, levelUpMessageEl, saveMessageEl;
let loaderText;
let quizScreen;
let increaseFontBtn, decreaseFontBtn, fontTypeSelect;
let statsTotalQuizzes, statsAvgScore, statsHighScore, statsTotalXp, statsHistoryContainer;
let leaderboardContainer;
let achievementsContainer;
let confirmationModal, modalTitle, modalText, modalConfirmBtn, modalCancelBtn;
let achievementToast, toastIcon, toastTitle, toastDescription;
let storeCategoriesContainer;
let currentStoreCategory = 'ALL';
let activeTimers = [];

/**
 * دالة التهيئة التي تقوم باستهداف كل عناصر الواجهة بعد تحميل الصفحة.
 */
export function initializeUI() {
    // الشاشات
    screens = {
        start: document.getElementById('start-screen'),
        quiz: document.getElementById('quiz-screen'),
        result: document.getElementById('result-screen'),
        store: document.getElementById('store-screen'),
        challenges: document.getElementById('challenges-screen'),
        stats: document.getElementById('stats-screen'),
        leaderboard: document.getElementById('leaderboard-screen'),
        achievements: document.getElementById('achievements-screen'),
        'admin-panel-screen': document.getElementById('admin-panel-screen')
    };
    quizScreen = screens['quiz'];

    // عناصر عامة
    userNameInput = document.getElementById('userName');
    loginButton = document.getElementById('loginButton');
    loader = document.getElementById('loader');
    loaderText = document.getElementById('loader-text');

    // معلومات اللاعب
    playerInfoDiv = document.getElementById('player-info');
    playerInfoHr = document.getElementById('player-info-hr');
    mainMenuDiv = document.getElementById('main-menu');
    quizOptionsDiv = document.getElementById('quiz-options');
    playerLevelEl = document.getElementById('player-level');
    playerTitleEl = document.getElementById('player-title');
    playerDiamondsEl = document.getElementById('player-diamonds');
    playerXpEl = document.getElementById('player-xp');
    xpBarEl = document.getElementById('xp-bar');

    // الاختبار
    questionArea = document.getElementById('question-area');
    feedbackArea = document.getElementById('feedback-area');
    progressCounter = document.getElementById('progress-counter');
    progressBar = document.getElementById('progress-bar');
    pageSelect = document.getElementById('pageSelect');
    rangeStartInput = document.getElementById('rangeStart');
    rangeEndInput = document.getElementById('rangeEnd');
    qariSelect = document.getElementById('qariSelect');
    questionsCountSelect = document.getElementById('questionsCount');
    increaseFontBtn = document.getElementById('increase-font-btn');
    decreaseFontBtn = document.getElementById('decrease-font-btn');
    fontTypeSelect = document.getElementById('font-type-select');

    // المتجر والتحديات
    storeItemsContainer = document.getElementById('store-items-container');
    challengesContainer = document.getElementById('challenges-container');
    storeDiamondsEl = document.getElementById('store-diamonds');
    storeCategoriesContainer = document.getElementById('store-categories');

    // الإحصائيات ولوحة الصدارة والإنجازات
    statsTotalQuizzes = document.getElementById('stats-total-quizzes');
    statsAvgScore = document.getElementById('stats-avg-score');
    statsHighScore = document.getElementById('stats-high-score');
    statsTotalXp = document.getElementById('stats-total-xp');
    statsHistoryContainer = document.getElementById('stats-history-container');
    leaderboardContainer = document.getElementById('leaderboard-container');
    achievementsContainer = document.getElementById('achievements-container');

    // النتيجة النهائية
    resultNameEl = document.getElementById('resultName');
    finalScoreEl = document.getElementById('finalScore');
    levelUpMessageEl = document.getElementById('level-up-message');
    saveMessageEl = document.getElementById('save-message');

    // النوافذ المنبثقة والإشعارات
    confirmationModal = document.getElementById('confirmation-modal');
    modalTitle = document.getElementById('modal-title');
    modalText = document.getElementById('modal-text');
    modalConfirmBtn = document.getElementById('modal-confirm-btn');
    modalCancelBtn = document.getElementById('modal-cancel-btn');
    achievementToast = document.getElementById('achievement-toast');
    toastIcon = document.getElementById('toast-icon');
    toastTitle = document.getElementById('toast-title');
    toastDescription = document.getElementById('toast-description');

    // ربط مستمعي الأحداث الخاصة بالواجهة فقط
    modalCancelBtn.addEventListener('click', () => hideConfirmationModal());
    storeCategoriesContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('category-tab')) {
            currentStoreCategory = event.target.dataset.category;
            storeCategoriesContainer.querySelector('.active').classList.remove('active');
            event.target.classList.add('active');
            renderStore();
        }
    });

    console.log("UI module initialized and all elements targeted.");
}

// --- دوال التحكم بالواجهة ---
export function showScreen(screenId) {
    Object.values(screens).forEach(screen => screen.classList.add('hidden'));
    if (screens[screenId]) {
        screens[screenId].classList.remove('hidden');
    }
}

export function updateUIState(isLoggedIn) {
    if (isLoggedIn) {
        userNameInput.parentElement.classList.add('hidden');
        playerInfoDiv.classList.remove('hidden');
        playerInfoHr.classList.remove('hidden');
        mainMenuDiv.classList.remove('hidden');
        quizOptionsDiv.classList.remove('hidden');
    } else {
        userNameInput.parentElement.classList.remove('hidden');
        userNameInput.disabled = false;
        userNameInput.value = '';
        document.getElementById('adminPassword').value = '';
        document.getElementById('adminPassword').classList.add('hidden');
        playerInfoDiv.classList.add('hidden');
        playerInfoHr.classList.add('hidden');
        mainMenuDiv.classList.add('hidden');
        quizOptionsDiv.classList.add('hidden');
    }
}

export function toggleLoader(show, text = "جاري التحميل...") {
    loader.classList.toggle('hidden', !show);
    loaderText.textContent = text;
}

export function updatePlayerDisplay(playerData, levelInfo) {
    playerLevelEl.textContent = levelInfo.level;
    playerTitleEl.textContent = levelInfo.title;
    playerDiamondsEl.textContent = playerData.diamonds;
    playerXpEl.textContent = `${levelInfo.currentLevelXp} / ${levelInfo.xpForNextLevel} XP`;
    xpBarEl.style.width = `${levelInfo.progress}%`;
}

export function updateProgress(current, total, finished = false) {
    progressCounter.textContent = `السؤال ${current} من ${total}`;
    const percentage = finished ? 100 : ((current - 1) / total) * 100;
    progressBar.style.width = `${percentage}%`;
}

export function showFeedback(isCorrect, correctAnswerText = '') {
    feedbackArea.classList.remove('hidden');
    feedbackArea.textContent = isCorrect ? 'إجابة صحيحة! أحسنت.' : `إجابة خاطئة. ${correctAnswerText}`;
    feedbackArea.className = isCorrect ? 'correct-feedback' : 'wrong-feedback';
}

export function disableQuestionInteraction() {
    questionArea.querySelectorAll('button, .option-div, .choice-button').forEach(el => {
        el.disabled = true;
        el.style.pointerEvents = 'none';
    });
}

export function markAnswer(element, isCorrect) {
    element.classList.add(isCorrect ? 'correct-answer' : 'wrong-answer');
}

export function displayFinalResult(resultState) {
    showScreen('result');
    resultNameEl.textContent = player.playerData.name;
    finalScoreEl.textContent = `${resultState.score} من ${resultState.totalQuestions}`;
    saveMessageEl.textContent = 'جاري حفظ تقدمك على السحابة...';
    levelUpMessageEl.classList.add('hidden');
}

export function displayLevelUp(levelUpInfo) {
    levelUpMessageEl.innerHTML = `🎉 <strong>ترقية!</strong> لقد وصلت إلى المستوى ${levelUpInfo.level} (${levelUpInfo.title}) وحصلت على ${levelUpInfo.reward} ألماسة!`;
    levelUpMessageEl.classList.remove('hidden');
}

export function updateSaveMessage(success, message) {
    saveMessageEl.textContent = message;
    saveMessageEl.style.color = success ? 'green' : 'red';
}

// --- دوال المتجر ---
export function resetStoreCategory() {
    currentStoreCategory = 'ALL';
}

export function renderStore() {
    const allItems = store.getStoreItems();
    const ownedItems = player.playerData.owned_items;
    storeItemsContainer.innerHTML = '';
    storeDiamondsEl.textContent = player.playerData.diamonds;

    activeTimers.forEach(timer => clearInterval(timer));
    activeTimers = [];

    const itemsToDisplay = allItems.filter(item => currentStoreCategory === 'ALL' || item.item_type === currentStoreCategory);

    if (itemsToDisplay.length === 0) {
        storeItemsContainer.innerHTML = '<p>لا توجد عناصر في هذه الفئة حاليًا.</p>';
        return;
    }

    itemsToDisplay.forEach(item => {
        const isOwned = ownedItems.includes(item.item_id);
        const itemDiv = document.createElement('div');
        itemDiv.className = 'store-item';

        let featuredHTML = '';
        if (item.is_featured && !isOwned) {
            featuredHTML = '<div class="featured-badge">موصى به</div>';
        }

        const now = new Date();
        const endTime = item.discount_end_time ? new Date(item.discount_end_time) : null;
        const hasActiveDiscount = item.discount_price != null && endTime && endTime > now;

        let priceHTML = '';
        if (hasActiveDiscount) {
            priceHTML = `<div class="price-container"><span class="original-price">${item.price} 💎</span><span class="discount-price">${item.discount_price} 💎</span></div><div class="countdown-timer" id="timer-${item.item_id}"></div>`;
            startCountdown(`timer-${item.item_id}`, endTime);
        } else {
            priceHTML = `<div class="price-container"><span>${item.price} 💎</span></div>`;
        }

        itemDiv.innerHTML = `
            ${featuredHTML}
            <h4>${item.item_name}</h4>
            <p>${item.description}</p>
            ${isOwned ? '<p><strong>تم الشراء</strong></p>' : priceHTML}
            <button class="buy-button" data-item-id="${item.item_id}" ${isOwned ? 'disabled' : ''}>${isOwned ? 'تم الشراء' : 'شراء'}</button>
        `;
        storeItemsContainer.appendChild(itemDiv);
    });
}

function startCountdown(elementId, endTime) {
    const timer = setInterval(() => {
        const element = document.getElementById(elementId);
        if (!element) {
            clearInterval(timer);
            return;
        }
        const distance = endTime.getTime() - new Date().getTime();
        if (distance < 0) {
            clearInterval(timer);
            element.innerHTML = "انتهى العرض!";
            return;
        }
        const d = Math.floor(distance / (1000 * 60 * 60 * 24));
        const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((distance % (1000 * 60)) / 1000);
        element.innerHTML = `ينتهي خلال: ${d > 0 ? `${d}ي ` : ''}${h > 0 || d > 0 ? `${h}س ` : ''}${m}د ${s}ث`;
    }, 1000);
    activeTimers.push(timer);
}

// --- دوال الشاشات الجديدة ---
export function renderChallenges() { /* ... (الكود يبقى كما هو) ... */ }

export function renderStats(stats) { /* ... (الكود من الخطوات السابقة) ... */ }

export function renderLeaderboard(leaderboardData) { /* ... (الكود من الخطوات السابقة) ... */ }

export function renderAchievements() {
    const allAchievementsData = achievements.getAchievementsForDisplay();
    achievementsContainer.innerHTML = '';
    if (allAchievementsData.length === 0) {
        achievementsContainer.innerHTML = '<p>لا توجد إنجازات متاحة حاليًا.</p>';
        return;
    }
    allAchievementsData.forEach(ach => {
        const cardDiv = document.createElement('div');
        cardDiv.className = `achievement-card ${ach.unlocked ? 'unlocked' : 'locked'}`;
        cardDiv.innerHTML = `
            <div class="icon">${ach.icon}</div>
            <h4>${ach.title}</h4>
            <p>${ach.description}</p>
            ${ach.unlocked ? '<p class="reward"><strong>تم التحقيق!</strong></p>' : `<p class="reward">+${ach.reward_xp} XP, +${ach.reward_diamonds} 💎</p>`}
        `;
        achievementsContainer.appendChild(cardDiv);
    });
}

// --- دوال النوافذ المنبثقة والإشعارات ---
export function showConfirmationModal(itemName, itemPrice, onConfirm) {
    modalTitle.textContent = `تأكيد شراء "${itemName}"`;
    modalText.innerHTML = `هل أنت متأكد من رغبتك في شراء هذا العنصر مقابل <strong>${itemPrice} 💎</strong>؟`;
    const newConfirmBtn = modalConfirmBtn.cloneNode(true);
    modalConfirmBtn.parentNode.replaceChild(newConfirmBtn, modalConfirmBtn);
    modalConfirmBtn = newConfirmBtn;
    modalConfirmBtn.onclick = () => {
        onConfirm();
        hideConfirmationModal();
    };
    confirmationModal.classList.remove('hidden');
}

export function hideConfirmationModal() {
    confirmationModal.classList.add('hidden');
}

export function showAchievementNotification(achievement) {
    toastIcon.textContent = achievement.icon;
    toastTitle.textContent = `إنجاز جديد: ${achievement.title}`;
    toastDescription.textContent = `+${achievement.reward_xp} XP, +${achievement.reward_diamonds} 💎`;
    achievementToast.classList.remove('hidden');
    achievementToast.classList.add('show');
    setTimeout(() => {
        achievementToast.classList.remove('show');
    }, 5000);
}

// --- دوال تحديث خيارات الاختبار ---
export function updateAvailablePages(availablePages) { /* ... (الكود يبقى كما هو) ... */ }

export function updateAvailableQuizLengths(availableLengths) {
    questionsCountSelect.innerHTML = '';
    const sortedLengths = availableLengths.map(Number).sort((a, b) => a - b);
    sortedLengths.forEach(length => {
        const option = document.createElement('option');
        option.value = length;
        option.textContent = `${length} أسئلة`;
        questionsCountSelect.appendChild(option);
    });
    if (sortedLengths.length > 0) {
        questionsCountSelect.value = sortedLengths[0];
    }
}

export function applyDisplaySettings(fontClass, sizeClass) {
    if (!quizScreen) return;
    const fontClasses = ['font-amiri', 'font-cairo', 'font-noto-naskh'];
    const sizeClasses = ['font-size-small', 'font-size-medium', 'font-size-large', 'font-size-xlarge'];
    if (fontClass) {
        quizScreen.classList.remove(...fontClasses);
        quizScreen.classList.add(fontClass);
    }
    if (sizeClass) {
        quizScreen.classList.remove(...sizeClasses);
        quizScreen.classList.add(sizeClass);
    }
}


