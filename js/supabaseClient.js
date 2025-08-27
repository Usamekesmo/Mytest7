import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// !! هام جداً !!
// تأكد من أن هذه المتغيرات تحتوي على بيانات مشروعك الصحيحة في Supabase.
const supabaseUrl = 'https://mfytyecyiwpvsvfvmgaa.supabase.co';    // الصق هنا عنوان URL الخاص بك
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1meXR5ZWN5aXdwdnN2ZnZtZ2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzk1NDMsImV4cCI6MjA3MTgxNTU0M30.doXt3SRJykWBO0swU-VZIFOjquNI2EN9JhFzPMhIuSw'; // الصق هنا مفتاح "anon" العام الخاص بك

/**
 * عميل Supabase الذي سيتم استخدامه في جميع أنحاء التطبيق.
 */
export const supabase = createClient(supabaseUrl, supabaseKey);


