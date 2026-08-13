import React, { useMemo } from 'react';
import { generateChartDataUrl } from '../utils/exportMetrics';

export const PrintableReport = ({ patientData, results, conclusions, t, chartData }: any) => {
  const chartImage = useMemo(() => {
    return chartData && chartData.length > 0 ? generateChartDataUrl(chartData) : null;
  }, [chartData]);
  
  return (
    <div id="print-only-container" className="hidden print:flex absolute top-0 left-0 w-full bg-white text-black p-[2cm] text-base z-50 flex-col">
      <div className="border-[2px] border-[#808080] p-8 relative min-h-[calc(100vh-4cm)] flex flex-col">
        {/* Header */}
        <div className="text-center border-b-[4px] border-[#1E3A8A] pb-4 mb-6">
          <h1 className="text-3xl font-bold text-[#1E3A8A]">PolyPredict APH version 26.8</h1>
          <p className="text-xl mt-1 text-black font-bold">Tác giả: Bác sĩ Đỗ Tiến Sơn</p>
          <p className="text-2xl mt-4 text-[#1E3A8A] font-bold">
            {t.subtitle === "Dự đoán APH đa mô thức" ? "Dự đoán chiều cao khi trưởng thành đa mô thức" : t.subtitle}
          </p>
        </div>
        
        {/* Patient Info */}
        <div className="border-[2px] border-[#1E3A8A] mb-6">
          <div className="bg-[#E0E7FF] text-[#1E3A8A] font-bold text-lg text-center py-2">
            {t.adminInfoTitle || 'THÔNG TIN HÀNH CHÍNH'}
          </div>
          <div className="flex bg-[#F8FAFC]">
            <div className="w-1/2 flex flex-col gap-2 p-4">
              <div><strong>Họ tên:</strong> {patientData.name || 'Ẩn danh'}</div>
              <div><strong>Tuổi:</strong> {patientData.ageYears} tuổi {patientData.ageMonths} tháng</div>
              <div><strong>Giới tính:</strong> {patientData.genderStr}</div>
              <div><strong>Tuổi xương:</strong> {patientData.effectiveBoneAge || '---'}</div>
            </div>
            <div className="w-1/2 flex flex-col gap-2 p-4">
              <div><strong>Chiều cao:</strong> {patientData.currentHeight ? `${patientData.currentHeight} cm` : '---'}</div>
              <div><strong>Cân nặng:</strong> {patientData.weight ? `${patientData.weight} kg` : '---'}</div>
              <div><strong>MPH:</strong> {patientData.mph ? `${patientData.mph} cm` : '---'}</div>
              {patientData.gender === 'girl' && (
                <div><strong>Kinh nguyệt:</strong> {patientData.menarche === 'yes' ? 'Đã có' : 'Chưa'}</div>
              )}
            </div>
          </div>
        </div>
        
        {/* Results */}
        <div className="mb-6 leading-relaxed whitespace-pre-wrap">
          {results.resultText}
        </div>
        
        {/* Conclusions */}
        <div className="border-[2px] border-[#1E3A8A] mb-6 leading-relaxed bg-[#F8FAFC]">
          <div className="bg-[#E0E7FF] text-[#1E3A8A] font-bold text-lg text-center py-2">
            {t.conclusionTitle || 'KẾT LUẬN'}
          </div>
          <div className="p-4">
            {conclusions.map((c: any, i: number) => (
            <div key={i} className="mb-2">
              <p>
                - <strong>{c.methodName}</strong>{c.midText}
                <strong>{c.pah} ± {c.error}</strong>{c.endText}
              </p>
            </div>
            ))}
          </div>
        </div>
        
        {/* Chart */}
        {chartImage && (
          <div className="text-center my-8">
            <img src={chartImage} alt="Chart" className="mx-auto" style={{ maxWidth: '600px', width: '100%' }} />
            <p className="italic mt-4 text-[#808080]">Dự kiến chiều cao trưởng thành (PolyPredict APH - Dr. Do Tien Son)</p>
          </div>
        )}
        
        <div className="flex-grow"></div>
        
        {/* Footer */}
        <div className="text-center text-[#808080] font-bold text-lg mt-8 pt-4 border-t-[2px] border-gray-300">
          DỮ LIỆU CÁ NHÂN BÍ MẬT - KHÔNG SAO CHỤP
        </div>
      </div>
    </div>
  );
};
