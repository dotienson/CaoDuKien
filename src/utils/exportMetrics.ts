import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  Footer,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ImageRun,
  VerticalAlign,
  LineRuleType,
} from 'docx';
import { saveAs } from 'file-saver';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { bpTable } from '../bpTable';
import { rwtGirls, rwtBoys, rwtErrorMargins, RWTCoefficient } from '../data/rwt';
import { Coefficients } from '../data/twmc';
import { BxV3PredictionResult } from '../data/bonexpertV2';

// Initialize pdfMake VFS with bundled Roboto Unicode fonts (full Vietnamese diacritics support)
const resolvedVfs = (pdfFonts as any)?.pdfMake?.vfs || (pdfFonts as any)?.vfs || pdfFonts;
if (typeof (pdfMake as any).addVirtualFileSystem === 'function') {
  (pdfMake as any).addVirtualFileSystem(resolvedVfs);
} else {
  (pdfMake as any).vfs = resolvedVfs;
}

export interface PahSummaryRow {
  methodKey: string;
  methodName: string;
  pah: number;
  error: number;
  ci95Low: number;
  ci95High: number;
  diffMph: number | null;
  isPreferred?: boolean;
  note?: string;
}

export interface ClinicalReportPayload {
  patientData: {
    name: string;
    gender: 'boy' | 'girl';
    genderStr: string;
    dob?: string;
    examDate?: string;
    xrayDate?: string;
    ageYears: number | string;
    ageMonths: number | string;
    chronAge?: number;
    currentHeight: string | number;
    weight?: string | number;
    bmi?: number | null;
    fatherHeight?: string | number;
    motherHeight?: string | number;
    mph?: string | number;
    menarche?: string;
    menarcheHeight?: string | number;
    effectiveBoneAge: string | number;
    noBoneAge?: boolean;
    caMinusBa?: number | null;
    estimatedAphv?: number | null;
    baPeak?: number;
    isTeleconsultation?: boolean;
    hideCoefficients?: boolean;
    digitalSign?: boolean;
    boneXpertPah?: string;
  };
  summaryRows: PahSummaryRow[];
  bpFraction?: number | null;
  tw1Coeffs?: Coefficients | null;
  rwtCoeffs?: RWTCoefficient | null;
  bxV2Result?: BxV3PredictionResult | null;
  bxV2Enabled?: boolean;
  conclusionText: string;
  lang?: 'vi' | 'en';
  chartData: Array<{
    method: string;
    fullName?: string;
    pah: number;
    error: number;
    style?: { lineDash?: string; markerType?: string };
  }>;
}

interface ForestPlotRenderResult {
  uint8Array: Uint8Array;
  dataUrl: string;
  width: number;
  height: number;
}

async function loadSignatureImage(): Promise<ForestPlotRenderResult | null> {
  if (typeof document === 'undefined') return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const targetW = 480;
        const targetH = Math.round((targetW / img.width) * img.height);
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, targetW, targetH);
        // Remove near-white background and find tight ink bounding box
        const imageData = ctx.getImageData(0, 0, targetW, targetH);
        const data = imageData.data;
        let minX = targetW;
        let minY = targetH;
        let maxX = 0;
        let maxY = 0;

        for (let y = 0; y < targetH; y++) {
          for (let x = 0; x < targetW; x++) {
            const idx = (y * targetW + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const brightness = (r + g + b) / 3;
            if (brightness > 235) {
              data[idx + 3] = 0;
            } else if (brightness > 200) {
              data[idx + 3] = Math.round(((235 - brightness) / 35) * 255);
            }
            if (data[idx + 3] > 20) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        ctx.putImageData(imageData, 0, 0);

        // Crop tightly around the signature ink so it aligns flush to the right margin
        const pad = 2;
        const cropX = Math.max(0, minX - pad);
        const cropY = Math.max(0, minY - pad);
        const cropW = maxX >= minX ? Math.min(targetW - cropX, maxX - minX + 1 + pad * 2) : targetW;
        const cropH = maxY >= minY ? Math.min(targetH - cropY, maxY - minY + 1 + pad * 2) : targetH;

        const croppedCanvas = document.createElement('canvas');
        croppedCanvas.width = cropW;
        croppedCanvas.height = cropH;
        const croppedCtx = croppedCanvas.getContext('2d');
        if (!croppedCtx) {
          resolve(null);
          return;
        }
        croppedCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

        const dataUrl = croppedCanvas.toDataURL('image/png');
        const base64 = dataUrl.split(',')[1] || '';
        const binaryStr = atob(base64);
        const uint8Array = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          uint8Array[i] = binaryStr.charCodeAt(i);
        }
        resolve({
          uint8Array,
          dataUrl,
          width: cropW,
          height: cropH,
        });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = '/assets/aistudio/IMG_8037_5c4ef58d.JPG';
  });
}

export async function loadTeleconsultStampImage(): Promise<ForestPlotRenderResult | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const targetW = 600;
        const targetH = Math.round((img.height / img.width) * targetW);
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, targetW, targetH);

        const imageData = ctx.getImageData(0, 0, targetW, targetH);
        const data = imageData.data;
        let minX = targetW;
        let minY = targetH;
        let maxX = 0;
        let maxY = 0;

        for (let y = 0; y < targetH; y++) {
          for (let x = 0; x < targetW; x++) {
            const idx = (y * targetW + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];
            // Detect non-transparent and non-pure-white pixels of the stamp
            if (a > 25 && !(r > 245 && g > 245 && b > 245)) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        const pad = 4;
        const cropX = Math.max(0, minX - pad);
        const cropY = Math.max(0, minY - pad);
        const cropW = maxX >= minX ? Math.min(targetW - cropX, maxX - minX + 1 + pad * 2) : targetW;
        const cropH = maxY >= minY ? Math.min(targetH - cropY, maxY - minY + 1 + pad * 2) : targetH;

        const croppedCanvas = document.createElement('canvas');
        croppedCanvas.width = cropW;
        croppedCanvas.height = cropH;
        const croppedCtx = croppedCanvas.getContext('2d');
        if (!croppedCtx) {
          resolve(null);
          return;
        }
        croppedCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

        const dataUrl = croppedCanvas.toDataURL('image/png');
        const base64 = dataUrl.split(',')[1] || '';
        const binaryStr = atob(base64);
        const uint8Array = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          uint8Array[i] = binaryStr.charCodeAt(i);
        }
        resolve({
          uint8Array,
          dataUrl,
          width: cropW,
          height: cropH,
        });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = '/assets/aistudio/99.99__51474235.png';
  });
}

function getMethodLegendMap(lang: 'vi' | 'en' = 'vi'): Record<string, string> {
  const isEn = lang === 'en';
  return {
    TW1: 'TW1: Tanner-Whitehouse Mark I (1975)',
    BP: 'BP: Bayley-Pinneau (1953)',
    RWT: 'RWT: Roche-Wainer-Thissen (1975)',
    'BoneXpert (AsiChi)': 'BX 3.1: BoneXpert AHP 3.1 (AsiChi)',
    'AHP Thodberg-Martin (VN)': 'AHP TM (VN): Thodberg-Martin 2012 (NIN FH VN 2020)',
    'AHP Thodberg-Martin (EU)': isEn
      ? 'AHP TM (EU): Thodberg-Martin 2012 (Caucasian - Zurich)'
      : 'AHP TM (EU): Thodberg-Martin 2012 (Châu Âu - Zurich)',
    'AHP Thodberg-Martin (Custom)': isEn
      ? 'AHP TM (Custom): Thodberg-Martin 2012 (Custom)'
      : 'AHP TM (Custom): Thodberg-Martin 2012 (Tùy chỉnh)',
  };
}

function drawMarker(
  ctx: CanvasRenderingContext2D,
  markerType: string | undefined,
  xCenter: number,
  y: number,
  filled = true
) {
  ctx.beginPath();
  switch (markerType) {
    case 'square':
      ctx.rect(xCenter - 4.5, y - 4.5, 9, 9);
      break;
    case 'triangle':
      ctx.moveTo(xCenter, y - 5.5);
      ctx.lineTo(xCenter - 5.5, y + 4.5);
      ctx.lineTo(xCenter + 5.5, y + 4.5);
      ctx.closePath();
      break;
    case 'diamond':
      ctx.moveTo(xCenter, y - 6);
      ctx.lineTo(xCenter + 6, y);
      ctx.lineTo(xCenter, y + 6);
      ctx.lineTo(xCenter - 6, y);
      ctx.closePath();
      break;
    case 'star':
      for (let j = 0; j < 5; j++) {
        ctx.lineTo(
          xCenter + Math.cos(((18 + j * 72) / 180) * Math.PI) * 6.5,
          y - Math.sin(((18 + j * 72) / 180) * Math.PI) * 6.5
        );
        ctx.lineTo(
          xCenter + Math.cos(((54 + j * 72) / 180) * Math.PI) * 3.0,
          y - Math.sin(((54 + j * 72) / 180) * Math.PI) * 3.0
        );
      }
      ctx.closePath();
      break;
    default:
      ctx.arc(xCenter, y, 4.5, 0, Math.PI * 2);
      break;
  }
  if (filled) {
    ctx.fill();
  } else {
    ctx.stroke();
  }
}

function generateForestPlotImage(
  data: Array<{
    method: string;
    fullName?: string;
    pah: number;
    error: number;
    style?: { lineDash?: string; markerType?: string };
  }>,
  mphVal?: number | null,
  lang: 'vi' | 'en' = 'vi'
): ForestPlotRenderResult {
  const isEn = lang === 'en';
  const methodLegendMap = getMethodLegendMap(lang);
  const canvas = document.createElement('canvas');
  const scale = 2; // High-DPI rendering for crisp A4 print
  const logicalWidth = 820;
  const rowHeight = 38;
  const marginTop = 38;
  const marginLeft = 225;
  const marginRight = 150;

  const hasMph = typeof mphVal === 'number' && !isNaN(mphVal) && mphVal >= 130;

  // Build plot rows: MPH at the very top with ± 8.5 cm, followed by selected methods
  const plotRows: Array<{
    method: string;
    fullName?: string;
    pah: number;
    error: number;
    style?: { lineDash?: string; markerType?: string };
  }> = [
    ...(hasMph
      ? [
          {
            method: 'MPH',
            fullName: isEn
              ? 'MPH: Mid-Parental Height Target Range'
              : 'MPH: Dải tiềm năng di truyền',
            pah: mphVal!,
            error: 8.5,
            style: { lineDash: '10,4', markerType: 'diamond' },
          },
        ]
      : []),
    ...data,
  ];

  // Build legend items matching plot rows
  const legendItems: Array<{
    label: string;
    markerType?: string;
    lineDash?: string;
  }> = plotRows.map((d) => ({
    label: d.fullName || methodLegendMap[d.method] || d.method,
    markerType: d.style?.markerType || 'circle',
    lineDash: d.style?.lineDash || '',
  }));

  // First measure inline legend rows on a scratch context
  const measureCtx = canvas.getContext('2d');
  const legendMaxRowWidth = logicalWidth - 48;
  const sampleGraphicWidth = 34;
  const itemGapX = 20;
  const legendRowHeight = 20;

  type PositionedLegendItem = {
    item: (typeof legendItems)[number];
    x: number;
    rowIdx: number;
    width: number;
  };

  const positionedLegend: PositionedLegendItem[] = [];
  let currentRow = 0;
  let currentX = 0;

  if (measureCtx) {
    measureCtx.font = '11px Arial, sans-serif';
    legendItems.forEach((item) => {
      const textW = measureCtx.measureText(item.label).width;
      const totalItemW = sampleGraphicWidth + 6 + textW;
      if (currentX > 0 && currentX + totalItemW > legendMaxRowWidth) {
        currentRow += 1;
        currentX = 0;
      }
      positionedLegend.push({
        item,
        x: currentX,
        rowIdx: currentRow,
        width: totalItemW,
      });
      currentX += totalItemW + itemGapX;
    });
  }

  const totalLegendRows = positionedLegend.length > 0 ? currentRow + 1 : 1;
  const legendBoxPaddingY = 8;
  const legendHeight = totalLegendRows * legendRowHeight + legendBoxPaddingY * 2;
  const axisZoneHeight = 52;
  const plotBottom = marginTop + Math.max(1, plotRows.length) * rowHeight;
  const logicalHeight = plotBottom + axisZoneHeight + legendHeight + 12;

  canvas.width = logicalWidth * scale;
  canvas.height = logicalHeight * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { uint8Array: new Uint8Array(), dataUrl: '', width: logicalWidth, height: logicalHeight };
  }

  ctx.scale(scale, scale);

  // Pure white background (outer box border is handled by the report table cell so width matches Box III 100%)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, logicalWidth, logicalHeight);

  // Title inside chart
  ctx.font = 'bold 14px Arial, sans-serif';
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(
    isEn ? 'PREDICTED ADULT HEIGHT COMPARISON CHART' : 'BIỂU ĐỒ SO SÁNH CHIỀU CAO DỰ KIẾN',
    logicalWidth / 2,
    10
  );

  const allLows = plotRows.map((d) => d.pah - d.error);
  const allHighs = plotRows.map((d) => d.pah + d.error);

  const minPah = Math.min(...allLows);
  const maxPah = Math.max(...allHighs);
  const padding = 2.5;
  const xMin = Math.floor(minPah - padding);
  const xMax = Math.ceil(maxPah + padding);

  const plotWidth = logicalWidth - marginLeft - marginRight;
  const xScale = (val: number) => marginLeft + ((val - xMin) / Math.max(1, xMax - xMin)) * plotWidth;

  const plotTop = marginTop - 6;

  // Horizontal X-axis line
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(marginLeft, plotBottom);
  ctx.lineTo(logicalWidth - marginRight, plotBottom);
  ctx.stroke();

  // X-axis ticks & grid lines
  ctx.font = '12px Arial, sans-serif';
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  const range = xMax - xMin;
  let interval = 2;
  if (range > 40) interval = 10;
  else if (range > 20) interval = 5;

  const firstTick = Math.ceil(xMin / interval) * interval;
  for (let i = firstTick; i <= xMax; i += interval) {
    const x = xScale(i);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, plotBottom);
    ctx.lineTo(x, plotBottom + 5);
    ctx.stroke();
    ctx.fillText(`${i}`, x, plotBottom + 8);

    ctx.save();
    ctx.strokeStyle = '#d4d4d4';
    ctx.lineWidth = 0.8;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(x, plotTop);
    ctx.lineTo(x, plotBottom);
    ctx.stroke();
    ctx.restore();
  }

  // Larger X-axis title
  ctx.font = 'bold 14.5px Arial, sans-serif';
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(
    isEn ? 'Predicted Adult Height (cm)' : 'Chiều cao dự kiến trưởng thành (cm)',
    marginLeft + plotWidth / 2,
    plotBottom + 26
  );

  // Draw each plot row (MPH on top, then selected methods)
  plotRows.forEach((d, i) => {
    const y = marginTop + (i + 0.5) * rowHeight;
    const xCenter = xScale(d.pah);
    const xLeft = xScale(d.pah - d.error);
    const xRight = xScale(d.pah + d.error);

    if (i > 0) {
      ctx.save();
      ctx.strokeStyle = '#eeeeee';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(12, marginTop + i * rowHeight);
      ctx.lineTo(logicalWidth - 12, marginTop + i * rowHeight);
      ctx.stroke();
      ctx.restore();
    }

    // Method label on left
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(d.method, marginLeft - 14, y);

    // Error bar line
    ctx.save();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    if (d.style && d.style.lineDash) {
      ctx.setLineDash(d.style.lineDash.split(',').map(Number));
    }
    ctx.beginPath();
    ctx.moveTo(xLeft, y);
    ctx.lineTo(xRight, y);
    ctx.stroke();
    ctx.restore();

    // Whiskers
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(xLeft, y - 6);
    ctx.lineTo(xLeft, y + 6);
    ctx.moveTo(xRight, y - 6);
    ctx.lineTo(xRight, y + 6);
    ctx.stroke();

    // Point estimate marker
    ctx.fillStyle = '#000000';
    drawMarker(ctx, d.style?.markerType, xCenter, y, true);

    // Value label on right
    ctx.textAlign = 'left';
    ctx.font = 'bold 12.5px Arial, sans-serif';
    ctx.fillStyle = '#000000';
    ctx.fillText(`${d.pah.toFixed(1)} ± ${d.error.toFixed(1)} cm`, logicalWidth - marginRight + 12, y);
  });

  // Draw Compact Inline Horizontal Legend Box at the bottom of the chart
  const legendTop = plotBottom + axisZoneHeight;
  const legendLeft = 16;
  const legendWidth = logicalWidth - 32;

  ctx.save();
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.strokeRect(legendLeft, legendTop, legendWidth, legendHeight);

  // Center each row of legend items horizontally inside the box
  for (let r = 0; r < totalLegendRows; r++) {
    const rowEntries = positionedLegend.filter((p) => p.rowIdx === r);
    if (rowEntries.length === 0) continue;
    const lastEntry = rowEntries[rowEntries.length - 1];
    const rowContentWidth = lastEntry.x + lastEntry.width;
    const rowStartX = legendLeft + Math.max(10, (legendWidth - rowContentWidth) / 2);
    const itemY = legendTop + legendBoxPaddingY + (r + 0.5) * legendRowHeight;

    rowEntries.forEach((entry) => {
      const sampleXStart = rowStartX + entry.x;
      const sampleXEnd = sampleXStart + sampleGraphicWidth;
      const sampleXCenter = (sampleXStart + sampleXEnd) / 2;

      ctx.save();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.8;
      if (entry.item.lineDash) {
        ctx.setLineDash(entry.item.lineDash.split(',').map(Number));
      }
      ctx.beginPath();
      ctx.moveTo(sampleXStart, itemY);
      ctx.lineTo(sampleXEnd, itemY);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = '#000000';
      drawMarker(ctx, entry.item.markerType, sampleXCenter, itemY, true);

      ctx.font = '11px Arial, sans-serif';
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(entry.item.label, sampleXEnd + 6, itemY);
    });
  }
  ctx.restore();

  const dataUrl = canvas.toDataURL('image/png');
  const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
  const uint8Array = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

  return {
    uint8Array,
    dataUrl,
    width: logicalWidth,
    height: logicalHeight,
  };
}

function formatDateVN(dateStr?: string): string {
  if (!dateStr) return '---';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function getSafeFileName(
  patientName: string | undefined,
  ext: 'docx' | 'pdf',
  lang: 'vi' | 'en' = 'vi'
): string {
  const today = new Date();
  const dateStr = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${today.getFullYear()}`;
  const isEn = lang === 'en';
  const cleanName =
    patientName && patientName.trim() ? patientName.trim() : isEn ? 'Patient' : 'BenhNhi';
  return isEn
    ? `PAH_Report_${cleanName}_${dateStr}_Dr_Do_Tien_Son.${ext}`
    : `Bao_Cao_PAH_${cleanName}_${dateStr}_BS_Do_Tien_Son.${ext}`;
}

/**
 * Xây dựng đoạn text tổng hợp toàn bộ chỉ số & hệ số của tất cả các công thức/mô hình được chọn
 * (Ngăn cách bằng dấu "," và dấu ";", KHÔNG dùng dấu "|", canh lề 2 bên Justified)
 */
function buildAllModelsMetricsParagraphText(payload: ClinicalReportPayload): string | null {
  const { patientData, bpFraction, tw1Coeffs, rwtCoeffs, bxV2Enabled, bxV2Result, lang = 'vi' } = payload;
  if (patientData.hideCoefficients) {
    return null;
  }

  const isEn = lang === 'en';
  const segments: string[] = [];

  if (bpFraction !== null && bpFraction !== undefined) {
    segments.push(
      isEn
        ? `Bayley-Pinneau (1953): mature height fraction = ${bpFraction}`
        : `Bayley-Pinneau (1953): hệ số tỷ lệ trưởng thành fraction = ${bpFraction}`
    );
  }

  if (tw1Coeffs) {
    segments.push(
      isEn
        ? `Tanner-Whitehouse Mark I (1975): α = ${tw1Coeffs.alpha}, β = ${tw1Coeffs.beta}, γ = ${tw1Coeffs.gamma}, constant c = ${tw1Coeffs.c}`
        : `Tanner-Whitehouse Mark I (1975): α = ${tw1Coeffs.alpha}, β = ${tw1Coeffs.beta}, γ = ${tw1Coeffs.gamma}, hằng số c = ${tw1Coeffs.c}`
    );
  }

  if (rwtCoeffs) {
    segments.push(
      `Roche-Wainer-Thissen (1975): βRL = ${rwtCoeffs.betaRL}, βW = ${rwtCoeffs.betaW}, βMPS = ${rwtCoeffs.betaMPS}, βSA = ${rwtCoeffs.betaSA}, β0 = ${rwtCoeffs.beta0}`
    );
  }

  if (bxV2Enabled && bxV2Result) {
    const im = bxV2Result.intermediate_metrics;
    const preds = bxV2Result.predictions;
    const popShortLocalized =
      bxV2Result.inputs.population_mode === 'vietnam'
        ? 'NIN FH VN 2020'
        : bxV2Result.inputs.population_mode === 'caucasian'
        ? isEn
          ? 'Caucasian - Zurich'
          : 'Chuẩn Châu Âu - Zurich'
        : isEn
        ? 'Custom Population'
        : 'Quần thể Tùy chỉnh';

    const tmParts: string[] = [
      `gp = ${im.growth_potential_pct}%`,
      `H_raw = ${im.h_raw_cm} cm`,
      `CA - BA = ${im.ba_delay_years > 0 ? '+' : ''}${im.ba_delay_years} ${isEn ? 'yrs' : 'năm'}`,
      `w_pop = ${im.w_pop}`,
      isEn
        ? `H_pred (population) = ${preds.ahp_using_population_hpred.height_cm} ± ${preds.ahp_using_population_hpred.rmse_cm} cm`
        : `H_pred (nhóm dân cư) = ${preds.ahp_using_population_hpred.height_cm} ± ${preds.ahp_using_population_hpred.rmse_cm} cm`,
    ];
    if (preds.ahp_using_parents_hpredp) {
      tmParts.push(
        `w_P = ${im.w_p_eff}`,
        `H_predP (x+p) = ${preds.ahp_using_parents_hpredp.height_cm} ± ${preds.ahp_using_parents_hpredp.rmse_cm} cm`
      );
    }
    if (preds.ahp_using_menarche_hpredm) {
      tmParts.push(
        isEn
          ? `H_predM (menarche) = ${preds.ahp_using_menarche_hpredm.height_cm} ± ${preds.ahp_using_menarche_hpredm.rmse_cm} cm`
          : `H_predM (kinh nguyệt) = ${preds.ahp_using_menarche_hpredm.height_cm} ± ${preds.ahp_using_menarche_hpredm.rmse_cm} cm`
      );
    }
    segments.push(
      isEn
        ? `Thodberg-Martin (2012) Model (${popShortLocalized}, Hpop = ${bxV2Result.inputs.h_pop} cm): ${tmParts.join(', ')}`
        : `Mô hình Thodberg-Martin (2012) (${popShortLocalized}, Hpop = ${bxV2Result.inputs.h_pop} cm): ${tmParts.join(', ')}`
    );
  }

  if (segments.length === 0) {
    return null;
  }

  return `${segments.join('; ')}.`;
}

/**
 * Lọc bỏ dòng tiêu đề "* KẾT QUẢ DỰ KIẾN CHIỀU CAO KHI TRƯỞNG THÀNH"
 * và dòng "Lưu ý: Kết quả PAH thay đổi theo mỗi lần đánh giá..." khỏi Box Kết luận lâm sàng trong Report
 */
function filterReportConclusionLines(conclusionText: string): string[] {
  return (conclusionText || '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) return false;
      if (line.startsWith('*')) return false;
      if (line.startsWith('Lưu ý:') || line.startsWith('Note:')) return false;
      return true;
    });
}

export async function exportDocx(payload: ClinicalReportPayload) {
  try {
    const { patientData, summaryRows, conclusionText, chartData, lang = 'vi' } = payload;
    const isEn = lang === 'en';
    const numericMph =
      patientData.mph && !isNaN(Number(patientData.mph)) ? Number(patientData.mph) : null;
    const forestPlot =
      chartData && chartData.length > 0 ? generateForestPlotImage(chartData, numericMph, lang) : null;
    const signatureImg =
      patientData.digitalSign && !patientData.isTeleconsultation ? await loadSignatureImage() : null;
    const teleStampImg = patientData.isTeleconsultation ? await loadTeleconsultStampImage() : null;

    const blackBoxBorders = {
      top: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
      left: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    };

    const makeInfoLine = (label: string, value: string) =>
      new Paragraph({
        spacing: { before: 25, after: 25 },
        children: [
          new TextRun({ text: `${label}: `, bold: true, size: 20, color: '000000' }),
          new TextRun({ text: value, size: 20, color: '000000' }),
        ],
      });

    const caMinusBaAndAphvLine =
      !patientData.noBoneAge &&
      patientData.caMinusBa !== null &&
      patientData.caMinusBa !== undefined
        ? isEn
          ? `${patientData.caMinusBa > 0 ? '+' : ''}${patientData.caMinusBa} yrs${
              patientData.estimatedAphv !== null && patientData.estimatedAphv !== undefined
                ? `  ;  Estimated APHV: ~ ${patientData.estimatedAphv} yrs`
                : ''
            }`
          : `${patientData.caMinusBa > 0 ? '+' : ''}${patientData.caMinusBa} năm${
              patientData.estimatedAphv !== null && patientData.estimatedAphv !== undefined
                ? `  ;  APHV dự kiến: ~ ${patientData.estimatedAphv} tuổi`
                : ''
            }`
        : '---';

    const anthropometryDisplay = isEn
      ? `Height ${patientData.currentHeight} cm${
          patientData.weight ? `, Weight ${patientData.weight} kg` : ''
        }`
      : `Trẻ cao ${patientData.currentHeight} cm${
          patientData.weight ? `, nặng ${patientData.weight} kg` : ''
        }`;

    const menarcheDisplay =
      patientData.gender === 'girl'
        ? patientData.menarche === 'post' || patientData.menarche === 'yes'
          ? isEn
            ? `Postmenarcheal${
                patientData.menarcheHeight
                  ? ` (height at first cycle: ${patientData.menarcheHeight} cm)`
                  : ''
              }`
            : `Đã có kinh nguyệt${
                patientData.menarcheHeight
                  ? ` (chiều cao khi có chu kì đầu tiên: ${patientData.menarcheHeight} cm)`
                  : ''
              }`
          : isEn
          ? 'Premenarcheal'
          : 'Chưa có kinh nguyệt'
        : null;

    const allMetricsText = buildAllModelsMetricsParagraphText(payload);

    const footerPrefix = isEn ? 'Note: ' : 'Lưu ý: ';
    const footerBodyText = isEn
      ? `Predicted results depend on skeletal maturity at X-ray assessment, genetic potential, and nutritional-endocrine factors. This report supports periodic growth monitoring and specialist clinical decision-making, not for deterministic forecasting.${
          patientData.isTeleconsultation
            ? ' Results are calculated by Dr. Do Tien Son based on clinical information provided remotely by the attending physician.'
            : ''
        }`
      : `Kết quả dự đoán phụ thuộc vào độ trưởng thành xương tại thời điểm chụp, tiềm năng di truyền và các yếu tố dinh dưỡng - nội tiết. Phiếu kết quả này phục vụ công tác theo dõi tăng trưởng định kỳ và hỗ trợ quyết định lâm sàng của bác sĩ chuyên khoa, không dùng để tiên đoán.${
          patientData.isTeleconsultation
            ? ' Kết quả được BS. Đỗ Tiến Sơn tính dựa trên thông tin được bác sĩ lâm sàng cung cấp từ xa.'
            : ''
        }`;
    const footerFontSize = patientData.isTeleconsultation ? 13 : 14;

    // Build Section II Summary Table Rows
    const summaryTableRows: TableRow[] = [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            shading: { fill: 'FFFFFF' },
            margins: { top: 42, bottom: 42, left: 120, right: 120 },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { before: 0, after: 0, line: 220, lineRule: LineRuleType.EXACT },
                children: [
                  new TextRun({
                    text: isEn ? 'Prediction Method' : 'Phương pháp dự đoán',
                    bold: true,
                    size: 20,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 20, type: WidthType.PERCENTAGE },
            shading: { fill: 'FFFFFF' },
            margins: { top: 42, bottom: 42, left: 100, right: 100 },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 0, line: 220, lineRule: LineRuleType.EXACT },
                children: [new TextRun({ text: 'PAH ± SD (cm)', bold: true, size: 20 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 22, type: WidthType.PERCENTAGE },
            shading: { fill: 'FFFFFF' },
            margins: { top: 42, bottom: 42, left: 100, right: 100 },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 0, line: 220, lineRule: LineRuleType.EXACT },
                children: [
                  new TextRun({
                    text: isEn ? '95% CI' : 'Khoảng tin cậy 95%',
                    bold: true,
                    size: 20,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 18, type: WidthType.PERCENTAGE },
            shading: { fill: 'FFFFFF' },
            margins: { top: 42, bottom: 42, left: 100, right: 100 },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 0, line: 220, lineRule: LineRuleType.EXACT },
                children: [
                  new TextRun({
                    text: isEn ? 'Diff vs. MPH' : 'So với MPH',
                    bold: true,
                    size: 20,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      ...summaryRows.map(
        (row) =>
          new TableRow({
            children: [
              new TableCell({
                shading: { fill: 'FFFFFF' },
                margins: { top: 36, bottom: 36, left: 120, right: 120 },
                verticalAlign: VerticalAlign.CENTER,
                children: [
                  new Paragraph({
                    spacing: { before: 0, after: 0, line: 220, lineRule: LineRuleType.EXACT },
                    children: [
                      new TextRun({ text: row.methodName, bold: true, size: 20 }),
                      ...(row.isPreferred
                        ? [new TextRun({ text: ' *', bold: true, size: 25, color: '000000' })]
                        : []),
                    ],
                  }),
                ],
              }),
              new TableCell({
                shading: { fill: 'FFFFFF' },
                margins: { top: 36, bottom: 36, left: 100, right: 100 },
                verticalAlign: VerticalAlign.CENTER,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 0, after: 0, line: 220, lineRule: LineRuleType.EXACT },
                    children: [
                      new TextRun({
                        text: `${row.pah.toFixed(1)} ± ${row.error.toFixed(1)}`,
                        bold: true,
                        size: 20,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                shading: { fill: 'FFFFFF' },
                margins: { top: 36, bottom: 36, left: 100, right: 100 },
                verticalAlign: VerticalAlign.CENTER,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 0, after: 0, line: 220, lineRule: LineRuleType.EXACT },
                    children: [
                      new TextRun({
                        text: `${row.ci95Low.toFixed(1)} – ${row.ci95High.toFixed(1)} cm`,
                        size: 20,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                shading: { fill: 'FFFFFF' },
                margins: { top: 36, bottom: 36, left: 100, right: 100 },
                verticalAlign: VerticalAlign.CENTER,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 0, after: 0, line: 220, lineRule: LineRuleType.EXACT },
                    children: [
                      new TextRun({
                        text:
                          row.diffMph !== null
                            ? `${row.diffMph > 0 ? '+' : ''}${row.diffMph.toFixed(1)} cm`
                            : '---',
                        bold: true,
                        size: 20,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          })
      ),
    ];

    if (allMetricsText) {
      summaryTableRows.push(
        new TableRow({
          children: [
            new TableCell({
              columnSpan: 4,
              shading: { fill: 'FFFFFF' },
              margins: { top: 34, bottom: 34, left: 120, right: 120 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.JUSTIFIED,
                  spacing: { before: 6, after: 6, line: 205 },
                  children: [
                    new TextRun({
                      text: isEn ? 'Model Metrics & Coefficients: ' : 'Chỉ số & Hệ số mô hình: ',
                      bold: true,
                      size: 15, // 7.5pt
                    }),
                    new TextRun({
                      text: allMetricsText,
                      size: 15, // 7.5pt
                    }),
                  ],
                }),
              ],
            }),
          ],
        })
      );
    }

    const conclusionLines = filterReportConclusionLines(conclusionText);
    const hasPreferredRow = summaryRows.some((r) => r.isPreferred);

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              size: 21, // 10.5pt
              font: 'Times New Roman',
              color: '000000',
            },
            paragraph: {
              spacing: { line: 245, before: 35, after: 35 },
            },
          },
        },
      },
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 660,
                right: 860,
                bottom: 780,
                left: 860,
                footer: 520,
              },
            },
          },
          footers: {
            default: new Footer({
              children: [
                signatureImg && signatureImg.uint8Array.length > 0
                  ? new Table({
                      width: { size: 100, type: WidthType.PERCENTAGE },
                      borders: {
                        top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                        bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                        left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                        right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                        insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                      },
                      rows: [
                        new TableRow({
                          children: [
                            new TableCell({
                              width: { size: 86, type: WidthType.PERCENTAGE },
                              verticalAlign: VerticalAlign.CENTER,
                              margins: { top: 0, bottom: 0, left: 0, right: 20 },
                              children: [
                                new Paragraph({
                                  alignment: AlignmentType.JUSTIFIED,
                                  spacing: { before: 0, after: 0, line: 210 },
                                  children: [
                                    new TextRun({
                                      text: footerPrefix,
                                      bold: true,
                                      italics: true,
                                      size: 14, // 7pt - fits strictly in 2 lines
                                      color: '333333',
                                    }),
                                    new TextRun({
                                      text: footerBodyText,
                                      italics: true,
                                      size: 14, // 7pt - fits strictly in 2 lines
                                      color: '333333',
                                    }),
                                  ],
                                }),
                              ],
                            }),
                            new TableCell({
                              width: { size: 14, type: WidthType.PERCENTAGE },
                              verticalAlign: VerticalAlign.CENTER,
                              margins: { top: 0, bottom: 0, left: 10, right: 0 },
                              children: [
                                new Paragraph({
                                  alignment: AlignmentType.RIGHT,
                                  indent: { right: -160 },
                                  spacing: { before: 0, after: 0 },
                                  children: [
                                    new ImageRun({
                                      data: signatureImg.uint8Array,
                                      transformation: {
                                        width: 68,
                                        height: Math.round((68 / signatureImg.width) * signatureImg.height),
                                      },
                                      type: 'png',
                                    }),
                                  ],
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    })
                  : new Paragraph({
                      alignment: AlignmentType.JUSTIFIED,
                      spacing: { before: 0, after: 0, line: 210 },
                      children: [
                        new TextRun({
                          text: footerPrefix,
                          bold: true,
                          italics: true,
                          size: footerFontSize,
                          color: '333333',
                        }),
                        new TextRun({
                          text: footerBodyText,
                          italics: true,
                          size: footerFontSize,
                          color: '333333',
                        }),
                      ],
                    }),
              ],
            }),
          },
          children: [
            // BRAND HEADER
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                bottom: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
                insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              },
              rows: [
                new TableRow({
                  children: patientData.isTeleconsultation
                    ? [
                        new TableCell({
                          width: { size: 37, type: WidthType.PERCENTAGE },
                          verticalAlign: VerticalAlign.CENTER,
                          margins: { top: 0, bottom: 55, left: 0, right: 40 },
                          children: [
                            new Paragraph({
                              spacing: { before: 0, after: 20 },
                              children: [
                                new TextRun({
                                  text: 'PAH Calc',
                                  bold: true,
                                  size: 32, // 16pt
                                  color: '000000',
                                }),
                                new TextRun({
                                  text: '®',
                                  bold: true,
                                  size: 22,
                                  superScript: true,
                                  color: '000000',
                                }),
                                new TextRun({
                                  text: ' by Dr.Son',
                                  bold: false,
                                  size: 26, // 13pt
                                  color: '333333',
                                }),
                              ],
                            }),
                            new Paragraph({
                              spacing: { before: 0, after: 0 },
                              children: [
                                new TextRun({
                                  text: 'Predict Adult Height Multi-modals',
                                  italics: true,
                                  size: 17, // 8.5pt - balanced width matching PAH Calc® by Dr.Son
                                  color: '333333',
                                }),
                              ],
                            }),
                          ],
                        }),
                        new TableCell({
                          width: { size: 26, type: WidthType.PERCENTAGE },
                          verticalAlign: VerticalAlign.CENTER,
                          margins: { top: 0, bottom: 50, left: 20, right: 20 },
                          children: [
                            new Paragraph({
                              alignment: AlignmentType.CENTER,
                              spacing: { before: 0, after: 0 },
                              children: teleStampImg
                                ? [
                                    new ImageRun({
                                      data: teleStampImg.uint8Array,
                                      transformation: {
                                        width: 102,
                                        height: Math.round((102 / teleStampImg.width) * teleStampImg.height),
                                      },
                                      type: 'png',
                                    }),
                                  ]
                                : [],
                            }),
                          ],
                        }),
                        new TableCell({
                          width: { size: 37, type: WidthType.PERCENTAGE },
                          margins: { top: 0, bottom: 55, left: 40, right: 0 },
                          verticalAlign: VerticalAlign.CENTER,
                          children: [
                            new Paragraph({
                              alignment: AlignmentType.RIGHT,
                              spacing: { before: 0, after: 20 },
                              children: [
                                new TextRun({
                                  text: isEn
                                    ? `Analysis Date: ${formatDateVN(patientData.examDate)}`
                                    : `Phân tích ngày: ${formatDateVN(patientData.examDate)}`,
                                  size: 19,
                                  italics: true,
                                  color: '000000',
                                }),
                              ],
                            }),
                            new Paragraph({
                              alignment: AlignmentType.RIGHT,
                              spacing: { before: 0, after: 0 },
                              children: [
                                new TextRun({
                                  text: isEn
                                    ? 'Dr. Do Tien Son (Consultant)'
                                    : 'BS. Đỗ Tiến Sơn (cố vấn)',
                                  size: 17, // 8.5pt
                                  italics: true,
                                  color: '333333',
                                }),
                              ],
                            }),
                          ],
                        }),
                      ]
                    : [
                        new TableCell({
                          width: { size: 70, type: WidthType.PERCENTAGE },
                          margins: { top: 0, bottom: 60, left: 0, right: 100 },
                          children: [
                            new Paragraph({
                              spacing: { before: 0, after: 10 },
                              children: [
                                new TextRun({
                                  text: 'PAH Calc',
                                  bold: true,
                                  size: 32, // 16pt
                                  color: '000000',
                                }),
                                new TextRun({
                                  text: '®',
                                  bold: true,
                                  size: 22,
                                  superScript: true,
                                  color: '000000',
                                }),
                                new TextRun({
                                  text: ' by Dr.Son',
                                  bold: false,
                                  size: 26, // 13pt
                                  color: '333333',
                                }),
                              ],
                            }),
                          ],
                        }),
                        new TableCell({
                          width: { size: 30, type: WidthType.PERCENTAGE },
                          margins: { top: 0, bottom: 60, left: 100, right: 0 },
                          verticalAlign: VerticalAlign.BOTTOM,
                          children: [
                            new Paragraph({
                              alignment: AlignmentType.RIGHT,
                              spacing: { before: 0, after: 10 },
                              children: [
                                new TextRun({
                                  text: isEn
                                    ? `Analysis Date: ${formatDateVN(patientData.examDate)}`
                                    : `Phân tích ngày: ${formatDateVN(patientData.examDate)}`,
                                  size: 19,
                                  italics: true,
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                }),
              ],
            }),

            // MAIN REPORT TITLE
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 140, after: 120 },
              children: [
                new TextRun({
                  text: isEn
                    ? 'PREDICTED ADULT HEIGHT (PAH) CLINICAL REPORT'
                    : 'PHIẾU KẾT QUẢ DỰ ĐOÁN CHIỀU CAO TRƯỞNG THÀNH (PAH)',
                  bold: true,
                  size: 27, // 13.5pt
                  color: '000000',
                }),
              ],
            }),

            // SECTION I: PATIENT ADMINISTRATIVE & ANTHROPOMETRIC INFO
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
                bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
                left: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
                right: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
                insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      columnSpan: 2,
                      shading: { fill: 'FFFFFF' },
                      margins: { top: 60, bottom: 60, left: 140, right: 140 },
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: isEn
                                ? 'I. ADMINISTRATIVE & ANTHROPOMETRIC INFORMATION'
                                : 'I. THÔNG TIN HÀNH CHÍNH & CHỈ SỐ NHÂN TRẮC',
                              bold: true,
                              size: 21,
                              color: '000000',
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      shading: { fill: 'FFFFFF' },
                      margins: { top: 80, bottom: 80, left: 140, right: 100 },
                      children: [
                        makeInfoLine(
                          isEn ? 'Gender' : 'Giới tính',
                          isEn
                            ? patientData.gender === 'boy'
                              ? 'Male'
                              : 'Female'
                            : patientData.gender === 'boy'
                            ? 'Nam'
                            : 'Nữ'
                        ),
                        makeInfoLine(
                          isEn ? 'Chronological Age (CA)' : 'Tuổi thực (CA)',
                          isEn
                            ? `${patientData.ageYears} yrs ${patientData.ageMonths || 0} mos`
                            : `${patientData.ageYears} tuổi ${patientData.ageMonths || 0} tháng`
                        ),
                        makeInfoLine(
                          isEn ? 'Bone Age (BA-G&P)' : 'Tuổi xương (BA-G&P)',
                          patientData.noBoneAge
                            ? isEn
                              ? 'No X-ray bone age'
                              : 'Chưa chụp X-quang tuổi xương'
                            : isEn
                            ? `${patientData.effectiveBoneAge} yrs`
                            : `${patientData.effectiveBoneAge} tuổi`
                        ),
                        ...(!patientData.noBoneAge
                          ? [
                              makeInfoLine(
                                isEn ? 'CA - BA' : 'Độ lệch CA - BA',
                                caMinusBaAndAphvLine
                              ),
                            ]
                          : []),
                      ],
                    }),
                    new TableCell({
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      shading: { fill: 'FFFFFF' },
                      margins: { top: 80, bottom: 80, left: 100, right: 140 },
                      children: [
                        makeInfoLine(
                          isEn ? 'Current Anthropometrics' : 'Nhân trắc hiện tại',
                          anthropometryDisplay
                        ),
                        makeInfoLine(
                          isEn ? 'Father / Mother Height' : 'Chiều cao Bố / Mẹ',
                          `${patientData.fatherHeight ? `${patientData.fatherHeight} cm` : '---'}  /  ${
                            patientData.motherHeight ? `${patientData.motherHeight} cm` : '---'
                          }`
                        ),
                        makeInfoLine(
                          isEn ? 'Mid-Parental Height (MPH)' : 'Chiều cao di truyền (MPH)',
                          patientData.mph && patientData.mph !== '---'
                            ? `${patientData.mph} cm (± ${patientData.gender === 'boy' ? '10' : '9'} cm)`
                            : '---'
                        ),
                        ...(menarcheDisplay
                          ? [
                              makeInfoLine(
                                isEn ? 'Pubertal Status' : 'Tình trạng dậy thì',
                                menarcheDisplay
                              ),
                            ]
                          : []),
                      ],
                    }),
                  ],
                }),
              ],
            }),

            new Paragraph({ spacing: { before: 60, after: 30 }, text: '' }),

            // SECTION II: SUMMARY TABLE OF PAH RESULTS & INTERMEDIATE METRICS
            ...(summaryRows.length > 0
              ? [
                  new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: blackBoxBorders,
                    rows: [
                      new TableRow({
                        children: [
                          new TableCell({
                            columnSpan: 4,
                            shading: { fill: 'FFFFFF' },
                            margins: { top: 44, bottom: 44, left: 140, right: 140 },
                            children: [
                              new Paragraph({
                                spacing: { before: 0, after: 0, line: 220, lineRule: LineRuleType.EXACT },
                                children: [
                                  new TextRun({
                                    text: isEn
                                      ? 'II. SUMMARY OF PREDICTED ADULT HEIGHT (PAH) RESULTS'
                                      : 'II. BẢNG TỔNG HỢP KẾT QUẢ DỰ ĐOÁN CHIỀU CAO TRƯỞNG THÀNH (PAH)',
                                    bold: true,
                                    size: 21,
                                    color: '000000',
                                  }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                      ...summaryTableRows,
                    ],
                  }),
                  new Paragraph({ spacing: { before: 60, after: 30 }, text: '' }),
                ]
              : []),

            // SECTION III: CLINICAL CONCLUSION BOX
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
                bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
                left: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
                right: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
                insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      shading: { fill: 'FFFFFF' },
                      margins: { top: 60, bottom: 60, left: 140, right: 140 },
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: isEn ? 'III. CLINICAL CONCLUSION' : 'III. KẾT LUẬN LÂM SÀNG',
                              bold: true,
                              size: 21,
                              color: '000000',
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      shading: { fill: 'FFFFFF' },
                      margins: { top: 65, bottom: 65, left: 140, right: 140 },
                      children: [
                        ...conclusionLines.map((line) => {
                          const isBullet = line.startsWith('-');
                          const hasStarSuffix = line.endsWith(' *');
                          const coreLine = hasStarSuffix ? line.slice(0, -2) : line;
                          const colonIdx = isBullet ? coreLine.indexOf(': ') : -1;

                          let runChildren: TextRun[];
                          if (isBullet && colonIdx !== -1) {
                            const prefixPart = coreLine.slice(0, colonIdx + 2);
                            const valuePart = coreLine.slice(colonIdx + 2);
                            runChildren = [
                              new TextRun({
                                text: prefixPart,
                                bold: true,
                                size: 20,
                                color: '000000',
                              }),
                              new TextRun({
                                text: valuePart,
                                bold: true,
                                size: 20,
                                color: '8B0000',
                              }),
                              ...(hasStarSuffix
                                ? [
                                    new TextRun({
                                      text: ' *',
                                      bold: true,
                                      size: 25,
                                      color: '8B0000',
                                    }),
                                  ]
                                : []),
                            ];
                          } else {
                            runChildren = [
                              new TextRun({
                                text: coreLine,
                                bold: isBullet,
                                size: 20,
                                color: '000000',
                              }),
                              ...(hasStarSuffix
                                ? [
                                    new TextRun({
                                      text: ' *',
                                      bold: true,
                                      size: 25,
                                      color: '8B0000',
                                    }),
                                  ]
                                : []),
                            ];
                          }

                          return new Paragraph({
                            spacing: {
                              before: 14,
                              after: 14,
                              line: 272,
                              lineRule: LineRuleType.EXACT,
                            },
                            alignment: isBullet ? AlignmentType.LEFT : AlignmentType.JUSTIFIED,
                            children: runChildren,
                          });
                        }),
                        ...(hasPreferredRow
                          ? [
                              new Paragraph({
                                spacing: {
                                  before: 14,
                                  after: 14,
                                  line: 272,
                                  lineRule: LineRuleType.EXACT,
                                },
                                alignment: AlignmentType.LEFT,
                                children: [
                                  new TextRun({
                                    text: '* ',
                                    bold: true,
                                    size: 24,
                                    color: '000000',
                                  }),
                                  new TextRun({
                                    text: isEn
                                      ? 'Recommended priority method for clinical use'
                                      : 'Phương pháp được khuyến cáo ưu tiên sử dụng',
                                    size: 20,
                                    color: '000000',
                                  }),
                                ],
                              }),
                            ]
                          : []),
                      ],
                    }),
                  ],
                }),
              ],
            }),

            // SECTION IV: FOREST PLOT CHART IN A 100%-WIDTH BOX MATCHING THE CONCLUSION BOX
            ...(forestPlot && forestPlot.uint8Array.length > 0
              ? [
                  new Paragraph({ spacing: { before: 60, after: 30 }, text: '' }),
                  new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
                      bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
                      left: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
                      right: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
                      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                    },
                    rows: [
                      new TableRow({
                        children: [
                          new TableCell({
                            shading: { fill: 'FFFFFF' },
                            margins: { top: 60, bottom: 60, left: 60, right: 60 },
                            children: [
                              new Paragraph({
                                alignment: AlignmentType.CENTER,
                                spacing: { before: 0, after: 0 },
                                children: [
                                  new ImageRun({
                                    data: forestPlot.uint8Array,
                                    transformation: {
                                      width: 635,
                                      height: Math.round((635 / forestPlot.width) * forestPlot.height),
                                    },
                                    type: 'png',
                                  }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ]
              : []),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, getSafeFileName(patientData.name, 'docx', lang));
  } catch (error) {
    console.error('Error exporting DOCX:', error);
  }
}

export async function exportPdf(payload: ClinicalReportPayload) {
  try {
    const { patientData, summaryRows, conclusionText, chartData, lang = 'vi' } = payload;
    const isEn = lang === 'en';
    const numericMph =
      patientData.mph && !isNaN(Number(patientData.mph)) ? Number(patientData.mph) : null;
    const forestPlot =
      chartData && chartData.length > 0 ? generateForestPlotImage(chartData, numericMph, lang) : null;
    const signatureImg =
      patientData.digitalSign && !patientData.isTeleconsultation ? await loadSignatureImage() : null;
    const teleStampImg = patientData.isTeleconsultation ? await loadTeleconsultStampImage() : null;

    const caMinusBaAndAphvLine =
      !patientData.noBoneAge &&
      patientData.caMinusBa !== null &&
      patientData.caMinusBa !== undefined
        ? isEn
          ? `${patientData.caMinusBa > 0 ? '+' : ''}${patientData.caMinusBa} yrs${
              patientData.estimatedAphv !== null && patientData.estimatedAphv !== undefined
                ? `  ;  Estimated APHV: ~ ${patientData.estimatedAphv} yrs`
                : ''
            }`
          : `${patientData.caMinusBa > 0 ? '+' : ''}${patientData.caMinusBa} năm${
              patientData.estimatedAphv !== null && patientData.estimatedAphv !== undefined
                ? `  ;  APHV dự kiến: ~ ${patientData.estimatedAphv} tuổi`
                : ''
            }`
        : '---';

    const anthropometryDisplay = isEn
      ? `Height ${patientData.currentHeight} cm${
          patientData.weight ? `, Weight ${patientData.weight} kg` : ''
        }`
      : `Trẻ cao ${patientData.currentHeight} cm${
          patientData.weight ? `, nặng ${patientData.weight} kg` : ''
        }`;

    const menarcheDisplay =
      patientData.gender === 'girl'
        ? patientData.menarche === 'post' || patientData.menarche === 'yes'
          ? isEn
            ? `Postmenarcheal${
                patientData.menarcheHeight
                  ? ` (height at first cycle: ${patientData.menarcheHeight} cm)`
                  : ''
              }`
            : `Đã có kinh nguyệt${
                patientData.menarcheHeight
                  ? ` (chiều cao khi có chu kì đầu tiên: ${patientData.menarcheHeight} cm)`
                  : ''
              }`
          : isEn
          ? 'Premenarcheal'
          : 'Chưa có kinh nguyệt'
        : null;

    const allMetricsText = buildAllModelsMetricsParagraphText(payload);

    const footerPrefix = isEn ? 'Note: ' : 'Lưu ý: ';
    const footerBodyText = isEn
      ? `Predicted results depend on skeletal maturity at X-ray assessment, genetic potential, and nutritional-endocrine factors. This report supports periodic growth monitoring and specialist clinical decision-making, not for deterministic forecasting.${
          patientData.isTeleconsultation
            ? ' Results are calculated by Dr. Do Tien Son based on clinical information provided remotely by the attending physician.'
            : ''
        }`
      : `Kết quả dự đoán phụ thuộc vào độ trưởng thành xương tại thời điểm chụp, tiềm năng di truyền và các yếu tố dinh dưỡng - nội tiết. Phiếu kết quả này phục vụ công tác theo dõi tăng trưởng định kỳ và hỗ trợ quyết định lâm sàng của bác sĩ chuyên khoa, không dùng để tiên đoán.${
          patientData.isTeleconsultation
            ? ' Kết quả được BS. Đỗ Tiến Sơn tính dựa trên thông tin được bác sĩ lâm sàng cung cấp từ xa.'
            : ''
        }`;
    const pdfFooterFontSize = patientData.isTeleconsultation ? 6.5 : 7.0;

    const blackGridLayout = {
      hLineWidth: () => 0.8,
      vLineWidth: () => 0.8,
      hLineColor: () => '#000000',
      vLineColor: () => '#000000',
      paddingLeft: () => 7,
      paddingRight: () => 7,
      paddingTop: () => 3.0,
      paddingBottom: () => 3.0,
    };

    const outerBoxLayout = {
      hLineWidth: (i: number, node: any) =>
        i === 0 || i === 1 || i === node.table.body.length ? 0.8 : 0,
      vLineWidth: (i: number, node: any) =>
        i === 0 || i === node.table.widths.length ? 0.8 : 0,
      hLineColor: () => '#000000',
      vLineColor: () => '#000000',
      paddingLeft: () => 8,
      paddingRight: () => 8,
      paddingTop: () => 4.5,
      paddingBottom: () => 4.5,
    };

    const singleCellBoxLayout = {
      hLineWidth: (i: number, node: any) => (i === 0 || i === node.table.body.length ? 0.8 : 0),
      vLineWidth: (i: number, node: any) => (i === 0 || i === node.table.widths.length ? 0.8 : 0),
      hLineColor: () => '#000000',
      vLineColor: () => '#000000',
      paddingLeft: () => 4,
      paddingRight: () => 4,
      paddingTop: () => 4,
      paddingBottom: () => 4,
    };

    // Build Section II Summary Table Body for PDF
    const summaryBody: any[][] = [
      [
        {
          text: isEn
            ? 'II. SUMMARY OF PREDICTED ADULT HEIGHT (PAH) RESULTS'
            : 'II. BẢNG TỔNG HỢP KẾT QUẢ DỰ ĐOÁN CHIỀU CAO TRƯỞNG THÀNH (PAH)',
          bold: true,
          fontSize: 10,
          lineHeight: 1.05,
          colSpan: 4,
          alignment: 'left',
        },
        {},
        {},
        {},
      ],
      [
        {
          text: isEn ? 'Prediction Method' : 'Phương pháp dự đoán',
          bold: true,
          fontSize: 9.5,
          lineHeight: 1.05,
          alignment: 'left',
        },
        { text: 'PAH ± SD (cm)', bold: true, fontSize: 9.5, lineHeight: 1.05, alignment: 'center' },
        {
          text: isEn ? '95% CI' : 'Khoảng tin cậy 95%',
          bold: true,
          fontSize: 9.5,
          lineHeight: 1.05,
          alignment: 'center',
        },
        {
          text: isEn ? 'Diff vs. MPH' : 'So với MPH',
          bold: true,
          fontSize: 9.5,
          lineHeight: 1.05,
          alignment: 'center',
        },
      ],
      ...summaryRows.map((row) => [
        {
          text: row.isPreferred
            ? [
                { text: row.methodName, bold: true, fontSize: 9.5 },
                { text: ' *', bold: true, fontSize: 12, lineHeight: 0.9 },
              ]
            : row.methodName,
          bold: true,
          fontSize: 9.5,
          lineHeight: 1.05,
          alignment: 'left',
        },
        {
          text: `${row.pah.toFixed(1)} ± ${row.error.toFixed(1)}`,
          bold: true,
          fontSize: 9.5,
          lineHeight: 1.05,
          alignment: 'center',
        },
        {
          text: `${row.ci95Low.toFixed(1)} – ${row.ci95High.toFixed(1)} cm`,
          fontSize: 9.5,
          lineHeight: 1.05,
          alignment: 'center',
        },
        {
          text:
            row.diffMph !== null
              ? `${row.diffMph > 0 ? '+' : ''}${row.diffMph.toFixed(1)} cm`
              : '---',
          bold: true,
          fontSize: 9.5,
          lineHeight: 1.05,
          alignment: 'center',
        },
      ]),
    ];

    if (allMetricsText) {
      summaryBody.push([
        {
          colSpan: 4,
          fontSize: 7.5,
          alignment: 'justify',
          lineHeight: 1.15,
          text: [
            {
              text: isEn ? 'Model Metrics & Coefficients: ' : 'Chỉ số & Hệ số mô hình: ',
              bold: true,
            },
            {
              text: allMetricsText,
            },
          ],
        },
        {},
        {},
        {},
      ]);
    }

    const conclusionLines = filterReportConclusionLines(conclusionText);
    const hasPreferredRow = summaryRows.some((r) => r.isPreferred);

    const docDefinition: any = {
      pageSize: 'A4',
      pageOrientation: 'portrait',
      pageMargins: [34, 22, 34, 48],
      defaultStyle: {
        font: 'Roboto',
        fontSize: 9.5,
        color: '#000000',
        lineHeight: 1.2,
      },
      footer:
        signatureImg && signatureImg.dataUrl
          ? {
              margin: [34, 0, 14, 12],
              columns: [
                {
                  width: '*',
                  alignment: 'justify',
                  margin: [0, 2, 0, 0],
                  lineHeight: 1.12,
                  text: [
                    {
                      text: footerPrefix,
                      bold: true,
                      italics: true,
                      fontSize: 6.8,
                      color: '#333333',
                    },
                    {
                      text: footerBodyText,
                      italics: true,
                      fontSize: 6.8,
                      color: '#333333',
                    },
                  ],
                },
                {
                  width: 72,
                  image: signatureImg.dataUrl,
                  fit: [68, 25],
                  alignment: 'right',
                  margin: [4, -2, 0, 0],
                },
              ],
            }
          : {
              margin: [34, 2, 34, 12],
              lineHeight: 1.12,
              text: [
                {
                  text: footerPrefix,
                  bold: true,
                  italics: true,
                  fontSize: pdfFooterFontSize,
                  color: '#333333',
                },
                {
                  text: footerBodyText,
                  italics: true,
                  fontSize: pdfFooterFontSize,
                  color: '#333333',
                },
              ],
              alignment: 'justify',
            },
      content: [
        // BRAND HEADER
        {
          columns:
            patientData.isTeleconsultation
              ? [
                  {
                    width: '37%',
                    stack: [
                      {
                        text: [
                          { text: 'PAH Calc', bold: true, fontSize: 15, color: '#000000' },
                          { text: '®', bold: true, fontSize: 10.5, sup: true, color: '#000000' },
                          { text: ' by Dr.Son', bold: false, fontSize: 12.5, color: '#333333' },
                        ],
                        lineHeight: 1.0,
                      },
                      {
                        text: 'Predict Adult Height Multi-modals',
                        italics: true,
                        fontSize: 8.4,
                        color: '#333333',
                        margin: [0, 1.5, 0, 0],
                        lineHeight: 1.0,
                      },
                    ],
                    margin: [0, 0, 0, 2],
                  },
                  {
                    width: '26%',
                    stack:
                      teleStampImg && teleStampImg.dataUrl
                        ? [
                            {
                              image: teleStampImg.dataUrl,
                              fit: [96, 30],
                              alignment: 'center',
                            },
                          ]
                        : [],
                    margin: [0, 0, 0, 2],
                  },
                  {
                    width: '37%',
                    stack: [
                      {
                        text: isEn
                          ? `Analysis Date: ${formatDateVN(patientData.examDate)}`
                          : `Phân tích ngày: ${formatDateVN(patientData.examDate)}`,
                        italics: true,
                        fontSize: 9.5,
                        color: '#000000',
                        alignment: 'right',
                        lineHeight: 1.0,
                      },
                      {
                        text: isEn ? 'Dr. Do Tien Son (Consultant)' : 'BS. Đỗ Tiến Sơn (cố vấn)',
                        italics: true,
                        fontSize: 8.6,
                        color: '#333333',
                        alignment: 'right',
                        margin: [0, 3.8, 0, 0],
                        lineHeight: 1.0,
                      },
                    ],
                    margin: [0, 4.2, 0, 2],
                  },
                ]
              : [
                  {
                    width: '*',
                    text: [
                      { text: 'PAH Calc', bold: true, fontSize: 15, color: '#000000' },
                      { text: '®', bold: true, fontSize: 10.5, sup: true, color: '#000000' },
                      { text: ' by Dr.Son', bold: false, fontSize: 12.5, color: '#333333' },
                    ],
                    lineHeight: 1.05,
                  },
                  {
                    width: 'auto',
                    text: isEn
                      ? `Analysis Date: ${formatDateVN(patientData.examDate)}`
                      : `Phân tích ngày: ${formatDateVN(patientData.examDate)}`,
                    italics: true,
                    fontSize: 9.5,
                    alignment: 'right',
                    margin: [0, 4, 0, 0],
                  },
                ],
        },
        {
          canvas: [
            {
              type: 'line',
              x1: 0,
              y1: 4,
              x2: 527,
              y2: 4,
              lineWidth: 1.2,
              lineColor: '#000000',
            },
          ],
          margin: [0, 0, 0, 8],
        },

        // MAIN REPORT TITLE
        {
          text: isEn
            ? 'PREDICTED ADULT HEIGHT (PAH) CLINICAL REPORT'
            : 'PHIẾU KẾT QUẢ DỰ ĐOÁN CHIỀU CAO TRƯỞNG THÀNH (PAH)',
          bold: true,
          fontSize: 13.5,
          alignment: 'center',
          margin: [0, 2, 0, 8],
        },

        // SECTION I: ADMINISTRATIVE & ANTHROPOMETRIC INFO
        {
          table: {
            widths: ['50%', '50%'],
            body: [
              [
                {
                  text: isEn
                    ? 'I. ADMINISTRATIVE & ANTHROPOMETRIC INFORMATION'
                    : 'I. THÔNG TIN HÀNH CHÍNH & CHỈ SỐ NHÂN TRẮC',
                  bold: true,
                  fontSize: 10,
                  colSpan: 2,
                },
                {},
              ],
              [
                {
                  stack: [
                    {
                      text: [
                        { text: isEn ? 'Gender: ' : 'Giới tính: ', bold: true },
                        {
                          text: isEn
                            ? patientData.gender === 'boy'
                              ? 'Male'
                              : 'Female'
                            : patientData.gender === 'boy'
                            ? 'Nam'
                            : 'Nữ',
                        },
                      ],
                      margin: [0, 1, 0, 2],
                    },
                    {
                      text: [
                        {
                          text: isEn ? 'Chronological Age (CA): ' : 'Tuổi thực (CA): ',
                          bold: true,
                        },
                        {
                          text: isEn
                            ? `${patientData.ageYears} yrs ${patientData.ageMonths || 0} mos`
                            : `${patientData.ageYears} tuổi ${patientData.ageMonths || 0} tháng`,
                        },
                      ],
                      margin: [0, 1, 0, 2],
                    },
                    {
                      text: [
                        { text: isEn ? 'Bone Age (BA-G&P): ' : 'Tuổi xương (BA-G&P): ', bold: true },
                        {
                          text: patientData.noBoneAge
                            ? isEn
                              ? 'No X-ray bone age'
                              : 'Chưa chụp X-quang tuổi xương'
                            : isEn
                            ? `${patientData.effectiveBoneAge} yrs`
                            : `${patientData.effectiveBoneAge} tuổi`,
                        },
                      ],
                      margin: [0, 1, 0, 2],
                    },
                    ...(!patientData.noBoneAge
                      ? [
                          {
                            text: [
                              {
                                text: isEn ? 'CA - BA: ' : 'Độ lệch CA - BA: ',
                                bold: true,
                              },
                              { text: caMinusBaAndAphvLine },
                            ],
                            margin: [0, 1, 0, 1],
                          },
                        ]
                      : []),
                  ],
                },
                {
                  stack: [
                    {
                      text: [
                        {
                          text: isEn ? 'Current Anthropometrics: ' : 'Nhân trắc hiện tại: ',
                          bold: true,
                        },
                        { text: anthropometryDisplay },
                      ],
                      margin: [0, 1, 0, 2],
                    },
                    {
                      text: [
                        {
                          text: isEn ? 'Father / Mother Height: ' : 'Chiều cao Bố / Mẹ: ',
                          bold: true,
                        },
                        {
                          text: `${
                            patientData.fatherHeight ? `${patientData.fatherHeight} cm` : '---'
                          }  /  ${
                            patientData.motherHeight ? `${patientData.motherHeight} cm` : '---'
                          }`,
                        },
                      ],
                      margin: [0, 1, 0, 2],
                    },
                    {
                      text: [
                        {
                          text: isEn
                            ? 'Mid-Parental Height (MPH): '
                            : 'Chiều cao di truyền (MPH): ',
                          bold: true,
                        },
                        {
                          text:
                            patientData.mph && patientData.mph !== '---'
                              ? `${patientData.mph} cm (± ${
                                  patientData.gender === 'boy' ? '10' : '9'
                                } cm)`
                              : '---',
                        },
                      ],
                      margin: [0, 1, 0, 2],
                    },
                    ...(menarcheDisplay
                      ? [
                          {
                            text: [
                              {
                                text: isEn ? 'Pubertal Status: ' : 'Tình trạng dậy thì: ',
                                bold: true,
                              },
                              { text: menarcheDisplay },
                            ],
                            margin: [0, 1, 0, 1],
                          },
                        ]
                      : []),
                  ],
                },
              ],
            ],
          },
          layout: outerBoxLayout,
          margin: [0, 0, 0, 8],
        },

        // SECTION II: SUMMARY TABLE OF PAH RESULTS
        ...(summaryRows.length > 0
          ? [
              {
                table: {
                  headerRows: 2,
                  widths: ['42%', '19%', '22%', '17%'],
                  body: summaryBody,
                },
                layout: blackGridLayout,
                margin: [0, 0, 0, 8],
              },
            ]
          : []),

        // SECTION III: CLINICAL CONCLUSION
        {
          table: {
            widths: ['100%'],
            body: [
              [
                {
                  text: isEn ? 'III. CLINICAL CONCLUSION' : 'III. KẾT LUẬN LÂM SÀNG',
                  bold: true,
                  fontSize: 10,
                },
              ],
              [
                {
                  stack: [
                    ...conclusionLines.map((line) => {
                      const isBullet = line.startsWith('-');
                      const hasStarSuffix = line.endsWith(' *');
                      const coreLine = hasStarSuffix ? line.slice(0, -2) : line;
                      const colonIdx = isBullet ? coreLine.indexOf(': ') : -1;

                      if (isBullet && colonIdx !== -1) {
                        const prefixPart = coreLine.slice(0, colonIdx + 2);
                        const valuePart = coreLine.slice(colonIdx + 2);
                        return {
                          text: [
                            { text: prefixPart, bold: true, fontSize: 9.5, color: '#000000' },
                            { text: valuePart, bold: true, fontSize: 9.5, color: '#8B0000' },
                            ...(hasStarSuffix
                              ? [
                                  {
                                    text: ' *',
                                    bold: true,
                                    fontSize: 11.5,
                                    lineHeight: 0.95,
                                    color: '#8B0000',
                                  },
                                ]
                              : []),
                          ],
                          alignment: 'left',
                          lineHeight: 1.3,
                          margin: [0, 1.2, 0, 1.2],
                        };
                      }

                      return {
                        text: hasStarSuffix
                          ? [
                              { text: coreLine, bold: isBullet, fontSize: 9.5, color: '#000000' },
                              {
                                text: ' *',
                                bold: true,
                                fontSize: 11.5,
                                lineHeight: 0.95,
                                color: '#8B0000',
                              },
                            ]
                          : coreLine,
                        bold: isBullet,
                        fontSize: 9.5,
                        alignment: isBullet ? 'left' : 'justify',
                        lineHeight: 1.3,
                        margin: [0, 1.2, 0, 1.2],
                      };
                    }),
                    ...(hasPreferredRow
                      ? [
                          {
                            text: [
                              {
                                text: '* ',
                                bold: true,
                                fontSize: 11.5,
                                lineHeight: 0.95,
                                color: '#000000',
                              },
                              {
                                text: isEn
                                  ? 'Recommended priority method for clinical use'
                                  : 'Phương pháp được khuyến cáo ưu tiên sử dụng',
                                fontSize: 9.5,
                                color: '#000000',
                              },
                            ],
                            alignment: 'left',
                            lineHeight: 1.3,
                            margin: [0, 1.2, 0, 1.2],
                          },
                        ]
                      : []),
                  ],
                },
              ],
            ],
          },
          layout: outerBoxLayout,
          margin: [0, 0, 0, 8],
        },

        // SECTION IV: FOREST PLOT IMAGE IN A 100%-WIDTH BOX MATCHING CONCLUSION BOX
        ...(forestPlot && forestPlot.dataUrl
          ? [
              {
                table: {
                  widths: ['100%'],
                  body: [
                    [
                      {
                        image: forestPlot.dataUrl,
                        width: 517,
                        alignment: 'center',
                      },
                    ],
                  ],
                },
                layout: singleCellBoxLayout,
                margin: [0, 0, 0, 0],
              },
            ]
          : []),
      ],
    };

    pdfMake.createPdf(docDefinition).download(getSafeFileName(patientData.name, 'pdf', lang));
  } catch (error) {
    console.error('Error exporting PDF:', error);
  }
}

export async function exportBpRwtFlowDocx() {
  try {
    const allBpAges = Array.from(
      new Set(
        [
          ...Object.keys(bpTable.girls.delayed),
          ...Object.keys(bpTable.girls.average),
          ...Object.keys(bpTable.girls.advanced),
          ...Object.keys(bpTable.boys.delayed),
          ...Object.keys(bpTable.boys.average),
          ...Object.keys(bpTable.boys.advanced),
        ].map(Number)
      )
    ).sort((a, b) => a - b);

    const makeHeaderCell = (text: string, widthPct?: number) =>
      new TableCell({
        width: widthPct ? { size: widthPct, type: WidthType.PERCENTAGE } : undefined,
        margins: { top: 80, bottom: 80, left: 100, right: 100 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text, bold: true, size: 20 })],
          }),
        ],
      });

    const makeDataCell = (
      text: string,
      align: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.CENTER
    ) =>
      new TableCell({
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        children: [
          new Paragraph({
            alignment: align,
            children: [new TextRun({ text, size: 20 })],
          }),
        ],
      });

    const tableBorders = {
      top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: '888888' },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: '888888' },
    };

    const bpTableRows = [
      new TableRow({
        tableHeader: true,
        children: [
          makeHeaderCell('Tuổi xương (BA)', 16),
          makeHeaderCell('Nữ - Chậm (Delayed, BA - CA < -1)', 14),
          makeHeaderCell('Nữ - Trung bình (Average, |BA - CA| ≤ 1)', 14),
          makeHeaderCell('Nữ - Sớm (Advanced, BA - CA > 1)', 14),
          makeHeaderCell('Nam - Chậm (Delayed, BA - CA < -1)', 14),
          makeHeaderCell('Nam - Trung bình (Average, |BA - CA| ≤ 1)', 14),
          makeHeaderCell('Nam - Sớm (Advanced, BA - CA > 1)', 14),
        ],
      }),
      ...allBpAges.map((ba) => {
        const gDel = (bpTable.girls.delayed as Record<number, number>)[ba];
        const gAvg = (bpTable.girls.average as Record<number, number>)[ba];
        const gAdv = (bpTable.girls.advanced as Record<number, number>)[ba];
        const bDel = (bpTable.boys.delayed as Record<number, number>)[ba];
        const bAvg = (bpTable.boys.average as Record<number, number>)[ba];
        const bAdv = (bpTable.boys.advanced as Record<number, number>)[ba];
        return new TableRow({
          children: [
            makeDataCell(ba.toFixed(2)),
            makeDataCell(gDel !== undefined ? String(gDel) : '—'),
            makeDataCell(gAvg !== undefined ? String(gAvg) : '—'),
            makeDataCell(gAdv !== undefined ? String(gAdv) : '—'),
            makeDataCell(bDel !== undefined ? String(bDel) : '—'),
            makeDataCell(bAvg !== undefined ? String(bAvg) : '—'),
            makeDataCell(bAdv !== undefined ? String(bAdv) : '—'),
          ],
        });
      }),
    ];

    const makeRwtTable = (rowsData: typeof rwtGirls, genderKey: 'girls' | 'boys') =>
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: tableBorders,
        rows: [
          new TableRow({
            tableHeader: true,
            children: [
              makeHeaderCell('Tuổi (Năm - Tháng)', 16),
              makeHeaderCell('βRL (Chiều dài nằm)', 16),
              makeHeaderCell('βW (Cân nặng)', 16),
              makeHeaderCell('βMPS (MPH)', 16),
              makeHeaderCell('βSA (Tuổi xương)', 16),
              makeHeaderCell('β0 (Hằng số)', 12),
              makeHeaderCell('Sai số (± cm)', 8),
            ],
          }),
          ...rowsData.map((r) => {
            const errObj = rwtErrorMargins[r.ageYears];
            const errVal = errObj ? errObj[genderKey] : null;
            return new TableRow({
              children: [
                makeDataCell(`${r.ageYears} tuổi ${r.ageMonths} tháng`),
                makeDataCell(r.betaRL.toFixed(3)),
                makeDataCell(r.betaW.toFixed(3)),
                makeDataCell(r.betaMPS.toFixed(3)),
                makeDataCell(r.betaSA.toFixed(3)),
                makeDataCell(r.beta0.toFixed(3)),
                makeDataCell(errVal !== null && errVal !== undefined ? `±${errVal}` : '—'),
              ],
            });
          }),
        ],
      });

    const pTitle = (text: string) =>
      new Paragraph({
        spacing: { before: 240, after: 120 },
        children: [new TextRun({ text, bold: true, size: 28, color: '000000' })],
      });

    const pSubTitle = (text: string) =>
      new Paragraph({
        spacing: { before: 180, after: 80 },
        children: [new TextRun({ text, bold: true, size: 24, color: '000000' })],
      });

    const pBullet = (boldPrefix: string, content: string) =>
      new Paragraph({
        bullet: { level: 0 },
        spacing: { before: 40, after: 40 },
        alignment: AlignmentType.JUSTIFIED,
        children: [
          new TextRun({ text: boldPrefix, bold: true, size: 22 }),
          new TextRun({ text: content, size: 22 }),
        ],
      });

    const pText = (content: string, bold = false) =>
      new Paragraph({
        spacing: { before: 60, after: 60 },
        alignment: AlignmentType.JUSTIFIED,
        children: [new TextRun({ text: content, bold, size: 22 })],
      });

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: { size: 22, font: 'Arial' },
            paragraph: { spacing: { line: 260, before: 60, after: 60 } },
          },
        },
      },
      sections: [
        {
          properties: {
            page: {
              margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
            },
          },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 120, after: 120 },
              children: [
                new TextRun({
                  text: 'TÀI LIỆU QUY TRÌNH (FLOW) & HỆ SỐ TÍNH CHIỀU CAO TRƯỞNG THÀNH THEO BAYLEY-PINNEAU (BP) VÀ ROCHE-WAINER-THISSEN (RWT)',
                  bold: true,
                  size: 30,
                }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 200 },
              children: [
                new TextRun({
                  text: 'Hệ thống OmniAPH® 8.2 - ThS.BS. Đỗ Tiến Sơn',
                  italics: true,
                  size: 22,
                }),
              ],
            }),

            // PHẦN I: BAYLEY-PINNEAU
            pTitle('PHẦN I. QUY TRÌNH TÍNH HỆ SỐ & CHIỀU CAO THEO PHƯƠNG PHÁP BAYLEY-PINNEAU (BP)'),
            pSubTitle('1. Điều kiện áp dụng và Biến đầu vào'),
            pBullet(
              'Giới tính (gender): ',
              "Nam ('boy') hoặc Nữ ('girl'). Với trẻ nữ bắt buộc đã chọn tình trạng kinh nguyệt."
            ),
            pBullet(
              'Tuổi thực (chronAge - CA): ',
              'Tính bằng năm thập phân: CA = ageYears + (ageMonths / 12). Phương pháp BP chỉ kích hoạt khi CA ≥ 6.0 tuổi.'
            ),
            pBullet(
              'Tuổi xương (effectiveBoneAge - BA): ',
              "Bắt buộc phải có tuổi xương chụp X-quang (không tích 'Không có tuổi xương')."
            ),
            pBullet(
              'Chiều cao hiện tại (currentHeight - H): ',
              'Hợp lệ trong khoảng 50 – 200 cm (và MPH nếu có phải ≥ 140 cm).'
            ),

            pSubTitle('2. Lưu đồ thuật toán (Step-by-Step Flow)'),
            pBullet(
              'Bước 1 - Làm tròn Tuổi xương (roundedBA): ',
              'Làm tròn tuổi xương đến bội số 0.25 năm gần nhất theo công thức: roundedBA = Math.round(effectiveBoneAge × 4) / 4. (Ví dụ: BA = 10.1 → 10.0; BA = 10.15 → 10.25).'
            ),
            pBullet(
              'Bước 2 - Tính độ lệch giữa Tuổi xương và Tuổi thực (diff): ',
              'diff = effectiveBoneAge - chronAge (tức BA - CA).'
            ),
            pBullet(
              'Bước 3 - Phân nhóm phát triển xương (category): ',
              "Dựa vào giá trị diff:\n  • Nếu diff > 1.0 năm (BA nhanh hơn CA trên 1 năm) → Nhóm Sớm ('advanced').\n  • Nếu diff < -1.0 năm (BA chậm hơn CA trên 1 năm) → Nhóm Chậm ('delayed').\n  • Nếu -1.0 ≤ diff ≤ 1.0 (BA chênh lệch không quá 1 năm so với CA) → Nhóm Trung bình ('average').\n  (Lưu ý đặc biệt: Khi |BA - CA| > 1.5 năm, hệ thống đánh dấu tuổi xương lệch nhiều isBoneAgeDeviated = true, tự động ẩn TW1 và RWT, chỉ giữ lại duy nhất phương pháp BP)."
            ),
            pBullet(
              'Bước 4 - Tra cứu hệ số tỷ lệ chiều cao trưởng thành (fraction): ',
              'Tra trong bảng bpTable[boys | girls][category][roundedBA]. Nếu tuổi xương sau làm tròn nằm ngoài phạm vi bảng của nhóm tương ứng, hệ thống báo không có hệ số BP cho tuổi xương này.'
            ),
            pBullet(
              'Bước 5 - Công thức tính Chiều cao trưởng thành dự đoán (PAH_BP): ',
              'PAH_BP = Math.round((currentHeight / fraction) × 10) / 10 (làm tròn 1 chữ số thập phân). Sai số cố định: ± 5 cm.'
            ),

            pSubTitle('3. Bảng tra hệ số Bayley-Pinneau (Fraction of Mature Height)'),
            pText(
              'Dưới đây là toàn bộ hệ số tỷ lệ (fraction) đang sử dụng trong hệ thống theo Giới tính, Nhóm tuổi xương và Tuổi xương đã làm tròn (0.25 năm):'
            ),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: tableBorders,
              rows: bpTableRows,
            }),

            new Paragraph({ text: '' }),

            // PHẦN II: ROCHE-WAINER-THISSEN
            pTitle(
              'PHẦN II. QUY TRÌNH TÍNH HỆ SỐ & CHIỀU CAO THEO PHƯƠNG PHÁP ROCHE-WAINER-THISSEN (RWT 1975)'
            ),
            pSubTitle('1. Điều kiện áp dụng và Biến đầu vào'),
            pBullet(
              'Độ lệch tuổi xương: ',
              "Chỉ áp dụng khi tuổi xương không lệch quá 1.5 năm so với tuổi thực (|BA - CA| ≤ 1.5) hoặc khi tích chọn 'Không có tuổi xương' (noBoneAge = true)."
            ),
            pBullet(
              'Phạm vi tuổi thực (CA): ',
              'Từ 1 tuổi 0 tháng đến 14 tuổi 0 tháng đối với Nữ; từ 1 tuổi 0 tháng đến 16 tuổi 0 tháng đối với Nam.'
            ),
            pBullet(
              'Cân nặng hiện tại (weight - W): ',
              'Bắt buộc phải nhập cân nặng (W > 0 kg).'
            ),
            pBullet(
              'Chiều cao bố mẹ / Chiều cao di truyền (MPH): ',
              'Bắt buộc phải tính được MPH ≥ 140 cm.'
            ),

            pSubTitle('2. Lưu đồ chuẩn hóa tham số & Tra hệ số (Step-by-Step Flow)'),
            pBullet(
              'Bước 1 - Tính chiều cao di truyền (MPH): ',
              '\n  • Nếu có đủ chiều cao Bố (FH) và Mẹ (MH):\n    - Nam: MPH = (FH + MH + 13) / 2 (cm)\n    - Nữ: MPH = (FH + MH - 13) / 2 (cm)\n  • Nếu chỉ có chiều cao Mẹ (MH) mà không có chiều cao Bố:\n    - Nam: MPH = 99.9 + 0.492 × MH (cm)\n    - Nữ: MPH = 96.3 + 0.436 × MH (cm)\n  (Làm tròn 1 chữ số thập phân).'
            ),
            pBullet(
              'Bước 2 - Xác định Chiều dài nằm (recumbentLength - RL): ',
              "\n  • Nếu bác sĩ nhập trực tiếp ô 'Chiều dài nằm': lấy giá trị đã nhập.\n  • Nếu để trống ô 'Chiều dài nằm': hệ thống tự động cộng thêm 1.25 cm vào chiều cao đứng: RL = currentHeight + 1.25 (cm)."
            ),
            pBullet(
              'Bước 3 - Xác định Tuổi xương hiệu dụng (effectiveBoneAge - SA): ',
              "\n  • Nếu có nhập tuổi xương X-quang: SA = numBoneAge.\n  • Nếu tích chọn 'Không có tuổi xương' (noBoneAge = true): hệ thống gán SA = chronAge (tuổi thực)."
            ),
            pBullet(
              'Bước 4 - Làm tròn Tuổi thực theo mốc 3 tháng (Quý) để tra bảng hệ số: ',
              '\n  • roundedMonths = Math.round(ageMonths / 3) × 3 (quy về 0, 3, 6, 9 hoặc 12 tháng).\n  • roundedYears = ageYears.\n  • Nếu roundedMonths == 12 thì tăng roundedYears thêm 1 (roundedYears += 1) và đặt roundedMonths = 0.\n  (Ví dụ: 10 tuổi 1 tháng → 10 tuổi 0 tháng; 10 tuổi 2 tháng → 10 tuổi 3 tháng; 10 tuổi 11 tháng → 11 tuổi 0 tháng).'
            ),
            pBullet(
              'Bước 5 - Tra cứu bộ 5 hệ số hồi quy RWT và Sai số: ',
              '\n  • Tra trong bảng rwtGirls (nếu là Nữ) hoặc rwtBoys (nếu là Nam) tại đúng cặp (roundedYears, roundedMonths) để lấy 5 hệ số: βRL, βW, βMPS, βSA, β0.\n  • Tra sai số chuẩn (error) trong bảng rwtErrorMargins[ageYears][boys | girls] theo số năm tuổi nguyên (ageYears).'
            ),
            pBullet(
              'Bước 6 - Công thức tính Chiều cao trưởng thành dự đoán (PAH_RWT): ',
              '\n  PAH_RWT = (βRL × RL) + (βW × W) + (βMPS × MPH) + (βSA × SA) + β0\n  Kết quả cuối cùng được làm tròn đến 1 chữ số thập phân: Math.round(PAH_RWT × 10) / 10.'
            ),

            pSubTitle('3. Bảng hệ số hồi quy Roche-Wainer-Thissen cho Trẻ Nữ (rwtGirls: 1 – 14 tuổi)'),
            makeRwtTable(rwtGirls, 'girls'),

            new Paragraph({ text: '' }),

            pSubTitle('4. Bảng hệ số hồi quy Roche-Wainer-Thissen cho Trẻ Nam (rwtBoys: 1 – 16 tuổi)'),
            makeRwtTable(rwtBoys, 'boys'),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Flow_Tinh_He_So_BP_va_RWT_OmniAPH_8.2.docx`);
  } catch (error) {
    console.error('Error exporting BP & RWT Flow DOCX:', error);
  }
}
