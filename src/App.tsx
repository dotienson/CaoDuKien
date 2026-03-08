import React, { useState, useEffect, useRef } from 'react';
import { translations, Language } from './i18n';
import { Gender, MenarcheStatus, getCoefficients, calculatePAH, calculateMPH, Coefficients } from './data/twmc';
import { Copy, Download, Info, ChevronDown, ChevronUp } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { motion, AnimatePresence } from 'motion/react';

const DateInput = ({ value, onChange, label, ringColor }: { value: string, onChange: (val: string) => void, label: string, ringColor: string }) => {
  const [dd, setDd] = useState('');
  const [mm, setMm] = useState('');
  const [yyyy, setYyyy] = useState('');

  useEffect(() => {
    if (value) {
      const [y, m, d] = value.split('-');
      if (y && m && d) {
        setYyyy(y);
        setMm(m);
        setDd(d);
      }
    }
  }, [value]);

  const ddRef = useRef<HTMLInputElement>(null);
  const mmRef = useRef<HTMLInputElement>(null);
  const yyyyRef = useRef<HTMLInputElement>(null);

  const handleDdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setDd(val);
    if (val.length === 2) {
      mmRef.current?.focus();
      if (mm.length === 2 && yyyy.length === 4) onChange(`${yyyy}-${mm}-${val}`);
    }
  };

  const handleMmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setMm(val);
    if (val.length === 2) {
      yyyyRef.current?.focus();
      if (dd.length === 2 && yyyy.length === 4) onChange(`${yyyy}-${val}-${dd}`);
    }
  };

  const handleYyyyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setYyyy(val);
    if (val.length === 4 && dd.length === 2 && mm.length === 2) {
      onChange(`${val}-${mm}-${dd}`);
    }
  };

  const handleBlur = () => {
    let d = dd;
    let m = mm;
    if (d.length > 0 && d.length < 2) { d = d.padStart(2, '0'); setDd(d); }
    if (m.length > 0 && m.length < 2) { m = m.padStart(2, '0'); setMm(m); }
    if (d && m && yyyy.length === 4) {
      onChange(`${yyyy}-${m}-${d}`);
    }
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      <div className="flex gap-2">
        <input ref={ddRef} value={dd} onChange={handleDdChange} onBlur={handleBlur} placeholder="DD" className={`w-14 md:w-16 px-2 py-2 rounded-xl border border-white/50 bg-white/80 focus:ring-2 ${ringColor} outline-none text-center`} />
        <input ref={mmRef} value={mm} onChange={handleMmChange} onBlur={handleBlur} placeholder="MM" className={`w-14 md:w-16 px-2 py-2 rounded-xl border border-white/50 bg-white/80 focus:ring-2 ${ringColor} outline-none text-center`} />
        <input ref={yyyyRef} value={yyyy} onChange={handleYyyyChange} onBlur={handleBlur} placeholder="YYYY" className={`w-20 px-2 py-2 rounded-xl border border-white/50 bg-white/80 focus:ring-2 ${ringColor} outline-none text-center`} />
      </div>
    </div>
  );
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    if (username.toLowerCase().includes('ta') && password.includes('5555')) {
      setIsLoggedIn(true);
    }
  }, [username, password]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.toLowerCase().includes('ta') && password.includes('5555')) {
      setIsLoggedIn(true);
    } else {
      setLoginError(translations.vi.loginError);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center relative overflow-hidden">
        {/* Blurred background */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-200 to-blue-200 filter blur-3xl opacity-50"></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-md relative z-10 border border-white/50"
        >
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800">Height Prediction</h1>
            <p className="text-sm text-gray-500">by Dr. Son</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{translations.vi.username}</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none bg-white/80"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{translations.vi.password}</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none bg-white/80"
              />
            </div>
            {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-xl transition-colors"
            >
              {translations.vi.login}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6 font-medium">
            {translations.vi.contactDoctor}
          </p>
        </motion.div>
      </div>
    );
  }

  return <MainApp />;
}

function MainApp() {
  const [lang, setLang] = useState<Language>('vi');
  const t = translations[lang];
  const pdfRef = useRef<HTMLDivElement>(null);

  // Form State
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('girl');
  
  const [ageMode, setAgeMode] = useState<'dob' | 'manual'>('manual');
  const today = new Date().toISOString().split('T')[0];
  const [dob, setDob] = useState('');
  const [examDate, setExamDate] = useState(today);
  
  const [ageYears, setAgeYears] = useState<number | ''>('');
  const [ageMonths, setAgeMonths] = useState<number | ''>(0);
  
  const [currentHeight, setCurrentHeight] = useState('');
  const [fatherHeight, setFatherHeight] = useState('');
  const [motherHeight, setMotherHeight] = useState('');
  
  const [menarche, setMenarche] = useState<MenarcheStatus>('none');
  const [boneAge, setBoneAge] = useState('');
  
  const [doctor, setDoctor] = useState('Đỗ Tiến Sơn');
  const [xrayDate, setXrayDate] = useState(today);

  const [showNote, setShowNote] = useState(false);
  const [copied, setCopied] = useState(false);

  // Auto calculate age
  useEffect(() => {
    if (ageMode === 'dob' && dob && examDate) {
      const d1 = new Date(dob);
      const d2 = new Date(examDate);
      if (d2 >= d1) {
        let years = d2.getFullYear() - d1.getFullYear();
        let months = d2.getMonth() - d1.getMonth();
        if (months < 0 || (months === 0 && d2.getDate() < d1.getDate())) {
          years--;
          months += 12;
        }
        if (d2.getDate() < d1.getDate()) {
          months--;
        }
        if (months < 0) months = 11;
        
        setAgeYears(years);
        setAgeMonths(months);
      }
    }
  }, [dob, examDate, ageMode]);

  // Parsing numbers
  const numCurrentHeight = currentHeight ? Number(currentHeight) : '';
  const numFatherHeight = fatherHeight ? Number(fatherHeight) : '';
  const numMotherHeight = motherHeight ? Number(motherHeight) : '';
  const numBoneAge = boneAge ? Number(boneAge) : '';

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}-${m}-${y}`;
  };

  // Calculations
  const isValidHeight = (h: number | '') => h === '' || (h >= 50 && h <= 200);
  
  let invalidAgeError = false;
  if (ageYears !== '') {
    const y = Number(ageYears);
    if (y < 0 || y > 19) {
      invalidAgeError = true;
    }
  }

  const mph = (numFatherHeight && numMotherHeight && isValidHeight(numFatherHeight) && isValidHeight(numMotherHeight)) 
    ? calculateMPH(gender, Number(numFatherHeight), Number(numMotherHeight)) 
    : null;
  
  let pahResult: { pah: number; error: number } | null = null;
  let usedCoeffs: Coefficients | null = null;
  let noDataError = false;
  let outOfRangeError = false;
  let requireMenarcheError = false;

  const isMenarcheValid = gender === 'boy' || menarche !== 'none';

  if (numCurrentHeight && isValidHeight(numCurrentHeight) && ageYears !== '' && numBoneAge !== '' && !invalidAgeError) {
    if (!isMenarcheValid) {
      requireMenarcheError = true;
    } else {
      const chronAge = Number(ageYears) + (Number(ageMonths) || 0) / 12;
      usedCoeffs = getCoefficients(gender, chronAge, menarche);
      if (usedCoeffs) {
        pahResult = calculatePAH(usedCoeffs, Number(numCurrentHeight), chronAge, Number(numBoneAge));
        if (pahResult.pah > 190) {
          outOfRangeError = true;
          pahResult = null;
        }
      } else {
        noDataError = true;
      }
    }
  }

  const genderStr = gender === 'boy' ? t.boy.toLowerCase() : t.girl.toLowerCase();
  const resultTextStr = pahResult ? t.resultText(name, genderStr, String(ageYears), String(ageMonths || 0), currentHeight, String(boneAge), doctor, formatDate(xrayDate), String(pahResult.pah), String(pahResult.error), formatDate(examDate)) : '';

  const handleCopy = () => {
    if (pahResult) {
      navigator.clipboard.writeText(resultTextStr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExportPdf = async () => {
    if (pdfRef.current) {
      try {
        const canvas = await html2canvas(pdfRef.current, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        
        let imgWidth = pdfWidth;
        let imgHeight = (canvas.height * pdfWidth) / canvas.width;
        
        // Scale down if height exceeds 1 page
        if (imgHeight > pageHeight) {
          imgHeight = pageHeight;
          imgWidth = (canvas.width * pageHeight) / canvas.height;
        }
        
        // Center horizontally if scaled down
        const xOffset = (pdfWidth - imgWidth) / 2;
        
        pdf.addImage(imgData, 'PNG', xOffset, 0, imgWidth, imgHeight);
        pdf.save(`CaoDuKien_${name || 'Result'}.pdf`);
      } catch (error) {
        console.error("Lỗi khi xuất PDF:", error);
      }
    }
  };

  const themeColor = gender === 'girl' ? 'pink' : 'blue';
  const bgGradient = gender === 'girl' ? 'from-pink-100 to-pink-200' : 'from-blue-100 to-blue-200';
  const primaryColor = gender === 'girl' ? 'text-pink-600' : 'text-blue-600';
  const primaryBg = gender === 'girl' ? 'bg-pink-600' : 'bg-blue-600';
  const primaryHover = gender === 'girl' ? 'hover:bg-pink-700' : 'hover:bg-blue-700';
  const ringColor = gender === 'girl' ? 'focus:ring-pink-400' : 'focus:ring-blue-400';

  // Chart Logic
  let chartMin = 100;
  let chartMax = 200;
  const pahVal = pahResult ? pahResult.pah : null;
  const mphVal = mph;

  if (pahVal && mphVal) {
    const min = Math.min(pahVal, mphVal);
    const max = Math.max(pahVal, mphVal);
    chartMin = Math.floor(min / 5) * 5 - 5;
    chartMax = Math.ceil(max / 5) * 5 + 5;
    if (chartMax - chartMin < 15) {
      chartMin -= 5;
      chartMax += 5;
    }
  } else if (pahVal) {
    chartMin = Math.floor(pahVal / 10) * 10 - 10;
    chartMax = Math.ceil(pahVal / 10) * 10 + 10;
  } else if (mphVal) {
    chartMin = Math.floor(mphVal / 10) * 10 - 10;
    chartMax = Math.ceil(mphVal / 10) * 10 + 10;
  }
  
  const getPercentage = (val: number) => {
    return Math.max(0, Math.min(100, ((val - chartMin) / (chartMax - chartMin)) * 100));
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${bgGradient} font-sans text-gray-800 p-2 md:p-8 transition-colors duration-500`}>
      <div className="max-w-4xl mx-auto">
        
        {/* Header Controls */}
        <div className="flex justify-end mb-4 gap-2">
          <button 
            onClick={() => setLang('vi')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${lang === 'vi' ? primaryBg + ' text-white' : 'bg-white/50 text-gray-600'}`}
          >
            VI
          </button>
          <button 
            onClick={() => setLang('en')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${lang === 'en' ? primaryBg + ' text-white' : 'bg-white/50 text-gray-600'}`}
          >
            EN
          </button>
          <button 
            onClick={handleExportPdf}
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/50 text-gray-700 hover:bg-white/80 transition-colors text-sm font-medium"
          >
            <Download size={16} /> {t.exportPdf}
          </button>
        </div>

        {/* Main Content to Export */}
        <div ref={pdfRef} className="bg-white/85 backdrop-blur-2xl rounded-3xl shadow-xl border border-white/40 p-4 md:p-10">
          
          {/* Header */}
          <div className="text-center mb-8 md:mb-10">
            <h1 className={`text-2xl md:text-4xl font-bold tracking-tight ${primaryColor} mb-2`}>
              Height Prediction by Dr. Son
            </h1>
            <p className="text-xs md:text-base text-gray-500 font-medium">
              Based on Tanner – Whitehouse – Marshall – Carter Method
            </p>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Left Column */}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{t.name}</label>
                <input type="text" value={name} onChange={e => {
                  const val = e.target.value;
                  const capitalized = val.replace(/(^|\s)\S/g, l => l.toUpperCase());
                  setName(capitalized);
                }} className={`w-full px-4 py-2 rounded-xl border border-white/50 bg-white/80 focus:ring-2 ${ringColor} outline-none transition-all`} />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.gender}</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setGender('boy')}
                    className={`flex-1 py-2 rounded-xl font-medium transition-all ${gender === 'boy' ? 'bg-blue-500 text-white shadow-md' : 'bg-white/60 text-gray-600 hover:bg-blue-100'}`}
                  >
                    {t.boy}
                  </button>
                  <button 
                    onClick={() => setGender('girl')}
                    className={`flex-1 py-2 rounded-xl font-medium transition-all ${gender === 'girl' ? 'bg-pink-500 text-white shadow-md' : 'bg-white/60 text-gray-600 hover:bg-pink-100'}`}
                  >
                    {t.girl}
                  </button>
                </div>
              </div>

              <div className="bg-white/60 p-3 md:p-4 rounded-2xl border border-white/50">
                <div className="flex gap-2 mb-4 border-b border-white/50 pb-2">
                  <button 
                    onClick={() => setAgeMode('manual')}
                    className={`text-sm font-medium px-2 py-1 rounded-lg transition-colors ${ageMode === 'manual' ? primaryBg + ' text-white' : 'text-gray-600 hover:bg-white/80'}`}
                  >
                    {t.manualInput}
                  </button>
                  <button 
                    onClick={() => setAgeMode('dob')}
                    className={`text-sm font-medium px-2 py-1 rounded-lg transition-colors ${ageMode === 'dob' ? primaryBg + ' text-white' : 'text-gray-600 hover:bg-white/80'}`}
                  >
                    {t.calcByDob}
                  </button>
                </div>

                {ageMode === 'dob' ? (
                  <div className="space-y-4">
                    <DateInput label={t.dob} value={dob} onChange={setDob} ringColor={ringColor} />
                    <DateInput label={t.examDate} value={examDate} onChange={setExamDate} ringColor={ringColor} />
                    <div className="pt-2">
                      <span className="text-sm font-semibold text-gray-700">{t.currentAge}: </span>
                      <span className="text-sm font-bold text-gray-900">{ageYears !== '' ? `${ageYears} ${t.years} ${ageMonths} ${t.months}` : '--'}</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{t.currentAge}</label>
                    <div className="flex items-center gap-2">
                      <input type="number" placeholder={t.years} value={ageYears} onChange={e => setAgeYears(e.target.value ? Number(e.target.value) : '')} className={`w-20 px-2 py-2 rounded-xl border border-white/50 bg-white/80 focus:ring-2 ${ringColor} outline-none transition-all text-center`} />
                      <span className="text-sm text-gray-500">{t.years}</span>
                      <input type="number" min="0" max="11" placeholder="00" value={ageMonths} onChange={e => {
                        let val = e.target.value ? Number(e.target.value) : '';
                        if (typeof val === 'number' && val > 11) val = 11;
                        if (typeof val === 'number' && val < 0) val = 0;
                        setAgeMonths(val);
                      }} className={`w-20 px-2 py-2 rounded-xl border border-white/50 bg-white/80 focus:ring-2 ${ringColor} outline-none transition-all text-center`} />
                      <span className="text-sm text-gray-500">{t.months}</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{t.currentHeight}</label>
                <input type="text" inputMode="decimal" value={currentHeight} onChange={e => setCurrentHeight(e.target.value.replace(',', '.'))} className={`w-full px-4 py-2 rounded-xl border border-white/50 bg-white/80 focus:ring-2 ${ringColor} outline-none transition-all`} />
                {!isValidHeight(numCurrentHeight) && <p className="text-xs text-red-500 mt-1">50 - 200 cm</p>}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{t.fatherHeight}</label>
                  <input type="text" inputMode="decimal" value={fatherHeight} onChange={e => setFatherHeight(e.target.value.replace(',', '.'))} className={`w-full px-4 py-2 rounded-xl border border-white/50 bg-white/80 focus:ring-2 ${ringColor} outline-none transition-all`} />
                  {!isValidHeight(numFatherHeight) && <p className="text-xs text-red-500 mt-1">50 - 200 cm</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{t.motherHeight}</label>
                  <input type="text" inputMode="decimal" value={motherHeight} onChange={e => setMotherHeight(e.target.value.replace(',', '.'))} className={`w-full px-4 py-2 rounded-xl border border-white/50 bg-white/80 focus:ring-2 ${ringColor} outline-none transition-all`} />
                  {!isValidHeight(numMotherHeight) && <p className="text-xs text-red-500 mt-1">50 - 200 cm</p>}
                </div>
              </div>

              {mph !== null && (
                <div className="bg-white/70 p-3 rounded-xl border border-white/60 text-sm text-gray-700 flex justify-between items-center">
                  <span className="font-medium">{t.mph}:</span>
                  <span className="font-bold text-lg">{mph} cm <span className="text-gray-500 text-xs font-normal">(+/- 7cm)</span></span>
                </div>
              )}

              {gender === 'girl' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t.menarche}</label>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setMenarche('pre')}
                      className={`flex-1 py-1.5 text-sm rounded-xl font-medium transition-all ${menarche === 'pre' ? primaryBg + ' text-white shadow-md' : 'bg-white/60 text-gray-600 hover:bg-white/80'}`}
                    >
                      {t.noMenarche}
                    </button>
                    <button 
                      onClick={() => setMenarche('post')}
                      className={`flex-1 py-1.5 text-sm rounded-xl font-medium transition-all ${menarche === 'post' ? primaryBg + ' text-white shadow-md' : 'bg-white/60 text-gray-600 hover:bg-white/80'}`}
                    >
                      {t.hasMenarche}
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-white/60 p-4 rounded-2xl border border-white/50 shadow-sm">
                <label className="block text-sm font-semibold text-gray-800 mb-2">{t.boneAge}</label>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 space-y-3">
                    <input type="text" inputMode="decimal" value={boneAge} onChange={e => setBoneAge(e.target.value.replace(',', '.'))} className={`w-full px-4 py-2 rounded-xl border border-white/50 bg-white focus:ring-2 ${ringColor} outline-none transition-all font-bold text-lg`} placeholder="e.g. 12.5" />
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">{t.interpretingDoctor}</label>
                      <input type="text" value={doctor} onChange={e => setDoctor(e.target.value)} className="w-full px-3 py-1.5 rounded-lg border border-white/50 bg-white/80 text-sm outline-none" />
                    </div>
                    <div>
                      <DateInput label={t.xrayDate} value={xrayDate} onChange={setXrayDate} ringColor={ringColor} />
                    </div>
                  </div>
                  
                  {/* Result Box */}
                  <div className={`flex-1 rounded-xl flex flex-col items-center justify-center p-4 text-white shadow-inner ${pahResult ? primaryBg : (outOfRangeError || noDataError || invalidAgeError ? 'bg-red-500' : 'bg-gray-400')}`}>
                    <span className="text-sm font-medium opacity-80">{t.result}</span>
                    {pahResult ? (
                      <div className="text-center">
                        <span className="text-3xl font-bold">{pahResult.pah}</span>
                        <span className="text-sm ml-1">cm</span>
                        <div className="text-xs opacity-80 mt-1">+/- {pahResult.error} cm</div>
                      </div>
                    ) : invalidAgeError ? (
                      <span className="text-sm font-bold mt-2 text-center">{t.invalidAge}</span>
                    ) : requireMenarcheError ? (
                      <span className="text-sm font-bold mt-2 text-center">{t.requireMenarche}</span>
                    ) : outOfRangeError ? (
                      <span className="text-sm font-bold mt-2 text-center">{t.outOfRange}</span>
                    ) : noDataError ? (
                      <span className="text-sm font-bold mt-2 text-center">{t.noData}</span>
                    ) : (
                      <span className="text-xl font-bold mt-1">--</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Formula Display */}
          {usedCoeffs && numCurrentHeight && ageYears !== '' && numBoneAge !== '' && !noDataError && !invalidAgeError && (
             <div className="text-center mb-4 opacity-50 text-xs font-mono text-gray-600">
               {t.formula}: (Height × {usedCoeffs.alpha}) + (Age × {usedCoeffs.beta}) + (Bone Age × {usedCoeffs.gamma}) + {usedCoeffs.c}
             </div>
          )}
          
          {/* TW75 Note Display */}
          {noDataError && !invalidAgeError && (
             <div className="text-center mb-4 text-sm font-medium text-red-500">
               {t.tw75Note}
             </div>
          )}

          {/* Interpretation Text */}
          {pahResult && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-8"
            >
              <div className="bg-white/70 p-4 rounded-2xl border border-white/60 relative">
                <p className="text-sm text-gray-700 leading-relaxed pr-10">
                  {resultTextStr}
                </p>
                <button 
                  onClick={handleCopy}
                  className={`absolute top-4 right-4 p-2 rounded-lg transition-colors ${copied ? 'bg-green-100 text-green-600' : 'bg-white hover:bg-gray-50 text-gray-500 shadow-sm'}`}
                  title={t.copy}
                >
                  <Copy size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Chart Section */}
          <div className="mt-10 pt-8 border-t border-white/40">
            <div className="relative w-full max-w-md mx-auto h-72 border-l-2 border-b-2 border-gray-400 flex items-end justify-around pb-0 px-2 md:px-8 mb-12">
              {/* Y-axis labels */}
              <div className="absolute -left-12 bottom-0 text-xs text-gray-500 font-mono">{chartMin}cm</div>
              <div className="absolute -left-12 top-0 text-xs text-gray-500 font-mono">{chartMax}cm</div>
              <div className="absolute -left-12 top-1/2 text-xs text-gray-500 font-mono">{Math.round((chartMin + chartMax) / 2)}cm</div>
              
              {/* Grid lines */}
              <div className="absolute left-0 right-0 top-0 border-t border-dashed border-gray-300"></div>
              <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-gray-300"></div>

              {/* PAH Bar */}
              <div className="flex flex-col items-center relative w-16 md:w-20 z-10 h-full justify-end">
                <div className="absolute -top-8 text-sm font-bold text-gray-700 bg-white/90 px-2 py-1 rounded shadow-sm whitespace-nowrap z-20">
                  {pahResult ? `${pahResult.pah} cm` : '--'}
                </div>
                <div 
                  className={`w-full rounded-t-md transition-all duration-1000 ${gender === 'girl' ? 'bg-pink-500' : 'bg-blue-500'} shadow-md`} 
                  style={{ height: pahResult ? `${getPercentage(pahResult.pah)}%` : '5%' }}
                ></div>
                <div className="absolute -bottom-6 font-bold text-gray-800 text-sm">PAH</div>
              </div>

              {/* MPH Bar */}
              <div className="flex flex-col items-center relative w-16 md:w-20 z-10 h-full justify-end">
                <div className="absolute -top-8 text-sm font-bold text-gray-600 bg-white/90 px-2 py-1 rounded shadow-sm whitespace-nowrap z-20">
                  {mph ? `${mph} cm` : '--'}
                </div>
                <div 
                  className="w-full rounded-t-md bg-gray-400 transition-all duration-1000 shadow-md" 
                  style={{ height: mph ? `${getPercentage(mph)}%` : '5%' }}
                ></div>
                <div className="absolute -bottom-6 font-bold text-gray-600 text-sm">MPH</div>
              </div>

              {/* Difference indicator */}
              {pahResult && mph && (
                <div className="absolute top-0 right-0 md:-right-12 bg-white/90 px-3 py-2 rounded-xl shadow-sm border border-gray-200 text-center z-20">
                  <div className="text-xs text-gray-500 font-semibold">{t.diff}</div>
                  <div className={`text-lg font-bold ${pahResult.pah > mph ? 'text-green-600' : 'text-red-500'}`}>
                    {pahResult.pah > mph ? '+' : ''}{Math.round((pahResult.pah - mph) * 10) / 10} cm
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-xs text-gray-500 space-y-1 text-center max-w-2xl mx-auto mt-4">
              <p>{t.pahLegend}</p>
              <p>{t.mphLegend}</p>
              <p className="italic">{t.illustrationNote}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-white/40 text-center">
            <p className="text-xs text-gray-500 mb-4">{t.footerText}</p>
            
            <div className="inline-block text-left">
              <button 
                onClick={() => setShowNote(!showNote)}
                className="flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors mx-auto mb-2"
              >
                <Info size={14} /> {t.noteTitle} {showNote ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              
              <AnimatePresence>
                {showNote && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-yellow-50/80 border border-yellow-200 p-3 rounded-xl text-xs text-yellow-800 max-w-xl mx-auto mb-4">
                      {t.noteContent}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="mt-2">
              <a href="https://dotienson.com/app" target="_blank" rel="noopener noreferrer" className={`text-sm font-medium hover:underline ${primaryColor}`}>
                {t.link}
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
