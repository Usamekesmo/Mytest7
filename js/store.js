import * as player from './player.js';
import * as ui from './ui.js';
import * as progression from './progression.js';
import * as quiz from './quiz.js';
import * as achievements from './achievements.js';
import { playSound } from './audio.js';

let storeItems = [];

/**
 * دالة التهيئة، تقوم بتخزين بيانات عناصر المتجر.
 * @param {Array} items - بيانات عناصر المتجر من قاعدة البيانات.
 */
export function initialize(items) {
    storeItems = items || [];
    console.log("Store module initialized.");
}

/**
 * يطبق كل العناصر التي يمتلكها اللاعب على واجهة المستخدم وحالة اللعبة.
 */
export function applyOwnedItems() {
    if (!player.playerData) return;

    const ownedItemIds = new Set(player.playerData.owned_items);

    // 1. تطبيق الثيمات
    const ownedTheme = storeItems.find(item =>
        ownedItemIds.has(item.item_id) && item.item_type === 'THEME'
    );
    document.body.className = ownedTheme ? ownedTheme.value : ''; // تطبيق الثيم أو إزالته

    // 2. تحديث الصفحات المتاحة
    const defaultPages = (progression.getRuleValue('default_pages') || '').split(',').map(Number);
    const purchasedPages = storeItems
        .filter(item => ownedItemIds.has(item.item_id) && item.item_type === 'PAGE')
        .map(item => parseInt(item.value, 10));
    const allAvailablePages = [...new Set([...defaultPages, ...purchasedPages])].sort((a, b) => a - b);
    ui.updateAvailablePages(allAvailablePages);

    // 3. تحديث خيارات عدد الأسئلة المتاحة
    const defaultLengths = ['5'];
    const purchasedLengths = storeItems
        .filter(item => ownedItemIds.has(item.item_id) && item.item_type === 'QUIZ_LENGTH')
        .map(item => item.value);
    const allAvailableLengths = [...new Set([...defaultLengths, ...purchasedLengths])];
    ui.updateAvailableQuizLengths(allAvailableLengths);

    // 4. تحديث أنواع الأسئلة النشطة
    const purchasedQuestionTypes = storeItems
        .filter(item => ownedItemIds.has(item.item_id) && item.item_type === 'QUESTION_TYPE')
        .map(item => item.value);
    quiz.updateActiveQuestions(purchasedQuestionTypes);
}

/**
 * يعيد مصفوفة بكل عناصر المتجر.
 * @returns {Array}
 */
export function getStoreItems() {
    return storeItems;
}

/**
 * ينفذ عملية شراء عنصر معين.
 * @param {string} itemId - معرف العنصر المراد شراؤه.
 */
export async function buyItem(itemId) {
    if (!player.playerData) return;

    const item = storeItems.find(i => i.item_id === itemId);
    if (!item) {
        alert("العنصر غير موجود!");
        return;
    }

    // تحديد السعر النهائي (مع الأخذ في الاعتبار الخصومات)
    const now = new Date();
    const endTime = item.discount_end_time ? new Date(item.discount_end_time) : null;
    const hasActiveDiscount = item.discount_price != null && endTime && endTime > now;
    const finalPrice = hasActiveDiscount ? item.discount_price : item.price;

    if (player.playerData.diamonds < finalPrice) {
        alert("ليس لديك ما يكفي من الألماس لشراء هذا العنصر.");
        return;
    }

    // تنفيذ عملية الشراء
    player.playerData.diamonds -= finalPrice;
    player.playerData.owned_items.push(item.item_id);

    ui.toggleLoader(true, "جاري إتمام عملية الشراء...");
    await player.savePlayer();
    ui.toggleLoader(false);

    playSound('purchase');
    alert(`تم شراء "${item.item_name}" بنجاح!`);

    // التحقق من إنجاز "أول عملية شراء"
    await achievements.checkAchievements('item_purchased', { itemId });

    // إعادة تطبيق المشتريات وتحديث واجهة المتجر
    applyOwnedItems();
    ui.renderStore();
}

/**
 * يتحقق مما إذا كان اللاعب يمتلك كل الصفحات في نطاق معين.
 * @param {number} start - بداية النطاق.
 * @param {number} end - نهاية النطاق.
 * @returns {boolean}
 */
export function ownsPageRange(start, end) {
    if (!player.playerData) return false;

    const defaultPages = (progression.getRuleValue('default_pages') || '').split(',').map(Number);
    const purchasedPages = storeItems
        .filter(item => player.playerData.owned_items.includes(item.item_id) && item.item_type === 'PAGE')
        .map(item => parseInt(item.value, 10));
    
    const ownedPages = new Set([...defaultPages, ...purchasedPages]);

    for (let i = start; i <= end; i++) {
        if (!ownedPages.has(i)) {
            return false;
        }
    }
    return true;
}


