import React from 'react';
import { BayesianStepResult } from '../data/bonexpertBayesian';
import { Gender, MenarcheStatus } from '../data/twmc';
import { Language } from '../i18n';
import { CheckCircle2, Sparkles, Activity, TrendingUp, ShieldCheck, Users } from 'lucide-react';

interface BoneXpertBayesianCardProps {
  lang: Language;
  gender: Gender;
  menarche: MenarcheStatus;
  result: BayesianStepResult | null;
  includeInReport: boolean;
  onToggleInclude: (checked: boolean) => void;
  popMode: 'ref1zls' | 'vn2020' | 'custom';
  onChangePopMode: (mode: 'ref1zls' | 'vn2020' | 'custom') => void;
  customPopHeight: string;
  onChangeCustomPopHeight: (val: string) => void;
  menarcheHeight: string;
  onChangeMenarcheHeight: (val: string) => void;
  currentHeight: string;
  noBoneAge: boolean;
}

export const BoneXpertBayesianCard: React.FC<BoneXpertBayesianCardProps> = ({
  lang,
  gender,
  menarche,
  result,
  includeInReport,
  onToggleInclude,
  popMode,
  onChangePopMode,
  customPopHeight,
  onChangeCustomPopHeight,
  menarcheHeight,
  onChangeMenarcheHeight,
  currentHeight,
  noBoneAge,
}) => {
  const isVi = lang === 'vi';

  const statusText = (status: 'normal' | 'advanced' | 'delayed') => {
    if (status === 'advanced') return isVi ? 'Phát triển xương sớm (BA > CA + 1)' : 'Advanced Bone Age';
    if (status === 'delayed') return isVi ? 'Phát triển xương chậm (BA < CA - 1)' : 'Delayed Bone Age';
    return isVi ? 'Phát triển bình thường (|CA - BA| ≤ 1)' : 'Normal Bone Age';
  };

  const statusBadgeClass = (status: 'normal' | 'advanced' | 'delayed') => {
    if (status === 'advanced') return 'bg-amber-100 text-amber-800 border-amber-300';
    if (status === 'delayed') return 'bg-sky-100 text-sky-800 border-sky-300';
    return 'bg-emerald-100 text-emerald-800 border-emerald-300';
  };

  return (
    <div className="mb-8 rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/90 via-white to-slate-50/90 p-4 md:p-6 shadow-md relative transition-all">
      {/* Top Header with BETA badge and Integration Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-indigo-100">
        <div className="flex items-start md:items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-sm shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base md:text-lg font-bold text-indigo-950">
                {isVi
                  ? 'Dự đoán Chiều cao với BoneXpert & Suy luận Bayesian'
                  : 'BoneXpert & Bayesian Inference Height Prediction'}
              </h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-extrabold uppercase tracking-wider bg-indigo-600 text-white shadow-xs">
                BETA
              </span>
            </div>
            <p className="text-xs text-indigo-700/80 mt-0.5">
              {isVi
                ? 'Mạng Nơ-ron Truyền thẳng (FFNN - Thodberg et al.) kết hợp hiệu chỉnh Bayesian đa tầng, BMI SDS & tiền sử dậy thì'
                : 'Feed-Forward Neural Network (Thodberg et al.) with Bayesian inference, BMI SDS & pubertal adjustment'}
            </p>
          </div>
        </div>

        {/* Integration Checkbox / Button */}
        <label
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all select-none shrink-0 ${
            includeInReport
              ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
              : 'bg-white hover:bg-indigo-50/70 border-indigo-200 text-indigo-900'
          }`}
        >
          <input
            type="checkbox"
            checked={includeInReport}
            onChange={(e) => onToggleInclude(e.target.checked)}
            className="w-4 h-4 rounded accent-white cursor-pointer"
          />
          <span className="text-xs md:text-sm font-bold">
            {isVi ? 'Tích hợp vào kết quả cuối & báo cáo' : 'Include in final result & report'}
          </span>
          {includeInReport && <CheckCircle2 size={16} className="text-white shrink-0" />}
        </label>
      </div>

      {/* Parameter Bar: Population Reference Height & Menarche Onset Height */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-3 bg-white/80 p-3 rounded-xl border border-indigo-100">
        <div className="md:col-span-7 flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="text-xs font-bold text-indigo-900 whitespace-nowrap">
            {isVi ? 'Chuẩn quần thể (Hpop):' : 'Population Ref (Hpop):'}
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => onChangePopMode('ref1zls')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                popMode === 'ref1zls'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-indigo-50'
              }`}
            >
              {isVi
                ? `Chuẩn gốc 1ZLS (${gender === 'boy' ? '178.2' : '165.0'} cm)`
                : `1ZLS Ref (${gender === 'boy' ? '178.2' : '165.0'} cm)`}
            </button>
            <button
              type="button"
              onClick={() => onChangePopMode('vn2020')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                popMode === 'vn2020'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-indigo-50'
              }`}
            >
              {isVi
                ? `Việt Nam 2020 (${gender === 'boy' ? '168.1' : '156.2'} cm)`
                : `Vietnam 2020 (${gender === 'boy' ? '168.1' : '156.2'} cm)`}
            </button>
            <button
              type="button"
              onClick={() => onChangePopMode('custom')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                popMode === 'custom'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-indigo-50'
              }`}
            >
              {isVi ? 'Tùy chỉnh' : 'Custom'}
            </button>
          </div>
          {popMode === 'custom' && (
            <input
              type="text"
              inputMode="decimal"
              value={customPopHeight}
              onChange={(e) => onChangeCustomPopHeight(e.target.value.replace(',', '.'))}
              placeholder={gender === 'boy' ? '178.2' : '165.0'}
              className="w-24 px-2.5 py-1 text-xs font-bold text-indigo-950 bg-white border border-indigo-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400 text-center"
            />
          )}
        </div>

        {gender === 'girl' && menarche === 'post' && (
          <div className="md:col-span-5 flex items-center justify-between sm:justify-end gap-2 border-t md:border-t-0 pt-2 md:pt-0 border-indigo-100">
            <label className="text-xs font-bold text-pink-800">
              {isVi ? 'Chiều cao lúc bắt đầu có kinh (cm):' : 'Height at menarche (cm):'}
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={menarcheHeight}
              onChange={(e) => onChangeMenarcheHeight(e.target.value.replace(',', '.'))}
              placeholder={currentHeight || '145.0'}
              className="w-24 px-2.5 py-1 text-xs font-bold text-pink-900 bg-pink-50/60 border border-pink-300 rounded-lg outline-none focus:ring-2 focus:ring-pink-400 text-center"
              title={
                isVi
                  ? 'Nếu để trống, hệ thống mặc định lấy chiều cao hiện tại làm mốc tính H_M = H_menarche + 6.6 cm'
                  : 'Defaults to current standing height if left blank'
              }
            />
          </div>
        )}
      </div>

      {/* Main Content or Empty State */}
      {!result || noBoneAge ? (
        <div className="mt-4 p-4 rounded-xl bg-white/70 border border-dashed border-indigo-200 text-center text-xs text-indigo-800/80">
          {noBoneAge
            ? isVi
              ? 'Mô hình BoneXpert & Suy luận Bayesian yêu cầu phải có dữ liệu Tuổi xương X-quang (5 – 18 tuổi).'
              : 'BoneXpert & Bayesian model requires X-ray Bone Age (5 – 18 years).'
            : isVi
            ? 'Vui lòng nhập đầy đủ Tuổi thực (5 – 18 tuổi), Chiều cao hiện tại và Tuổi xương (và chọn Kinh nguyệt với trẻ nữ) để tính toán mô hình BoneXpert & Bayesian.'
            : 'Please enter Chronological Age (5 – 18 yrs), Standing Height, and Bone Age to compute the BoneXpert & Bayesian model.'}
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {/* Top Highlight Banner: Final Predicted Height & Confidence Intervals */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-indigo-900 text-white p-4 rounded-xl shadow-sm items-center">
            <div className="md:col-span-5 text-center md:text-left border-b md:border-b-0 md:border-r border-indigo-700/80 pb-3 md:pb-0 md:pr-4">
              <div className="text-[11px] uppercase tracking-wider text-indigo-200 font-semibold">
                {isVi ? 'Chiều cao trưởng thành dự đoán cuối cùng' : 'Final Predicted Adult Height'}
              </div>
              <div className="flex items-baseline justify-center md:justify-start gap-2 mt-1">
                <span className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
                  {result.finalHeight.toFixed(1)}
                </span>
                <span className="text-base font-semibold text-indigo-200">
                  ± {result.finalRmse.toFixed(2)} cm
                </span>
              </div>
              <div className="text-[11px] text-indigo-200 mt-1 font-medium">
                {result.finalHeightLabel}
              </div>
            </div>

            <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div className="bg-indigo-800/70 rounded-lg p-2.5 border border-indigo-700">
                <div className="text-[11px] text-indigo-200 font-medium">
                  {isVi ? 'Sai số chuẩn (RMSE)' : 'Standard Error (RMSE)'}
                </div>
                <div className="text-base font-bold text-white mt-0.5">
                  ± {result.finalRmse.toFixed(2)} cm
                </div>
                <div className="text-[10px] text-indigo-300">
                  {isVi ? 'Nội suy tuyến tính theo BA' : 'Interpolated by BA'}
                </div>
              </div>

              <div className="bg-indigo-800/70 rounded-lg p-2.5 border border-indigo-700">
                <div className="text-[11px] text-indigo-200 font-medium">
                  {isVi ? 'Khoảng tin cậy 68% (±1 RMSE)' : '68% CI (±1 RMSE)'}
                </div>
                <div className="text-base font-bold text-emerald-300 mt-0.5">
                  {result.ci68[0].toFixed(1)} – {result.ci68[1].toFixed(1)} cm
                </div>
                <div className="text-[10px] text-indigo-300">
                  {isVi ? 'Xác suất đạt 68%' : '68% probability range'}
                </div>
              </div>

              <div className="bg-indigo-800/70 rounded-lg p-2.5 border border-indigo-700">
                <div className="text-[11px] text-indigo-200 font-medium">
                  {isVi ? 'Khoảng tin cậy 95% (±1.96 RMSE)' : '95% CI (±1.96 RMSE)'}
                </div>
                <div className="text-base font-bold text-amber-300 mt-0.5">
                  {result.ci95[0].toFixed(1)} – {result.ci95[1].toFixed(1)} cm
                </div>
                <div className="text-[10px] text-indigo-300">
                  {isVi ? 'Biên độ lâm sàng tối đa' : '95% clinical range'}
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Sections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Các chỉ số động học tăng trưởng */}
            <div className="bg-white rounded-xl p-3.5 border border-indigo-100 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-900 mb-2.5 pb-1.5 border-b border-gray-100">
                  <Activity size={14} className="text-indigo-600" />
                  {isVi ? '1. Động học tăng trưởng' : '1. Growth Kinetics'}
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">
                        {isVi ? 'Độ lệch tuổi xương (CA - BA):' : 'Bone Age Offset (CA - BA):'}
                      </span>
                      <span className="font-bold text-gray-900">
                        {result.caMinusBa > 0 ? `+${result.caMinusBa}` : result.caMinusBa}{' '}
                        {isVi ? 'năm' : 'yrs'}
                      </span>
                    </div>
                    <div className="mt-1">
                      <span
                        className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md border ${statusBadgeClass(
                          result.boneAgeStatus
                        )}`}
                      >
                        {statusText(result.boneAgeStatus)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1.5 border-t border-gray-50">
                    <span className="text-gray-600 font-medium">
                      {isVi ? 'Tiềm năng tăng trưởng còn lại (gp):' : 'Remaining Growth Potential (gp):'}
                    </span>
                    <span className="font-bold text-indigo-700 text-sm">
                      {result.gpPercent.toFixed(2)}%
                    </span>
                  </div>

                  <div className="pt-1.5 border-t border-gray-50">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">
                        {isVi ? 'Chỉ số BMI & BMI SDS (theo BA):' : 'BMI & BMI SDS (by BA):'}
                      </span>
                      {result.bmi !== null && result.bmiSdsClamped !== null ? (
                        <span className="font-bold text-gray-900">
                          {result.bmi.toFixed(1)} kg/m² ({result.bmiSdsClamped > 0 ? '+' : ''}
                          {result.bmiSdsClamped.toFixed(2)} SDS)
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">
                          {isVi ? 'Chưa nhập cân nặng' : 'No weight'}
                        </span>
                      )}
                    </div>
                    {result.bmiSdsRaw !== null && Math.abs(result.bmiSdsRaw) > 2.0 && (
                      <div className="text-[10px] text-amber-700 mt-0.5 italic">
                        {isVi
                          ? `* Đã giới hạn ngưỡng cắt (truncation) tại ±2.0 SDS (gốc: ${result.bmiSdsRaw.toFixed(2)})`
                          : `* Truncated at ±2.0 SDS (raw: ${result.bmiSdsRaw.toFixed(2)})`}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Chiều cao trưởng thành qua từng bước xử lý */}
            <div className="bg-white rounded-xl p-3.5 border border-indigo-100 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-900 mb-2.5 pb-1.5 border-b border-gray-100">
                  <TrendingUp size={14} className="text-indigo-600" />
                  {isVi ? '2. Chiều cao qua từng bước' : '2. Step-by-Step Heights'}
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">
                      {isVi ? 'Dự đoán thô (Hraw - FFNN):' : 'Raw Prediction (Hraw):'}
                    </span>
                    <span className="font-bold text-gray-900">{result.hRaw.toFixed(1)} cm</span>
                  </div>

                  <div className="flex justify-between items-center pt-1.5 border-t border-gray-50">
                    <span className="text-gray-600 font-medium" title={`w_pop = ${result.wPopPct}%`}>
                      {isVi
                        ? `Hiệu chỉnh quần thể (Hpred, w=${result.wPopPct}%):`
                        : `Pop-Adjusted (Hpred, w=${result.wPopPct}%):`}
                    </span>
                    <span className="font-bold text-indigo-700">{result.hPred.toFixed(1)} cm</span>
                  </div>

                  <div className="flex justify-between items-center pt-1.5 border-t border-gray-50">
                    <span className="text-gray-600 font-medium">
                      {isVi ? 'Mức bù trừ do BMI (ΔH_BMI):' : 'BMI Adjustment (ΔH_BMI):'}
                    </span>
                    {result.deltaHBmi !== null ? (
                      <span
                        className={`font-bold ${
                          result.deltaHBmi >= 0 ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {result.deltaHBmi > 0 ? `+${result.deltaHBmi.toFixed(2)}` : result.deltaHBmi.toFixed(2)} cm
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">--</span>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-1.5 border-t border-gray-50">
                    <span className="text-gray-600 font-medium">
                      {isVi ? 'Dự đoán tích hợp BMI (HpredW):' : 'BMI-Adjusted (HpredW):'}
                    </span>
                    {result.hPredW !== null ? (
                      <span className="font-bold text-indigo-900 text-sm">
                        {result.hPredW.toFixed(1)} cm
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">
                        {isVi ? 'Cần nhập cân nặng' : 'Requires weight'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Kết quả mở rộng (Di truyền Cha Mẹ & Sau Kinh Nguyệt) */}
            <div className="bg-white rounded-xl p-3.5 border border-indigo-100 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-900 mb-2.5 pb-1.5 border-b border-gray-100">
                  <Users size={14} className="text-indigo-600" />
                  {isVi ? '3. Mở rộng (Cha Mẹ & Dậy thì)' : '3. Extended Modules'}
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">
                      {isVi ? 'Chiều cao di truyền chuẩn hóa (HP):' : 'Normalized Parental (HP):'}
                    </span>
                    {result.hParentEst !== null ? (
                      <span className="font-bold text-gray-900">
                        {result.hParentEst.toFixed(1)} cm (wP={result.wPPct}%)
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">
                        {isVi ? 'Chưa đủ chiều cao Bố & Mẹ' : 'Requires both parents'}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-1.5 border-t border-gray-50">
                    <span className="text-gray-600 font-medium">
                      {isVi ? 'Tích hợp di truyền cha mẹ (HpredP):' : 'Parent-Adjusted (HpredP):'}
                    </span>
                    {result.hPredP !== null ? (
                      <span className="font-bold text-indigo-700">
                        {result.hPredP.toFixed(1)} ± {result.rmseP?.toFixed(2)} cm
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">--</span>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-1.5 border-t border-gray-50">
                    <span className="text-gray-600 font-medium">
                      {isVi ? 'Tích hợp Cha Mẹ + BMI (HpredPW):' : 'Parent + BMI (HpredPW):'}
                    </span>
                    {result.hPredPW !== null ? (
                      <span className="font-bold text-indigo-900">
                        {result.hPredPW.toFixed(1)} ± {result.rmseP?.toFixed(2)} cm
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">--</span>
                    )}
                  </div>

                  {gender === 'girl' && (
                    <div className="flex justify-between items-center pt-1.5 border-t border-gray-50">
                      <span className="text-gray-600 font-medium">
                        {isVi ? 'Cập nhật sau kinh nguyệt (HpredM):' : 'Post-Menarche (HpredM):'}
                      </span>
                      {result.hPredM !== null && result.rmseM !== null ? (
                        <span className="font-bold text-pink-700">
                          {result.hPredM.toFixed(1)} ± {result.rmseM.toFixed(2)} cm
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">
                          {isVi ? 'Áp dụng khi Đã có kinh' : 'Post-menarche only'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
