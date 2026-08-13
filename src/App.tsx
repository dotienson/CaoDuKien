import React, { useState, useEffect, useRef } from 'react';
import { translations, Language } from './i18n';
import { Gender, MenarcheStatus, getCoefficients, calculatePAH, calculateMPH, Coefficients } from './data/twmc';
import { calculateRWT, RWTCoefficient } from './data/rwt';
import { bpTable } from './bpTable';
import { Copy, Info, ChevronDown, ChevronUp, ExternalLink, FileText, FileDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { exportDocx } from './utils/exportMetrics';
import { HeightPredictionChart } from './components/HeightPredictionChart';
import { PrintableReport } from './components/PrintableReport';

type PredictionMethod = 'tw1' | 'bp' | 'both' | 'rwt' | 'all';

const DateInput = ({ value, onChange, label, className = '' }: { value: string, onChange: (val: string) => void, label: string, className?: string }) => {
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
        <input inputMode="numeric" pattern="[0-9]*" ref={ddRef} value={dd} onChange={handleDdChange} onBlur={handleBlur('dd')} placeholder="DD" className={`w-14 md:w-16 px-2 py-1.5 rounded-lg border bg-white outline-none text-center transition-all ${className}`} />
        <input inputMode="numeric" pattern="[0-9]*" ref={mmRef} value={mm} onChange={handleMmChange} onBlur={handleBlur('mm')} placeholder="MM" className={`w-14 md:w-16 px-2 py-1.5 rounded-lg border bg-white outline-none text-center transition-all ${className}`} />
        <input inputMode="numeric" pattern="[0-9]*" ref={yyyyRef} value={yyyy} onChange={handleYyyyChange} onBlur={handleBlur('yyyy')} placeholder="YYYY" className={`w-20 px-2 py-1.5 rounded-lg border bg-white outline-none text-center transition-all ${className}`} />
      </div>
    </div>
  );
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [lang, setLang] = useState<'vi' | 'en'>('vi');
  const t = translations[lang];

  useEffect(() => {
    try {
      const authInfo = localStorage.getItem('hexaPahAuth');
      if (authInfo) {
        const parsed = JSON.parse(authInfo);
        if (parsed.isLoggedIn && parsed.expiresAt > Date.now()) {
          setIsLoggedIn(true);
        }
      }
    } catch (e) {
      console.warn('Failed to access auth localStorage');
    }
  }, []);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      // Auto logout after 5 minutes (300000 ms)
      timeoutId = setTimeout(() => {
        setIsLoggedIn(false);
        localStorage.removeItem('hexaPahAuth');
      }, 5 * 60 * 1000);
    };

    if (isLoggedIn) {
      resetTimer();
      window.addEventListener('mousemove', resetTimer);
      window.addEventListener('keydown', resetTimer);
      window.addEventListener('click', resetTimer);
      window.addEventListener('scroll', resetTimer);
    }

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
      window.removeEventListener('scroll', resetTimer);
    };
  }, [isLoggedIn]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.endsWith('12')) {
      setIsLoggedIn(true);
      try {
        localStorage.setItem('hexaPahAuth', JSON.stringify({
          isLoggedIn: true,
          expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes (initial)
        }));
      } catch (e) {
        console.warn('Failed to set auth localStorage');
      }
    } else {
      setLoginError(translations.vi.loginError);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-full max-w-[350px] mx-4"
        >
          <div className="bg-white px-10 pt-10 pb-8 border border-gray-300 flex flex-col items-center">
            
            <div className="text-center mb-8">
              <h1 className="font-bold text-gray-900 tracking-tight">
                <span className="block md:hidden text-2xl">
                  PolyPredict APH Dr.Son
                </span>
                <span className="hidden md:block text-3xl">
                  PolyPredict APH version 26.8<br/>
                  <span className="text-xl font-medium opacity-80 mt-1 block">Tác giả: Bác sĩ Đỗ Tiến Sơn</span>
                </span>
              </h1>
            </div>
            
            <form onSubmit={handleLogin} className="w-full space-y-3">
              <div className="w-full">
                <input 
                  type="password" 
                  placeholder="Mã truy cập"
                  value={password}
                  onChange={(e) => setPassword(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-2 py-2.5 rounded-sm border border-gray-300 focus:border-gray-400 bg-gray-50 outline-none text-gray-900 text-xs transition-colors"
                />
              </div>

              {loginError && (
                <p className="text-red-500 text-sm text-center my-3">
                  {loginError}
                </p>
              )}

              <button 
                type="submit"
                className="w-full bg-[#0095f6] hover:bg-[#1877f2] text-white font-semibold py-2 rounded-lg text-sm transition-colors mt-2"
              >
                {translations.vi.login}
              </button>
            </form>
          </div>
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
  const [boneXpertPah, setBoneXpertPah] = useState('');
  const [boneXpertError, setBoneXpertError] = useState('');
  const [aphv, setAphv] = useState('');
  const [isTeleconsultation, setIsTeleconsultation] = useState(false);
  const [hideCoefficients, setHideCoefficients] = useState(false);

  const [showNote, setShowNote] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showSessionPrompt, setShowSessionPrompt] = useState(false);
  const [copied, setCopied] = useState(false);
  const isInitializing = useRef(true);

  useEffect(() => {
    try {
      const savedInfo = localStorage.getItem('triPredictState');
      if (savedInfo) {
        try {
          const parsed = JSON.parse(savedInfo);
          if (parsed.currentHeight || parsed.boneAge || parsed.name) {
            setShowRestoreModal(true);
            if (parsed.name) setName(parsed.name);
            if (parsed.gender) setGender(parsed.gender);
            if (parsed.ageMode) setAgeMode(parsed.ageMode);
            if (parsed.dob) setDob(parsed.dob);
            if (parsed.examDate) setExamDate(parsed.examDate);
            if (parsed.ageYears !== undefined) setAgeYears(parsed.ageYears);
            if (parsed.ageMonths !== undefined) setAgeMonths(parsed.ageMonths);
            if (parsed.currentHeight) setCurrentHeight(parsed.currentHeight);
            if (parsed.fatherHeight) setFatherHeight(parsed.fatherHeight);
            if (parsed.motherHeight) setMotherHeight(parsed.motherHeight);
            if (parsed.weight) setWeight(parsed.weight);
            if (parsed.recumbentLength) setRecumbentLength(parsed.recumbentLength);
            if (parsed.menarche) setMenarche(parsed.menarche);
            if (parsed.boneAge) setBoneAge(parsed.boneAge);
            if (parsed.noBoneAge !== undefined) setNoBoneAge(parsed.noBoneAge);
            if (parsed.doctor) setDoctor(parsed.doctor);
            if (parsed.xrayDate) setXrayDate(parsed.xrayDate);
            if (parsed.method) setMethod(parsed.method);
            if (parsed.boneXpertPah) setBoneXpertPah(parsed.boneXpertPah);
            if (parsed.boneXpertError) setBoneXpertError(parsed.boneXpertError);
            if (parsed.aphv) setAphv(parsed.aphv);
            if (parsed.isTeleconsultation !== undefined) setIsTeleconsultation(parsed.isTeleconsultation);
            if (parsed.hideCoefficients !== undefined) setHideCoefficients(parsed.hideCoefficients);
            if (parsed.lang) setLang(parsed.lang);
          }
        } catch (e) {
          console.warn('Failed to parse cached state');
        }
      }
    } catch (e) {
      console.warn('Failed to access localStorage');
    }
    setTimeout(() => {
      isInitializing.current = false;
    }, 500);
  }, []);

  useEffect(() => {
    if (isInitializing.current) return;
    const stateToSave = {
      lang, name, gender, ageMode, dob, examDate, ageYears, ageMonths, currentHeight, fatherHeight, motherHeight, weight, recumbentLength, menarche, boneAge, noBoneAge, doctor, xrayDate, method, boneXpertPah, boneXpertError, aphv, isTeleconsultation, hideCoefficients
    };
    try {
      localStorage.setItem('triPredictState', JSON.stringify(stateToSave));
    } catch (e) {
      console.warn('Failed to set localStorage');
    }
  }, [lang, name, gender, ageMode, dob, examDate, ageYears, ageMonths, currentHeight, fatherHeight, motherHeight, weight, recumbentLength, menarche, boneAge, noBoneAge, doctor, xrayDate, method, boneXpertPah, boneXpertError, aphv, isTeleconsultation, hideCoefficients]);

  const confirmNewSessionPrompt = () => {
    if (!isInitializing.current && (currentHeight || weight || boneAge || boneXpertPah)) {
      setShowSessionPrompt(true);
    }
  };

  const handleGenderChange = (newGender: Gender) => {
    if (gender !== newGender) {
      setGender(newGender);
      confirmNewSessionPrompt();
    }
  };

  const handleAgeChange = (val: number | '') => {
    if (val !== ageYears) {
      setAgeYears(val);
      confirmNewSessionPrompt();
    }
  };

  const clearSessionMeasurements = () => {
    setCurrentHeight('');
    setFatherHeight('');
    setMotherHeight('');
    setWeight('');
    setRecumbentLength('');
    setMenarche('none');
    setBoneAge('');
    setNoBoneAge(false);
    setBoneXpertPah('');
    setBoneXpertError('');
    setAphv('');
    setIsTeleconsultation(false);
    setHideCoefficients(false);
    setShowSessionPrompt(false);
    setShowRestoreModal(false);
  };

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
  
  let conclusions: any[] = [];
  let resultTextStr = '';
  if ((numBoneAge !== '' || (noBoneAge && canUseNoBoneAge)) && ageYears !== '') {
    if (isBoneAgeDeviated) {
      if (bpResult) {
        resultTextStr = t.resultTextBPOnly(name, genderStr, String(ageYears), String(ageMonths || 0), currentHeight, weight, mph ? String(mph) : '', String(effectiveBoneAge), doctor, formatDate(xrayDate), String(bpResult.pah), formatDate(examDate), isBoneAgeDeviated, isTeleconsultation);
      }
    } else if (method === 'all' && pahResult && bpResult && rwtResult) {
      resultTextStr = t.resultTextAll(name, genderStr, String(ageYears), String(ageMonths || 0), currentHeight, weight, mph ? String(mph) : '', String(effectiveBoneAge), doctor, formatDate(xrayDate), String(bpResult.pah), String(pahResult.pah), String(pahResult.error), String(rwtResult.pah), String(rwtResult.error), formatDate(examDate), isTeleconsultation);
    } else if (method === 'rwt' && rwtResult) {
      resultTextStr = t.resultTextRWT(name, genderStr, String(ageYears), String(ageMonths || 0), currentHeight, weight, mph ? String(mph) : '', String(effectiveBoneAge), doctor, formatDate(xrayDate), String(rwtResult.pah), String(rwtResult.error), formatDate(examDate), noBoneAge, isTeleconsultation);
    } else if (pahResult && bpResult && (method === 'both' || method === 'all')) {
      resultTextStr = t.resultTextBoth(name, genderStr, String(ageYears), String(ageMonths || 0), currentHeight, weight, mph ? String(mph) : '', String(effectiveBoneAge), doctor, formatDate(xrayDate), String(bpResult.pah), String(pahResult.pah), String(pahResult.error), formatDate(examDate), isTeleconsultation);
    } else if (bpResult && rwtResult && method === 'all') {
      resultTextStr = t.resultTextBPRWT(name, genderStr, String(ageYears), String(ageMonths || 0), currentHeight, weight, mph ? String(mph) : '', String(effectiveBoneAge), doctor, formatDate(xrayDate), String(bpResult.pah), String(rwtResult.pah), String(rwtResult.error), formatDate(examDate), isTeleconsultation);
    } else if (pahResult && rwtResult && method === 'all') {
      resultTextStr = t.resultTextTW1RWT(name, genderStr, String(ageYears), String(ageMonths || 0), currentHeight, weight, mph ? String(mph) : '', String(effectiveBoneAge), doctor, formatDate(xrayDate), String(pahResult.pah), String(pahResult.error), String(rwtResult.pah), String(rwtResult.error), formatDate(examDate), isTeleconsultation);
    } else if (bpResult && (method === 'bp' || method === 'both' || method === 'all')) {
      resultTextStr = t.resultTextBPOnly(name, genderStr, String(ageYears), String(ageMonths || 0), currentHeight, weight, mph ? String(mph) : '', String(effectiveBoneAge), doctor, formatDate(xrayDate), String(bpResult.pah), formatDate(examDate), isBoneAgeDeviated, isTeleconsultation);
    } else if (pahResult && (method === 'tw1' || method === 'both' || method === 'all')) {
      resultTextStr = t.resultText(name, genderStr, String(ageYears), String(ageMonths || 0), currentHeight, weight, mph ? String(mph) : '', String(effectiveBoneAge), doctor, formatDate(xrayDate), String(pahResult.pah), String(pahResult.error), formatDate(examDate), isTeleconsultation);
    }

    if (resultTextStr && (boneXpertPah || boneXpertError || aphv)) {
      const bxSentObj = t.generateBoneXpertSent(aphv, boneXpertPah, boneXpertError);
      const bxSentText = `${bxSentObj.methodName}${bxSentObj.midText}${bxSentObj.pah} +/- ${bxSentObj.error}${bxSentObj.endText} `;
      if (resultTextStr.includes(t.examDatePrefix)) {
        resultTextStr = resultTextStr.replace(t.examDatePrefix, bxSentText + t.examDatePrefix);
      }
    }

    // Generate export conclusions
    if (isBoneAgeDeviated) {
      if (bpResult && (method === 'bp' || method === 'all' || method === 'both')) {
        conclusions.push(t.generateBPSent(String(bpResult.pah), String(bpResult.error), `${bpResult.fraction}`, hideCoefficients));
      }
    } else {
      if (bpResult && (method === 'bp' || method === 'both' || method === 'all')) {
        conclusions.push(t.generateBPSent(String(bpResult.pah), String(bpResult.error), `${bpResult.fraction}`, hideCoefficients));
      }
      if (pahResult && usedCoeffs && (method === 'tw1' || method === 'both' || method === 'all')) {
        const formulaStr = `(H × ${usedCoeffs.alpha}) + (A × ${usedCoeffs.beta}) + (BA × ${usedCoeffs.gamma}) + ${usedCoeffs.c}`;
        conclusions.push(t.generateTW1Sent(String(pahResult.pah), String(pahResult.error), formulaStr, hideCoefficients));
      }
      if (rwtResult && (method === 'rwt' || method === 'all')) {
        const c = rwtResult.coefficients;
        const coeffsStr = `βRL=${c.betaRL}, βW=${c.betaW}, βMPS=${c.betaMPS}, βSA=${c.betaSA}, β0=${c.beta0}`;
        conclusions.push(t.generateRWTSent(String(rwtResult.pah), String(rwtResult.error), coeffsStr, hideCoefficients));
      }
    }
    
    if (boneXpertPah || boneXpertError || aphv) {
      conclusions.push(t.generateBoneXpertSent(aphv, boneXpertPah, boneXpertError));
    }
  }
  
  const chartData: any[] = [];
  if (method === 'tw1' || method === 'both' || method === 'all') {
    if (pahResult) {
      chartData.push({ method: t.resultTW1, pah: Number(pahResult.pah), error: Number(pahResult.error), style: { lineDash: '', markerType: 'circle' as const } });
    }
  }
  if (method === 'bp' || method === 'both' || method === 'all') {
    if (bpResult) {
      chartData.push({ method: t.resultBP, pah: Number(bpResult.pah), error: Number(bpResult.error), style: { lineDash: '4,4', markerType: 'square' as const } });
    }
  }
  if (method === 'rwt' || method === 'all') {
    if (rwtResult) {
      chartData.push({ method: t.resultRWT, pah: Number(rwtResult.pah), error: Number(rwtResult.error), style: { lineDash: '2,2', markerType: 'triangle' as const } });
    }
  }
  if (boneXpertPah && boneXpertError) {
    chartData.push({ method: "BoneXpert (AsiChi)", pah: Number(boneXpertPah.replace(',', '.')), error: Number(boneXpertError.replace(',', '.')), style: { lineDash: '8,4,2,4', markerType: 'star' as const } });
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
    setRecumbentLength('');
    setMenarche('none');
    setBoneXpertPah('');
    setBoneXpertError('');
    setAphv('');
    setIsTeleconsultation(false);
    setHideCoefficients(false);
    setShowResetModal(false);
  };

  const handleCopy = () => {
    if (resultTextStr) {
      navigator.clipboard.writeText(resultTextStr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  
  const patientDataForPrint = {
    name,
    gender,
    genderStr,
    ageYears: ageYears || '0',
    ageMonths: ageMonths || 0,
    currentHeight,
    xrayDate: formatDate(xrayDate),
    examDate: formatDate(examDate),
    dob: formatDate(dob),
    weight,
    menarche,
    effectiveBoneAge,
    mph: mph || '---',
    isTeleconsultation,
    hideCoefficients,
    boneXpertPah
  };

  const handleExportDocx = () => {
    const patientData = {
      name,
      gender,
      genderStr,
      ageYears: ageYears || '0',
      ageMonths: ageMonths || 0,
      currentHeight,
      weight,
      menarche,
      effectiveBoneAge,
      mph: mph || '---',
      isTeleconsultation,
      hideCoefficients,
      boneXpertPah
    };
    exportDocx(patientData, { chartData }, conclusions, t);
  };

  const themeColor = gender === 'girl' ? 'pink' : 'blue';
  const bgGradient = gender === 'girl' ? 'from-pink-100 via-rose-50 to-pink-200' : 'from-blue-100 via-sky-50 to-blue-200';
  const primaryColor = gender === 'girl' ? 'text-pink-600' : 'text-blue-600';
  const primaryBg = gender === 'girl' ? 'bg-pink-600' : 'bg-blue-600';
  const primaryHover = gender === 'girl' ? 'hover:bg-pink-700' : 'hover:bg-blue-700';
  const ringColor = gender === 'girl' ? 'focus:ring-pink-400' : 'focus:ring-blue-400';

  const theme = gender === 'girl' ? {
    cardBg: 'bg-pink-50/80',
    cardBorder: 'border-pink-200',
    inputBorder: 'border-pink-300 focus:border-pink-500 focus:ring-pink-200',
    labelDark: 'text-pink-800 font-bold',
    labelMedium: 'text-pink-700 font-semibold',
  } : {
    cardBg: 'bg-blue-50/80',
    cardBorder: 'border-blue-200',
    inputBorder: 'border-blue-300 focus:border-blue-500 focus:ring-blue-200',
    labelDark: 'text-blue-800 font-bold',
    labelMedium: 'text-blue-700 font-semibold',
  };

  // Chart Logic
  let chartMin = 100;
  let chartMax = 200;
  const pahVal = (method === 'tw1' || method === 'both' || method === 'all') ? (pahResult ? pahResult.pah : null) : null;
  const bpVal = (method === 'bp' || method === 'both' || method === 'all') ? (bpResult ? bpResult.pah : null) : null;
  const rwtVal = (method === 'rwt' || method === 'all') ? (rwtResult ? rwtResult.pah : null) : null;
  const mphVal = mph;
  const vnAvgVal = gender === 'girl' ? 156.2 : 168.1;

  const allVals = [pahVal, bpVal, rwtVal, mphVal, vnAvgVal].filter(v => v !== null) as number[];
  
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
        <div className="flex justify-end mb-4 gap-2 items-center">
          <button
            onClick={() => setShowResetModal(true)}
            className="p-1.5 bg-white/50 hover:bg-white/70 rounded-full transition-colors text-gray-600 mr-2"
            title={t.newSession}
          >
            <RefreshCw size={18} />
          </button>
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
          <a 
            href="https://tw2-drson.vercel.app/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center justify-center px-3 py-1.5 bg-white/50 hover:bg-white/70 text-gray-600 text-xs font-medium rounded-full transition-colors ml-2"
          >
            {t.useTW2}
          </a>
        </div>

        {/* Main Content to Export */}
        <div className="bg-white/85 backdrop-blur-2xl rounded-3xl shadow-xl border border-white/40 p-4 md:p-10 relative">
          <div className="absolute inset-1.5 md:inset-2 border-2 border-gray-300/30 rounded-[1.25rem] md:rounded-[1.5rem] pointer-events-none"></div>
          
          {/* Header */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8 border-b border-gray-200/50 pb-6">
            <div className="md:col-span-7 text-center md:text-left flex flex-col md:flex-row items-center md:items-start gap-3">
              <div>
                <h1 className={`font-bold tracking-tight ${primaryColor} flex items-center justify-center md:justify-start gap-3`}>
                  <span className="block md:hidden text-2xl">
                    PolyPredict APH Dr.Son
                  </span>
                  <span className="hidden md:block text-3xl">
                    PolyPredict APH version 26.8<br/>
                    <span className="text-xl font-medium opacity-80 mt-1 block">Tác giả: Bác sĩ Đỗ Tiến Sơn</span>
                  </span>
                </h1>
                <p className={`font-medium mt-1 ${primaryColor} opacity-80 block md:hidden`}>{t.subtitle}</p>
              </div>
            </div>
            <div className="md:col-span-5 md:text-right text-center flex flex-col justify-center">
              <p className={`text-xs whitespace-pre-line leading-relaxed opacity-80 ${primaryColor}`}>
                {t.subtitleNote}
              </p>
            </div>
          </div>

          {/* Form Grid */}
          <div className={`${theme.cardBg} px-4 md:px-6 pt-8 pb-6 rounded-2xl border ${theme.cardBorder} relative shadow-sm mb-8 mt-6`}>
            <div className={`absolute -top-3 left-6 px-3 py-0.5 text-xs font-bold uppercase tracking-wider bg-white rounded-full border ${theme.cardBorder} ${theme.labelDark} shadow-sm`}>
              {t.adminInfoTitle}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Left Column */}
            <div className="space-y-5 md:col-span-5">
              <div>
                <label className={`block text-sm ${theme.labelDark} mb-1.5`}>{t.name}</label>
                <input type="text" value={name} onChange={e => {
                  const val = e.target.value;
                  const capitalized = val.replace(/(^|\s)\S/g, l => l.toUpperCase());
                  setName(capitalized);
                }} className={`w-full px-4 py-2 rounded-xl border bg-white outline-none transition-all shadow-sm ${theme.inputBorder}`} />
              </div>
              
              <div>
                <label className={`block text-sm ${theme.labelDark} mb-2`}>{t.gender}</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleGenderChange('boy')}
                    className={`flex-1 py-2 rounded-xl font-medium transition-all ${gender === 'boy' ? 'bg-blue-500 text-white shadow-md' : 'bg-white/60 text-gray-600 hover:bg-blue-100'}`}
                  >
                    {t.boy}
                  </button>
                  <button 
                    onClick={() => handleGenderChange('girl')}
                    className={`flex-1 py-2 rounded-xl font-medium transition-all ${gender === 'girl' ? 'bg-pink-500 text-white shadow-md' : 'bg-white/60 text-gray-600 hover:bg-pink-100'}`}
                  >
                    {t.girl}
                  </button>
                </div>
              </div>

              <div className={`${theme.cardBg} p-3 md:p-4 rounded-2xl border ${theme.cardBorder} shadow-sm`}>
                <div className={`flex gap-2 mb-4 border-b ${theme.cardBorder} pb-2`}>
                  <button 
                    onClick={() => setAgeMode('manual')}
                    className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${ageMode === 'manual' ? primaryBg + ' text-white shadow-sm' : 'bg-white/60 text-gray-600 hover:bg-white/80'}`}
                  >
                    {t.manualInput}
                  </button>
                  <button 
                    onClick={() => setAgeMode('dob')}
                    className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${ageMode === 'dob' ? primaryBg + ' text-white shadow-sm' : 'bg-white/60 text-gray-600 hover:bg-white/80'}`}
                  >
                    {t.calcByDob}
                  </button>
                </div>

                {ageMode === 'dob' ? (
                  <div className="space-y-4">
                    <DateInput label={t.dob} value={dob} onChange={setDob} className={theme.inputBorder} />
                    <DateInput label={t.examDate} value={examDate} onChange={setExamDate} className={theme.inputBorder} />
                    <div className="pt-2 flex items-center gap-2">
                       <span className={`text-sm ${theme.labelMedium}`}>{t.currentAge}: </span>
                       <span className={`text-sm font-bold ${theme.labelDark} bg-white px-2 py-1 rounded-md border ${theme.cardBorder}`}>{ageYears !== '' ? `${ageYears} ${t.years} ${ageMonths} ${t.months}` : '--'}</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className={`block text-sm ${theme.labelDark} mb-1.5`}>{t.currentAge}</label>
                    <div className="flex items-center gap-2">
                      <input type="number" inputMode="numeric" pattern="[0-9]*" placeholder={t.years} value={ageYears} onChange={e => handleAgeChange(e.target.value ? Number(e.target.value) : '')} className={`w-20 px-3 py-2 rounded-xl border bg-white outline-none transition-all text-center shadow-sm ${theme.inputBorder}`} />
                      <span className={`text-sm ${theme.labelMedium}`}>{t.years}</span>
                      <input type="number" inputMode="numeric" pattern="[0-9]*" min="0" max="11" placeholder="00" value={ageMonths} onChange={e => {
                        let val: number | '' = e.target.value ? Number(e.target.value) : '';
                        if (typeof val === 'number' && val > 11) val = 11;
                        if (typeof val === 'number' && val < 0) val = 0;
                        setAgeMonths(val);
                      }} className={`w-20 px-3 py-2 rounded-xl border bg-white outline-none transition-all text-center shadow-sm ${theme.inputBorder}`} />
                      <span className={`text-sm ${theme.labelMedium}`}>{t.months}</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`block text-sm ${theme.labelDark}`}>{t.currentHeight}</label>
                  <a href="https://who-zeta.vercel.app" target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1 text-xs font-medium ${primaryColor} hover:underline`}>
                    <ExternalLink size={12} /> {t.compareWHO}
                  </a>
                </div>
                <input type="text" inputMode="decimal" value={currentHeight} onChange={e => setCurrentHeight(e.target.value.replace(',', '.'))} className={`w-full px-4 py-2 rounded-xl border bg-white outline-none transition-all shadow-sm ${theme.inputBorder}`} />
                {!isValidHeight(numCurrentHeight) && <p className="text-xs text-red-500 mt-1.5">50 - 200 cm</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm ${theme.labelDark} mb-1.5`}>{t.weight}</label>
                  <input type="text" inputMode="decimal" value={weight} onChange={e => setWeight(e.target.value.replace(',', '.'))} className={`w-full px-4 py-2 rounded-xl border bg-white outline-none transition-all shadow-sm ${theme.inputBorder}`} />
                </div>
                <div>
                  <label className={`block text-sm ${theme.labelDark} mb-1.5`}>{t.recumbentLength}</label>
                  <input type="text" inputMode="decimal" value={recumbentLength} onChange={e => setRecumbentLength(e.target.value.replace(',', '.'))} placeholder={numCurrentHeight ? String(numCurrentHeight + 1.25) : ''} className={`w-full px-4 py-2 rounded-xl border bg-white outline-none transition-all shadow-sm ${theme.inputBorder}`} />
                  {numRecumbentLength !== '' && numCurrentHeight !== '' && Number(numRecumbentLength) < Number(numCurrentHeight) && <p className="text-xs text-red-500 mt-1.5">Chiều dài nằm không hợp lệ</p>}
                </div>
              </div>

            </div>

            {/* Right Column */}
            <div className="space-y-5 md:col-span-7">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm ${theme.labelDark} mb-1.5`}>{t.fatherHeight}</label>
                  <input type="text" inputMode="decimal" value={fatherHeight} onChange={e => setFatherHeight(e.target.value.replace(',', '.'))} className={`w-full px-4 py-2 rounded-xl border bg-white outline-none transition-all shadow-sm ${theme.inputBorder}`} />
                  {!isValidHeight(numFatherHeight) && <p className="text-xs text-red-500 mt-1.5">50 - 200 cm</p>}
                </div>
                <div>
                  <label className={`block text-sm ${theme.labelDark} mb-1.5`}>{t.motherHeight}</label>
                  <input type="text" inputMode="decimal" value={motherHeight} onChange={e => setMotherHeight(e.target.value.replace(',', '.'))} className={`w-full px-4 py-2 rounded-xl border bg-white outline-none transition-all shadow-sm ${theme.inputBorder}`} />
                  {!isValidHeight(numMotherHeight) && <p className="text-xs text-red-500 mt-1.5">50 - 200 cm</p>}
                </div>
              </div>
              
              <div className={`${theme.cardBg} p-3 rounded-xl border ${theme.cardBorder} text-sm flex justify-between items-center shadow-sm`}>
                <span className={`font-medium ${theme.labelDark}`}>{t.mph}:</span>
                <span className={`font-bold text-lg ${theme.labelDark}`}>{mph} cm <span className={`text-xs font-normal opacity-70`}>(+/- 8.5)</span></span>
              </div>

              {gender === 'girl' && (
                <div>
                  <label className={`block text-sm ${theme.labelDark} mb-2`}>{t.menarche}</label>
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

              <div className={`${theme.cardBg} p-4 rounded-2xl border ${theme.cardBorder} shadow-sm`}>
                <div className="flex items-center gap-2 mb-2">
                  <label className={`block text-sm ${theme.labelDark}`}>{t.boneAge}</label>
                  <a href="https://ba-drson.vercel.app" target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1 text-xs font-medium ${primaryColor} hover:underline`}>
                    <ExternalLink size={12} /> {t.openAtlas}
                  </a>
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 space-y-4">
                    <input type="text" inputMode="decimal" value={boneAge} onChange={e => setBoneAge(e.target.value.replace(',', '.'))} disabled={noBoneAge && canUseNoBoneAge} className={`w-full px-4 py-2 rounded-xl border bg-white outline-none transition-all font-bold text-lg disabled:opacity-50 shadow-sm ${theme.inputBorder}`} />
                    
                    {canUseNoBoneAge && (
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="noBoneAge" checked={noBoneAge} onChange={(e) => setNoBoneAge(e.target.checked)} className={`rounded border-[var(--card-border)] text-${themeColor}-600 focus:ring-${themeColor}-500`} />
                        <label htmlFor="noBoneAge" className={`text-sm ${theme.labelDark}`}>{t.noBoneAge}</label>
                      </div>
                    )}
                    
                    {!(noBoneAge && canUseNoBoneAge) && (
                      <div className="bg-blue-50/80 p-3 rounded-xl border border-blue-200 shadow-sm mt-4">
                        <div className="flex items-center gap-1 mb-2">
                          <label className="text-sm text-blue-700 font-bold">{t.labelBoneXpert}</label>
                          <a href="https://bonexpert.com/ahp/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 transition-colors" title="BoneXpert AHP">
                            <ExternalLink size={14} />
                          </a>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <input type="text" inputMode="decimal" value={boneXpertPah} onChange={e => setBoneXpertPah(e.target.value.replace(',', '.'))} placeholder="..." className="flex-1 px-3 py-1.5 rounded-lg border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 bg-white text-sm text-blue-900 outline-none text-center transition-all placeholder-blue-300" />
                          <span className="text-sm text-blue-700 font-bold">+/-</span>
                          <input type="text" inputMode="decimal" value={boneXpertError} onChange={e => setBoneXpertError(e.target.value.replace(',', '.'))} placeholder="..." className="w-16 px-2 py-1.5 rounded-lg border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 bg-white text-sm text-blue-900 outline-none text-center transition-all placeholder-blue-300" />
                        </div>
                        <div>
                          <label className="block text-xs text-blue-700 font-semibold mb-1.5">{t.labelAphv}</label>
                          <input type="text" inputMode="decimal" value={aphv} onChange={e => setAphv(e.target.value.replace(',', '.'))} placeholder="..." className="w-full px-3 py-1.5 rounded-lg border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 bg-white text-sm text-blue-900 outline-none transition-all placeholder-blue-300" />
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <DateInput label={t.xrayDate} value={xrayDate} onChange={setXrayDate} className={theme.inputBorder} />
                    </div>
                    <div>
                      <label className={`block text-xs ${theme.labelMedium} mb-1.5`}>{t.predictionMethod}</label>
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
                    
                    <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-6">
                      <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={isTeleconsultation} 
                          onChange={(e) => setIsTeleconsultation(e.target.checked)} 
                          className={`rounded border-[var(--card-border)] text-${themeColor}-600 focus:ring-${themeColor}-500 w-4 h-4`} 
                        />
                        <span className={theme.labelDark}>{t.teleconsultation}</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={hideCoefficients} 
                          onChange={(e) => setHideCoefficients(e.target.checked)} 
                          className={`rounded border-[var(--card-border)] text-${themeColor}-600 focus:ring-${themeColor}-500 w-4 h-4`} 
                        />
                        <span className={theme.labelDark}>{t.hideCoefficients}</span>
                      </label>
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
                            <div className="text-xs opacity-80 mt-1">{t.resultRWT} (+/- {rwtResult.error})</div>
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
                              <div className="text-[10px] opacity-80 mt-1">{t.resultTW1} (+/- {pahResult.error})</div>
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
                              <div className="text-[10px] opacity-80 mt-1">{t.resultBP} (+/- {bpResult.error})</div>
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
                              <div className="text-[10px] opacity-80">{t.resultTW1} (+/- {pahResult.error})</div>
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
                              <div className="text-[10px] opacity-80">{t.resultBP} (+/- {bpResult.error})</div>
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
                              <div className="text-[10px] opacity-80">{t.resultRWT} (+/- {rwtResult.error})</div>
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
                            <div className="text-xs opacity-80 mt-1">{method === 'tw1' ? t.resultTW1 : method === 'bp' ? t.resultBP : t.resultRWT} (+/- {(method === 'tw1' ? pahResult : method === 'bp' ? bpResult : rwtResult)?.error})</div>
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
          </div>

          {/* TW75 & BP Note Display */}
          {(noDataError || bpNoDataError || isBoneAgeDeviated) && !invalidAgeError && (
             <div className="text-center mb-4 text-sm font-medium text-red-500 space-y-1">
               {noDataError && <div>{t.tw75Note}</div>}
               {bpNoDataError && <div>{t.bpNoCoeff}</div>}
               {isBoneAgeDeviated && <div>{t.boneAgeDeviated}</div>}
             </div>
          )}

          <AnimatePresence>
            {resultTextStr && (
              <motion.div
                initial={{ opacity: 0, y: 20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                {/* Report Wrapper for PDF */}
                <div id="hexapah-report" className="bg-transparent p-2 -mx-2 rounded-xl">
                  {/* Interpretation Text */}
                  <div className="mb-8">
                    <div className={`${theme.cardBg} px-5 pt-6 pb-5 rounded-2xl border ${theme.cardBorder} relative shadow-sm whitespace-pre-wrap`}>
                      <div className={`absolute -top-3 left-6 px-3 py-0.5 text-xs font-bold uppercase tracking-wider bg-white rounded-full border ${theme.cardBorder} ${theme.labelDark} shadow-sm`}>
                        {t.conclusionTitle}
                      </div>
                      <p className={`text-sm ${theme.labelDark} leading-relaxed font-medium text-justify`}>
                        {resultTextStr}
                      </p>
                    </div>
                    <div className="flex justify-center flex-wrap gap-4 mt-4">
                      <button 
                        onClick={handleCopy}
                        className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full transition-all shadow-sm border font-bold hover:scale-105 ${copied ? 'bg-green-50 hover:bg-green-100 border-green-200 text-green-700' : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'}`}
                        title={t.copy}
                      >
                        {copied ? <Copy size={18} className="text-green-600" /> : <Copy size={18} />}
                        {t.copy}
                      </button>
                      <button 
                        onClick={handleExportDocx}
                        className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full transition-all shadow-sm border font-bold hover:scale-105 bg-red-50 hover:bg-red-100/70 border-red-200 text-red-700`}
                        title={t.exportDocx}
                      >
                        <FileText size={18} />
                        {t.exportDocx}
                      </button>
                      <button 
                        onClick={() => window.print()}
                        className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full transition-all shadow-sm border font-bold hover:scale-105 bg-orange-50 hover:bg-orange-100/70 border-orange-200 text-orange-700`}
                        title={t.exportPdf}
                      >
                        <FileDown size={18} />
                        {t.exportPdf}
                      </button>
                      <button
                        onClick={() => setShowResetModal(true)}
                        className={`inline-flex items-center gap-2 px-6 py-2.5 ${theme.cardBg} ${theme.labelDark} font-bold rounded-full shadow-sm border ${theme.cardBorder} transition-all hover:scale-105`}
                      >
                        <RefreshCw size={18} /> {t.newSession}
                      </button>
                    </div>
                  </div>

            {/* Chart Section */}
            <div className="mt-10 pt-8 border-t border-white/40 relative">
              <div id="hexapah-chart" className="relative w-full max-w-md mx-auto h-72 border-l-2 border-b-2 border-gray-400 flex items-end justify-around pb-0 px-2 md:px-8 mb-12 bg-white/50 rounded-tr-lg pt-4">
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
                <div className="flex flex-col items-center relative w-12 md:w-16 z-10 h-full justify-end">
                  <div className="absolute -top-8 text-sm font-bold text-gray-700 bg-white/90 px-1 py-1 rounded shadow-sm whitespace-nowrap z-20">
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
                <div className="flex flex-col items-center relative w-12 md:w-16 z-10 h-full justify-end">
                  <div className="absolute -top-8 text-sm font-bold text-gray-700 bg-white/90 px-1 py-1 rounded shadow-sm whitespace-nowrap z-20">
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
                <div className="flex flex-col items-center relative w-12 md:w-16 z-10 h-full justify-end">
                  <div className="absolute -top-8 text-sm font-bold text-gray-700 bg-white/90 px-1 py-1 rounded shadow-sm whitespace-nowrap z-20">
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
              <div className="flex flex-col items-center relative w-12 md:w-16 z-10 h-full justify-end">
                <div className="absolute -top-8 text-sm font-bold text-gray-600 bg-white/90 px-1 py-1 rounded shadow-sm whitespace-nowrap z-20">
                  {mph ? `${mph} cm` : '--'}
                </div>
                <div 
                  className="w-full rounded-t-md bg-gray-400 transition-all duration-1000 shadow-md" 
                  style={{ height: mph ? `${getPercentage(mph)}%` : '5%' }}
                ></div>
                <div className="absolute -bottom-6 font-bold text-gray-600 text-sm">MPH</div>
              </div>

              {/* VN'20 Bar */}
              <div className="flex flex-col items-center relative w-12 md:w-16 z-10 h-full justify-end">
                <div className="absolute -top-8 text-sm font-bold text-emerald-600 bg-white/90 px-1 py-1 rounded shadow-sm whitespace-nowrap z-20">
                  {vnAvgVal} cm
                </div>
                <div 
                  className="w-full rounded-t-md bg-emerald-400 transition-all duration-1000 shadow-md" 
                  style={{ height: `${getPercentage(vnAvgVal)}%` }}
                ></div>
                <div className="absolute -bottom-6 font-bold text-emerald-600 text-sm">VN'20</div>
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
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
  
  {/* Footer */}
          <div className="mt-4 pt-4 border-t border-gray-200/50 text-center">
            <div className="flex justify-center gap-6 mb-4">
              <button 
                onClick={() => setShowLegend(!showLegend)}
                className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Info size={14} /> {t.legendAndCoeffs} {showLegend ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              <button 
                onClick={() => setShowNote(!showNote)}
                className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Info size={14} /> {t.noteTitle} {showNote ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
            
            <div className="w-full">
              <AnimatePresence>
                {showLegend && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mb-4"
                  >
                    <div className="text-xs text-gray-500 text-center max-w-2xl mx-auto bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="md:space-y-1">
                        {t.pahLegend && <span className="md:block">{t.pahLegend} </span>}
                        <span className="md:block">{t.mphLegend} </span>
                        <span className="italic md:block">{t.illustrationNote} </span>
                        <span className="italic md:block">
                          {gender === 'girl' ? t.vnAvgFemale : t.vnAvgMale}
                        </span>
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
                            RWT Coeffs: βRL={rwtResult.coefficients.betaRL}, βW={rwtResult.coefficients.betaW}, βMPS={rwtResult.coefficients.betaMPS}, βSA={rwtResult.coefficients.betaSA}, β0={rwtResult.coefficients.beta0}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {showNote && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-yellow-50/80 border border-yellow-200 p-3 rounded-xl text-xs text-yellow-800 max-w-xl mx-auto mb-4 text-justify">
                      {t.noteContent}
                      <div className="mt-2 pt-2 border-t border-yellow-200/50">
                        {t.footerText}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      
      {/* Printable Report (Hidden in UI, only visible when printing) */}
      <PrintableReport 
        patientData={patientDataForPrint} 
        results={{ resultText: resultTextStr, chartData }} 
        conclusions={conclusions} 
        t={t} 
        chartData={chartData} 
      />
      
      {/* Reset Confirmation Modal */}
      <Modal 
        show={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleReset}
        title={t.confirmReset}
        confirmText={t.confirm}
        cancelText={t.cancel}
      />

      {/* Restore Session Modal */}
      <Modal 
        show={showRestoreModal}
        onClose={clearSessionMeasurements}
        onConfirm={() => setShowRestoreModal(false)}
        title={t.restoreSession}
        description={t.restoreSessionDesc}
        confirmText={t.keepData}
        cancelText={t.resetData}
        type="success"
      />

      {/* Age/Gender Change Session Prompt */}
      <Modal 
        show={showSessionPrompt}
        onClose={() => setShowSessionPrompt(false)}
        onConfirm={clearSessionMeasurements}
        title={t.ageGenderChanged}
        description={t.ageGenderChangedDesc}
        confirmText={t.resetData}
        cancelText={t.keepData}
        type="danger"
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

function Modal({ show, onClose, onConfirm, title, description, confirmText, cancelText, type = 'danger' }: { 
  show: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  title: string; 
  description?: string;
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
          {description && <p className="text-sm text-gray-600 mb-4">{description}</p>}
          <div className="flex flex-col gap-2 mt-6">
            <button
              onClick={onConfirm}
              className={`w-full py-3 rounded-xl font-bold text-white transition-transform active:scale-95 ${type === 'danger' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
            >
              {confirmText}
            </button>
            <button
              onClick={onClose}
              className={`w-full py-3 rounded-xl font-bold text-white transition-transform active:scale-95 ${type === 'danger' ? 'bg-gray-400 hover:bg-gray-500' : 'bg-gray-400 hover:bg-gray-500'}`}
            >
              {cancelText}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
