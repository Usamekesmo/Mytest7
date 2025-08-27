import * as ui from './ui.js';
import * as api from './api.js';
import { supabase } from './supabaseClient.js';

let isAdmin = false;

/**
 * يتم استدعاؤها عند تغير حالة المصادقة (تسجيل دخول أو خروج).
 * تتحقق من دور المستخدم من جدول 'profiles'.
 */
export async function handleAuthStateChange(session) {
    const adminPanelButton = document.getElementById('adminPanelButton');
    
    if (session && session.user) {
        // تحقق من دور المستخدم من جدول profiles
        const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (error) {
            console.error("Error fetching user role:", error.message);
            isAdmin = false;
        }

        // إذا كان الدور هو 'admin'، أظهر لوحة التحكم
        if (data && data.role === 'admin') {
            isAdmin = true;
            adminPanelButton.classList.remove('hidden');
        } else {
            isAdmin = false;
            adminPanelButton.classList.add('hidden');
        }
    } else {
        // لا يوجد مستخدم مسجل دخوله
        isAdmin = false;
        adminPanelButton.classList.add('hidden');
        // تأكد من إخفاء لوحة التحكم إذا كانت مفتوحة
        if (!document.getElementById('admin-panel-screen').classList.contains('hidden')) {
            ui.showScreen('start');
        }
    }
}

/**
 * يقوم بتسجيل خروج المدير وإعادة تحميل الصفحة.
 */
export async function logoutAdmin() {
    await api.logout();
    alert("تم تسجيل خروج المدير.");
    // إعادة تحميل الصفحة لضمان إعادة تعيين كل شيء إلى حالة نظيفة
    location.reload();
}

/**
 * يعالج حدث حفظ نموذج عنصر المتجر.
 * @param {Event} event 
 */
export async function handleStoreItemSave(event) {
    event.preventDefault();
    if (!isAdmin) {
        alert("ليس لديك صلاحية للقيام بهذه العملية.");
        return;
    }
    const formData = new FormData(event.target);
    const itemData = {
        item_id: formData.get('storeItemId'),
        item_name: formData.get('storeItemName'),
        description: formData.get('storeItemDescription'),
        item_type: formData.get('storeItemType'),
        price: parseInt(formData.get('storeItemPrice'), 10),
        value: formData.get('storeItemValue')
        // يمكنك إضافة حقول للخصومات والعروض هنا إذا أردت التحكم بها من لوحة المدير
    };
    ui.toggleLoader(true, "جاري حفظ عنصر المتجر...");
    const result = await api.saveStoreItem(itemData);
    ui.toggleLoader(false);
    if (result) {
        alert("تم حفظ عنصر المتجر بنجاح!");
        event.target.reset();
    }
}

/**
 * يعالج حدث حفظ نموذج التحدي.
 * @param {Event} event 
 */
export async function handleChallengeSave(event) {
    event.preventDefault();
    if (!isAdmin) {
        alert("ليس لديك صلاحية للقيام بهذه العملية.");
        return;
    }
    const formData = new FormData(event.target);
    const challengeData = {
        challenge_id: formData.get('challengeId'),
        title: formData.get('challengeTitle'),
        description: formData.get('challengeDescription'),
        start_time: new Date(formData.get('startTime')).toISOString(),
        end_time: new Date(formData.get('endTime')).toISOString(),
        scope_type: formData.get('scopeType'),
        scope_value: formData.get('scopeValue'),
        questions_count: parseInt(formData.get('challengeQuestionsCount'), 10),
        reward: parseInt(formData.get('challengeReward'), 10)
    };
    ui.toggleLoader(true, "جاري حفظ التحدي...");
    const result = await api.saveChallenge(challengeData);
    ui.toggleLoader(false);
    if (result) {
        alert("تم حفظ التحدي بنجاح!");
        event.target.reset();
    }
}


