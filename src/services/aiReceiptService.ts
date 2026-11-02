import Tesseract from 'tesseract.js';
import { ExpenseCategory, ReceiptLineItem } from '../types/care';
import { AppLanguage } from '../i18n/translations';

export interface ExtractedReceiptResult {
  providerName: string;
  date: string;
  category: ExpenseCategory;
  totalAmount: number;
  isTaxDeductible: boolean;
  aiConfidence: number;
  notes: string;
  lineItems: ReceiptLineItem[];
}

export interface SampleReceiptPreset {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  result: ExtractedReceiptResult;
}

const SAMPLE_PRESETS_ZH_TW: SampleReceiptPreset[] = [
  {
    id: 'sample_hospital',
    title: '台大醫院門診與檢驗收據',
    subtitle: '台大醫院 • $845.00（3 項明細）',
    badge: '醫院門診',
    result: {
      providerName: '台大醫院 — 心臟內科門診與抽血檢查',
      date: new Date().toISOString().split('T')[0],
      category: 'HOSPITAL_CLINIC',
      totalAmount: 845.0,
      isTaxDeductible: true,
      aiConfidence: 99,
      notes: '心臟內科回診、12導程心電圖與血脂血糖抽血檢驗。',
      lineItems: [
        {
          id: 'li_s1',
          description: '心臟內科專科門診診察與部分負擔',
          quantity: 1,
          unitPrice: 340.0,
          total: 340.0,
          isInsuranceEligible: true,
          isTaxDeductible: true,
        },
        {
          id: 'li_s2',
          description: '12導程心電圖檢查 (ECG)',
          quantity: 1,
          unitPrice: 285.0,
          total: 285.0,
          isInsuranceEligible: true,
          isTaxDeductible: true,
        },
        {
          id: 'li_s3',
          description: '血液生化與血脂全套檢驗',
          quantity: 1,
          unitPrice: 220.0,
          total: 220.0,
          isInsuranceEligible: true,
          isTaxDeductible: true,
        },
      ],
    },
  },
  {
    id: 'sample_pharmacy',
    title: '躍獅藥局處方領藥與耗材',
    subtitle: '躍獅藥局 • $182.40（3 項明細）',
    badge: '藥局處方',
    result: {
      providerName: '躍獅連鎖藥局 — 慢性病處方領藥',
      date: new Date().toISOString().split('T')[0],
      category: 'PHARMACY_MEDS',
      totalAmount: 182.4,
      isTaxDeductible: true,
      aiConfidence: 98,
      notes: '慢性病處方藥部分負擔與採血針、酒精棉片。',
      lineItems: [
        {
          id: 'li_p1',
          description: '恩排糖 (Jardiance 10mg) 30天份',
          quantity: 1,
          unitPrice: 125.0,
          total: 125.0,
          isInsuranceEligible: true,
          isTaxDeductible: true,
        },
        {
          id: 'li_p2',
          description: '立普妥 (Atorvastatin 20mg) 降膽固醇藥',
          quantity: 1,
          unitPrice: 18.4,
          total: 18.4,
          isInsuranceEligible: true,
          isTaxDeductible: true,
        },
        {
          id: 'li_p3',
          description: '血糖採血針與無菌酒精棉片組',
          quantity: 2,
          unitPrice: 19.5,
          total: 39.0,
          isInsuranceEligible: true,
          isTaxDeductible: true,
        },
      ],
    },
  },
  {
    id: 'sample_caregiver',
    title: '居家看護單週服務收據',
    subtitle: '安心居家長照 • $420.00（12 小時）',
    badge: '居家看護',
    result: {
      providerName: '安心居家長照機構',
      date: new Date().toISOString().split('T')[0],
      category: 'IN_HOME_CAREGIVER',
      totalAmount: 420.0,
      isTaxDeductible: true,
      aiConfidence: 97,
      notes: '12小時居家照服員：協助沐浴、服藥提醒與復健陪同。',
      lineItems: [
        {
          id: 'li_c1',
          description: '居家照顧服務費 (12小時 @ $35/時)',
          quantity: 12,
          unitPrice: 35.0,
          total: 420.0,
          isInsuranceEligible: false,
          isTaxDeductible: true,
        },
      ],
    },
  },
  {
    id: 'sample_rehab',
    title: '復健物理治療診所收據',
    subtitle: '康健物理治療所 • $260.00（2 項明細）',
    badge: '復健物理治療',
    result: {
      providerName: '康健骨科物理治療診所',
      date: new Date().toISOString().split('T')[0],
      category: 'THERAPY_REHAB',
      totalAmount: 260.0,
      isTaxDeductible: true,
      aiConfidence: 98,
      notes: '髖關節術後步態訓練與平衡復健治療。',
      lineItems: [
        {
          id: 'li_r1',
          description: '一對一術後步態與肌力復健訓練',
          quantity: 2,
          unitPrice: 85.0,
          total: 170.0,
          isInsuranceEligible: true,
          isTaxDeductible: true,
        },
        {
          id: 'li_r2',
          description: '平衡感與關節活動度物理治療',
          quantity: 1,
          unitPrice: 90.0,
          total: 90.0,
          isInsuranceEligible: true,
          isTaxDeductible: true,
        },
      ],
    },
  },
];

const SAMPLE_PRESETS_EN: SampleReceiptPreset[] = [
  {
    id: 'sample_hospital',
    title: 'Hospital Cardiology & Lab Bill',
    subtitle: 'UCSF Medical Center • $845.00 (3 items)',
    badge: 'Hospital',
    result: {
      providerName: 'UCSF Senior Cardiology Clinic',
      date: new Date().toISOString().split('T')[0],
      category: 'HOSPITAL_CLINIC',
      totalAmount: 845.0,
      isTaxDeductible: true,
      aiConfidence: 99,
      notes: 'Cardiology consult, ECG, and blood panel.',
      lineItems: [
        {
          id: 'li_s1',
          description: 'Cardiology Specialist Consultation',
          quantity: 1,
          unitPrice: 340.0,
          total: 340.0,
          isInsuranceEligible: true,
          isTaxDeductible: true,
        },
        {
          id: 'li_s2',
          description: 'Electrocardiogram (ECG) Test',
          quantity: 1,
          unitPrice: 285.0,
          total: 285.0,
          isInsuranceEligible: true,
          isTaxDeductible: true,
        },
        {
          id: 'li_s3',
          description: 'Metabolic & Lipid Blood Panel',
          quantity: 1,
          unitPrice: 220.0,
          total: 220.0,
          isInsuranceEligible: true,
          isTaxDeductible: true,
        },
      ],
    },
  },
  {
    id: 'sample_pharmacy',
    title: 'CVS Pharmacy Rx & Supplies',
    subtitle: 'CVS Pharmacy • $182.40 (3 items)',
    badge: 'Pharmacy',
    result: {
      providerName: 'CVS Pharmacy #2918',
      date: new Date().toISOString().split('T')[0],
      category: 'PHARMACY_MEDS',
      totalAmount: 182.4,
      isTaxDeductible: true,
      aiConfidence: 98,
      notes: 'Prescription meds and glucose lancets.',
      lineItems: [
        {
          id: 'li_p1',
          description: 'Jardiance 10mg Tablets (30-Day)',
          quantity: 1,
          unitPrice: 125.0,
          total: 125.0,
          isInsuranceEligible: true,
          isTaxDeductible: true,
        },
        {
          id: 'li_p2',
          description: 'Atorvastatin 20mg Tablets',
          quantity: 1,
          unitPrice: 18.4,
          total: 18.4,
          isInsuranceEligible: true,
          isTaxDeductible: true,
        },
        {
          id: 'li_p3',
          description: 'Lancets & Alcohol Prep Pads',
          quantity: 2,
          unitPrice: 19.5,
          total: 39.0,
          isInsuranceEligible: true,
          isTaxDeductible: true,
        },
      ],
    },
  },
  {
    id: 'sample_caregiver',
    title: 'In-Home Caregiver Receipt',
    subtitle: 'Visiting Angels • $420.00 (12 hrs)',
    badge: 'Caregiver',
    result: {
      providerName: 'Visiting Angels Home Care',
      date: new Date().toISOString().split('T')[0],
      category: 'IN_HOME_CAREGIVER',
      totalAmount: 420.0,
      isTaxDeductible: true,
      aiConfidence: 97,
      notes: '12 hours personal care assistance.',
      lineItems: [
        {
          id: 'li_c1',
          description: 'Home Caregiver Shift (12 hrs @ $35/hr)',
          quantity: 12,
          unitPrice: 35.0,
          total: 420.0,
          isInsuranceEligible: false,
          isTaxDeductible: true,
        },
      ],
    },
  },
  {
    id: 'sample_rehab',
    title: 'Physical Therapy Session',
    subtitle: 'Golden Gate PT • $260.00 (2 items)',
    badge: 'Rehab',
    result: {
      providerName: 'Golden Gate Physical Therapy',
      date: new Date().toISOString().split('T')[0],
      category: 'THERAPY_REHAB',
      totalAmount: 260.0,
      isTaxDeductible: true,
      aiConfidence: 98,
      notes: 'Post-hip surgery walking & balance therapy.',
      lineItems: [
        {
          id: 'li_r1',
          description: 'Gait & Walking Training (2 sessions)',
          quantity: 2,
          unitPrice: 85.0,
          total: 170.0,
          isInsuranceEligible: true,
          isTaxDeductible: true,
        },
        {
          id: 'li_r2',
          description: 'Balance Re-Education Exercise',
          quantity: 1,
          unitPrice: 90.0,
          total: 90.0,
          isInsuranceEligible: true,
          isTaxDeductible: true,
        },
      ],
    },
  },
];

export const getSampleReceiptPresets = (lang: AppLanguage = 'zh-TW'): SampleReceiptPreset[] => {
  if (lang === 'en') return SAMPLE_PRESETS_EN;
  return SAMPLE_PRESETS_ZH_TW;
};

export const SAMPLE_RECEIPT_PRESETS = SAMPLE_PRESETS_ZH_TW;

export const BUILTIN_GEMINI_API_KEY: string =
  (import.meta as any).env?.VITE_GEMINI_API_KEY?.trim() || '';

/**
 * Compresses and downscales large camera photos to a max dimension of 1400px
 * and converts to JPEG (0.85 quality) via an HTML Canvas element.
 * This reduces 10MB+ camera captures down to ~150-300KB, preventing browser lag and OOM.
 */
export async function compressAndNormalizeImage(
  dataUrl: string,
  maxDim = 1400,
  quality = 0.85
): Promise<string> {
  if (typeof window === 'undefined' || !dataUrl.startsWith('data:image/')) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        let { width, height } = img;
        if (width <= maxDim && height <= maxDim && dataUrl.length < 500 * 1024) {
          resolve(dataUrl);
          return;
        }

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      } catch (e) {
        console.warn('Image canvas compression fallback:', e);
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Runs on-device OCR using Tesseract.js.
 * Defaults to Traditional Chinese + English for medical receipts.
 */
export async function runLocalTesseractOcr(
  imageDataUrl: string,
  lang: AppLanguage = 'zh-TW',
  onProgress?: (progressPercent: number, status: string) => void
): Promise<string> {
  try {
    const tesseractLang = lang === 'en' ? 'eng' : 'chi_tra+eng';
    onProgress?.(15, '載入辨識引擎...');
    const worker = await Tesseract.createWorker(tesseractLang, undefined, {
      logger: (m) => {
        if (m.status === 'recognizing text' && typeof m.progress === 'number') {
          const pct = Math.min(95, Math.round(20 + m.progress * 75));
          onProgress?.(pct, '正在辨識收據文字...');
        }
      },
    });

    onProgress?.(30, '掃描影像細節...');
    const ret = await worker.recognize(imageDataUrl);
    await worker.terminate();
    onProgress?.(100, '完成辨識');
    return ret?.data?.text || '';
  } catch (err) {
    console.warn('Tesseract chi_tra+eng OCR error, trying eng fallback:', err);
    try {
      const worker = await Tesseract.createWorker('eng');
      const ret = await worker.recognize(imageDataUrl);
      await worker.terminate();
      return ret?.data?.text || '';
    } catch (fallbackErr) {
      console.error('Tesseract fallback failed:', fallbackErr);
      return '';
    }
  }
}

/**
 * Parses raw OCR text using medical receipt heuristics:
 * - Provider / Clinic name detection
 * - Date extraction (supporting Western YYYY/MM/DD and Taiwan ROC 113/MM/DD)
 * - Category inference (Hospital, Pharmacy, Rehab, Caregiver, Supplies, Lab)
 * - Total amount detection (合计, 總計, 應付, 實付, Total, etc.)
 * - Line item extraction
 */
export function parseReceiptTextWithHeuristics(
  rawText: string,
  lang: AppLanguage = 'zh-TW'
): ExtractedReceiptResult {
  const isZh = lang !== 'en';
  const cleanText = rawText.trim();

  const lines = cleanText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return {
      providerName: '',
      date: new Date().toISOString().split('T')[0],
      category: 'HOSPITAL_CLINIC',
      totalAmount: 0,
      isTaxDeductible: true,
      aiConfidence: 0,
      notes: isZh
        ? '⚠️ 未能辨識出清晰文字，請手動輸入收據資料或確保照片光線清晰後重試。'
        : '⚠️ No legible text detected. Please enter details manually or re-take photo with better lighting.',
      lineItems: [],
    };
  }

  // 1. Date Extraction
  let extractedDate = new Date().toISOString().split('T')[0];
  // Check for Taiwan ROC date: e.g., 113年10月15日 or 113/10/15 or 113-10-15
  const rocMatch = cleanText.match(/(?:民國\s*)?(1[0-2][0-9])[\s\.\/\-年]+(0?[1-9]|1[0-2])[\s\.\/\-月]+(0?[1-9]|[12][0-9]|3[01])/);
  if (rocMatch) {
    const rocYear = parseInt(rocMatch[1], 10);
    const m = rocMatch[2].padStart(2, '0');
    const d = rocMatch[3].padStart(2, '0');
    extractedDate = `${rocYear + 1911}-${m}-${d}`;
  } else {
    // Check standard YYYY-MM-DD or YYYY/MM/DD
    const isoMatch = cleanText.match(/(202[0-9])[\s\.\/\-年]+(0?[1-9]|1[0-2])[\s\.\/\-月]+(0?[1-9]|[12][0-9]|3[01])/);
    if (isoMatch) {
      const y = isoMatch[1];
      const m = isoMatch[2].padStart(2, '0');
      const d = isoMatch[3].padStart(2, '0');
      extractedDate = `${y}-${m}-${d}`;
    }
  }

  // 2. Provider Name Detection
  let providerName = '';
  const providerKeywords = [
    '三軍總醫院', '榮民總醫院', '長庚紀念醫院', '台灣大學醫學院附設醫院', '台大醫院', '馬偕紀念醫院', '新光醫院', '國泰醫院',
    '醫院', '分院', '總院', '診所', '聯合診所', '中醫診所', '牙醫診所', '耳鼻喉科',
    '眼科', '內科', '骨科', '藥局', '藥房', '衛生所', '長照機構', '護理之家',
    '物理治療', '復健科', '檢驗所', '醫事檢驗',
    'Hospital', 'Clinic', 'Pharmacy', 'Health', 'Medical', 'Center', 'Rehab'
  ];

  for (const line of lines) {
    // Skip invoice numbers, registration numbers, patient info
    if (line.match(/^(?:No\.|NO\.|No\s|編號|病歷|序號|統編|0[0-9]{8,}|11[0-9]{8,})/i)) continue;
    const stripped = line.replace(/^[0-9\W]+/, '').trim();
    if (providerKeywords.some((k) => line.includes(k))) {
      // Clean trailing receipt keywords
      providerName = stripped
        .replace(/(?:住院|門診)?醫療費用收據.*$/, '')
        .replace(/收執聯.*$/, '')
        .replace(/收據.*$/, '')
        .trim();
      if (providerName.length >= 2) break;
    }
  }

  // Fallback provider name: first non-empty header line (if not date or phone or pure numbers)
  if (!providerName) {
    for (const line of lines.slice(0, 4)) {
      const stripped = line.replace(/^[#\*\-=\s]+/, '').trim();
      if (
        stripped.length >= 2 &&
        !stripped.match(/^(?:202|11[0-9]|09[0-9]|\(?0[2-8]\)?|收據|發票|收執聯|統一編號|No\.|NO\.)/i) &&
        !stripped.match(/^[0-9\W]+$/)
      ) {
        providerName = stripped;
        break;
      }
    }
  }

  if (!providerName) {
    providerName = isZh ? '醫療院所/藥局' : 'Medical Provider';
  }

  // 3. Category Inference
  let category: ExpenseCategory = 'HOSPITAL_CLINIC';
  const lowerAll = cleanText.toLowerCase();
  if (
    lowerAll.includes('藥局') ||
    lowerAll.includes('處方') ||
    lowerAll.includes('藥費') ||
    lowerAll.includes('藥品') ||
    lowerAll.includes('pharmacy') ||
    lowerAll.includes('rx') ||
    lowerAll.includes('meds')
  ) {
    category = 'PHARMACY_MEDS';
  } else if (
    lowerAll.includes('看護') ||
    lowerAll.includes('照服') ||
    lowerAll.includes('居服') ||
    lowerAll.includes('居家長照') ||
    lowerAll.includes('caregiver') ||
    lowerAll.includes('home care')
  ) {
    category = 'IN_HOME_CAREGIVER';
  } else if (
    lowerAll.includes('復健') ||
    lowerAll.includes('物理治療') ||
    lowerAll.includes('職能治療') ||
    lowerAll.includes('rehab') ||
    lowerAll.includes('therapy')
  ) {
    category = 'THERAPY_REHAB';
  } else if (
    lowerAll.includes('檢驗') ||
    lowerAll.includes('抽血') ||
    lowerAll.includes('放射') ||
    lowerAll.includes('超音波') ||
    lowerAll.includes('x光') ||
    lowerAll.includes('lab') ||
    lowerAll.includes('diagnostics')
  ) {
    category = 'LAB_DIAGNOSTICS';
  } else if (
    lowerAll.includes('耗材') ||
    lowerAll.includes('輔具') ||
    lowerAll.includes('尿布') ||
    lowerAll.includes('輪椅') ||
    lowerAll.includes('supplies')
  ) {
    category = 'MEDICAL_SUPPLIES';
  }

  // 4. Total Amount Extraction
  let totalAmount = 0;
  const totalKeywords = [
    '實收金額', '應收金額', '實付', '應付', '合計', '總計', '總額', '總金額', '自費金額', '收費金額', '繳費金額',
    '金額', '結帳', '現金', '刷卡',
    'Amount Received', 'Patient\'s payable Amount', 'Total', 'Grand Total', 'Amount Due', 'Amount Paid', 'Net Amount', 'Balance Due'
  ];

  // Pass 1: Look for lines explicitly mentioning total keywords
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (totalKeywords.some((k) => line.includes(k))) {
      // Find amounts in this line or the immediate next line
      const lineCombined = `${line} ${lines[i + 1] || ''}`;
      const amountMatches = lineCombined.match(/(?:NT\$|\$|TWD|￥)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/g);
      if (amountMatches) {
        for (const m of amountMatches) {
          const numStr = m.replace(/[^0-9.]/g, '');
          const val = parseFloat(numStr);
          // Avoid matching year numbers like 2026 or 115 or registration numbers
          if (val > 0 && val !== 2024 && val !== 2025 && val !== 2026 && val !== 113 && val !== 114 && val !== 115 && val < 5000000) {
            if (val > totalAmount) {
              totalAmount = val;
            }
          }
        }
      }
      if (totalAmount > 0) break;
    }
  }

  // Pass 2: Line items extraction
  const lineItems: ReceiptLineItem[] = [];
  const itemLineRegex = /^([^\d$NT]{2,30})[\s:：]+(?:NT\$|\$)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/;

  for (const line of lines) {
    // Avoid header lines, patient info, date rows, or total lines
    if (totalKeywords.some((k) => line.includes(k))) continue;
    if (
      line.includes('日期') ||
      line.includes('號碼') ||
      line.includes('統編') ||
      line.includes('病歷') ||
      line.includes('姓名') ||
      line.includes('起迄') ||
      line.includes('開單') ||
      line.includes('電話') ||
      line.includes('印花') ||
      line.includes('收訖章')
    ) {
      continue;
    }

    const match = line.match(itemLineRegex);
    if (match) {
      const desc = match[1].replace(/[^\w\u4e00-\u9fa5\s()（）]/g, '').trim();
      const amount = parseFloat(match[2].replace(/,/g, ''));
      if (
        desc.length >= 2 &&
        amount > 0 &&
        amount < 1000000 &&
        amount !== 2024 &&
        amount !== 2025 &&
        amount !== 2026 &&
        amount !== 115 &&
        amount !== 113
      ) {
        lineItems.push({
          id: `li_${Date.now()}_${lineItems.length}`,
          description: desc,
          quantity: 1,
          unitPrice: amount,
          total: amount,
          isInsuranceEligible: true,
          isTaxDeductible: true,
        });
      }
    }
  }

  // If no total extracted from keywords, but line items exist, sum them up
  if (totalAmount === 0 && lineItems.length > 0) {
    totalAmount = lineItems.reduce((acc, cur) => acc + cur.total, 0);
  }

  // Pass 3: If still no total, search for the most likely currency amount in all lines
  if (totalAmount === 0) {
    const allNumbers = cleanText.match(/(?:NT\$|\$)\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+)/g);
    if (allNumbers) {
      for (const raw of allNumbers) {
        const num = parseFloat(raw.replace(/[^0-9.]/g, ''));
        if (num > totalAmount && num < 1000000 && num !== 2024 && num !== 2025 && num !== 2026) {
          totalAmount = num;
        }
      }
    }
  }

  // If still no line items, create 1 primary line item if totalAmount > 0
  if (lineItems.length === 0 && totalAmount > 0) {
    lineItems.push({
      id: `li_${Date.now()}_0`,
      description: providerName || (isZh ? '醫療與門診費用' : 'Medical Service Fee'),
      quantity: 1,
      unitPrice: totalAmount,
      total: totalAmount,
      isInsuranceEligible: true,
      isTaxDeductible: true,
    });
  }

  // AI Confidence
  let aiConfidence = 85;
  if (providerName && totalAmount > 0 && extractedDate) {
    aiConfidence = 94;
  } else if (totalAmount > 0) {
    aiConfidence = 80;
  } else {
    aiConfidence = 50;
  }

  const notes = isZh
    ? `辨識完成：${providerName}（${extractedDate}），金額 NT$ ${totalAmount}`
    : `Extracted: ${providerName} (${extractedDate}), Total $${totalAmount}`;

  return {
    providerName,
    date: extractedDate,
    category,
    totalAmount,
    isTaxDeductible: true,
    aiConfidence,
    notes,
    lineItems,
  };
}

export const aiReceiptService = {
  async analyzeReceiptImage(
    imageDataUrl: string,
    fileName: string,
    geminiApiKey?: string,
    lang: AppLanguage = 'zh-TW',
    onProgress?: (pct: number, status: string) => void
  ): Promise<ExtractedReceiptResult> {
    onProgress?.(5, '壓縮與優化影像中...');
    // Step 1: Compress image to avoid browser lag, OOM, and fast upload/OCR
    const compressedDataUrl = await compressAndNormalizeImage(imageDataUrl, 1400, 0.85);

    // Step 2: Check if user has a Gemini API Key (built-in or user configured)
    const rawKey = (geminiApiKey?.trim() || BUILTIN_GEMINI_API_KEY).trim();
    const isGeminiKeyValid = rawKey.length > 15;

    if (isGeminiKeyValid && compressedDataUrl.startsWith('data:image/')) {
      try {
        onProgress?.(25, '正在連線 Gemini AI 深度解析表格與雙語項目...');
        const commaIdx = compressedDataUrl.indexOf(',');
        if (commaIdx !== -1) {
          const header = compressedDataUrl.slice(0, commaIdx);
          const base64Data = compressedDataUrl.slice(commaIdx + 1);
          const mimeType = header.split(';')[0].replace('data:', '') || 'image/jpeg';

          const langInstruction =
            lang === 'zh-TW'
              ? 'Use Traditional Chinese (繁體中文) for providerName, notes, and item descriptions.'
              : lang === 'zh-CN'
              ? 'Use Simplified Chinese (简体中文) for providerName, notes, and item descriptions.'
              : lang === 'ja'
              ? 'Use Japanese (日本語) for providerName, notes, and item descriptions.'
              : lang === 'ko'
              ? 'Use Korean (한국어) for providerName, notes, and item descriptions.'
              : 'Use clear, simple English.';

          const prompt = `You are an expert medical receipt, hospital bill, and clinic invoice reader. ${langInstruction}
Analyze this medical/hospital receipt image very carefully.
Receipts often contain complex tabular charts with columns like:
[項目 Item | 健保金額 Insurance Amount | 自費金額 Self-paid Amount | ...]
and summary boxes like:
[住院部分負擔金額 Copayment, 自費金額 Self-paid, 應收金額 Patient's payable, 實收金額 Amount Received].

Extract the receipt details and return ONLY a valid JSON object matching this exact structure:
{
  "providerName": "Official hospital or clinic name in Traditional Chinese (e.g. 三軍總醫院附設民眾診療服務處)",
  "receiptNumber": "Invoice or Receipt number (e.g. 115102610174)",
  "patientName": "Patient name if shown (e.g. 范光明)",
  "date": "YYYY-MM-DD",
  "category": "HOSPITAL_CLINIC" | "PHARMACY_MEDS" | "IN_HOME_CAREGIVER" | "MEDICAL_SUPPLIES" | "THERAPY_REHAB" | "LAB_DIAGNOSTICS",
  "totalAmount": number,
  "copaymentAmount": number,
  "selfPaidAmount": number,
  "isTaxDeductible": boolean,
  "aiConfidence": number,
  "notes": "Clear summary of inpatient/outpatient services and total payment",
  "lineItems": [
    {
      "id": "li_1",
      "description": "Item description with code and bilingual text if present (e.g. 01. 診察費 (DIAGNOSE FEE))",
      "quantity": number,
      "unitPrice": number,
      "total": number,
      "isInsuranceEligible": boolean,
      "isTaxDeductible": boolean
    }
  ]
}

CRITICAL RULES FOR TABULAR RECEIPTS:
1. Provider Name: Extract the official hospital, clinic, or pharmacy name from the top header or official circular seal/stamp (e.g. 三軍總醫院, 台大醫院, 台北榮總). NEVER use the serial invoice/receipt number (like No.115...) as providerName!
2. Date: Convert Taiwan ROC year (民國紀年) to Gregorian year (西元年). For example:
   - 115/10/26 -> 2026-10-26 (115 + 1911 = 2026)
   - 113/10/26 -> 2024-10-26
   Prefer the bill date (開單日期 / 費用起訖日期).
3. Total Amount:
   - Must be the actual final amount paid or payable by the patient: 實收金額 (Amount Received) or 應收金額 (Patient Payable Amount).
   - In Taiwan hospital receipts with 住院部分負擔 (Copayment) and 自費 (Self-paid), totalAmount is the sum (實收金額, e.g. 4,905). Do NOT confuse totalAmount with copayment alone!
4. Line Items:
   - ONLY include items where the cost is strictly GREATER than 0!
   - EXCLUDE all table rows where both 健保金額 and 自費金額 are 0 (e.g. 手術費 0, 麻醉費 0, 血液費 0 must NOT be in lineItems).
   - For items with non-zero amounts, use the non-zero amount as total (e.g. 01. 診察費 4173, 03. 伙食費 1870, 04. 檢查費 12695, 12. 特殊材料費 100, 13. 藥費 580, 14. 藥事服務費 912).
`;

          const requestBody = JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          });

          const modelsToTry = [
            'gemini-3.8-flash',
            'gemini-flash-latest',
            'gemini-flash-lite-latest',
            'gemini-2.5-flash-lite',
          ];
          for (const modelName of modelsToTry) {
            try {
              const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(rawKey)}`;
              const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: requestBody,
              });

              if (response.ok) {
                const json = await response.json();
                const rawResultText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (rawResultText) {
                  const parsed = JSON.parse(rawResultText);
                  if (parsed && (parsed.providerName || parsed.totalAmount !== undefined)) {
                    onProgress?.(100, 'Gemini AI 辨識完成！');
                    const finalTotal =
                      Number(parsed.totalAmount) ||
                      (Number(parsed.copaymentAmount) || 0) + (Number(parsed.selfPaidAmount) || 0);

                    return {
                      providerName: parsed.providerName || (lang === 'zh-TW' ? '醫療院所' : 'Medical Provider'),
                      date: parsed.date || new Date().toISOString().split('T')[0],
                      category: parsed.category || 'HOSPITAL_CLINIC',
                      totalAmount: finalTotal,
                      isTaxDeductible: Boolean(parsed.isTaxDeductible ?? true),
                      aiConfidence: Number(parsed.aiConfidence) || 98,
                      notes: parsed.notes || '',
                      lineItems: Array.isArray(parsed.lineItems)
                        ? parsed.lineItems
                            .filter((li: any) => (Number(li.total) || Number(li.unitPrice) || 0) > 0)
                            .map((li: any, idx: number) => ({
                              id: `li_${Date.now()}_${idx}`,
                              description: String(li.description || '項目'),
                              quantity: Number(li.quantity) || 1,
                              unitPrice: Number(li.unitPrice) || Number(li.total) || 0,
                              total: Number(li.total) || 0,
                              isInsuranceEligible: Boolean(li.isInsuranceEligible ?? true),
                              isTaxDeductible: Boolean(li.isTaxDeductible ?? true),
                            }))
                        : [],
                    };
                  }
                }
              }
            } catch (modelErr) {
              console.warn(`Gemini model ${modelName} call failed, trying next:`, modelErr);
            }
          }
        }
      } catch (err) {
        console.warn('Gemini cloud API failed, falling back to on-device OCR:', err);
      }
    }

    // Step 3: Local on-device OCR using Tesseract.js (Offline / Zero-API-Key fallback)
    onProgress?.(30, '啟動本地文字辨識引擎 (Tesseract OCR)...');
    const rawOcrText = await runLocalTesseractOcr(compressedDataUrl, lang, onProgress);

    // Step 4: Parse OCR text with heuristics
    onProgress?.(95, '分析醫療單據項目與金額...');
    const result = parseReceiptTextWithHeuristics(rawOcrText, lang);
    onProgress?.(100, '辨識完成！');
    return result;
  },
};
