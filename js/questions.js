const shuffleArray = array => [...array].sort(() => 0.5 - Math.random());

/**
 * يولد سؤال "اختر الآية التالية".
 */
function generateChooseNextQuestion(pageAyahs, qari, handleResultCallback) {
    if (pageAyahs.length < 4) return null;
    const startIndex = Math.floor(Math.random() * (pageAyahs.length - 1));
    const questionAyah = pageAyahs[startIndex];
    const correctNextAyah = pageAyahs[startIndex + 1];
    const wrongOptions = shuffleArray(pageAyahs.filter(a => a.number !== correctNextAyah.number && a.number !== questionAyah.number)).slice(0, 2);
    const options = shuffleArray([correctNextAyah, ...wrongOptions]);
    const questionHTML = `<h3>السؤال: استمع واختر الآية التالية</h3><audio controls autoplay src="https://cdn.islamic.network/quran/audio/128/${qari}/${questionAyah.number}.mp3"></audio>${options.map(opt => `<div class="option-div" data-number="${opt.number}">${opt.text}</div>`).join('')}`;
    const correctAnswerText = correctNextAyah.text;
    const setupListeners = (questionArea) => {
        questionArea.querySelectorAll('.option-div').forEach(el => {
            el.addEventListener('click', () => {
                const isCorrect = el.dataset.number == correctNextAyah.number;
                handleResultCallback(isCorrect, correctAnswerText, el);
            });
        });
    };
    return { questionHTML, setupListeners };
}

/**
 * يولد سؤال "حدد موضع الآية".
 */
function generateLocateAyahQuestion(pageAyahs, qari, handleResultCallback) {
    const ayahIndex = Math.floor(Math.random() * pageAyahs.length);
    const questionAyah = pageAyahs[ayahIndex];
    const totalAyahs = pageAyahs.length;
    let correctLocation;
    if (ayahIndex < totalAyahs / 3) correctLocation = 'بداية';
    else if (ayahIndex < (totalAyahs * 2) / 3) correctLocation = 'وسط';
    else correctLocation = 'نهاية';
    const questionHTML = `<h3>السؤال: أين يقع موضع هذه الآية في الصفحة؟</h3><p style="font-family: 'Amiri', serif; font-size: 22px;">"${questionAyah.text}"</p><audio controls src="https://cdn.islamic.network/quran/audio/128/${qari}/${questionAyah.number}.mp3"></audio><div class="interactive-area" style="display: flex; justify-content: center; gap: 15px; margin: 20px 0;">${['بداية', 'وسط', 'نهاية'].map(loc => `<button class="choice-button" data-location="${loc}">${loc} الصفحة</button>`).join('')}</div>`;
    const correctAnswerText = `${correctLocation} الصفحة`;
    const setupListeners = (questionArea) => {
        questionArea.querySelectorAll('.choice-button').forEach(el => {
            el.addEventListener('click', () => {
                const isCorrect = el.dataset.location === correctLocation;
                handleResultCallback(isCorrect, correctAnswerText, el);
            });
        });
    };
    return { questionHTML, setupListeners };
}

/**
 * يولد سؤال "أكمل الكلمة الأخيرة".
 */
function generateCompleteLastWordQuestion(pageAyahs, qari, handleResultCallback) {
    const suitableAyahs = pageAyahs.filter(a => a.text.split(' ').length > 3);
    if (suitableAyahs.length < 4) return null;
    const questionAyah = shuffleArray(suitableAyahs)[0];
    const words = questionAyah.text.split(' ');
    const correctLastWord = words.pop();
    const incompleteAyahText = words.join(' ');
    const wrongOptions = shuffleArray(suitableAyahs.filter(a => a.number !== questionAyah.number)).slice(0, 3).map(a => a.text.split(' ').pop());
    const options = shuffleArray([correctLastWord, ...wrongOptions]);
    const questionHTML = `<h3>السؤال: اختر الكلمة الصحيحة لإكمال الآية التالية:</h3><p style="font-family: 'Amiri', serif; font-size: 22px;">${incompleteAyahText} (...)</p><audio controls autoplay src="https://cdn.islamic.network/quran/audio/128/${qari}/${questionAyah.number}.mp3"></audio><div class="interactive-area" style="display: flex; justify-content: center; gap: 15px; margin: 20px 0; flex-wrap: wrap;">${options.map(opt => `<button class="choice-button" data-word="${opt}">${opt}</button>`).join('')}</div>`;
    const correctAnswerText = `الكلمة الصحيحة هي: "${correctLastWord}"`;
    const setupListeners = (questionArea) => {
        questionArea.querySelectorAll('.choice-button').forEach(el => {
            el.addEventListener('click', () => {
                const isCorrect = el.dataset.word === correctLastWord;
                handleResultCallback(isCorrect, correctAnswerText, el);
            });
        });
    };
    return { questionHTML, setupListeners };
}

/**
 * كائن يجمع كل مولدات الأسئلة المتاحة.
 */
export const allQuestionGenerators = {
    'choose_next': generateChooseNextQuestion,
    'locate_ayah': generateLocateAyahQuestion,
    'complete_word': generateCompleteLastWordQuestion,
    // يمكنك إضافة مولدات أسئلة جديدة هنا في المستقبل
    // 'new_question_type': generateNewQuestionType,
};


