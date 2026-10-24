import React, { useState } from 'react';
import {
  X,
  Phone,
  PhoneCall,
  MessageCircle,
  Copy,
  Check,
  Shield,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { ScoutMember } from '../types/scout';
import { getWhatsAppUrl, getBoyInitials, getCategoryColor } from '../utils/scoutHelper';

interface ContactActionModalProps {
  isOpen: boolean;
  member: ScoutMember | null;
  onClose: () => void;
}

export const ContactActionModal: React.FC<ContactActionModalProps> = ({
  isOpen,
  member,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [includeGreeting, setIncludeGreeting] = useState(true);

  if (!isOpen || !member || !member.phone) return null;

  const phone = member.phone;
  const categoryTheme = getCategoryColor(member.category);

  const greetingText = includeGreeting
    ? `السلام عليكم ورحمة الله وبركاته، تحية كشفية من قيادة كشافة العباس (ع) بخصوص الكشاف ${member.name}.`
    : undefined;

  const whatsappUrl = getWhatsAppUrl(phone, greetingText);
  const phoneCallUrl = `tel:${phone}`;

  const handleCopyPhone = async () => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 text-right animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-[#00685e] dark:bg-[#004f47] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-800/80 dark:bg-emerald-900 flex items-center justify-center border border-emerald-400/30">
              <Phone className="w-4 h-4 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">التواصل مع ولي الأمر</h3>
              <p className="text-[11px] text-emerald-100">اختر طريقة الاتصال أو المراسلة</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#00554d] hover:bg-[#00433d] flex items-center justify-center text-emerald-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scout Member Card Preview */}
        <div className="p-4 sm:p-5 space-y-4 text-xs">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#00685e] dark:border-emerald-400 shrink-0 bg-white dark:bg-slate-800 flex items-center justify-center shadow-xs">
              {member.photoUrl ? (
                <img
                  src={member.photoUrl}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs font-bold text-[#00685e] dark:text-emerald-300">
                  {getBoyInitials(member.name)}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">
                  {member.name}
                </h4>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${categoryTheme.badge}`}>
                  {member.category}
                </span>
              </div>
              
              {/* Phone number & copy button */}
              <div className="flex items-center justify-between gap-2 text-slate-600 dark:text-slate-300">
                <span className="font-mono text-xs font-bold dir-ltr tracking-wider">
                  {phone}
                </span>
                <button
                  onClick={handleCopyPhone}
                  className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-[#00685e] dark:hover:text-emerald-300 font-medium bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 transition-colors"
                  title="نسخ الرقم"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">تم النسخ</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>نسخ</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Action Choice Buttons */}
          <div className="space-y-2.5 pt-1">
            <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              اختر إجراء التواصل المطلوب:
            </span>

            {/* 1. WhatsApp Action Link */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="w-full p-3.5 rounded-2xl bg-[#25D366]/10 hover:bg-[#25D366]/15 dark:bg-[#25D366]/20 dark:hover:bg-[#25D366]/25 border-2 border-[#25D366]/60 dark:border-[#25D366]/50 text-slate-900 dark:text-white flex items-center justify-between gap-3 text-right shadow-xs transition-all active:scale-[0.98] group cursor-pointer block"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <MessageCircle className="w-5 h-5 fill-white text-[#25D366]" />
                </div>
                <div>
                  <strong className="block text-xs sm:text-sm font-black text-emerald-950 dark:text-emerald-200">
                    مراسلة عبر واتساب (WhatsApp)
                  </strong>
                  <span className="text-[10px] text-slate-600 dark:text-slate-300 font-medium">
                    فتح محادثة فورية مع ولي الأمر
                  </span>
                </div>
              </div>

              <ExternalLink className="w-4 h-4 text-[#25D366] shrink-0" />
            </a>

            {/* Optional Greeting text checkbox */}
            <label className="flex items-center gap-2 px-1 text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeGreeting}
                onChange={(e) => setIncludeGreeting(e.target.checked)}
                className="rounded accent-[#00685e] w-3.5 h-3.5"
              />
              <span>إرفاق رسالة تحية كشفية جاهزة باسم الكشاف في الواتساب</span>
            </label>

            {/* 2. Direct Phone Call Action Link */}
            <a
              href={phoneCallUrl}
              onClick={onClose}
              className="w-full p-3.5 rounded-2xl bg-teal-50/80 hover:bg-teal-100/70 dark:bg-slate-800 dark:hover:bg-slate-700 border-2 border-teal-200 dark:border-slate-700 text-slate-900 dark:text-white flex items-center justify-between gap-3 text-right shadow-xs transition-all active:scale-[0.98] group cursor-pointer block"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00685e] dark:bg-[#007a6e] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <strong className="block text-xs sm:text-sm font-black text-[#00685e] dark:text-emerald-300">
                    الاتصال مباشرة (مكالمة هاتفية)
                  </strong>
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                    إجراء اتصال هاتفي عبر تطبيق الهاتف
                  </span>
                </div>
              </div>

              <Phone className="w-4 h-4 text-[#00685e] dark:text-emerald-400 shrink-0" />
            </a>
          </div>

          {/* Footer note */}
          <div className="pt-2 flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
