import React, { useState, useEffect, useRef } from 'react';
import { translations, Language } from './i18n';
import { Gender, MenarcheStatus, getCoefficients, calculatePAH, calculateMPH, Coefficients } from './data/twmc';
import { calculateKhamisRoche } from './data/khamisRoche';
import { calculateRWT, RWTCoefficient } from './data/rwt';
import { bpTable } from './bpTable';
import { predictAdultHeightBxV3, validateCustomPopulation, BxPopulationMode } from './data/bonexpertV2';
import { Copy, Info, ChevronDown, ChevronUp, ExternalLink, FileText, FileDown, Check, PenTool } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { exportDocx, exportPdf, PahSummaryRow, ClinicalReportPayload } from './utils/exportMetrics';
import { HeightPredictionChart } from './components/HeightPredictionChart';

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
    } else {
      setYyyy('');
      setMm('');
      setDd('');
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
      <label className="block text-sm text-[#1b365d] font-bold mb-1.5">{label}</label>
      <div className="flex gap-2">
        <input inputMode="numeric" pattern="[0-9]*" ref={ddRef} value={dd} onChange={handleDdChange} onBlur={handleBlur('dd')} onWheel={(e) => e.currentTarget.blur()} placeholder="DD" className={`w-14 md:w-16 px-2 py-1.5 rounded-md border bg-white outline-none text-center transition-all ${className}`} />
        <input inputMode="numeric" pattern="[0-9]*" ref={mmRef} value={mm} onChange={handleMmChange} onBlur={handleBlur('mm')} onWheel={(e) => e.currentTarget.blur()} placeholder="MM" className={`w-14 md:w-16 px-2 py-1.5 rounded-md border bg-white outline-none text-center transition-all ${className}`} />
        <input inputMode="numeric" pattern="[0-9]*" ref={yyyyRef} value={yyyy} onChange={handleYyyyChange} onBlur={handleBlur('yyyy')} onWheel={(e) => e.currentTarget.blur()} placeholder="YYYY" className={`w-20 px-2 py-1.5 rounded-md border bg-white outline-none text-center transition-all ${className}`} />
      </div>
    </div>
  );
};

export default function App() {
  const [logoError, setLogoError] = useState(false);
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
          <div className="bg-white px-8 pt-8 pb-8 border border-slate-300 rounded-md flex flex-col items-center shadow-sm">
            
            <div className="text-center mb-6 w-full flex flex-col items-center justify-center py-2">
              <div className="text-3xl tracking-tight text-[#1b365d] leading-tight">
                <span className="font-extrabold">PAH Calc</span>{' '}
                <span className="font-normal text-slate-600 text-2xl">by Dr.Son</span>
              </div>
              <div className="text-base font-semibold text-slate-700 mt-1.5">
                Tính chiều cao trưởng thành
              </div>
            </div>
            
            <form onSubmit={handleLogin} className="w-full space-y-3">
              <div className="w-full">
                <input 
                  type="password" 
                  placeholder="Mã truy cập"
                  value={password}
                  onChange={(e) => setPassword(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2.5 rounded border border-slate-300 focus:border-[#1b365d] bg-slate-50 outline-none text-slate-900 text-xs transition-colors"
                />
              </div>

              {loginError && (
                <p className="text-red-600 text-sm text-center my-3">
                  {loginError}
                </p>
              )}

              <button 
                type="submit"
                className="w-full bg-[#1b365d] hover:bg-[#152a4a] text-white font-semibold py-2 rounded text-sm transition-colors mt-2"
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
  const [logoError, setLogoError] = useState(false);
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
  const [ageMonths, setAgeMonths] = useState<number | ''>('');
  
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
  const [selectedMethods, setSelectedMethods] = useState<{
    tw1: boolean;
    bp: boolean;
    rwt: boolean;
  }>({ tw1: true, bp: true, rwt: true });
  const [boneXpertPah, setBoneXpertPah] = useState('');
  const [boneXpertError, setBoneXpertError] = useState('');
  const [aphv, setAphv] = useState('');
  const [isTeleconsultation, setIsTeleconsultation] = useState(false);
  const [hideCoefficients, setHideCoefficients] = useState(false);
  const [digitalSign, setDigitalSign] = useState(false);

  // BoneXpert AHP V3.0 (Beta) State
  const [bxV2Enabled, setBxV2Enabled] = useState(false);
  const [bxV2Pop, setBxV2Pop] = useState<BxPopulationMode>('vietnam');
  const [customPopMale, setCustomPopMale] = useState('168.1');
  const [customPopFemale, setCustomPopFemale] = useState('156.2');
  const [bxV2UseParents, setBxV2UseParents] = useState(true);
  const [bxV2UseBmi, setBxV2UseBmi] = useState(true);
  const [bxV2MenarcheHeight, setBxV2MenarcheHeight] = useState('');

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
            if (parsed.bxV2MenarcheHeight) setBxV2MenarcheHeight(parsed.bxV2MenarcheHeight);
            if (parsed.boneAge) setBoneAge(parsed.boneAge);
            if (parsed.noBoneAge !== undefined) setNoBoneAge(parsed.noBoneAge);
            if (parsed.doctor) setDoctor(parsed.doctor);
            if (parsed.xrayDate) setXrayDate(parsed.xrayDate);
            if (parsed.selectedMethods) {
              setSelectedMethods(parsed.selectedMethods);
            } else if (parsed.method) {
              setSelectedMethods({
                tw1: parsed.method === 'tw1' || parsed.method === 'both' || parsed.method === 'all',
                bp: parsed.method === 'bp' || parsed.method === 'both' || parsed.method === 'all',
                rwt: parsed.method === 'rwt' || parsed.method === 'all',
              });
            }
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
      lang, name, gender, ageMode, dob, examDate, ageYears, ageMonths, currentHeight, fatherHeight, motherHeight, weight, recumbentLength, menarche, bxV2MenarcheHeight, boneAge, noBoneAge, doctor, xrayDate, selectedMethods, boneXpertPah, boneXpertError, aphv, isTeleconsultation, hideCoefficients
    };
    try {
      localStorage.setItem('triPredictState', JSON.stringify(stateToSave));
    } catch (e) {
      console.warn('Failed to set localStorage');
    }
  }, [lang, name, gender, ageMode, dob, examDate, ageYears, ageMonths, currentHeight, fatherHeight, motherHeight, weight, recumbentLength, menarche, bxV2MenarcheHeight, boneAge, noBoneAge, doctor, xrayDate, selectedMethods, boneXpertPah, boneXpertError, aphv, isTeleconsultation, hideCoefficients]);

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
    setBxV2Enabled(false);
    setBxV2MenarcheHeight('');
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

  const formatDateSlash = (dateStr: string) => {
    if (!dateStr) return '.../.../...';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
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
  let krResult: { pah: number; error: number } | null = null;
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

  // Determine available methods based on age
  const availableMethods = {
    tw1: chronAge >= 4 && !noBoneAge && !isBoneAgeDeviated,
    bp: chronAge >= 6 && !noBoneAge,
    rwt: !isBoneAgeDeviated // RWT is available for all ages (1-16) unless BA is deviated
  };

  const useTw1 = selectedMethods.tw1 && availableMethods.tw1;
  const useBp = selectedMethods.bp && availableMethods.bp;
  const useRwt = selectedMethods.rwt && availableMethods.rwt;

  useEffect(() => {
    if (noBoneAge) {
      setSelectedMethods(prev => ({ ...prev, rwt: true }));
    } else if (isBoneAgeDeviated) {
      setSelectedMethods(prev => ({ ...prev, bp: true }));
    }
  }, [noBoneAge, isBoneAgeDeviated]);

  // Khamis-Roche Calculation
  if (numCurrentHeight && isValidHeight(numCurrentHeight) && ageYears !== '' && !invalidAgeError && numWeight && mph !== null && numFatherHeight && numMotherHeight) {
    krResult = calculateKhamisRoche(
      gender,
      chronAge,
      Number(numCurrentHeight),
      Number(numWeight),
      Number(numFatherHeight),
      Number(numMotherHeight)
    );
  }

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

  const calculatedBmi = (numWeight && numCurrentHeight && isValidHeight(numCurrentHeight) && Number(numWeight) > 0)
    ? Math.round((Number(numWeight) / Math.pow(Number(numCurrentHeight) / 100, 2)) * 100) / 100
    : null;

  const customPopValidationError =
    bxV2Pop === 'custom'
      ? validateCustomPopulation(Number(customPopMale), Number(customPopFemale))
      : null;

  const bxV2Result = (
    numCurrentHeight &&
    isValidHeight(numCurrentHeight) &&
    ageYears !== '' &&
    !invalidAgeError &&
    !noBoneAge &&
    numBoneAge !== '' &&
    isMenarcheValid &&
    !(mph !== null && mph < 140) &&
    !customPopValidationError
  )
    ? predictAdultHeightBxV3({
        height: Number(numCurrentHeight),
        ca: chronAge,
        ba: effectiveBoneAge,
        gender,
        population: bxV2Pop,
        customPopMale: customPopMale ? Number(customPopMale) : 168.1,
        customPopFemale: customPopFemale ? Number(customPopFemale) : 156.2,
        fatherHeight: bxV2UseParents && numFatherHeight && isValidHeight(numFatherHeight) ? Number(numFatherHeight) : null,
        motherHeight: bxV2UseParents && numMotherHeight && isValidHeight(numMotherHeight) ? Number(numMotherHeight) : null,
        // Luôn truyền BMI để trả về mục Hệ số điều chỉnh theo BMI dựa trên V3 (nhưng engine V4 không cộng vào kết quả trả về)
        bmi: calculatedBmi,
        menarcheHeight:
          gender === 'girl' &&
          menarche === 'post' &&
          bxV2MenarcheHeight !== '' &&
          isValidHeight(Number(bxV2MenarcheHeight))
            ? Number(bxV2MenarcheHeight)
            : null,
      })
    : null;

  const genderStr = gender === 'boy' ? t.boy.toLowerCase() : t.girl.toLowerCase();
  const baPeak = gender === 'boy' ? 13.5 : 11.0;
  const caMinusBa =
    !noBoneAge && numBoneAge !== '' && ageYears !== '' && !invalidAgeError
      ? Math.round((chronAge - effectiveBoneAge) * 100) / 100
      : null;
  const estimatedAphv =
    caMinusBa !== null
      ? Math.round((baPeak + (chronAge - effectiveBoneAge)) * 10) / 10
      : null;
  
  let conclusions: any[] = [];
  let resultTextStr = '';

  if ((numBoneAge !== '' || (noBoneAge && canUseNoBoneAge)) && ageYears !== '' && numCurrentHeight && isValidHeight(numCurrentHeight) && !invalidAgeError && isMenarcheValid) {
    const isMphFromMotherOnly = !numFatherHeight && numMotherHeight && isValidHeight(numMotherHeight);
    const bulletLines: string[] = [];

    if (useBp && bpResult) {
      bulletLines.push(
        lang === 'vi'
          ? `- Theo Công thức Bayley-Pinneau (1953): ${bpResult.pah} +/- ${bpResult.error}cm`
          : `- According to Bayley-Pinneau (1953) formula: ${bpResult.pah} +/- ${bpResult.error}cm`
      );
      conclusions.push(t.generateBPSent(String(bpResult.pah), String(bpResult.error), `${bpResult.fraction}`, hideCoefficients));
    }

    if (useTw1 && pahResult && usedCoeffs) {
      bulletLines.push(
        lang === 'vi'
          ? `- Theo Công thức Tanner-Whitehouse Mark I (1975): ${pahResult.pah} +/- ${pahResult.error}cm`
          : `- According to Tanner-Whitehouse Mark I (1975) formula: ${pahResult.pah} +/- ${pahResult.error}cm`
      );
      const formulaStr = `(H × ${usedCoeffs.alpha}) + (A × ${usedCoeffs.beta}) + (BA × ${usedCoeffs.gamma}) + ${usedCoeffs.c}`;
      conclusions.push(t.generateTW1Sent(String(pahResult.pah), String(pahResult.error), formulaStr, hideCoefficients));
    }

    if (useRwt && rwtResult) {
      bulletLines.push(
        lang === 'vi'
          ? `- Theo Công thức Roche-Wainer-Thissen (1975): ${rwtResult.pah} +/- ${rwtResult.error}cm`
          : `- According to Roche-Wainer-Thissen (1975) formula: ${rwtResult.pah} +/- ${rwtResult.error}cm`
      );
      const c = rwtResult.coefficients;
      const coeffsStr = `βRL=${c.betaRL}, βW=${c.betaW}, βMPS=${c.betaMPS}, βSA=${c.betaSA}, β0=${c.beta0}`;
      conclusions.push(t.generateRWTSent(String(rwtResult.pah), String(rwtResult.error), coeffsStr, hideCoefficients));
    }

    if (bxV2Enabled && bxV2Result) {
      const popShortLabel =
        bxV2Pop === 'vietnam'
          ? 'NIN FH VN 2020'
          : bxV2Pop === 'caucasian'
          ? 'Châu Âu - Zurich'
          : `Tùy chỉnh ${bxV2Result.inputs.h_pop} cm`;
      bulletLines.push(
        lang === 'vi'
          ? `- Theo Mô hình Thodberg-Martin (2012) (${popShortLabel}): ${bxV2Result.predictions.final_predicted_height_cm} +/- ${bxV2Result.predictions.rmse_cm}cm`
          : `- According to Thodberg-Martin (2012) Model (${popShortLabel}): ${bxV2Result.predictions.final_predicted_height_cm} +/- ${bxV2Result.predictions.rmse_cm}cm`
      );
      conclusions.push(
        t.generateBxV2Sent(
          String(bxV2Result.predictions.final_predicted_height_cm),
          String(bxV2Result.predictions.rmse_cm),
          bxV2Result.inputs.population_short,
          bxV2Result.predictions.confidence_interval_95_pct,
          bxV2Result.intermediate_metrics.growth_potential_pct,
          bxV2Result.intermediate_metrics.h_raw_cm,
          bxV2Result.intermediate_metrics.w_pop,
          hideCoefficients
        )
      );
    }

    if (boneXpertPah || boneXpertError || aphv) {
      bulletLines.push(
        lang === 'vi'
          ? `- Theo Thuật toán BX AHP 3.1 (Visiana, 2025): ${boneXpertPah || '...'} +/- ${boneXpertError || '...'}cm (AsiChi)${aphv ? `, đỉnh tăng trưởng rơi vào ${aphv} tuổi (Zurich LS)` : ''}`
          : `- According to BX AHP 3.1 (Visiana, 2025): ${boneXpertPah || '...'} +/- ${boneXpertError || '...'}cm (AsiChi)${aphv ? `, APHV at ${aphv} years (Zurich LS)` : ''}`
      );
      conclusions.push(t.generateBoneXpertSent(aphv, boneXpertPah, boneXpertError));
    }

    if (bulletLines.length > 0) {
      const hasValidMenarcheH =
        gender === 'girl' &&
        menarche === 'post' &&
        bxV2MenarcheHeight !== '' &&
        isValidHeight(Number(bxV2MenarcheHeight));

      if (lang === 'vi') {
        const headerLine = isTeleconsultation
          ? '* HỘI CHẨN TỪ XA VỚI BÁC SĨ SƠN VỀ CHIỀU CAO KHI TRƯỞNG THÀNH'
          : '* KẾT QUẢ DỰ KIẾN CHIỀU CAO KHI TRƯỞNG THÀNH';
        const childDesc = `trẻ ${genderStr}${name ? ` ${name}` : ''}`;
        const weightPart = weight ? `, nặng ${weight} kg` : '';
        const mphPart = mph
          ? `, MPH ${mph} cm${isMphFromMotherOnly ? ' (tính từ chiều cao mẹ)' : ''}${krResult ? ` (krPAH: ${krResult.pah} +/- ${krResult.error}cm)` : ''}`
          : '';
        const menarchePart =
          gender === 'girl'
            ? menarche === 'post'
              ? `, đã có kinh nguyệt${hasValidMenarcheH ? ` (chiều cao khi có chu kì đầu tiên: ${bxV2MenarcheHeight} cm)` : ''}`
              : menarche === 'pre'
              ? ', chưa có kinh nguyệt'
              : ''
            : '';
        const baPart = noBoneAge
          ? ', chưa có dữ liệu tuổi xương'
          : `, tuổi xương ~ ${effectiveBoneAge} tuổi${
              estimatedAphv !== null ? ` (ước tính tuổi đạt đỉnh tăng trưởng APHV ~ ${estimatedAphv} tuổi)` : ''
            }`;
        const introLine = `Trẻ khám ngày (${formatDateSlash(examDate)}), ${childDesc}, ${ageYears} tuổi ${ageMonths || 0} tháng, hiện cao ${currentHeight} cm${weightPart}${mphPart}${menarchePart}${baPart}. Dựa vào độ trưởng thành của xương cổ - bàn tay trái và các chỉ số nhân trắc, tính chiều cao dự kiến khi trưởng thành (PAH):`;
        const footerNote = `Lưu ý: Kết quả PAH thay đổi theo mỗi lần đánh giá và công thức, được bác sĩ dùng để theo dõi định kì, phát hiện bệnh lí, không dùng để tiên đoán.`;

        resultTextStr = [headerLine, introLine, ...bulletLines, footerNote].join('\n');
      } else {
        const headerLine = isTeleconsultation
          ? '* TELECONSULTATION WITH DR. SON FOR PREDICTED ADULT HEIGHT'
          : '* PREDICTED ADULT HEIGHT RESULT';
        const childDesc = `${name ? `${name} ` : ''}(${genderStr})`;
        const weightPart = weight ? `, weight ${weight} kg` : '';
        const mphPart = mph
          ? `, MPH ${mph} cm${isMphFromMotherOnly ? ' (from mother\'s height)' : ''}${krResult ? ` (krPAH: ${krResult.pah} +/- ${krResult.error}cm)` : ''}`
          : '';
        const menarchePart =
          gender === 'girl'
            ? menarche === 'post'
              ? `, postmenarcheal${hasValidMenarcheH ? ` (height at first menstrual cycle: ${bxV2MenarcheHeight} cm)` : ''}`
              : menarche === 'pre'
              ? ', premenarcheal'
              : ''
            : '';
        const baPart = noBoneAge
          ? ', no bone age data'
          : `, bone age ~ ${effectiveBoneAge} years${
              estimatedAphv !== null ? ` (estimated APHV ~ ${estimatedAphv} years)` : ''
            }`;
        const introLine = `Exam date (${formatDateSlash(examDate)}), child ${childDesc}, ${ageYears} years ${ageMonths || 0} months old, current height ${currentHeight} cm${weightPart}${mphPart}${menarchePart}${baPart}. Based on left hand-wrist skeletal maturity and anthropometric indices, the predicted adult height (PAH) is:`;
        const footerNote = `Note: PAH results vary with each assessment and formula, used by physicians for periodic monitoring and pathology detection, not for future prediction.`;

        resultTextStr = [headerLine, introLine, ...bulletLines, footerNote].join('\n');
      }
    }
  }
  
  const chartData: any[] = [];
  if (useTw1 && pahResult) {
    chartData.push({ method: t.resultTW1, pah: Number(pahResult.pah), error: Number(pahResult.error), style: { lineDash: '', markerType: 'circle' as const } });
  }
  if (useBp && bpResult) {
    chartData.push({ method: t.resultBP, pah: Number(bpResult.pah), error: Number(bpResult.error), style: { lineDash: '4,4', markerType: 'square' as const } });
  }
  if (useRwt && rwtResult) {
    chartData.push({ method: t.resultRWT, pah: Number(rwtResult.pah), error: Number(rwtResult.error), style: { lineDash: '2,2', markerType: 'triangle' as const } });
  }
  if (boneXpertPah && boneXpertError) {
    chartData.push({ method: "BoneXpert (AsiChi)", pah: Number(boneXpertPah.replace(',', '.')), error: Number(boneXpertError.replace(',', '.')), style: { lineDash: '8,4,2,4', markerType: 'star' as const } });
  }
  if (bxV2Enabled && bxV2Result) {
    chartData.push({
      method: bxV2Pop === 'vietnam' ? "AHP Thodberg-Martin (VN)" : bxV2Pop === 'caucasian' ? "AHP Thodberg-Martin (EU)" : "AHP Thodberg-Martin (Custom)",
      pah: Number(bxV2Result.predictions.final_predicted_height_cm),
      error: Number(bxV2Result.predictions.rmse_cm),
      style: { lineDash: '6,3', markerType: 'star' as const }
    });
  }

  const handleReset = () => {
    setName('');
    setGender('boy');
    setAgeMode('manual');
    setDob('');
    setExamDate(new Date().toISOString().split('T')[0]);
    setAgeYears('');
    setAgeMonths('');
    setCurrentHeight('');
    setFatherHeight('');
    setMotherHeight('');
    setBoneAge('');
    setNoBoneAge(false);
    setXrayDate(new Date().toISOString().split('T')[0]);
    setDoctor('Đỗ Tiến Sơn');
    setSelectedMethods({ tw1: true, bp: true, rwt: true });
    setWeight('');
    setRecumbentLength('');
    setMenarche('none');
    setBoneXpertPah('');
    setBoneXpertError('');
    setAphv('');
    setBxV2Enabled(false);
    setBxV2MenarcheHeight('');
    setIsTeleconsultation(false);
    setHideCoefficients(false);
    setDigitalSign(false);
    setShowResetModal(false);
  };

  const handleCopy = () => {
    if (resultTextStr) {
      navigator.clipboard.writeText(resultTextStr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const buildReportPayload = (): ClinicalReportPayload => {
    const summaryRows: PahSummaryRow[] = [];

    const addRow = (methodKey: string, methodName: string, pah: number, error: number, ci95Override?: [number, number]) => {
      const ci95Low = ci95Override ? ci95Override[0] : Math.round((pah - 1.96 * error) * 10) / 10;
      const ci95High = ci95Override ? ci95Override[1] : Math.round((pah + 1.96 * error) * 10) / 10;
      const diffMph = mph !== null ? Math.round((pah - mph) * 10) / 10 : null;
      summaryRows.push({
        methodKey,
        methodName,
        pah,
        error,
        ci95Low,
        ci95High,
        diffMph,
      });
    };

    if (useBp && bpResult) {
      addRow('bp', 'Bayley-Pinneau (1953)', Number(bpResult.pah), Number(bpResult.error));
    }
    if (useTw1 && pahResult) {
      addRow('tw1', 'Tanner-Whitehouse Mark I (1975)', Number(pahResult.pah), Number(pahResult.error));
    }
    if (useRwt && rwtResult) {
      addRow('rwt', 'Roche-Wainer-Thissen (1975)', Number(rwtResult.pah), Number(rwtResult.error));
    }
    if (bxV2Enabled && bxV2Result) {
      const popShortLabel =
        bxV2Pop === 'vietnam'
          ? 'NIN FH VN 2020'
          : bxV2Pop === 'caucasian'
          ? 'Châu Âu - Zurich'
          : `Tùy chỉnh ${bxV2Result.inputs.h_pop} cm`;
      addRow(
        'tm2012',
        `Thodberg-Martin (2012) (${popShortLabel})`,
        Number(bxV2Result.predictions.final_predicted_height_cm),
        Number(bxV2Result.predictions.rmse_cm),
        bxV2Result.predictions.confidence_interval_95_pct
      );
    }
    if (boneXpertPah && boneXpertError) {
      const bxPahNum = Number(boneXpertPah.replace(',', '.'));
      const bxErrNum = Number(boneXpertError.replace(',', '.'));
      if (!isNaN(bxPahNum) && !isNaN(bxErrNum)) {
        addRow('bx31', 'BX AHP 3.1 (Visiana, 2025 - AsiChi)', bxPahNum, bxErrNum);
      }
    }

    return {
      patientData: {
        name,
        gender,
        genderStr,
        dob,
        examDate,
        xrayDate,
        ageYears: ageYears || '0',
        ageMonths: ageMonths || 0,
        chronAge,
        currentHeight,
        weight,
        bmi: calculatedBmi,
        fatherHeight,
        motherHeight,
        mph: mph || '---',
        menarche,
        menarcheHeight: bxV2MenarcheHeight,
        effectiveBoneAge,
        noBoneAge,
        caMinusBa,
        estimatedAphv,
        baPeak,
        isTeleconsultation,
        hideCoefficients,
        digitalSign,
        boneXpertPah,
      },
      summaryRows,
      bpFraction: useBp && bpResult ? bpResult.fraction : null,
      tw1Coeffs: useTw1 && pahResult && usedCoeffs ? usedCoeffs : null,
      rwtCoeffs: useRwt && rwtResult ? rwtResult.coefficients : null,
      bxV2Result,
      bxV2Enabled,
      conclusionText: resultTextStr,
      chartData,
    };
  };

  const handleExportDocx = () => {
    exportDocx(buildReportPayload());
  };

  const handleExportPdf = () => {
    exportPdf(buildReportPayload());
  };

  const themeColor = 'slate';
  const bgGradient = gender === 'girl' ? 'from-[#fff0f5] via-[#fff5f8] to-[#ffe4ee]' : 'from-slate-200 via-slate-100 to-[#d9e2ec]';
  const primaryColor = 'text-[#1b365d]';
  const primaryBg = 'bg-[#1b365d]';
  const primaryHover = 'hover:bg-[#152a4a]';
  const ringColor = 'focus:ring-[#1b365d]/30';

  const theme = {
    cardBg: 'bg-[#f4f6f9]/90',
    cardBorder: 'border-slate-300',
    inputBorder: 'border-slate-300 focus:border-[#1b365d] focus:ring-1 focus:ring-[#1b365d]/20',
    labelDark: 'text-[#1b365d] font-bold',
    labelMedium: 'text-[#2c4c7e] font-semibold',
  };

  // Chart Logic
  let chartMin = 100;
  let chartMax = 200;
  const pahVal = useTw1 ? (pahResult ? pahResult.pah : null) : null;
  const bpVal = useBp ? (bpResult ? bpResult.pah : null) : null;
  const rwtVal = useRwt ? (rwtResult ? rwtResult.pah : null) : null;
  const bxV2Val = (bxV2Enabled && bxV2Result) ? bxV2Result.predictions.final_predicted_height_cm : null;
  const mphVal = mph;
  const vnAvgVal = gender === 'girl' ? 156.2 : 168.1;

  const allVals = [pahVal, bpVal, rwtVal, bxV2Val, mphVal, vnAvgVal].filter(v => v !== null) as number[];
  
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
        <div className="flex justify-end mb-3 gap-2 items-center">
          <button
            onClick={() => setShowResetModal(true)}
            className="p-1.5 bg-white/80 hover:bg-white rounded border border-slate-300/80 transition-colors text-slate-700 mr-1"
            title={t.newSession}
          >
            <RefreshCw size={17} />
          </button>
          <button 
            onClick={() => setLang('vi')}
            className={`px-2.5 py-1 rounded text-xs font-bold transition-colors border ${lang === 'vi' ? primaryBg + ' text-white border-[#1b365d]' : 'bg-white/80 text-slate-700 border-slate-300/80 hover:bg-white'}`}
          >
            VI
          </button>
          <button 
            onClick={() => setLang('en')}
            className={`px-2.5 py-1 rounded text-xs font-bold transition-colors border ${lang === 'en' ? primaryBg + ' text-white border-[#1b365d]' : 'bg-white/80 text-slate-700 border-slate-300/80 hover:bg-white'}`}
          >
            EN
          </button>
          <a 
            href="https://tw2-drson.vercel.app/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center justify-center px-3 py-1 bg-white/80 hover:bg-white text-slate-700 text-xs font-semibold rounded border border-slate-300/80 transition-colors ml-1"
          >
            {t.useTW2}
          </a>
        </div>

        {/* Main Content to Export */}
        <div className="bg-white/95 backdrop-blur-xl rounded-lg shadow-lg border border-slate-300/90 p-4 md:px-8 md:py-6 relative">
          
          {/* Header */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4 border-b border-slate-200 pb-4">
            <div className="md:col-span-7 text-center md:text-left flex flex-col justify-center">
              <h1 className={`tracking-tight ${primaryColor} leading-tight`}>
                <span className="text-3xl md:text-4xl font-extrabold">PAH Calc</span>{' '}
                <span className="text-2xl md:text-3xl font-normal opacity-85">by Dr.Son</span>
              </h1>
              <p className={`text-lg md:text-xl mt-1 ${primaryColor}`}>
                <span className="font-bold">Tính chiều cao</span>{' '}
                <span className="font-normal">trưởng thành</span>
              </p>
            </div>
            <div className="md:col-span-5 md:text-right text-center flex flex-col justify-center">
              <p className={`text-xs whitespace-pre-line leading-relaxed opacity-85 ${primaryColor}`}>
                {t.subtitleNote}
              </p>
            </div>
          </div>

          {/* 3-Step Clinical Progress Bar */}
          {(() => {
            const step1Done = ageYears !== '' && !invalidAgeError;
            const step2Done = numCurrentHeight !== '' && isValidHeight(numCurrentHeight) && isMenarcheValid;
            const step3Done = (numBoneAge !== '' || (noBoneAge && canUseNoBoneAge)) && !outOfRangeError;
            const steps = [
              { id: 1, label: lang === 'vi' ? 'Thông tin hành chính' : 'Administrative Info', done: step1Done },
              { id: 2, label: lang === 'vi' ? 'Số đo nhân trắc' : 'Anthropometrics', done: step2Done },
              { id: 3, label: lang === 'vi' ? 'Dữ liệu X-quang' : 'X-ray Data', done: step3Done },
            ];
            const completedCount = steps.filter(s => s.done).length;
            const progressPct = Math.round((completedCount / steps.length) * 100);

            return (
              <div className="mb-6 bg-[#f4f6f9] border border-slate-300 rounded-md px-4 py-3 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1b365d]">
                    {lang === 'vi' ? 'Tiến độ hoàn thiện dữ liệu' : 'Data Entry Progress'}
                  </span>
                  <span className={`text-xs font-extrabold px-2 py-0.5 rounded-sm ${progressPct === 100 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-200/80 text-[#1b365d]'}`}>
                    {completedCount}/3 ({progressPct}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-sm overflow-hidden mb-3">
                  <div
                    className={`h-full transition-all duration-500 ${progressPct === 100 ? 'bg-emerald-600' : 'bg-[#1b365d]'}`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {steps.map((step) => (
                    <div
                      key={step.id}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded border text-xs font-bold transition-all ${
                        step.done
                          ? 'bg-white border-emerald-500/70 text-emerald-800 shadow-2xs'
                          : 'bg-white/70 border-slate-300/80 text-slate-600'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-sm flex items-center justify-center text-[11px] font-extrabold shrink-0 transition-colors ${
                          step.done
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-[#1b365d]'
                        }`}
                      >
                        {step.done ? <Check size={12} strokeWidth={3} /> : step.id}
                      </span>
                      <span className="truncate">{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Form Grid */}
          <div className={`${theme.cardBg} px-4 md:px-6 pt-6 pb-6 rounded-md border ${theme.cardBorder} relative shadow-xs mb-6 mt-2`}>
            <div className={`absolute -top-3 left-4 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-white rounded border ${theme.cardBorder} ${theme.labelDark} shadow-2xs`}>
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
                }} className={`w-full px-3.5 py-2 rounded-md border bg-white outline-none transition-all shadow-2xs ${theme.inputBorder}`} />
              </div>
              
              <div>
                <label className={`block text-sm ${theme.labelDark} mb-2`}>{t.gender}</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleGenderChange('boy')}
                    className={`flex-1 py-2 rounded-md font-semibold transition-all border ${gender === 'boy' ? primaryBg + ' text-white border-[#1b365d] shadow-xs' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}`}
                  >
                    {t.boy}
                  </button>
                  <button 
                    onClick={() => handleGenderChange('girl')}
                    className={`flex-1 py-2 rounded-md font-semibold transition-all border ${gender === 'girl' ? primaryBg + ' text-white border-[#1b365d] shadow-xs' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}`}
                  >
                    {t.girl}
                  </button>
                </div>
              </div>

              <div className={`bg-white/60 p-3 md:p-4 rounded-md border ${theme.cardBorder} shadow-2xs`}>
                <div className={`flex gap-2 mb-4 border-b ${theme.cardBorder} pb-2`}>
                  <button 
                    onClick={() => setAgeMode('manual')}
                    className={`text-sm font-semibold px-3 py-1.5 rounded transition-colors border ${ageMode === 'manual' ? primaryBg + ' text-white border-[#1b365d] shadow-2xs' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'}`}
                  >
                    {t.manualInput}
                  </button>
                  <button 
                    onClick={() => setAgeMode('dob')}
                    className={`text-sm font-semibold px-3 py-1.5 rounded transition-colors border ${ageMode === 'dob' ? primaryBg + ' text-white border-[#1b365d] shadow-2xs' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'}`}
                  >
                    {t.calcByDob}
                  </button>
                </div>

                {ageMode === 'dob' ? (
                  <div className="space-y-4">
                    <DateInput label={t.dob} value={dob} onChange={setDob} className={theme.inputBorder} />
                    <DateInput label={t.examDate} value={examDate} onChange={setExamDate} className={theme.inputBorder} />
                    <div className="pt-2 flex items-center gap-2">
                       <span className={`text-sm ${theme.labelDark}`}>{t.currentAge}: </span>
                       <span className={`text-sm font-bold ${theme.labelDark} bg-white px-2 py-1 rounded border ${theme.cardBorder}`}>{ageYears !== '' ? `${ageYears} ${t.years} ${ageMonths} ${t.months}` : '--'}</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className={`block text-sm ${theme.labelDark} mb-1.5`}>{t.currentAge}</label>
                    <div className="flex items-center gap-2">
                      <input type="number" inputMode="numeric" pattern="[0-9]*" placeholder={t.years} value={ageYears} onWheel={(e) => e.currentTarget.blur()} onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }} onChange={e => handleAgeChange(e.target.value ? Number(e.target.value) : '')} className={`w-20 px-3 py-2 rounded-md border bg-white outline-none transition-all text-center shadow-2xs ${theme.inputBorder}`} />
                      <span className={`text-sm ${theme.labelMedium}`}>{t.years}</span>
                      <input type="number" inputMode="numeric" pattern="[0-9]*" min="0" max="11" placeholder="00" value={ageMonths} onWheel={(e) => e.currentTarget.blur()} onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }} onChange={e => {
                        let val: number | '' = e.target.value ? Number(e.target.value) : '';
                        if (typeof val === 'number' && val > 11) val = 11;
                        if (typeof val === 'number' && val < 0) val = 0;
                        setAgeMonths(val);
                      }} className={`w-20 px-3 py-2 rounded-md border bg-white outline-none transition-all text-center shadow-2xs ${theme.inputBorder}`} />
                      <span className={`text-sm ${theme.labelMedium}`}>{t.months}</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`block text-sm ${theme.labelDark}`}>{t.currentHeight}</label>
                  <a href="https://who-zeta.vercel.app" target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1 text-xs font-semibold ${primaryColor} hover:underline`}>
                    <ExternalLink size={12} /> {t.compareWHO}
                  </a>
                </div>
                <input type="text" inputMode="decimal" value={currentHeight} onWheel={(e) => e.currentTarget.blur()} onChange={e => setCurrentHeight(e.target.value.replace(',', '.'))} className={`w-full px-3.5 py-2 rounded-md border bg-white outline-none transition-all shadow-2xs ${theme.inputBorder}`} />
                {!isValidHeight(numCurrentHeight) && <p className="text-xs text-red-600 mt-1.5">50 - 200 cm</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm ${theme.labelDark} mb-1.5`}>{t.weight}</label>
                  <input type="text" inputMode="decimal" value={weight} onWheel={(e) => e.currentTarget.blur()} onChange={e => setWeight(e.target.value.replace(',', '.'))} className={`w-full px-3.5 py-2 rounded-md border bg-white outline-none transition-all shadow-2xs ${theme.inputBorder}`} />
                </div>
                <div>
                  <label className={`block text-sm ${theme.labelDark} mb-1.5`}>{t.recumbentLength}</label>
                  <input type="text" inputMode="decimal" value={recumbentLength} onWheel={(e) => e.currentTarget.blur()} onChange={e => setRecumbentLength(e.target.value.replace(',', '.'))} placeholder={numCurrentHeight ? String(numCurrentHeight + 1.25) : ''} className={`w-full px-3.5 py-2 rounded-md border bg-white outline-none transition-all shadow-2xs ${theme.inputBorder}`} />
                  {numRecumbentLength !== '' && numCurrentHeight !== '' && Number(numRecumbentLength) < Number(numCurrentHeight) && <p className="text-xs text-red-600 mt-1.5">Chiều dài nằm không hợp lệ</p>}
                </div>
              </div>

              {gender === 'girl' && (
                <div className="space-y-3">
                  <div>
                    <label className={`block text-sm ${theme.labelDark} mb-2`}>{t.menarche}</label>
                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={() => setMenarche('pre')}
                        className={`flex-1 py-2 text-sm rounded-md font-semibold transition-all border ${menarche === 'pre' ? primaryBg + ' text-white border-[#1b365d] shadow-xs' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}`}
                      >
                        {t.noMenarche}
                      </button>
                      <button 
                        type="button"
                        onClick={() => setMenarche('post')}
                        className={`flex-1 py-2 text-sm rounded-md font-semibold transition-all border ${menarche === 'post' ? primaryBg + ' text-white border-[#1b365d] shadow-xs' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}`}
                      >
                        {t.hasMenarche}
                      </button>
                    </div>
                  </div>

                  {menarche === 'post' && (
                    <div>
                      <label className={`block text-sm ${theme.labelDark} mb-1.5`}>
                        {lang === 'vi' ? 'Chiều cao khi có kinh nguyệt (cm)' : 'Height at menarche (cm)'}
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={bxV2MenarcheHeight}
                        onWheel={(e) => e.currentTarget.blur()}
                        onChange={(e) => setBxV2MenarcheHeight(e.target.value.replace(',', '.'))}
                        placeholder={currentHeight ? `VD: ${currentHeight}` : 'Nhập chiều cao (cm)...'}
                        className={`w-full px-3.5 py-2 rounded-md border bg-white outline-none transition-all shadow-2xs ${theme.inputBorder}`}
                      />
                      {bxV2MenarcheHeight !== '' && !isValidHeight(Number(bxV2MenarcheHeight)) && (
                        <p className="text-xs text-red-600 mt-1.5">50 - 200 cm</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {!noBoneAge && (
                <div className={`bg-white/80 p-3 rounded-md border ${theme.cardBorder} text-sm flex justify-between items-center shadow-2xs`}>
                  <span className={theme.labelDark}>
                    {lang === 'vi' ? 'Ước tính APHV:' : 'Estimated APHV:'}
                  </span>
                  <span className={`font-bold text-lg ${theme.labelDark}`}>
                    {estimatedAphv !== null ? `~ ${estimatedAphv} ${lang === 'vi' ? 'tuổi' : 'yrs'}` : '--'}
                  </span>
                </div>
              )}

            </div>

            {/* Right Column */}
            <div className="space-y-5 md:col-span-7">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm ${theme.labelDark} mb-1.5`}>{t.fatherHeight}</label>
                  <input type="text" inputMode="decimal" value={fatherHeight} onWheel={(e) => e.currentTarget.blur()} onChange={e => setFatherHeight(e.target.value.replace(',', '.'))} className={`w-full px-3.5 py-2 rounded-md border bg-white outline-none transition-all shadow-2xs ${theme.inputBorder}`} />
                  {!isValidHeight(numFatherHeight) && <p className="text-xs text-red-600 mt-1.5">50 - 200 cm</p>}
                </div>
                <div>
                  <label className={`block text-sm ${theme.labelDark} mb-1.5`}>{t.motherHeight}</label>
                  <input type="text" inputMode="decimal" value={motherHeight} onWheel={(e) => e.currentTarget.blur()} onChange={e => setMotherHeight(e.target.value.replace(',', '.'))} className={`w-full px-3.5 py-2 rounded-md border bg-white outline-none transition-all shadow-2xs ${theme.inputBorder}`} />
                  {!isValidHeight(numMotherHeight) && <p className="text-xs text-red-600 mt-1.5">50 - 200 cm</p>}
                </div>
              </div>
              
              <div className={`bg-white/80 p-3 rounded-md border ${theme.cardBorder} text-sm flex justify-between items-center shadow-2xs`}>
                <span className={theme.labelDark}>{t.mph}:</span>
                <span className={`font-bold text-lg ${theme.labelDark}`}>{mph} cm <span className={`text-xs font-normal opacity-70`}>(±{gender === 'boy' ? 10 : 9})</span></span>
              </div>
              
              {krResult && (
                <div className={`mt-4 bg-white/80 p-3 rounded-md border ${theme.cardBorder} text-sm flex justify-between items-center shadow-2xs`}>
                  <span className={theme.labelDark}>{lang === 'vi' ? 'Dự kiến theo Khamis-Roche' : 'Khamis-Roche Prediction'}:</span>
                  <span className={`font-bold text-lg ${theme.labelDark}`}>{krResult.pah} cm <span className={`text-xs font-normal opacity-70`}>(+/- {krResult.error})</span></span>
                </div>
              )}

              <div className={`bg-white/60 p-4 rounded-md border ${theme.cardBorder} shadow-2xs`}>
                <div className="flex items-center gap-2 mb-2">
                  <label className={`block text-sm ${theme.labelDark}`}>{t.boneAge}</label>
                  <a href="https://ba-drson.vercel.app" target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1 text-xs font-semibold ${primaryColor} hover:underline`}>
                    <ExternalLink size={12} /> {t.openAtlas}
                  </a>
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 space-y-4">
                    <input type="text" inputMode="decimal" value={boneAge} onWheel={(e) => e.currentTarget.blur()} onChange={e => setBoneAge(e.target.value.replace(',', '.'))} disabled={noBoneAge && canUseNoBoneAge} className={`w-full px-3.5 py-2 rounded-md border bg-white outline-none transition-all font-bold text-lg disabled:opacity-50 shadow-2xs ${theme.inputBorder}`} />
                    
                    {canUseNoBoneAge && (
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="noBoneAge" checked={noBoneAge} onChange={(e) => setNoBoneAge(e.target.checked)} className="rounded-xs border-slate-300 accent-[#1b365d]" />
                        <label htmlFor="noBoneAge" className={`text-sm ${theme.labelDark}`}>{t.noBoneAge}</label>
                      </div>
                    )}
                    
                    <div>
                      <DateInput label={t.xrayDate} value={xrayDate} onChange={setXrayDate} className={theme.inputBorder} />
                    </div>
                    <div>
                      <label className={`block text-sm ${theme.labelDark} mb-1.5`}>{t.predictionMethod}</label>
                      <div className="flex flex-col gap-1.5">
                        {availableMethods.tw1 && (
                          <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedMethods.tw1}
                              onChange={(e) => setSelectedMethods(prev => ({ ...prev, tw1: e.target.checked }))}
                              className="rounded-xs border-slate-300 accent-[#1b365d] w-4 h-4"
                            />
                            <span>{t.methodTW1}</span>
                          </label>
                        )}
                        {availableMethods.bp && (
                          <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedMethods.bp}
                              onChange={(e) => setSelectedMethods(prev => ({ ...prev, bp: e.target.checked }))}
                              className="rounded-xs border-slate-300 accent-[#1b365d] w-4 h-4"
                            />
                            <span>{t.methodBP}</span>
                          </label>
                        )}
                        {availableMethods.rwt && (
                          <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedMethods.rwt}
                              onChange={(e) => setSelectedMethods(prev => ({ ...prev, rwt: e.target.checked }))}
                              className="rounded-xs border-slate-300 accent-[#1b365d] w-4 h-4"
                            />
                            <span>{t.methodRWT}</span>
                          </label>
                        )}
                        {!noBoneAge && (
                          <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={bxV2Enabled}
                              onChange={(e) => setBxV2Enabled(e.target.checked)}
                              className="rounded-xs border-slate-300 accent-[#1b365d] w-4 h-4"
                            />
                            <span>Thodberg-Martin</span>
                          </label>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-200 flex flex-wrap gap-6">
                      <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={isTeleconsultation} 
                          onChange={(e) => setIsTeleconsultation(e.target.checked)} 
                          className="rounded-xs border-slate-300 accent-[#1b365d] w-4 h-4" 
                        />
                        <span className={theme.labelDark}>{t.teleconsultation}</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={hideCoefficients} 
                          onChange={(e) => setHideCoefficients(e.target.checked)} 
                          className="rounded-xs border-slate-300 accent-[#1b365d] w-4 h-4" 
                        />
                        <span className={theme.labelDark}>{t.hideCoefficients}</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={digitalSign} 
                          onChange={(e) => setDigitalSign(e.target.checked)} 
                          className="rounded-xs border-slate-300 accent-[#1b365d] w-4 h-4" 
                        />
                        <span className={`inline-flex items-center gap-1 ${theme.labelDark}`}>
                          <PenTool size={13} className="text-[#1b365d]" />
                          {lang === 'vi' ? 'Kí số' : 'Digital Sign'}
                        </span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Result Box */}
                  {(() => {
                    const activeItems = [
                      ...(useTw1 ? [{ key: 'tw1', label: t.resultTW1, res: pahResult, errText: noDataError ? `${t.noData} (TW1)` : null }] : []),
                      ...(useBp ? [{ key: 'bp', label: t.resultBP, res: bpResult, errText: bpNoDataError ? t.bpNoCoeff : null }] : []),
                      ...(useRwt ? [{ key: 'rwt', label: t.resultRWT, res: rwtResult, errText: rwtNoDataError ? (numWeight ? t.rwtNoCoeff : t.rwtNoWeight) : null }] : []),
                    ];
                    const hasAnyResult = activeItems.some(item => item.res !== null);
                    const hasGlobalError = invalidAgeError || requireMenarcheError || outOfRangeError;

                    return (
                      <div className={`flex-1 rounded-md flex flex-col items-center justify-center p-4 text-white shadow-inner ${hasAnyResult ? primaryBg : (hasGlobalError ? 'bg-red-600' : 'bg-slate-400')}`}>
                        {hasGlobalError ? (
                          <span className="text-sm font-bold mt-2 text-center">
                            {invalidAgeError ? t.invalidAge : requireMenarcheError ? t.requireMenarche : t.outOfRange}
                          </span>
                        ) : activeItems.length === 0 ? (
                          <div className="flex flex-col items-center justify-center w-full h-full text-center">
                            <span className="text-3xl font-bold opacity-80">--</span>
                            <span className="text-xs font-medium opacity-80 mt-1">
                              {lang === 'vi' ? 'Chưa chọn công thức cổ điển' : 'No classic formula selected'}
                            </span>
                          </div>
                        ) : activeItems.length === 1 ? (
                          <div className="text-center">
                            {activeItems[0].res ? (
                              <>
                                <div className="flex items-baseline justify-center gap-1">
                                  <span className="text-4xl font-bold">{activeItems[0].res.pah}</span>
                                  <span className="text-sm">cm</span>
                                </div>
                                <div className="text-xs opacity-80 mt-1">
                                  {activeItems[0].label} (+/- {activeItems[0].res.error})
                                </div>
                              </>
                            ) : activeItems[0].errText ? (
                              <>
                                <span className="text-xl font-bold opacity-80">--</span>
                                <div className="text-xs font-bold mt-1">{activeItems[0].errText}</div>
                              </>
                            ) : (
                              <>
                                <span className="text-4xl font-bold opacity-80">--</span>
                                <div className="text-xs opacity-80 mt-1">{activeItems[0].label}</div>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col w-full h-full gap-2">
                            {activeItems.map((item, idx) => (
                              <div
                                key={item.key}
                                className={`flex-1 flex flex-col items-center justify-center ${idx < activeItems.length - 1 ? 'border-b border-white/30 pb-1.5' : ''}`}
                              >
                                {item.res ? (
                                  <div className="text-center">
                                    <div className="flex items-baseline justify-center gap-1">
                                      <span className={`${activeItems.length === 2 ? 'text-2xl' : 'text-xl'} font-bold`}>
                                        {item.res.pah}
                                      </span>
                                      <span className="text-[10px]">cm</span>
                                    </div>
                                    <div className="text-[10px] opacity-80">
                                      {item.label} (+/- {item.res.error})
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center">
                                    <span className="text-lg font-bold opacity-80">--</span>
                                    <div className="text-[10px] opacity-80">
                                      {item.errText || item.label}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
          </div>

          {/* Mô hình AHP Thodberg-Martin (2012) Dedicated Card */}
          <div className={`${theme.cardBg} px-4 md:px-6 pt-6 pb-5 rounded-md border ${theme.cardBorder} relative shadow-xs mb-6 mt-4`}>
            <div className={`absolute -top-3 left-4 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-white rounded border ${theme.cardBorder} ${theme.labelDark} shadow-2xs flex items-center gap-2`}>
              <span>MÔ HÌNH AHP THODBERG-MARTIN (2012)</span>
              <span className="bg-amber-600 text-white text-[10px] px-1.5 py-0.5 rounded-sm font-extrabold tracking-wider">BETA</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
              {/* Left Settings & Intermediate Metrics */}
              <div className="md:col-span-7 space-y-4">
                <div>
                  <label className={`block text-sm ${theme.labelDark} mb-2`}>
                    Dữ liệu theo Quần thể
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setBxV2Pop('vietnam')}
                      className={`py-2 px-3 rounded-md text-xs font-semibold transition-all border ${bxV2Pop === 'vietnam' ? primaryBg + ' text-white border-[#1b365d] shadow-2xs' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}`}
                    >
                      Việt Nam
                    </button>
                    <button
                      type="button"
                      onClick={() => setBxV2Pop('caucasian')}
                      className={`py-2 px-3 rounded-md text-xs font-semibold transition-all border ${bxV2Pop === 'caucasian' ? primaryBg + ' text-white border-[#1b365d] shadow-2xs' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}`}
                    >
                      Trung Âu
                    </button>
                    <button
                      type="button"
                      onClick={() => setBxV2Pop('custom')}
                      className={`py-2 px-3 rounded-md text-xs font-semibold transition-all border ${bxV2Pop === 'custom' ? primaryBg + ' text-white border-[#1b365d] shadow-2xs' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}`}
                    >
                      Tuỳ chỉnh
                    </button>
                  </div>

                  {bxV2Pop === 'custom' && (
                    <div className="mt-2.5 bg-white p-3 rounded-md border border-slate-300 space-y-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Nam trưởng thành (150 – 195 cm)
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={customPopMale}
                            onWheel={(e) => e.currentTarget.blur()}
                            onChange={(e) => setCustomPopMale(e.target.value.replace(',', '.'))}
                            placeholder="168.1"
                            className={`w-full px-3 py-1.5 rounded border bg-white text-xs font-semibold outline-none ${theme.inputBorder}`}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Nữ trưởng thành (140 – 185 cm)
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={customPopFemale}
                            onWheel={(e) => e.currentTarget.blur()}
                            onChange={(e) => setCustomPopFemale(e.target.value.replace(',', '.'))}
                            placeholder="156.2"
                            className={`w-full px-3 py-1.5 rounded border bg-white text-xs font-semibold outline-none ${theme.inputBorder}`}
                          />
                        </div>
                      </div>
                      {customPopValidationError && (
                        <div className="text-[11px] font-semibold text-red-600 bg-red-50 px-2.5 py-1.5 rounded border border-red-200">
                          {customPopValidationError}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Optional modifiers */}
                <div className="bg-white/85 p-3.5 rounded-md border border-slate-300/90 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bxV2UseParents}
                        onChange={(e) => setBxV2UseParents(e.target.checked)}
                        className="rounded-xs accent-[#1b365d] w-3.5 h-3.5 shrink-0"
                      />
                      <span>Hiệu chỉnh Tiềm năng Di truyền (Dịch chuyển Thế hệ = +1.0cm)</span>
                    </label>
                    {bxV2Result && (
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${bxV2Result.intermediate_metrics.is_golden_window ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-50 text-amber-800 border-amber-300'}`}>
                        {bxV2Result.intermediate_metrics.is_golden_window
                          ? 'Thời điểm tối ưu cho dự đoán PAH'
                          : `Giai đoạn dậy thì (BA ≥ ${gender === 'boy' ? '12.0' : '10.5'}t)`}
                      </span>
                    )}
                  </div>

                  {gender === 'girl' && menarche === 'post' && (
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                      <span>
                        Chiều cao khi có chu kì kinh đầu:{' '}
                        <strong className={theme.labelDark}>
                          {bxV2MenarcheHeight && isValidHeight(Number(bxV2MenarcheHeight))
                            ? `${bxV2MenarcheHeight} cm (Mục tiêu H_M = ${(Number(bxV2MenarcheHeight) + 6.6).toFixed(1)} cm)`
                            : 'Chưa nhập (NA)'}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Intermediate metrics & 4-branch breakdown + V3 BMI reference */}
                {bxV2Result ? (
                  <div className="bg-white/90 p-3.5 rounded-md border border-slate-300/90 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200 flex flex-col items-center justify-center text-center">
                      <span className="text-slate-500 block text-[11px] font-medium leading-snug">
                        Dư địa tăng trưởng<br />&amp; CA-BA
                      </span>
                      <div className={`font-bold text-sm mt-1.5 ${theme.labelDark}`}>
                        {bxV2Result.intermediate_metrics.growth_potential_pct}%{' '}
                        <span className="text-xs font-semibold text-slate-600">
                          ({bxV2Result.intermediate_metrics.ba_delay_years > 0 ? '+' : ''}
                          {bxV2Result.intermediate_metrics.ba_delay_years}t)
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200 flex flex-col items-center justify-center text-center">
                      <span className="text-slate-500 block text-[11px] font-medium leading-snug">
                        Kết quả thô (Hraw)<br />PAH(x)
                      </span>
                      <div className={`font-bold text-sm mt-1.5 ${theme.labelDark}`}>
                        {bxV2Result.intermediate_metrics.h_raw_cm} cm
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200 flex flex-col items-center justify-center text-center">
                      <span className="text-slate-500 block text-[11px] font-medium leading-snug">
                        Hệ số Quần thể<br />(Hpred, w={bxV2Result.intermediate_metrics.w_pop})
                      </span>
                      <div className="font-bold text-sm text-slate-800 mt-1.5">
                        {bxV2Result.predictions.ahp_using_population_hpred.height_cm} ± {bxV2Result.predictions.ahp_using_population_hpred.rmse_cm} cm
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200 flex flex-col items-center justify-center text-center">
                      <span className="text-slate-500 block text-[11px] font-medium leading-snug">
                        Kết quả kết hợp<br />PAH (x+p)
                      </span>
                      <div className="font-bold text-sm text-slate-800 mt-1.5 leading-tight">
                        {bxV2Result.predictions.ahp_using_parents_hpredp ? (
                          <>
                            <span className="block">
                              {bxV2Result.predictions.ahp_using_parents_hpredp.height_cm} ± {bxV2Result.predictions.ahp_using_parents_hpredp.rmse_cm} cm
                            </span>
                            <span className="block text-[11px] font-semibold text-slate-500 mt-0.5">
                              (PAH (p): {bxV2Result.intermediate_metrics.target_height_from_parents_hp_cm})
                            </span>
                          </>
                        ) : (
                          'Chưa dùng'
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200 flex flex-col items-center justify-center text-center">
                      <span className="text-slate-500 block text-[11px] font-medium leading-snug">
                        Hiệu chỉnh theo kinh nguyệt<br />PAH (x+p+m)
                      </span>
                      <div className="font-bold text-sm text-slate-800 mt-1.5">
                        {bxV2Result.predictions.ahp_using_menarche_hpredm
                          ? `${bxV2Result.predictions.ahp_using_menarche_hpredm.height_cm} ± ${bxV2Result.predictions.ahp_using_menarche_hpredm.rmse_cm} cm`
                          : gender === 'girl'
                          ? 'Chưa nhập (NA)'
                          : 'Chỉ áp dụng cho Nữ'}
                      </div>
                    </div>

                    {gender === 'boy' && (
                      <div className="bg-amber-50/80 p-2.5 rounded border border-amber-200 flex flex-col items-center justify-center text-center">
                        <span className="text-amber-800 block text-[11px] font-semibold leading-snug">
                          Hiệu chỉnh theo BMI
                        </span>
                        <div className="font-bold text-xs text-amber-900 mt-1 leading-tight">
                          {bxV2Result.bmi_v3_reference.applicable ? (
                            bxV2Result.bmi_v3_reference.bmi_adjustment_cm !== null ? (
                              <>
                                <span className="block text-sm">
                                  {bxV2Result.bmi_v3_reference.bmi_adjustment_cm > 0 ? '+' : ''}
                                  {bxV2Result.bmi_v3_reference.bmi_adjustment_cm} cm
                                </span>
                                <span className="block font-normal text-[10px] text-amber-800 mt-0.5">
                                  (ΔH={bxV2Result.bmi_v3_reference.delta_h_coeff}, SDS={bxV2Result.bmi_v3_reference.bmi_sds})
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="block">ΔH = {bxV2Result.bmi_v3_reference.delta_h_coeff} cm/SDS</span>
                                <span className="block font-normal text-[10px] text-amber-800 mt-0.5">(Nhập cân nặng để tính)</span>
                              </>
                            )
                          ) : (
                            `ΔH = ${bxV2Result.bmi_v3_reference.delta_h_coeff} (BA ≥ 16t)`
                          )}
                        </div>
                        <span className="text-[10px] text-amber-700/90 block mt-1 leading-tight">
                          (chỉ cho trẻ nam, không tính vào kết quả)
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white/70 p-3.5 rounded-md border border-dashed border-slate-300 text-xs text-slate-500 text-center">
                    {noBoneAge
                      ? 'Mô hình AHP Thodberg-Martin (2012) yêu cầu có số liệu Tuổi xương chụp X-quang (bỏ tích "Không có tuổi xương").'
                      : customPopValidationError
                      ? customPopValidationError
                      : 'Nhập đầy đủ Tuổi thực, Chiều cao hiện tại và Tuổi xương X-quang ở bảng trên để tự động tính toán theo Mô hình AHP Thodberg-Martin (2012).'}
                  </div>
                )}
              </div>

              {/* Right Result Display Box */}
              <div className="md:col-span-5 flex flex-col gap-3">
                <div className={`w-full flex-1 rounded-md flex flex-col items-center justify-center p-5 text-white shadow-inner transition-all ${bxV2Result ? primaryBg : 'bg-slate-400'}`}>
                  {bxV2Result ? (
                    <div className="text-center w-full space-y-2.5">
                      {bxV2Pop === 'vietnam' && (
                        <div className="flex justify-center mb-2">
                          <svg
                            viewBox="0 0 30 20"
                            className="w-24 sm:w-28 md:w-32 aspect-[3/2] h-auto rounded shadow-sm border border-white/50 transition-all"
                            aria-label="Cờ Việt Nam"
                          >
                            <rect width="30" height="20" fill="#DA251D" />
                            <polygon
                              points="15,4.2 16.35,8.35 20.7,8.35 17.18,10.92 18.53,15.07 15,12.5 11.47,15.07 12.82,10.92 9.3,8.35 13.65,8.35"
                              fill="#FFFF00"
                            />
                          </svg>
                        </div>
                      )}
                      {bxV2Pop === 'caucasian' && (
                        <div className="flex justify-center mb-2">
                          <svg
                            viewBox="0 0 30 20"
                            className="w-24 sm:w-28 md:w-32 aspect-[3/2] h-auto rounded shadow-sm border border-white/50 transition-all"
                            aria-label="Cờ Liên minh Châu Âu"
                          >
                            <rect width="30" height="20" fill="#003399" />
                            <g fill="#FFCC00">
                              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
                                const rad = (deg * Math.PI) / 180;
                                const cx = 15 + 6 * Math.cos(rad);
                                const cy = 10 + 6 * Math.sin(rad);
                                return (
                                  <polygon
                                    key={deg}
                                    points={`${cx},${cy - 1.15} ${cx + 0.27},${cy - 0.35} ${cx + 1.1},${cy - 0.35} ${cx + 0.43},${cy + 0.14} ${cx + 0.68},${cy + 0.94} ${cx},${cy + 0.45} ${cx - 0.68},${cy + 0.94} ${cx - 0.43},${cy + 0.14} ${cx - 1.1},${cy - 0.35} ${cx - 0.27},${cy - 0.35}`}
                                  />
                                );
                              })}
                            </g>
                          </svg>
                        </div>
                      )}
                      <div className="inline-flex items-center gap-1.5 bg-white/15 px-2.5 py-0.5 rounded text-[11px] font-semibold border border-white/20">
                        <span>{bxV2Result.inputs.population_short} (Hpop: {bxV2Result.inputs.h_pop} cm)</span>
                      </div>
                      <div className="flex items-baseline justify-center gap-1 pt-1">
                        <span className="text-4xl font-extrabold tracking-tight">
                          {bxV2Result.predictions.final_predicted_height_cm}
                        </span>
                        <span className="text-base font-semibold">cm</span>
                      </div>
                      <div className="text-xs font-semibold opacity-90">
                        Sai số chuẩn (RMSE): ± {bxV2Result.predictions.rmse_cm} cm
                      </div>
                      <div className="pt-2 mt-2 border-t border-white/25 grid grid-cols-2 gap-2 text-[11px]">
                        <div className="bg-black/20 rounded p-2">
                          <div className="opacity-80 leading-tight">
                            Khoảng tin cậy 68%<br />(±1 RMSE)
                          </div>
                          <div className="font-bold text-xs mt-1">
                            {bxV2Result.predictions.confidence_interval_68_pct[0]} – {bxV2Result.predictions.confidence_interval_68_pct[1]} cm
                          </div>
                        </div>
                        <div className="bg-black/20 rounded p-2">
                          <div className="opacity-80 leading-tight">
                            Khoảng tin cậy 95%<br />(±1.96 RMSE)
                          </div>
                          <div className="font-bold text-xs mt-1">
                            {bxV2Result.predictions.confidence_interval_95_pct[0]} – {bxV2Result.predictions.confidence_interval_95_pct[1]} cm
                          </div>
                        </div>
                      </div>
                      <div className="pt-1.5">
                        <button
                          type="button"
                          onClick={() => setBxV2Enabled(!bxV2Enabled)}
                          className={`inline-flex items-center justify-center gap-2 text-xs font-bold px-4 py-1.5 rounded transition-all cursor-pointer select-none shadow-xs ${
                            bxV2Enabled
                              ? 'bg-amber-400 text-slate-900 hover:bg-amber-300 ring-1 ring-white/70'
                              : 'bg-white/15 text-white hover:bg-white/25 border border-white/35'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={bxV2Enabled}
                            onChange={(e) => setBxV2Enabled(e.target.checked)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-3.5 h-3.5 rounded-xs accent-amber-600 cursor-pointer"
                          />
                          <span>{bxV2Enabled ? 'Đã tích hợp vào Kết quả' : 'Tích hợp vào Kết quả'}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 space-y-3">
                      <div>
                        <span className="text-4xl font-bold opacity-80">--</span>
                        <div className="text-xs opacity-85 mt-1 font-medium">Mô hình AHP Thodberg-Martin (2012)</div>
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => setBxV2Enabled(!bxV2Enabled)}
                          className={`inline-flex items-center justify-center gap-2 text-xs font-bold px-4 py-1.5 rounded transition-all cursor-pointer select-none shadow-xs ${
                            bxV2Enabled
                              ? 'bg-amber-400 text-slate-900 hover:bg-amber-300 ring-1 ring-white/70'
                              : 'bg-white/15 text-white hover:bg-white/25 border border-white/35'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={bxV2Enabled}
                            onChange={(e) => setBxV2Enabled(e.target.checked)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-3.5 h-3.5 rounded-xs accent-amber-600 cursor-pointer"
                          />
                          <span>{bxV2Enabled ? 'Đã tích hợp vào Kết quả' : 'Tích hợp vào Kết quả'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* TW75 & BP Note Display */}
          {(noDataError || bpNoDataError || isBoneAgeDeviated) && !invalidAgeError && (
             <div className="text-center mb-4 text-sm font-medium text-red-600 space-y-1">
               {noDataError && <div>{t.tw75Note}</div>}
               {bpNoDataError && <div>{t.bpNoCoeff}</div>}
               {isBoneAgeDeviated && <div>{t.boneAgeDeviated}</div>}
             </div>
          )}

          <AnimatePresence>
            {resultTextStr && (
              <motion.div
                key="result-card"
                initial={{ opacity: 0, y: 20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                {/* Report Wrapper for PDF */}
                <div id="hexapah-report" className="bg-transparent p-2 -mx-2 rounded-md">
                  {/* Interpretation Text */}
                  <div className="mb-8">
                    <div className={`${theme.cardBg} px-5 pt-6 pb-5 rounded-md border ${theme.cardBorder} relative shadow-xs whitespace-pre-wrap`}>
                      <div className={`absolute -top-3 left-4 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-white rounded border ${theme.cardBorder} ${theme.labelDark} shadow-2xs`}>
                        {t.conclusionTitle}
                      </div>
                      <p className={`text-sm ${theme.labelDark} leading-relaxed font-medium text-justify`}>
                        {resultTextStr}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
                      <button 
                        onClick={handleCopy}
                        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-md transition-all shadow-2xs border font-bold text-sm active:scale-98 ${
                          copied
                            ? 'bg-emerald-700 text-white border-emerald-700'
                            : 'bg-white hover:bg-slate-50 border-slate-300 text-[#1b365d] hover:border-[#1b365d]/50'
                        }`}
                        title={t.copy}
                      >
                        {copied ? <Check size={16} strokeWidth={2.5} /> : <Copy size={16} className="text-[#1b365d]" />}
                        <span>{copied ? (lang === 'vi' ? 'Đã sao chép' : 'Copied') : t.copy}</span>
                      </button>
                      <button 
                        onClick={handleExportDocx}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-md transition-all shadow-2xs border font-bold text-sm bg-[#1b365d] hover:bg-[#152a4a] border-[#1b365d] text-white active:scale-98"
                        title={lang === 'vi' ? 'Xuất báo cáo Word (.docx)' : 'Export Word (.docx)'}
                      >
                        <FileText size={16} />
                        <span>{lang === 'vi' ? 'Báo cáo Word' : 'Word (.docx)'}</span>
                      </button>
                      <button 
                        onClick={handleExportPdf}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-md transition-all shadow-2xs border font-bold text-sm bg-[#2c4c7e] hover:bg-[#213a61] border-[#2c4c7e] text-white active:scale-98"
                        title={lang === 'vi' ? 'Xuất báo cáo PDF chuẩn A4 (.pdf)' : 'Export A4 PDF (.pdf)'}
                      >
                        <FileDown size={16} />
                        <span>{lang === 'vi' ? 'Báo cáo PDF' : 'PDF (.pdf)'}</span>
                      </button>
                      <button
                        onClick={() => setShowResetModal(true)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-md transition-all shadow-2xs border font-bold text-sm bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700 active:scale-98"
                      >
                        <RefreshCw size={16} />
                        <span>{t.newSession}</span>
                      </button>
                    </div>
                  </div>

            {/* Chart Section */}
            <div className="mt-10 pt-8 border-t border-slate-200 relative">
              <div id="hexapah-chart" className="relative w-full max-w-2xl mx-auto h-72 border-l-2 border-b-2 border-slate-400 flex items-end justify-evenly pb-0 px-6 md:px-10 mb-12 bg-slate-50/70 rounded-tr pt-4">
              {/* Y-axis labels */}
              <div className="absolute left-1 bottom-0 text-[10px] text-slate-400 font-mono">{chartMin}</div>
              <div className="absolute left-1 top-0 text-[10px] text-slate-400 font-mono">{chartMax}</div>
              <div className="absolute left-1 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">{Math.round((chartMin + chartMax) / 2)}</div>
              <div className="absolute -left-6 -bottom-4 text-[10px] text-slate-400 font-mono">cm</div>
              
              {/* Grid lines */}
              <div className="absolute left-0 right-0 top-0 border-t border-dashed border-slate-300"></div>
              <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-slate-300"></div>

              {/* PAH TW1 Bar */}
              {useTw1 && !noDataError && (
                <div className="flex flex-col items-center relative w-11 sm:w-14 md:w-16 z-10 h-full justify-end">
                  <div className="absolute -top-8 text-xs md:text-sm font-bold text-slate-800 bg-white/95 px-1.5 py-0.5 rounded-xs border border-slate-200 shadow-2xs whitespace-nowrap z-20">
                    {pahResult ? `${pahResult.pah} cm` : '--'}
                  </div>
                  <div 
                    className="w-full rounded-t-[2px] transition-all duration-1000 bg-[#1b365d] shadow-xs" 
                    style={{ height: pahResult ? `${getPercentage(pahResult.pah)}%` : '5%' }}
                  ></div>
                  <div className="absolute -bottom-6 font-bold text-slate-800 text-xs md:text-sm">TW1</div>
                </div>
              )}

              {/* PAH BP Bar */}
              {useBp && !bpNoDataError && (
                <div className="flex flex-col items-center relative w-11 sm:w-14 md:w-16 z-10 h-full justify-end">
                  <div className="absolute -top-8 text-xs md:text-sm font-bold text-slate-800 bg-white/95 px-1.5 py-0.5 rounded-xs border border-slate-200 shadow-2xs whitespace-nowrap z-20">
                    {bpResult ? `${bpResult.pah} cm` : '--'}
                  </div>
                  <div 
                    className="w-full rounded-t-[2px] transition-all duration-1000 bg-[#2c5282] shadow-xs" 
                    style={{ height: bpResult ? `${getPercentage(bpResult.pah)}%` : '5%' }}
                  ></div>
                  <div className="absolute -bottom-6 font-bold text-slate-800 text-xs md:text-sm">BP</div>
                </div>
              )}

              {/* PAH RWT Bar */}
              {useRwt && !rwtNoDataError && (
                <div className="flex flex-col items-center relative w-11 sm:w-14 md:w-16 z-10 h-full justify-end">
                  <div className="absolute -top-8 text-xs md:text-sm font-bold text-slate-800 bg-white/95 px-1.5 py-0.5 rounded-xs border border-slate-200 shadow-2xs whitespace-nowrap z-20">
                    {rwtResult ? `${rwtResult.pah} cm` : '--'}
                  </div>
                  <div 
                    className="w-full rounded-t-[2px] transition-all duration-1000 bg-[#4a6fa5] shadow-xs" 
                    style={{ height: rwtResult ? `${getPercentage(rwtResult.pah)}%` : '5%' }}
                  ></div>
                  <div className="absolute -bottom-6 font-bold text-slate-800 text-xs md:text-sm">RWT</div>
                </div>
              )}

              {/* AHP Thodberg-Martin (2012) Bar (only when ticked) */}
              {bxV2Enabled && bxV2Result && (
                <div className="flex flex-col items-center relative w-11 sm:w-14 md:w-16 z-10 h-full justify-end">
                  <div className="absolute -top-8 text-xs md:text-sm font-bold text-amber-800 bg-white/95 px-1.5 py-0.5 rounded-xs border border-amber-200 shadow-2xs whitespace-nowrap z-20">
                    {bxV2Result.predictions.final_predicted_height_cm} cm
                  </div>
                  <div 
                    className="w-full rounded-t-[2px] bg-amber-600 transition-all duration-1000 shadow-xs" 
                    style={{ height: `${getPercentage(bxV2Result.predictions.final_predicted_height_cm)}%` }}
                  ></div>
                  <div className="absolute -bottom-6 font-bold text-amber-800 text-xs md:text-sm whitespace-nowrap">TM'12</div>
                </div>
              )}

              {/* MPH Bar */}
              <div className="flex flex-col items-center relative w-11 sm:w-14 md:w-16 z-10 h-full justify-end">
                <div className="absolute -top-8 text-xs md:text-sm font-bold text-slate-600 bg-white/95 px-1.5 py-0.5 rounded-xs border border-slate-200 shadow-2xs whitespace-nowrap z-20">
                  {mph ? `${mph} cm` : '--'}
                </div>
                <div 
                  className="w-full rounded-t-[2px] bg-slate-400 transition-all duration-1000 shadow-xs" 
                  style={{ height: mph ? `${getPercentage(mph)}%` : '5%' }}
                ></div>
                <div className="absolute -bottom-6 font-bold text-slate-600 text-xs md:text-sm">MPH</div>
              </div>

              {/* VN'20 Bar */}
              <div className="flex flex-col items-center relative w-11 sm:w-14 md:w-16 z-10 h-full justify-end">
                <div className="absolute -top-8 text-xs md:text-sm font-bold text-emerald-700 bg-white/95 px-1.5 py-0.5 rounded-xs border border-emerald-200 shadow-2xs whitespace-nowrap z-20">
                  {vnAvgVal} cm
                </div>
                <div 
                  className="w-full rounded-t-[2px] bg-emerald-600 transition-all duration-1000 shadow-xs" 
                  style={{ height: `${getPercentage(vnAvgVal)}%` }}
                ></div>
                <div className="absolute -bottom-6 font-bold text-emerald-700 text-xs md:text-sm">VN'20</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
  
          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-gray-200/50 text-center relative">
            <div className="flex flex-wrap justify-center gap-6 mb-4 items-center">
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
            {digitalSign && (
              <div className="flex justify-end items-center gap-2 px-2 pb-1">
                <span className="text-[11px] text-gray-400 italic">
                  {lang === 'vi' ? 'Đã kí nháy:' : 'Initialed:'}
                </span>
                <img
                  src="/assets/aistudio/IMG_8037_5c4ef58d.JPG"
                  alt="Chữ kí nháy"
                  className="h-7 w-auto object-contain mix-blend-multiply opacity-90 select-none pointer-events-none"
                />
              </div>
            )}
            
            <div className="w-full">
              <AnimatePresence>
                {showLegend && (
                  <motion.div 
                    key="legend"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mb-4"
                  >
                    <div className="text-xs text-slate-600 text-center max-w-2xl mx-auto bg-slate-50 p-3 rounded-md border border-slate-200">
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
                    key="note"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-md text-xs text-amber-900 max-w-xl mx-auto mb-4 text-justify">
                      {t.noteContent}
                      <div className="mt-2 pt-2 border-t border-amber-200/60">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-sm w-full overflow-hidden"
      >
        <div className="p-6 text-center">
          <div className={`w-14 h-14 rounded-md flex items-center justify-center mx-auto mb-4 ${type === 'danger' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
            <Info size={28} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
          {description && <p className="text-sm text-slate-600 mb-4">{description}</p>}
          <div className="flex flex-col gap-2 mt-6">
            <button
              onClick={onConfirm}
              className={`w-full py-2.5 rounded-md font-bold text-white transition-transform active:scale-98 ${type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#1b365d] hover:bg-[#152a4a]'}`}
            >
              {confirmText}
            </button>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-md font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-transform active:scale-98"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
