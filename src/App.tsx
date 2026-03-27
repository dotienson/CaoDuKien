import React, { useState, useEffect, useRef } from 'react';
import { translations, Language } from './i18n';
import { Gender, MenarcheStatus, getCoefficients, calculatePAH, calculateMPH, Coefficients } from './data/twmc';
import { calculateRWT, RWTCoefficient } from './data/rwt';
import { bpTable } from './bpTable';
import { Copy, Info, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type PredictionMethod = 'tw1' | 'bp' | 'both' | 'rwt' | 'all';

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
    let val = e.target.value.replace(/\D/g, '').slice(0, 2);
    if (val.length === 2) {
      const num = parseInt(val, 10);
      if (num < 1) val = '01';
      else if (num > 31) val = '31';
    }
    setDd(val);
    if (val.length === 2) {
      mmRef.current?.focus();
      if (mm.length === 2 && yyyy.length === 4) onChange(`${yyyy}-${mm}-${val}`);
    }
  };

  const handleMmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 2);
    if (val.length === 2) {
      const num = parseInt(val, 10);
      if (num < 1) val = '01';
      else if (num > 12) val = '12';
    }
    setMm(val);
    if (val.length === 2) {
      yyyyRef.current?.focus();
      if (dd.length === 2 && yyyy.length === 4) onChange(`${yyyy}-${val}-${dd}`);
    }
  };

  const handleYyyyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (val.length === 4) {
      const num = parseInt(val, 10);
      if (num < 2000) val = '2000';
      else if (num > 2026) val = '2026';
    }
    setYyyy(val);
    if (val.length === 4 && dd.length === 2 && mm.length === 2) {
      onChange(`${val}-${mm}-${dd}`);
    }
  };

  const handleBlur = (field: 'dd' | 'mm' | 'yyyy') => (e: React.FocusEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val) return;

    let currentDd = dd;
    let currentMm = mm;
    let currentYyyy = yyyy;

    if (field === 'dd') {
      if (val.length === 1) val = val.padStart(2, '0');
      const num = parseInt(val, 10);
      if (num < 1) val = '01';
      else if (num > 31) val = '31';
      setDd(val);
      currentDd = val;
    } else if (field === 'mm') {
      if (val.length === 1) val = val.padStart(2, '0');
      const num = parseInt(val, 10);
      if (num < 1) val = '01';
      else if (num > 12) val = '12';
      setMm(val);
      currentMm = val;
    } else if (field === 'yyyy') {
      if (val.length === 4) {
        const num = parseInt(val, 10);
        if (num < 2000) val = '2000';
        else if (num > 2026) val = '2026';
        setYyyy(val);
        currentYyyy = val;
      }
    }

    if (currentDd.length === 2 && currentMm.length === 2 && currentYyyy.length === 4) {
      onChange(`${currentYyyy}-${currentMm}-${currentDd}`);
    }
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      <div className="flex gap-2">
        <input ref={ddRef} value={dd} onChange={handleDdChange} onBlur={handleBlur('dd')} placeholder="DD" className={`w-14 md:w-16 px-2 py-2 rounded-xl border border-white/50 bg-white/80 focus:ring-2 ${ringColor} outline-none text-center`} />
        <input ref={mmRef} value={mm} onChange={handleMmChange} onBlur={handleBlur('mm')} placeholder="MM" className={`w-14 md:w-16 px-2 py-2 rounded-xl border border-white/50 bg-white/80 focus:ring-2 ${ringColor} outline-none text-center`} />
        <input ref={yyyyRef} value={yyyy} onChange={handleYyyyChange} onBlur={handleBlur('yyyy')} placeholder="YYYY" className={`w-20 px-2 py-2 rounded-xl border border-white/50 bg-white/80 focus:ring-2 ${ringColor} outline-none text-center`} />
      </div>
    </div>
  );
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [lang, setLang] = useState<'vi' | 'en'>('vi');
  const t = translations[lang];

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
      <div className="min-h-screen bg-gray-950 flex items-center justify-center relative overflow-hidden">
        {/* Blurred background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-black filter blur-3xl opacity-60"></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/40 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-2xl w-[90%] max-w-sm relative z-10 border border-white/10"
        >
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-100">{t.title}</h1>
            <p 
              className="text-sm text-gray-400 cursor-pointer hover:text-gray-300 transition-colors mt-1"
              onClick={() => setIsLoggedIn(true)}
            >
              by Dr. Son
            </p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">{translations.vi.username}</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-white/10 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-black/50 text-white placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">{translations.vi.password}</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-white/10 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-black/50 text-white placeholder-gray-500"
              />
            </div>
            {loginError && <p className="text-red-400 text-sm">{loginError}</p>}
            <button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-xl transition-colors shadow-lg shadow-indigo-500/30"
            >
              {translations.vi.login}
            </button>
          </form>
          <p className="text-center text-sm text-gray-400 mt-6 font-medium">
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
  
  const [weight, setWeight] = useState('');
  const [recumbentLength, setRecumbentLength] = useState('');

  
  const [menarche, setMenarche] = useState<MenarcheStatus>('none');
  const [boneAge, setBoneAge] = useState('');
  const [noBoneAge, setNoBoneAge] = useState(false);
  
  const [doctor, setDoctor] = useState('Đỗ Tiến Sơn');
  const [xrayDate, setXrayDate] = useState(today);
  const [method, setMethod] = useState<PredictionMethod>('tw1');

  const [showNote, setShowNote] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
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
  const numWeight = weight ? Number(weight) : '';
  const numRecumbentLength = recumbentLength ? Number(recumbentLength) : '';


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

  let mph = (numFatherHeight && numMotherHeight && isValidHeight(numFatherHeight) && isValidHeight(numMotherHeight)) 
    ? calculateMPH(gender, Number(numFatherHeight), Number(numMotherHeight)) 
    : null;
    
  if (!mph && numMotherHeight && isValidHeight(numMotherHeight)) {
    mph = gender === 'boy' ? 99.9 + 0.492 * Number(numMotherHeight) : 96.3 + 0.436 * Number(numMotherHeight);
    mph = Math.round(mph * 10) / 10;
  }
  
  let pahResult: { pah: number; error: number } | null = null;
  let bpResult: { pah: number; error: number; fraction: number } | null = null;
  let rwtResult: { pah: number; error: number; coefficients: RWTCoefficient } | null = null;
  let usedCoeffs: Coefficients | null = null;
  let noDataError = false;
  let bpNoDataError = false;
  let rwtNoDataError = false;
  let outOfRangeError = false;
  let requireMenarcheError = false;

  const isMenarcheValid = gender === 'boy' || menarche !== 'none';
  const chronAge = Number(ageYears) + (Number(ageMonths) || 0) / 12;
  
  const canUseNoBoneAge = true;
  const effectiveBoneAge = noBoneAge ? chronAge : Number(numBoneAge);
  const isBoneAgeDeviated = !noBoneAge && numBoneAge !== '' && Math.abs(effectiveBoneAge - chronAge) > 1.5;

  useEffect(() => {
    if (noBoneAge) {
      setMethod('rwt');
    } else if (isBoneAgeDeviated) {
      setMethod('bp');
    }
  }, [noBoneAge, isBoneAgeDeviated]);

  // Determine available methods based on age
  const availableMethods = {
    tw1: chronAge >= 4 && !noBoneAge && !isBoneAgeDeviated,
    bp: chronAge >= 6 && !noBoneAge,
    rwt: !isBoneAgeDeviated // RWT is available for all ages (1-16) unless BA is deviated
  };

  // Auto-select method if current method is not available
  useEffect(() => {
    if (ageYears !== '') {
      const currentChronAge = Number(ageYears) + (Number(ageMonths) || 0) / 12;
      if (currentChronAge < 4 && method !== 'rwt') {
        setMethod('rwt');
      } else if (currentChronAge >= 4 && currentChronAge < 6 && (method === 'bp' || method === 'all')) {
        setMethod('tw1');
      }
    }
  }, [ageYears, ageMonths]);

  if (numCurrentHeight && isValidHeight(numCurrentHeight) && ageYears !== '' && (numBoneAge !== '' || (noBoneAge && canUseNoBoneAge)) && !invalidAgeError) {
    if (!isMenarcheValid) {
      requireMenarcheError = true;
    } else {
      // TW1 Calculation
      if (availableMethods.tw1) {
        usedCoeffs = getCoefficients(gender, chronAge, menarche);
        if (usedCoeffs) {
          pahResult = calculatePAH(usedCoeffs, Number(numCurrentHeight), chronAge, effectiveBoneAge);
          if (pahResult.pah > 190 || pahResult.pah < 140) {
            outOfRangeError = true;
            pahResult = null;
          }
        } else {
          noDataError = true;
        }
      }

      // BP Calculation
      if (availableMethods.bp) {
        const roundedBA = Math.round(effectiveBoneAge * 4) / 4;
        const diff = effectiveBoneAge - chronAge;
        let category: 'delayed' | 'average' | 'advanced' = 'average';
        if (diff > 1) category = 'advanced';
        else if (diff < -1) category = 'delayed';
        
        const table = bpTable[gender === 'boy' ? 'boys' : 'girls'][category];
        const fraction = table[roundedBA as keyof typeof table];
        
        if (fraction !== undefined) {
          bpResult = {
            pah: Math.round((Number(numCurrentHeight) / fraction) * 10) / 10,
            error: 5,
            fraction
          };
        } else {
          bpNoDataError = true;
        }
      }
      
      // RWT Calculation
      if (availableMethods.rwt && mph !== null) {
        const finalRecumbentLength = numRecumbentLength ? Number(numRecumbentLength) : Number(numCurrentHeight) + 1.25;
        const finalWeight = numWeight ? Number(numWeight) : 0; // Need weight for RWT
        
        if (finalWeight > 0) {
          rwtResult = calculateRWT(
            gender, 
            Number(ageYears), 
            Number(ageMonths), 
            finalRecumbentLength, 
            finalWeight, 
            mph, 
            effectiveBoneAge
          );
          if (!rwtResult) {
            rwtNoDataError = true;
          }
        }
      }
    }
  }

  if (mph !== null && mph < 140) {
    outOfRangeError = true;
    pahResult = null;
    bpResult = null;
    rwtResult = null;
  }

  const genderStr = gender === 'boy' ? t.boy.toLowerCase() : t.girl.toLowerCase();
  
  let resultTextStr = '';
  if ((numBoneAge !== '' || (noBoneAge && canUseNoBoneAge)) && ageYears !== '') {
    if (isBoneAgeDeviated) {
      if (bpResult) {
        resultTextStr = t.resultTextBPOnly(name, genderStr, String(ageYears), String(ageMonths || 0), currentHeight, mph ? String(mph) : '', String(effectiveBoneAge), doctor, formatDate(xrayDate), String(bpResult.pah), formatDate(examDate), isBoneAgeDeviated);
      }
    } else if (method === 'all' && pahResult && bpResult && rwtResult) {
      resultTextStr = t.resultTextAll(name, genderStr, String(ageYears), String(ageMonths || 0), currentHeight, mph ? String(mph) : '', String(effectiveBoneAge), doctor, formatDate(xrayDate), String(bpResult.pah), String(pahResult.pah), String(pahResult.error), String(rwtResult.pah), String(rwtResult.error), formatDate(examDate));
    } else if (method === 'rwt' && rwtResult) {
      resultTextStr = t.resultTextRWT(name, genderStr, String(ageYears), String(ageMonths || 0), currentHeight, mph ? String(mph) : '', String(effectiveBoneAge), doctor, formatDate(xrayDate), String(rwtResult.pah), String(rwtResult.error), formatDate(examDate), noBoneAge);
    } else if (pahResult && bpResult && (method === 'both' || method === 'all')) {
      resultTextStr = t.resultTextBoth(name, genderStr, String(ageYears), String(ageMonths || 0), currentHeight, mph ? String(mph) : '', String(effectiveBoneAge), doctor, formatDate(xrayDate), String(bpResult.pah), String(pahResult.pah), String(pahResult.error), formatDate(examDate));
    } else if (bpResult && rwtResult && method === 'all') {
      resultTextStr = t.resultTextBPRWT(name, genderStr, String(ageYears), String(ageMonths || 0), currentHeight, mph ? String(mph) : '', String(effectiveBoneAge), doctor, formatDate(xrayDate), String(bpResult.pah), String(rwtResult.pah), String(rwtResult.error), formatDate(examDate));
    } else if (pahResult && rwtResult && method === 'all') {
      resultTextStr = t.resultTextTW1RWT(name, genderStr, String(ageYears), String(ageMonths || 0), currentHeight, mph ? String(mph) : '', String(effectiveBoneAge), doctor, formatDate(xrayDate), String(pahResult.pah), String(pahResult.error), String(rwtResult.pah), String(rwtResult.error), formatDate(examDate));
    } else if (bpResult && (method === 'bp' || method === 'both' || method === 'all')) {
      resultTextStr = t.resultTextBPOnly(name, genderStr, String(ageYears), String(ageMonths || 0), currentHeight, mph ? String(mph) : '', String(effectiveBoneAge), doctor, formatDate(xrayDate), String(bpResult.pah), formatDate(examDate), isBoneAgeDeviated);
    } else if (pahResult && (method === 'tw1' || method === 'both' || method === 'all')) {
      resultTextStr = t.resultText(name, genderStr, String(ageYears), String(ageMonths || 0), currentHeight, mph ? String(mph) : '', String(effectiveBoneAge), doctor, formatDate(xrayDate), String(pahResult.pah), String(pahResult.error), formatDate(examDate));
    }
  }

  const handleReset = () => {
    setName('');
    setGender('boy');
    setDob('');
    setExamDate(new Date().toISOString().split('T')[0]);
    setAgeYears('');
    setAgeMonths(0);
    setCurrentHeight('');
    setFatherHeight('');
    setMotherHeight('');
    setBoneAge('');
    setNoBoneAge(false);
    setXrayDate(new Date().toISOString().split('T')[0]);
    setDoctor('Đỗ Tiến Sơn');
    setMethod('all');
    setWeight('');
    setMenarche('none');
    setShowResetModal(false);
  };

  const handleCopy = () => {
    if (resultTextStr) {
      navigator.clipboard.writeText(resultTextStr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
  const pahVal = (method === 'tw1' || method === 'both' || method === 'all') ? (pahResult ? pahResult.pah : null) : null;
  const bpVal = (method === 'bp' || method === 'both' || method === 'all') ? (bpResult ? bpResult.pah : null) : null;
  const rwtVal = (method === 'rwt' || method === 'all') ? (rwtResult ? rwtResult.pah : null) : null;
  const mphVal = mph;

  const allVals = [pahVal, bpVal, rwtVal, mphVal].filter(v => v !== null) as number[];
  
  if (allVals.length > 0) {
    const min = Math.min(...allVals);
    const max = Math.max(...allVals);
    chartMin = Math.floor(min / 5) * 5 - 5;
    chartMax = Math.ceil(max / 5) * 5 + 5;
    if (chartMax - chartMin < 15) {
      chartMin -= 5;
      chartMax += 5;
    }
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
        </div>

        {/* Main Content to Export */}
        <div className="bg-white/85 backdrop-blur-2xl rounded-3xl shadow-xl border border-white/40 p-4 md:p-10">
          
          {/* Header */}
          <div className="text-center mb-8 md:mb-10">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{t.title}</h1>
            <p className="text-gray-600 font-medium mt-1">{t.subtitle}</p>
            <p className="text-xs text-gray-500 mt-2 whitespace-pre-line leading-relaxed">
              {t.subtitleNote}
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-semibold text-gray-700">{t.currentHeight}</label>
                  <a href="https://who-zeta.vercel.app" target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1 text-xs font-medium ${primaryColor} hover:underline`}>
                    <ExternalLink size={12} /> {t.compareWHO}
                  </a>
                </div>
                <input type="text" inputMode="decimal" value={currentHeight} onChange={e => setCurrentHeight(e.target.value.replace(',', '.'))} className={`w-full px-4 py-2 rounded-xl border border-white/50 bg-white/80 focus:ring-2 ${ringColor} outline-none transition-all`} />
                {!isValidHeight(numCurrentHeight) && <p className="text-xs text-red-500 mt-1">50 - 200 cm</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{t.weight}</label>
                  <input type="text" inputMode="decimal" value={weight} onChange={e => setWeight(e.target.value.replace(',', '.'))} className={`w-full px-4 py-2 rounded-xl border border-white/50 bg-white/80 focus:ring-2 ${ringColor} outline-none transition-all`} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{t.recumbentLength} <span className="text-xs font-normal text-gray-500">(opt)</span></label>
                  <input type="text" inputMode="decimal" value={recumbentLength} onChange={e => setRecumbentLength(e.target.value.replace(',', '.'))} placeholder={numCurrentHeight ? String(numCurrentHeight + 1.25) : ''} className={`w-full px-4 py-2 rounded-xl border border-white/50 bg-white/80 focus:ring-2 ${ringColor} outline-none transition-all`} />
                  {numRecumbentLength !== '' && numCurrentHeight !== '' && Number(numRecumbentLength) < Number(numCurrentHeight) && <p className="text-xs text-red-500 mt-1">Chiều cao nằm không hợp lệ</p>}
                </div>
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
              
              <div className="bg-white/70 p-3 rounded-xl border border-white/60 text-sm text-gray-700 flex justify-between items-center">
                <span className="font-medium">{t.mph}:</span>
                <span className="font-bold text-lg">{mph} cm <span className="text-gray-500 text-xs font-normal">(+/- 8.5cm)</span></span>
              </div>

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
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-800">{t.boneAge}</label>
                  <a href="https://ba-drson.vercel.app" target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1 text-xs font-medium ${primaryColor} hover:underline`}>
                    <ExternalLink size={12} /> {t.openAtlas}
                  </a>
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 space-y-3">
                    <input type="text" inputMode="decimal" value={boneAge} onChange={e => setBoneAge(e.target.value.replace(',', '.'))} disabled={noBoneAge && canUseNoBoneAge} className={`w-full px-4 py-2 rounded-xl border border-white/50 bg-white focus:ring-2 ${ringColor} outline-none transition-all font-bold text-lg disabled:opacity-50`} placeholder={t.egBoneAge} />
                    
                    {canUseNoBoneAge && (
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="noBoneAge" checked={noBoneAge} onChange={(e) => setNoBoneAge(e.target.checked)} className={`rounded border-gray-300 text-${themeColor}-600 focus:ring-${themeColor}-500`} />
                        <label htmlFor="noBoneAge" className="text-sm text-gray-600">{t.noBoneAge}</label>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">{t.interpretingDoctor}</label>
                      <input type="text" value={doctor} onChange={e => setDoctor(e.target.value)} className="w-full px-3 py-1.5 rounded-lg border border-white/50 bg-white/80 text-sm outline-none" />
                    </div>
                    <div>
                      <DateInput label={t.xrayDate} value={xrayDate} onChange={setXrayDate} ringColor={ringColor} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">{t.predictionMethod}</label>
                      <div className="flex flex-col gap-1">
                        {availableMethods.tw1 && (
                          <label className="flex items-center gap-2 text-sm">
                            <input type="radio" name="method" value="tw1" checked={method === 'tw1'} onChange={() => setMethod('tw1')} className={`text-${themeColor}-600 focus:ring-${themeColor}-500`} />
                            {t.methodTW1}
                          </label>
                        )}
                        {availableMethods.bp && (
                          <label className="flex items-center gap-2 text-sm">
                            <input type="radio" name="method" value="bp" checked={method === 'bp'} onChange={() => setMethod('bp')} className={`text-${themeColor}-600 focus:ring-${themeColor}-500`} />
                            {t.methodBP}
                          </label>
                        )}
                        {availableMethods.rwt && (
                          <label className="flex items-center gap-2 text-sm">
                            <input type="radio" name="method" value="rwt" checked={method === 'rwt'} onChange={() => setMethod('rwt')} className={`text-${themeColor}-600 focus:ring-${themeColor}-500`} />
                            {t.methodRWT}
                          </label>
                        )}
                        {!noBoneAge && !isBoneAgeDeviated && (
                          <label className="flex items-center gap-2 text-sm">
                            <input type="radio" name="method" value="all" checked={method === 'all'} onChange={() => setMethod('all')} className={`text-${themeColor}-600 focus:ring-${themeColor}-500`} />
                            {t.methodAll}
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Result Box */}
                  <div className={`flex-1 rounded-xl flex flex-col items-center justify-center p-4 text-white shadow-inner ${(method === 'tw1' ? pahResult : method === 'bp' ? bpResult : method === 'rwt' ? rwtResult : (pahResult || bpResult || rwtResult)) ? primaryBg : (outOfRangeError || noDataError || invalidAgeError ? 'bg-red-500' : 'bg-gray-400')}`}>
                    {(!pahResult && !bpResult && !rwtResult && !invalidAgeError && !requireMenarcheError && !outOfRangeError && !noDataError && !bpNoDataError && !rwtNoDataError) ? (
                      <div className="flex flex-col items-center justify-center w-full h-full">
                        <span className="text-4xl font-bold opacity-80">--</span>
                        <span className="text-[10px] font-medium opacity-80 mt-1">{method === 'tw1' ? t.resultTW1 : method === 'bp' ? t.resultBP : method === 'rwt' ? t.resultRWT : method === 'both' ? `${t.resultTW1}/${t.resultBP}` : `${t.resultTW1}/${t.resultBP}/${t.resultRWT}`}</span>
                      </div>
                    ) : noBoneAge ? (
                      <div className="text-center">
                        {rwtResult ? (
                          <>
                            <div className="flex items-baseline justify-center gap-1">
                              <span className="text-4xl font-bold">{rwtResult.pah}</span>
                              <span className="text-sm">cm</span>
                            </div>
                            <div className="text-xs opacity-80 mt-1">{t.resultRWT} (+/- {rwtResult.error} cm)</div>
                          </>
                        ) : (
                          <>
                            <span className="text-4xl font-bold opacity-80">--</span>
                            <div className="text-xs opacity-80 mt-1">{t.resultRWT}</div>
                          </>
                        )}
                      </div>
                    ) : method === 'both' ? (
                      <div className="flex flex-row md:flex-col w-full h-full gap-2 md:gap-4">
                        <div className="flex-1 flex flex-col items-center justify-center border-r md:border-r-0 md:border-b border-white/30 pr-2 md:pr-0 md:pb-2">
                          {pahResult ? (
                            <div className="text-center">
                              <div className="flex items-baseline justify-center gap-1">
                                <span className="text-2xl font-bold">{pahResult.pah}</span>
                                <span className="text-xs">cm</span>
                              </div>
                              <div className="text-[10px] opacity-80 mt-1">{t.resultTW1} (+/- {pahResult.error} cm)</div>
                            </div>
                          ) : (
                            <div className="text-center">
                              <span className="text-xl font-bold opacity-80">--</span>
                              <div className="text-[10px] opacity-80 mt-1">{t.resultTW1}</div>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center pl-2 md:pl-0 md:pt-2">
                          {bpResult ? (
                            <div className="text-center">
                              <div className="flex items-baseline justify-center gap-1">
                                <span className="text-2xl font-bold">{bpResult.pah}</span>
                                <span className="text-xs">cm</span>
                              </div>
                              <div className="text-[10px] opacity-80 mt-1">{t.resultBP} (+/- {bpResult.error} cm)</div>
                            </div>
                          ) : (
                            <div className="text-center">
                              <span className="text-xl font-bold opacity-80">--</span>
                              <div className="text-[10px] opacity-80 mt-1">{t.resultBP}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : method === 'all' ? (
                      <div className="flex flex-col w-full h-full gap-2">
                        <div className="flex-1 flex flex-col items-center justify-center border-b border-white/30 pb-1">
                          {pahResult ? (
                            <div className="text-center">
                              <div className="flex items-baseline justify-center gap-1">
                                <span className="text-xl font-bold">{pahResult.pah}</span>
                                <span className="text-[10px]">cm</span>
                              </div>
                              <div className="text-[10px] opacity-80">{t.resultTW1} (+/- {pahResult.error} cm)</div>
                            </div>
                          ) : (
                            <div className="text-center">
                              <span className="text-lg font-bold opacity-80">--</span>
                              <div className="text-[10px] opacity-80">{t.resultTW1}</div>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center border-b border-white/30 pb-1">
                          {bpResult ? (
                            <div className="text-center">
                              <div className="flex items-baseline justify-center gap-1">
                                <span className="text-xl font-bold">{bpResult.pah}</span>
                                <span className="text-[10px]">cm</span>
                              </div>
                              <div className="text-[10px] opacity-80">{t.resultBP} (+/- {bpResult.error} cm)</div>
                            </div>
                          ) : (
                            <div className="text-center">
                              <span className="text-lg font-bold opacity-80">--</span>
                              <div className="text-[10px] opacity-80">{t.resultBP}</div>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center">
                          {rwtResult ? (
                            <div className="text-center">
                              <div className="flex items-baseline justify-center gap-1">
                                <span className="text-xl font-bold">{rwtResult.pah}</span>
                                <span className="text-[10px]">cm</span>
                              </div>
                              <div className="text-[10px] opacity-80">{t.resultRWT} (+/- {rwtResult.error} cm)</div>
                            </div>
                          ) : (
                            <div className="text-center">
                              <span className="text-lg font-bold opacity-80">--</span>
                              <div className="text-[10px] opacity-80">{t.resultRWT}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <>
                        {(method === 'tw1' ? pahResult : method === 'bp' ? bpResult : rwtResult) ? (
                          <div className="text-center">
                            <div className="flex items-baseline justify-center gap-1">
                              <span className="text-4xl font-bold">{(method === 'tw1' ? pahResult : method === 'bp' ? bpResult : rwtResult)?.pah}</span>
                              <span className="text-sm">cm</span>
                            </div>
                            <div className="text-xs opacity-80 mt-1">{method === 'tw1' ? t.resultTW1 : method === 'bp' ? t.resultBP : t.resultRWT} (+/- {(method === 'tw1' ? pahResult : method === 'bp' ? bpResult : rwtResult)?.error} cm)</div>
                          </div>
                        ) : invalidAgeError ? (
                          <span className="text-sm font-bold mt-2 text-center">{t.invalidAge}</span>
                        ) : requireMenarcheError ? (
                          <span className="text-sm font-bold mt-2 text-center">{t.requireMenarche}</span>
                        ) : outOfRangeError ? (
                          <span className="text-sm font-bold mt-2 text-center">{t.outOfRange}</span>
                        ) : (method === 'tw1' && noDataError) ? (
                          <div className="text-center">
                            <span className="text-xl font-bold opacity-80">--</span>
                            <div className="text-xs font-bold mt-1">{t.noData} (TW1)</div>
                          </div>
                        ) : (method === 'bp' && bpNoDataError) ? (
                          <div className="text-center">
                            <span className="text-xl font-bold opacity-80">--</span>
                            <div className="text-xs font-bold mt-1">{t.bpNoCoeff}</div>
                          </div>
                        ) : (method === 'rwt' && rwtNoDataError) ? (
                          <div className="text-center">
                            <span className="text-xl font-bold opacity-80">--</span>
                            <div className="text-xs font-bold mt-1">{numWeight ? t.rwtNoCoeff : t.rwtNoWeight}</div>
                          </div>
                        ) : (
                          <div className="text-center">
                            <span className="text-4xl font-bold opacity-80">--</span>
                            <div className="text-xs opacity-80 mt-1">{method === 'tw1' ? t.resultTW1 : method === 'bp' ? t.resultBP : t.resultRWT}</div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TW75 & BP Note Display */}
          {(noDataError || bpNoDataError || isBoneAgeDeviated) && !invalidAgeError && (
             <div className="text-center mb-4 text-sm font-medium text-red-500 space-y-1">
               {noDataError && <div>{t.tw75Note}</div>}
               {bpNoDataError && <div>{t.bpNoCoeff}</div>}
               {isBoneAgeDeviated && <div>{t.boneAgeDeviated}</div>}
             </div>
          )}

          {/* Interpretation Text */}
          {resultTextStr && (
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
              <div className="absolute left-1 bottom-0 text-[10px] text-gray-400 font-mono">{chartMin}</div>
              <div className="absolute left-1 top-0 text-[10px] text-gray-400 font-mono">{chartMax}</div>
              <div className="absolute left-1 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-mono">{Math.round((chartMin + chartMax) / 2)}</div>
              <div className="absolute -left-6 -bottom-4 text-[10px] text-gray-400 font-mono">cm</div>
              
              {/* Grid lines */}
              <div className="absolute left-0 right-0 top-0 border-t border-dashed border-gray-300"></div>
              <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-gray-300"></div>

              {/* PAH TW1 Bar */}
              {(method === 'tw1' || method === 'both' || method === 'all') && !noDataError && (
                <div className="flex flex-col items-center relative w-16 md:w-20 z-10 h-full justify-end">
                  <div className="absolute -top-8 text-sm font-bold text-gray-700 bg-white/90 px-2 py-1 rounded shadow-sm whitespace-nowrap z-20">
                    {pahResult ? `${pahResult.pah} cm` : '--'}
                  </div>
                  <div 
                    className={`w-full rounded-t-md transition-all duration-1000 ${gender === 'girl' ? 'bg-pink-500' : 'bg-blue-500'} shadow-md`} 
                    style={{ height: pahResult ? `${getPercentage(pahResult.pah)}%` : '5%' }}
                  ></div>
                  <div className="absolute -bottom-6 font-bold text-gray-800 text-sm">TW1</div>
                </div>
              )}

              {/* PAH BP Bar */}
              {(method === 'bp' || method === 'both' || method === 'all') && !bpNoDataError && (
                <div className="flex flex-col items-center relative w-16 md:w-20 z-10 h-full justify-end">
                  <div className="absolute -top-8 text-sm font-bold text-gray-700 bg-white/90 px-2 py-1 rounded shadow-sm whitespace-nowrap z-20">
                    {bpResult ? `${bpResult.pah} cm` : '--'}
                  </div>
                  <div 
                    className={`w-full rounded-t-md transition-all duration-1000 ${gender === 'girl' ? 'bg-pink-400' : 'bg-blue-400'} shadow-md`} 
                    style={{ height: bpResult ? `${getPercentage(bpResult.pah)}%` : '5%' }}
                  ></div>
                  <div className="absolute -bottom-6 font-bold text-gray-800 text-sm">BP</div>
                </div>
              )}

              {/* PAH RWT Bar */}
              {(method === 'rwt' || method === 'all') && !rwtNoDataError && (
                <div className="flex flex-col items-center relative w-16 md:w-20 z-10 h-full justify-end">
                  <div className="absolute -top-8 text-sm font-bold text-gray-700 bg-white/90 px-2 py-1 rounded shadow-sm whitespace-nowrap z-20">
                    {rwtResult ? `${rwtResult.pah} cm` : '--'}
                  </div>
                  <div 
                    className={`w-full rounded-t-md transition-all duration-1000 ${gender === 'girl' ? 'bg-pink-300' : 'bg-blue-300'} shadow-md`} 
                    style={{ height: rwtResult ? `${getPercentage(rwtResult.pah)}%` : '5%' }}
                  ></div>
                  <div className="absolute -bottom-6 font-bold text-gray-800 text-sm">RWT</div>
                </div>
              )}

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
              {method !== 'both' && method !== 'all' && (method === 'tw1' ? pahResult : method === 'bp' ? bpResult : rwtResult) && mph && (
                <div className="absolute top-0 right-0 md:-right-12 bg-white/90 px-3 py-2 rounded-xl shadow-sm border border-gray-200 text-center z-20">
                  <div className="text-xs text-gray-500 font-semibold">{t.diff}</div>
                  <div className={`text-lg font-bold ${(method === 'tw1' ? pahResult : method === 'bp' ? bpResult : rwtResult)!.pah > mph ? 'text-green-600' : 'text-red-500'}`}>
                    {(method === 'tw1' ? pahResult : method === 'bp' ? bpResult : rwtResult)!.pah > mph ? '+' : ''}{Math.round(((method === 'tw1' ? pahResult : method === 'bp' ? bpResult : rwtResult)!.pah - mph) * 10) / 10} cm
                  </div>
                </div>
              )}
              {(method === 'both' || method === 'all') && mph && (
                <div className="absolute top-0 right-0 md:-right-12 bg-white/90 px-3 py-2 rounded-xl shadow-sm border border-gray-200 text-center z-20">
                  <div className="text-xs text-gray-500 font-semibold">{t.diff}</div>
                  {(method === 'both' || method === 'all') && pahResult && (
                    <div className={`text-sm font-bold ${pahResult.pah > mph ? 'text-green-600' : 'text-red-500'}`}>
                      TW1: {pahResult.pah > mph ? '+' : ''}{Math.round((pahResult.pah - mph) * 10) / 10} cm
                    </div>
                  )}
                  {(method === 'both' || method === 'all') && bpResult && (
                    <div className={`text-sm font-bold ${bpResult.pah > mph ? 'text-green-600' : 'text-red-500'}`}>
                      BP: {bpResult.pah > mph ? '+' : ''}{Math.round((bpResult.pah - mph) * 10) / 10} cm
                    </div>
                  )}
                  {method === 'all' && rwtResult && (
                    <div className={`text-sm font-bold ${rwtResult.pah > mph ? 'text-green-600' : 'text-red-500'}`}>
                      RWT: {rwtResult.pah > mph ? '+' : ''}{Math.round((rwtResult.pah - mph) * 10) / 10} cm
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="text-xs text-gray-500 text-center max-w-2xl mx-auto mt-4">
              <div className="md:space-y-1">
                {t.pahLegend && <span className="md:block">{t.pahLegend} </span>}
                <span className="md:block">{t.mphLegend} </span>
                <span className="italic md:block">{t.illustrationNote} </span>
                {usedCoeffs && numCurrentHeight && ageYears !== '' && numBoneAge !== '' && !noDataError && !invalidAgeError && (
                  <span className="italic md:block">
                    {t.tw1Formula}: (Height × {usedCoeffs.alpha}) + (Age × {usedCoeffs.beta}) + (Bone Age × {usedCoeffs.gamma}) + {usedCoeffs.c}{' '}
                  </span>
                )}
                {bpResult && (
                  <span className="italic md:block">
                    {t.bpCoeff}: {bpResult.fraction}
                  </span>
                )}
                {rwtResult && (
                  <span className="italic md:block">
                    RWT Coefficients: βRL={rwtResult.coefficients.betaRL}, βW={rwtResult.coefficients.betaW}, βMPS={rwtResult.coefficients.betaMPS}, βSA={rwtResult.coefficients.betaSA}, β0={rwtResult.coefficients.beta0}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-white/40 text-center">
            <button
              onClick={() => setShowResetModal(true)}
              className="mb-8 inline-flex items-center gap-2 px-6 py-2.5 bg-white/80 hover:bg-white text-gray-700 font-semibold rounded-full shadow-sm border border-white/60 transition-all hover:scale-105"
            >
              <RefreshCw size={18} /> {t.newSession}
            </button>

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
            
            <div className="mt-2 flex flex-col items-center gap-3">
              <a href="https://dotienson.com/app" target="_blank" rel="noopener noreferrer" className={`text-sm font-medium hover:underline ${primaryColor}`}>
                {t.link}
              </a>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <a 
                  href="https://tw2-drson.vercel.app/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center justify-center px-4 py-1.5 bg-[#C05621] hover:bg-[#9C4221] text-white text-xs font-medium rounded-full shadow-sm transition-colors"
                >
                  {t.useTW2}
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <Modal 
        show={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleReset}
        title={t.confirmReset}
        confirmText={t.confirm}
        cancelText={t.continue}
      />
    </div>
  );
}

function RefreshCw({ size }: { size: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}

function Modal({ show, onClose, onConfirm, title, confirmText, cancelText, type = 'danger' }: { 
  show: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  title: string; 
  confirmText: string; 
  cancelText: string;
  type?: 'danger' | 'success';
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden"
      >
        <div className="p-6 text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${type === 'danger' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
            <Info size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
          <div className="flex flex-col gap-2 mt-6">
            <button
              onClick={onConfirm}
              className="w-full py-3 rounded-xl font-bold text-white transition-transform active:scale-95 bg-red-500 hover:bg-red-600"
            >
              {confirmText}
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl font-bold text-white transition-transform active:scale-95 bg-green-500 hover:bg-green-600"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
