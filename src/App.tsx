import React, { useState } from 'react';
import { Copy, Download, Check, Sparkles, LayoutTemplate } from 'lucide-react';

const PRESETS = {
  'islamic': {
    id: 'islamic',
    name: 'Islamic Minimal',
    desc: 'أزرق داكن + ذهبي دافئ',
    bg:'#0D1B2A', acc:'#C9A84C', txt:'#F5F0E8',
    deco:'Islamic geometric patterns, thin gold crescent, star scatter',
    swatches: ['#0D1B2A', '#C9A84C', '#F5F0E8']
  },
  'dark-tech': {
    id: 'dark-tech',
    name: 'Dark Tech',
    desc: 'أسود + أخضر نيون',
    bg:'#0a0a0a', acc:'#00ff88', txt:'#ffffff',
    deco:'minimal grid lines, thin border frame',
    swatches: ['#0a0a0a', '#00ff88', '#ffffff']
  },
  'light-minimal': {
    id: 'light-minimal',
    name: 'Light Minimal',
    desc: 'أبيض نقي + كحلي',
    bg:'#f7f5f0', acc:'#1a1a2e', txt:'#1a1a2e',
    deco:'minimal grid lines, thin border frame',
    swatches: ['#f7f5f0', '#1a1a2e', '#1a1a2e']
  },
  'bold-editorial': {
    id: 'bold-editorial',
    name: 'Bold Editorial',
    desc: 'أحمر + أصفر جريء',
    bg:'#ff2d20', acc:'#ffdd00', txt:'#ffffff',
    deco:'bold typography only, no decoration',
    swatches: ['#ff2d20', '#ffdd00', '#ffffff']
  }
};

const TYPE_LABELS: Record<string, string> = { hook: 'Hook / Title', point: 'Point', cta: 'CTA / Takeaway' };

interface Slide {
  index: number;
  slide_type: string;
  slide_title: string;
  slide_body: string;
  image_prompt: string;
}

export default function App() {
  const [topic, setTopic] = useState('');
  const [slideCount, setSlideCount] = useState(5);
  const [lang, setLang] = useState('Arabic');
  const [activePreset, setActivePreset] = useState('islamic');
  
  const [bg, setBg] = useState(PRESETS['islamic'].bg);
  const [acc, setAcc] = useState(PRESETS['islamic'].acc);
  const [txt, setTxt] = useState(PRESETS['islamic'].txt);
  const [deco, setDeco] = useState(PRESETS['islamic'].deco);
  const [extra, setExtra] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [statusMsg, setStatusMsg] = useState('جاهز');
  const [progress, setProgress] = useState(0);
  const [copiedAll, setCopiedAll] = useState(false);

  const handlePresetSelect = (presetId: keyof typeof PRESETS) => {
    const p = PRESETS[presetId];
    setActivePreset(presetId);
    setBg(p.bg);
    setAcc(p.acc);
    setTxt(p.txt);
    setDeco(p.deco);
  };

  const generate = async () => {
    if (!topic.trim()) {
      alert('من فضلك أدخل موضوع الكاروسول');
      return;
    }

    setIsGenerating(true);
    setStatusMsg('جاري التوليد...');
    setProgress(15);
    setSlides([]);

    const promptText = `You are an expert Instagram carousel designer and AI image prompt engineer.

Generate exactly ${slideCount} carousel slides for this topic: "${topic}"
Language for all text content: ${lang}
${extra ? `Additional instructions: ${extra}` : ''}

VISUAL IDENTITY:
- Background color: ${bg}
- Accent/highlight color: ${acc}
- Primary text color: ${txt}
- Decorative elements: ${deco}
- Format: 1080x1080px square, Instagram carousel

SLIDE STRUCTURE RULES:
- Slide 1: Hook — bold attention-grabbing title, minimal body text
- Slides 2 to ${slideCount-1}: One focused point per slide, clear title + 1-2 line explanation
- Slide ${slideCount}: CTA or key takeaway

For EACH slide, generate:
1. slide_title: the actual text headline (in ${lang})
2. slide_body: supporting text (in ${lang}, max 20 words)
3. slide_type: hook | point | cta
4. image_prompt: A detailed English image generation prompt (for Midjourney/DALL-E/Stable Diffusion) that describes exactly how this slide should look as a visual image. Include:
   - The exact text/typography layout to render on the image
   - Background: ${bg} hex color, described as a color mood
   - Accent elements: ${acc} colored decorative details
   - Text colors: ${txt} for main text
   - Decorative: ${deco}
   - Lighting, mood, style descriptors
   - Technical specs: 1080x1080, square format, high resolution, sharp details
   - Negative prompts hint: --no blur, noise, low quality, watermark
   Make the prompt self-contained — someone should be able to paste it directly into any AI image generator and get this exact slide design.

Respond ONLY with raw JSON, no markdown fences, no explanation:
{
  "slides": [
    {
      "index": 1,
      "slide_type": "hook",
      "slide_title": "...",
      "slide_body": "...",
      "image_prompt": "..."
    }
  ]
}`;

    try {
      setProgress(40);
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptText })
      });

      setProgress(80);
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `HTTP error! status: ${response.status}`);
      }
      
      const parsed = await response.json();
      setSlides(parsed.slides || []);
      setStatusMsg(`تم توليد ${parsed.slides?.length || 0} prompts جاهزة للنسخ`);
      
    } catch (error: any) {
      console.error(error);
      setStatusMsg('حدث خطأ — حاول مرة أخرى');
      alert(`حدث خطأ أثناء التوليد: ${error.message}`);
    } finally {
      setProgress(100);
      setIsGenerating(false);
      setTimeout(() => setProgress(0), 800);
    }
  };

  const copyAll = () => {
    if (!slides.length) { alert('لا يوجد prompts بعد'); return; }
    const all = slides.map((s) =>
      `=== SLIDE ${s.index} (${s.slide_type.toUpperCase()}) ===\n📝 Content: ${s.slide_title}\n${s.slide_body ? `   ${s.slide_body}\n` : ''}\n🎨 Image Prompt:\n${s.image_prompt}\n`
    ).join('\n---\n\n');
    
    navigator.clipboard.writeText(all).then(() => {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2500);
    });
  };

  const exportTxt = () => {
    if (!slides.length) { alert('لا يوجد prompts بعد'); return; }
    const content = slides.map(s =>
      `SLIDE ${s.index} — ${s.slide_type.toUpperCase()}\n${'─'.repeat(50)}\nCONTENT: ${s.slide_title}\n${s.slide_body || ''}\n\nIMAGE PROMPT:\n${s.image_prompt}\n`
    ).join('\n\n' + '═'.repeat(50) + '\n\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'carousel-image-prompts.txt';
    a.click();
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[400px_1fr] bg-[#080c14] text-[#F0EAD8] font-cairo">
      {/* LEFT PANEL */}
      <div className="bg-[#0e1520] border-l border-[#1e2d47] h-screen overflow-y-auto flex flex-col">
        <div className="p-6 pb-4 border-b border-[#1e2d47] sticky top-0 bg-[#0e1520] z-10">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C9A84C] to-[#6b4e1a] flex items-center justify-center text-[#08100a] shrink-0">
              <Sparkles size={16} />
            </div>
            <h1 className="text-base font-bold tracking-wide">
              Carousel <span className="text-[#C9A84C]">Prompts</span>
            </h1>
          </div>
          <div className="text-[11px] text-[#6b7fa3]">يولد image prompts جاهزة لأي مولد صور AI</div>
        </div>

        <div className="p-5 flex flex-col gap-5 flex-1">
          {/* Topic */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-[#8a6830] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1 h-1 bg-[#C9A84C] rounded-full shrink-0"></span> موضوع الكاروسول
            </label>
            <textarea 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="bg-[#141d2e] border border-[#1e2d47] text-[#F0EAD8] rounded-lg p-2.5 text-[13px] outline-none transition-all focus:border-[#C9A84C] focus:ring-[3px] focus:ring-[#C9A84C]/10 resize-y min-h-[72px] leading-relaxed"
              placeholder="مثال: ٥ أدوات AI تغير طريقة بناء المواقع&#10;Example: Why context engineering beats prompt engineering"
            />
          </div>

          {/* Count + Lang */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-[#8a6830] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1 h-1 bg-[#C9A84C] rounded-full shrink-0"></span> عدد السلايدات
              </label>
              <input 
                type="number" 
                value={slideCount}
                onChange={(e) => setSlideCount(parseInt(e.target.value) || 5)}
                min="2" max="10"
                className="bg-[#141d2e] border border-[#1e2d47] text-[#F0EAD8] rounded-lg p-2.5 text-[13px] outline-none transition-all focus:border-[#C9A84C] focus:ring-[3px] focus:ring-[#C9A84C]/10 w-full"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-[#8a6830] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1 h-1 bg-[#C9A84C] rounded-full shrink-0"></span> لغة المحتوى
              </label>
              <select 
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="bg-[#141d2e] border border-[#1e2d47] text-[#F0EAD8] rounded-lg p-2.5 text-[13px] outline-none transition-all focus:border-[#C9A84C] focus:ring-[3px] focus:ring-[#C9A84C]/10 w-full"
              >
                <option value="Arabic">عربي</option>
                <option value="English">English</option>
                <option value="Mixed Arabic-English">Mixed</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-[#4a5a7a] text-[10px] uppercase tracking-wider before:content-[''] before:flex-1 before:h-px before:bg-[#1e2d47] after:content-[''] after:flex-1 after:h-px after:bg-[#1e2d47]">
            الهوية البصرية
          </div>

          {/* Identity Presets */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-[#8a6830] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1 h-1 bg-[#C9A84C] rounded-full shrink-0"></span> قوالب جاهزة
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.values(PRESETS).map(p => (
                <div 
                  key={p.id}
                  onClick={() => handlePresetSelect(p.id as keyof typeof PRESETS)}
                  className={`border rounded-lg p-2.5 cursor-pointer transition-all relative overflow-hidden ${activePreset === p.id ? 'border-[#C9A84C] bg-[#C9A84C]/5' : 'border-[#1e2d47] bg-[#141d2e] hover:border-[#2a3d5c]'}`}
                >
                  {activePreset === p.id && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#C9A84C] to-transparent"></div>
                  )}
                  <div className="text-[11px] font-bold text-white mb-0.5">{p.name}</div>
                  <div className="text-[10px] text-[#6b7fa3] leading-snug">{p.desc}</div>
                  <div className="flex gap-1 mt-1.5">
                    {p.swatches.map((s, i) => (
                      <div key={i} className="w-3 h-3 rounded-sm border border-white/10" style={{ backgroundColor: s }}></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Colors */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-[#8a6830] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1 h-1 bg-[#C9A84C] rounded-full shrink-0"></span> ألوان مخصصة
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <div className="text-[10px] text-[#6b7fa3]">الخلفية</div>
                <div className="flex items-center gap-2 bg-[#141d2e] border border-[#1e2d47] rounded-lg p-1.5 px-2.5 transition-colors focus-within:border-[#C9A84C]">
                  <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="w-6 h-6 border-0 bg-transparent p-0 cursor-pointer rounded shrink-0" />
                  <input type="text" value={bg} onChange={(e) => setBg(e.target.value)} className="border-0 bg-transparent p-0 text-[12px] text-[#6b7fa3] font-mono w-[70px] outline-none" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-[10px] text-[#6b7fa3]">اللون الرئيسي</div>
                <div className="flex items-center gap-2 bg-[#141d2e] border border-[#1e2d47] rounded-lg p-1.5 px-2.5 transition-colors focus-within:border-[#C9A84C]">
                  <input type="color" value={acc} onChange={(e) => setAcc(e.target.value)} className="w-6 h-6 border-0 bg-transparent p-0 cursor-pointer rounded shrink-0" />
                  <input type="text" value={acc} onChange={(e) => setAcc(e.target.value)} className="border-0 bg-transparent p-0 text-[12px] text-[#6b7fa3] font-mono w-[70px] outline-none" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-[10px] text-[#6b7fa3]">النص</div>
                <div className="flex items-center gap-2 bg-[#141d2e] border border-[#1e2d47] rounded-lg p-1.5 px-2.5 transition-colors focus-within:border-[#C9A84C]">
                  <input type="color" value={txt} onChange={(e) => setTxt(e.target.value)} className="w-6 h-6 border-0 bg-transparent p-0 cursor-pointer rounded shrink-0" />
                  <input type="text" value={txt} onChange={(e) => setTxt(e.target.value)} className="border-0 bg-transparent p-0 text-[12px] text-[#6b7fa3] font-mono w-[70px] outline-none" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-[10px] text-[#6b7fa3]">الديكور</div>
                <select value={deco} onChange={(e) => setDeco(e.target.value)} className="bg-[#141d2e] border border-[#1e2d47] text-[#F0EAD8] rounded-lg p-1.5 px-2.5 text-[12px] outline-none transition-all focus:border-[#C9A84C] w-full h-[38px]">
                  <option value="Islamic geometric patterns, thin gold crescent, star scatter">Islamic Geometric</option>
                  <option value="minimal grid lines, thin border frame">Minimal Lines</option>
                  <option value="bold typography only, no decoration">No Decoration</option>
                  <option value="subtle gradient overlay, soft glow">Soft Glow</option>
                  <option value="abstract geometric shapes">Abstract Geo</option>
                </select>
              </div>
            </div>
          </div>

          {/* Extra instructions */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-[#8a6830] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1 h-1 bg-[#C9A84C] rounded-full shrink-0"></span> تعليمات إضافية (اختياري)
            </label>
            <textarea 
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              className="bg-[#141d2e] border border-[#1e2d47] text-[#F0EAD8] rounded-lg p-2.5 text-[13px] outline-none transition-all focus:border-[#C9A84C] focus:ring-[3px] focus:ring-[#C9A84C]/10 resize-y min-h-[54px]"
              placeholder="مثال: أضف CTA في السلايد الأخير، استخدم نبرة تحفيزية..."
            />
          </div>

          <button 
            onClick={generate}
            disabled={isGenerating}
            className="mt-auto bg-gradient-to-br from-[#C9A84C] to-[#8a5e15] text-[#060b0f] border-0 rounded-[10px] p-3.5 text-[14px] font-bold cursor-pointer transition-all hover:not:disabled:opacity-90 hover:not:disabled:-translate-y-px active:not:disabled:translate-y-0 disabled:opacity-45 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full relative overflow-hidden group"
          >
            {isGenerating && <span className="shimmer"></span>}
            <span className="relative z-10 flex items-center gap-2">
              <Sparkles size={16} />
              {isGenerating ? 'جاري التوليد...' : 'توليد الـ Prompts'}
            </span>
            <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>

        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex flex-col h-screen overflow-hidden">
        <div className="flex items-center justify-between p-4 px-7 border-b border-[#1e2d47] bg-[#0e1520] shrink-0">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-[14px] font-bold text-white">Image Prompts</h2>
            <div className="text-[11px] text-[#6b7fa3]">
              {slides.length > 0 ? `${slides.length} slides · ${lang} · جاهزة` : 'في انتظار التوليد'}
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={copyAll}
              className="bg-[#141d2e] border border-[#1e2d47] text-[#6b7fa3] rounded-md px-3.5 py-1.5 text-[11px] font-semibold cursor-pointer transition-all hover:border-[#C9A84C] hover:text-[#C9A84C] flex items-center gap-1.5"
            >
              {copiedAll ? <Check size={14} className="text-[#3dd68c]" /> : <Copy size={14} />}
              {copiedAll ? <span className="text-[#3dd68c]">تم نسخ الكل</span> : 'نسخ الكل'}
            </button>
            <button 
              onClick={exportTxt}
              className="bg-[#141d2e] border border-[#6b4e1a] text-[#C9A84C] rounded-md px-3.5 py-1.5 text-[11px] font-semibold cursor-pointer transition-all hover:border-[#C9A84C] flex items-center gap-1.5"
            >
              <Download size={14} />
              تصدير .txt
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 px-7 flex flex-col gap-4">
          {slides.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-[#6b7fa3] p-10">
              <div className="w-16 h-16 border-2 border-dashed border-[#2a3d5c] rounded-2xl flex items-center justify-center text-2xl opacity-50">
                <LayoutTemplate size={32} />
              </div>
              <h3 className="text-base text-white opacity-50 font-bold">لا يوجد prompts بعد</h3>
              <p className="text-xs opacity-40 text-center leading-relaxed">
                حدد الموضوع والهوية البصرية<br/>من اليسار واضغط "توليد الـ Prompts"
              </p>
            </div>
          ) : (
            slides.map((s, i) => (
              <SlideCard key={i} slide={s} index={i} />
            ))
          )}
        </div>

        <div className="border-t border-[#1e2d47] p-2 px-7 flex items-center gap-4 bg-[#0e1520] shrink-0">
          <div className={`w-1.5 h-1.5 rounded-full ${isGenerating ? 'bg-[#3dd68c] shadow-[0_0_6px_#3dd68c]' : 'bg-[#4a5a7a]'}`}></div>
          <div className="text-[11px] text-[#6b7fa3] w-32">{statusMsg}</div>
          <div className="flex-1 h-[3px] bg-[#1e2d47] rounded-sm overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#6b4e1a] to-[#C9A84C] rounded-sm transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SlideCard({ slide, index }: { slide: Slide, index: number }) {
  const [copied, setCopied] = useState(false);

  const copyPrompt = () => {
    navigator.clipboard.writeText(slide.image_prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const highlightPrompt = (text: string) => {
    // A simple regex-based highlighting approach for React
    const parts = text.split(/(--\w[\w-]*|#[0-9a-fA-F]{3,6}|\d+x\d+|\d+px|\d+mm)/g);
    return parts.map((part, i) => {
      if (/^--\w/.test(part)) return <span key={i} className="text-[#e8c96a]">{part}</span>;
      if (/^#[0-9a-fA-F]/.test(part)) return <span key={i} className="text-[#f0b47c]">{part}</span>;
      if (/^\d+x\d+|^\d+px|^\d+mm/.test(part)) return <span key={i} className="text-[#f0b47c]">{part}</span>;
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div 
      className="bg-[#0e1520] border border-[#1e2d47] rounded-xl overflow-hidden transition-colors hover:border-[#2a3d5c] animate-card-in opacity-0"
      style={{ animationDelay: `${index * 0.07}s`, animationFillMode: 'forwards' }}
    >
      <div className="flex items-center justify-between p-3 px-4 border-b border-[#1e2d47] bg-[#141d2e]">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-[#C9A84C] to-[#6b4e1a] text-[#060b0f] w-6 h-6 rounded-md text-[11px] font-extrabold flex items-center justify-center shrink-0">
            {slide.index}
          </div>
          <div className="text-[10px] text-[#6b7fa3] uppercase tracking-wider font-semibold">
            {TYPE_LABELS[slide.slide_type] || slide.slide_type}
          </div>
        </div>
        <div className="flex gap-1.5">
          <button 
            onClick={copyPrompt}
            className={`bg-transparent border rounded-md px-2.5 py-1 text-[11px] font-cairo transition-all flex items-center gap-1 ${copied ? 'border-[#3dd68c] text-[#3dd68c]' : 'border-[#1e2d47] text-[#6b7fa3] hover:border-[#C9A84C] hover:text-[#C9A84C]'}`}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'تم النسخ' : 'نسخ الـ Prompt'}
          </button>
        </div>
      </div>
      <div className="p-3.5 px-4 pb-2.5 border-b border-[#1e2d47]">
        <div className="text-[15px] font-bold text-white mb-1">{slide.slide_title}</div>
        {slide.slide_body && <div className="text-[12px] text-[#6b7fa3] leading-relaxed">{slide.slide_body}</div>}
      </div>
      <div className="p-3.5 px-4">
        <div className="text-[10px] text-[#8a6830] uppercase tracking-wider font-bold mb-2 flex items-center gap-1.5 after:content-['IMAGE_PROMPT'] after:bg-[#C9A84C]/10 after:border after:border-[#6b4e1a] after:text-[#C9A84C] after:rounded after:px-1.5 after:py-px after:text-[9px] after:tracking-widest">
          Prompt جاهز للنسخ
        </div>
        <div className="bg-[#1a2540] border border-[#1e2d47] rounded-lg p-3 px-3.5 font-mono text-[11.5px] text-[#a8c4e8] leading-relaxed whitespace-pre-wrap break-words relative">
          {highlightPrompt(slide.image_prompt)}
        </div>
      </div>
    </div>
  );
}
