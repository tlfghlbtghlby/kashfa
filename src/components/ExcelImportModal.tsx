import React, { useState, useRef } from 'react';
import {
  X,
  FileSpreadsheet,
  Upload,
  Check,
  AlertCircle,
  Download,
  Users,
  CheckCircle2,
  HelpCircle,
  FileText,
  RotateCcw,
  Sparkles,
  Calendar,
  Cake
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ScoutMember, ScoutCategory } from '../types/scout';
import { getCategoryFromAge, getCategoryColor, calculateAgeFromBirthDate, normalizePhoneNumber } from '../utils/scoutHelper';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (importedMembers: ScoutMember[], mode: 'merge' | 'replace') => void;
  currentMembersCount: number;
}

interface ParsedScoutRow {
  originalIndex: number;
  name: string;
  age: number;
  category: ScoutCategory;
  birthDate?: string;
  phone?: string;
  notes?: string;
  isValid: boolean;
  warning?: string;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  currentMembersCount,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [rawWorkbook, setRawWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [headerRowIndex, setHeaderRowIndex] = useState<number>(0);
  
  // Column Mappings
  const [nameCol, setNameCol] = useState<string>('');
  const [birthDateCol, setBirthDateCol] = useState<string>('');
  const [ageCol, setAgeCol] = useState<string>('');
  const [categoryCol, setCategoryCol] = useState<string>('');
  const [phoneCol, setPhoneCol] = useState<string>('');
  const [notesCol, setNotesCol] = useState<string>('');

  const [parsedRows, setParsedRows] = useState<ParsedScoutRow[]>([]);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Reset modal state
  const handleReset = () => {
    setFile(null);
    setFileName('');
    setSheetNames([]);
    setSelectedSheet('');
    setRawWorkbook(null);
    setHeaders([]);
    setHeaderRowIndex(0);
    setNameCol('');
    setBirthDateCol('');
    setAgeCol('');
    setCategoryCol('');
    setPhoneCol('');
    setNotesCol('');
    setParsedRows([]);
    setErrorMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Download official sample Excel template
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'اسم الكشاف بالكامل': 'علي حسن الساعدي',
        'مواليد / تاريخ الميلاد (اختياري)': '2019-03-15',
        'العمر': 7,
        'الفئة (اختياري)': 'براعم',
        'رقم هاتف ولي الأمر': '07701234561',
        'ملاحظات': 'ملتزم في سداسي النجوم',
      },
      {
        'اسم الكشاف بالكامل': 'حسين جواد الكاظمي',
        'مواليد / تاريخ الميلاد (اختياري)': '2020-05-20',
        'العمر': 6,
        'الفئة (اختياري)': 'براعم',
        'رقم هاتف ولي الأمر': '07701234562',
        'ملاحظات': '',
      },
      {
        'اسم الكشاف بالكامل': 'عباس فاضل التميمي',
        'مواليد / تاريخ الميلاد (اختياري)': '2016-04-18',
        'العمر': 10,
        'الفئة (اختياري)': 'أشبال',
        'رقم هاتف ولي الأمر': '07702345671',
        'ملاحظات': 'مرشح لقائد طليعة الصقور',
      },
      {
        'اسم الكشاف بالكامل': 'مهدي باقر الحلي',
        'مواليد / تاريخ الميلاد (اختياري)': '2017-09-12',
        'العمر': 9,
        'الفئة (اختياري)': 'أشبال',
        'رقم هاتف ولي الأمر': '07702345672',
        'ملاحظات': '',
      },
      {
        'اسم الكشاف بالكامل': 'مرتضى هادي الشمري',
        'مواليد / تاريخ الميلاد (اختياري)': '2013-05-30',
        'العمر': 13,
        'الفئة (اختياري)': 'كشافة',
        'رقم هاتف ولي الأمر': '07703456781',
        'ملاحظات': 'طليعة الفرسان الكشفية',
      },
      {
        'اسم الكشاف بالكامل': 'زيد حيدر العامري',
        'مواليد / تاريخ الميلاد (اختياري)': '2012-03-10',
        'العمر': 14,
        'الفئة (اختياري)': 'كشافة',
        'رقم هاتف ولي الأمر': '07703456783',
        'ملاحظات': '',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    
    // Set RTL and column widths
    worksheet['!cols'] = [
      { wch: 25 }, // Name
      { wch: 20 }, // Birth date
      { wch: 10 }, // Age
      { wch: 16 }, // Category
      { wch: 20 }, // Phone
      { wch: 30 }, // Notes
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'كشافة العباس');
    
    // Write and download
    XLSX.writeFile(workbook, 'نموذج_اسماء_كشافة_العباس.xlsx');
  };

  // Process File Buffer
  const processFile = async (uploadedFile: File) => {
    try {
      setErrorMessage('');
      setFile(uploadedFile);
      setFileName(uploadedFile.name);

      const buffer = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        setErrorMessage('الملف فارغ أو لا يحتوي على أوراق عمل.');
        return;
      }

      setRawWorkbook(workbook);
      setSheetNames(workbook.SheetNames);
      const initialSheet = workbook.SheetNames[0];
      setSelectedSheet(initialSheet);

      analyzeSheet(workbook, initialSheet);
    } catch (err) {
      console.error(err);
      setErrorMessage('حدث خطأ أثناء قراءة ملف الإكسل. يرجى التأكد من أن الملف بصيغة .xlsx أو .xls أو .csv صحيحة.');
    }
  };

  // Helper to normalize Eastern Arabic and Persian numerals to Western digits
  const normalizeDigits = (str: string): string => {
    return str
      .replace(/[٠۰]/g, '0')
      .replace(/[١۱]/g, '1')
      .replace(/[٢۲]/g, '2')
      .replace(/[٣۳]/g, '3')
      .replace(/[٤۴]/g, '4')
      .replace(/[٥۵]/g, '5')
      .replace(/[٦۶]/g, '6')
      .replace(/[٧۷]/g, '7')
      .replace(/[٨۸]/g, '8')
      .replace(/[٩۹]/g, '9');
  };

  // Analyze sheet structure, find header row, and intelligently map columns
  const analyzeSheet = (wb: XLSX.WorkBook, sheetName: string) => {
    const sheet = wb.Sheets[sheetName];
    if (!sheet) return;

    // Convert sheet to array of rows (2D array)
    const rawRows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    if (!rawRows || rawRows.length === 0) {
      setErrorMessage('الورقة المحددة فارغة.');
      return;
    }

    // Smart Header Row Detection:
    // Evaluate first 15 rows to find the true header row (bypassing title banners)
    let bestHeaderRowIdx = 0;
    let maxHeaderScore = -1;

    const maxCheckRows = Math.min(15, rawRows.length);
    for (let rIdx = 0; rIdx < maxCheckRows; rIdx++) {
      const row = (rawRows[rIdx] || []) as unknown[];
      const nonEmptyCells = row.map((c) => String(c || '').trim()).filter(Boolean);
      if (nonEmptyCells.length === 0) continue;

      let score = 0;
      nonEmptyCells.forEach((cellText) => {
        const lower = cellText.toLowerCase();
        // Name
        if (lower.includes('اسم') || lower.includes('name') || lower.includes('كشاف') || lower.includes('فتى') || lower.includes('طالب')) score += 12;
        // Age
        if (lower.includes('عمر') || lower.includes('اعمار') || lower.includes('أعمار') || lower.includes('سنوات') || lower.includes('سنة') || lower.includes('سنه') || /(^|\s|_)(السن|سن)(\s|_|$)/.test(lower) || lower.includes('age') || lower.includes('years')) score += 12;
        // Birth date
        if (lower.includes('مواليد') || lower.includes('ميلاد') || lower.includes('تولد') || lower.includes('ولادة') || lower.includes('dob') || lower.includes('birth')) score += 12;
        // Phone
        if (lower.includes('هاتف') || lower.includes('موبايل') || lower.includes('موبيل') || lower.includes('جوال') || lower.includes('phone') || lower.includes('mobile') || lower.includes('تلفون') || lower.includes('تليفون') || lower.includes('اتصال') || lower.includes('ولي الامر') || lower.includes('ولي الأمر') || lower.includes('واتساب') || lower.includes('whatsapp') || lower.includes('tel')) score += 12;
        if (lower.includes('رقم') && !lower.includes('تسلسل') && !lower.includes('هوية') && !lower.includes('قيد')) score += 6;
        // Category / Stage / Notes
        if (lower.includes('فئة') || lower.includes('فئه') || lower.includes('مرحلة') || lower.includes('category')) score += 6;
        if (lower.includes('ملاحظ') || lower.includes('طليعة') || lower.includes('سداسي') || lower.includes('note')) score += 4;
        // Short text bonus
        if (cellText.length < 35 && isNaN(Number(cellText))) score += 1;
      });

      // Bonus for multiple columns
      if (nonEmptyCells.length >= 2) score += 2;
      if (nonEmptyCells.length >= 3) score += 3;

      if (score > maxHeaderScore) {
        maxHeaderScore = score;
        bestHeaderRowIdx = rIdx;
      }
    }

    // Fallback if no keywords matched
    if (maxHeaderScore <= 1) {
      for (let rIdx = 0; rIdx < maxCheckRows; rIdx++) {
        const row = (rawRows[rIdx] || []) as unknown[];
        const nonEmpty = row.map((c) => String(c || '').trim()).filter(Boolean);
        if (nonEmpty.length >= 2) {
          bestHeaderRowIdx = rIdx;
          break;
        }
      }
    }

    setHeaderRowIndex(bestHeaderRowIdx);

    const headerRow = (rawRows[bestHeaderRowIdx] || []) as unknown[];
    // Normalize headers: strip extra spaces, provide fallback for empty headers
    const headerValues: string[] = [];
    let numCols = headerRow.length;
    for (let i = bestHeaderRowIdx + 1; i < Math.min(rawRows.length, bestHeaderRowIdx + 6); i++) {
      if ((rawRows[i] as unknown[]).length > numCols) {
        numCols = (rawRows[i] as unknown[]).length;
      }
    }

    for (let c = 0; c < numCols; c++) {
      const val = headerRow[c] !== undefined && headerRow[c] !== null ? String(headerRow[c]).trim() : '';
      headerValues.push(val || `عمود ${c + 1}`);
    }

    setHeaders(headerValues);

    // 1. Keyword-based matching
    let detectedName = '';
    let detectedBirthDate = '';
    let detectedAge = '';
    let detectedCategory = '';
    let detectedPhone = '';
    let detectedNotes = '';

    headerValues.forEach((h) => {
      const lower = h.toLowerCase();
      // Name
      if (!detectedName && (lower.includes('اسم') || lower.includes('name') || lower.includes('الفتى') || lower.includes('الكشاف') || lower.includes('الطالب'))) {
        detectedName = h;
      }
      // Birth date (detected first to avoid collision with age)
      else if (!detectedBirthDate && (lower.includes('مواليد') || lower.includes('ميلاد') || lower.includes('ولادة') || lower.includes('تولد') || lower.includes('birth') || lower.includes('dob'))) {
        detectedBirthDate = h;
      }
      // Age
      else if (!detectedAge && (lower.includes('عمر') || lower.includes('اعمار') || lower.includes('أعمار') || lower.includes('سنوات') || lower.includes('سنة') || lower.includes('سنه') || /(^|\s|_)(السن|سن)(\s|_|$)/.test(lower) || lower.includes('age') || lower.includes('years'))) {
        detectedAge = h;
      }
      // Phone
      else if (!detectedPhone && (lower.includes('هاتف') || lower.includes('موبايل') || lower.includes('موبيل') || lower.includes('جوال') || lower.includes('phone') || lower.includes('mobile') || lower.includes('تلفون') || lower.includes('تليفون') || lower.includes('اتصال') || lower.includes('ولي الامر') || lower.includes('ولي الأمر') || lower.includes('الوالد') || lower.includes('الاب') || lower.includes('الأب') || lower.includes('واتساب') || lower.includes('whatsapp') || (lower.includes('رقم') && !lower.includes('تسلسل') && !lower.includes('هوية') && !lower.includes('قيد')))) {
        detectedPhone = h;
      }
      // Category
      else if (!detectedCategory && (lower.includes('فئة') || lower.includes('فئه') || lower.includes('مرحلة') || lower.includes('category'))) {
        detectedCategory = h;
      }
      // Notes
      else if (!detectedNotes && (lower.includes('ملاحظ') || lower.includes('note') || lower.includes('طليعة') || lower.includes('سداسي'))) {
        detectedNotes = h;
      }
    });

    // 2. Smart Sample Inspection (Inspect first 6 data rows to detect column data types if headers didn't match)
    const sampleRows = rawRows.slice(bestHeaderRowIdx + 1, bestHeaderRowIdx + 7);
    if (sampleRows.length > 0) {
      headerValues.forEach((colName, cIdx) => {
        let phoneMatchCount = 0;
        let ageMatchCount = 0;
        let birthMatchCount = 0;
        let nameMatchCount = 0;

        sampleRows.forEach((r) => {
          const cell = (r as unknown[])[cIdx];
          if (cell === undefined || cell === null || cell === '') return;

          // Check if looks like phone
          const normP = normalizePhoneNumber(cell);
          if (normP && normP.length >= 10) {
            phoneMatchCount++;
          }

          // Check if looks like age (4 to 22)
          let cellAge = NaN;
          if (typeof cell === 'number') {
            cellAge = Math.round(cell);
          } else {
            const clean = normalizeDigits(String(cell).trim());
            const m = clean.match(/\b\d+(\.\d+)?\b/);
            if (m) cellAge = Math.round(parseFloat(m[0]));
          }
          if (!isNaN(cellAge) && cellAge >= 4 && cellAge <= 22) {
            ageMatchCount++;
          }

          // Check if looks like birth date or year
          if (typeof cell === 'number' && ((cell >= 1995 && cell <= 2025) || (cell > 25000 && cell < 55000))) {
            birthMatchCount++;
          } else if (typeof cell === 'string') {
            const s = normalizeDigits(cell);
            if (/\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(s) || /\d{1,2}[-/.]\d{1,2}[-/.]\d{4}/.test(s) || /^(199\d|200\d|201\d|202\d)$/.test(s.trim())) {
              birthMatchCount++;
            }
          }

          // Check if looks like Arabic Name
          if (typeof cell === 'string') {
            const words = cell.trim().split(/\s+/);
            if (words.length >= 2 && !/[\d]/.test(cell)) {
              nameMatchCount++;
            }
          }
        });

        const threshold = Math.max(1, Math.floor(sampleRows.length * 0.4));
        if (!detectedPhone && phoneMatchCount >= threshold && colName !== detectedName && colName !== detectedAge) {
          detectedPhone = colName;
        }
        if (!detectedBirthDate && birthMatchCount >= threshold && colName !== detectedName && colName !== detectedPhone) {
          detectedBirthDate = colName;
        }
        if (!detectedAge && ageMatchCount >= threshold && colName !== detectedName && colName !== detectedPhone && colName !== detectedBirthDate) {
          detectedAge = colName;
        }
        if (!detectedName && nameMatchCount >= threshold && colName !== detectedPhone && colName !== detectedAge) {
          detectedName = colName;
        }
      });
    }

    // 3. Fallbacks
    if (!detectedName && headerValues.length > 0) detectedName = headerValues[0];
    if (!detectedAge && !detectedBirthDate && headerValues.length > 1) {
      const candidate = headerValues.find((h) => h !== detectedName && h !== detectedPhone);
      if (candidate) detectedAge = candidate;
    }

    setNameCol(detectedName);
    setBirthDateCol(detectedBirthDate);
    setAgeCol(detectedAge);
    setCategoryCol(detectedCategory);
    setPhoneCol(detectedPhone);
    setNotesCol(detectedNotes);

    // Parse records using current mappings and header row index
    parseWithMappings(
      wb,
      sheetName,
      bestHeaderRowIdx,
      headerValues,
      detectedName,
      detectedBirthDate,
      detectedAge,
      detectedCategory,
      detectedPhone,
      detectedNotes
    );
  };

  // Parse records based on mappings
  const parseWithMappings = (
    wb: XLSX.WorkBook,
    sheetName: string,
    hRowIdx: number,
    colHeaders: string[],
    nameKey: string,
    birthDateKey: string,
    ageKey: string,
    catKey: string,
    phoneKey: string,
    notesKey: string
  ) => {
    const sheet = wb.Sheets[sheetName];
    if (!sheet) return;

    // Convert sheet to 2D array of rows
    const rawRows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    const parsed: ParsedScoutRow[] = [];

    // Find column indexes in the detected header row
    const nameIdx = colHeaders.indexOf(nameKey);
    const birthIdx = birthDateKey ? colHeaders.indexOf(birthDateKey) : -1;
    const ageIdx = ageKey ? colHeaders.indexOf(ageKey) : -1;
    const catIdx = catKey ? colHeaders.indexOf(catKey) : -1;
    const phoneIdx = phoneKey ? colHeaders.indexOf(phoneKey) : -1;
    const notesIdx = notesKey ? colHeaders.indexOf(notesKey) : -1;

    for (let rIdx = hRowIdx + 1; rIdx < rawRows.length; rIdx++) {
      const row = (rawRows[rIdx] || []) as unknown[];
      const rawName = nameIdx !== -1 && row[nameIdx] !== undefined ? String(row[nameIdx]).trim() : '';
      if (!rawName) continue; // Skip empty rows

      // 1. Birth Date parsing
      let parsedBirthDate: string | undefined = undefined;
      const rawBirth = birthIdx !== -1 ? row[birthIdx] : undefined;

      if (rawBirth !== undefined && rawBirth !== null && rawBirth !== '') {
        if (typeof rawBirth === 'number') {
          if (rawBirth > 20000 && rawBirth < 60000) {
            // Excel serial date to YYYY-MM-DD
            const dateObj = new Date((rawBirth - (25567 + 2)) * 86400 * 1000);
            if (!isNaN(dateObj.getTime())) {
              const y = dateObj.getFullYear();
              const m = String(dateObj.getMonth() + 1).padStart(2, '0');
              const d = String(dateObj.getDate()).padStart(2, '0');
              parsedBirthDate = `${y}-${m}-${d}`;
            }
          } else if (rawBirth >= 1990 && rawBirth <= 2030) {
            parsedBirthDate = `${rawBirth}-06-15`;
          }
        } else {
          const str = normalizeDigits(String(rawBirth).trim());
          const dateMatch = str.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
          const dmyMatch = str.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
          if (dateMatch) {
            const y = dateMatch[1];
            const m = dateMatch[2].padStart(2, '0');
            const d = dateMatch[3].padStart(2, '0');
            parsedBirthDate = `${y}-${m}-${d}`;
          } else if (dmyMatch) {
            const d = dmyMatch[1].padStart(2, '0');
            const m = dmyMatch[2].padStart(2, '0');
            const y = dmyMatch[3];
            parsedBirthDate = `${y}-${m}-${d}`;
          } else {
            const singleYear = parseInt(str.replace(/[^\d]/g, ''), 10);
            if (!isNaN(singleYear) && singleYear >= 1990 && singleYear <= 2030) {
              parsedBirthDate = `${singleYear}-06-15`;
            }
          }
        }
      }

      // 2. Age parsing
      let parsedAge = 8;
      let hasExplicitAge = false;
      let warning: string | undefined = undefined;

      const rawAge = ageIdx !== -1 ? row[ageIdx] : undefined;
      if (rawAge !== undefined && rawAge !== null && rawAge !== '') {
        let ageNum = NaN;
        if (typeof rawAge === 'number') {
          ageNum = Math.round(rawAge);
        } else {
          const cleanStr = normalizeDigits(String(rawAge).trim());
          // Match first integer or float (handles "10 سنوات", "10.0", "10", "١٠")
          const match = cleanStr.match(/\b\d+(\.\d+)?\b/) || cleanStr.match(/\d+/);
          if (match) {
            ageNum = Math.round(parseFloat(match[0]));
          }
        }

        if (!isNaN(ageNum) && ageNum >= 4 && ageNum <= 25) {
          parsedAge = ageNum;
          hasExplicitAge = true;
        } else if (!isNaN(ageNum)) {
          warning = `العمر المستخرج (${ageNum}) خارج النطاق الكشفي المعتاد`;
        }
      }

      // Harmonize Birth Date and Age
      if (parsedBirthDate && !hasExplicitAge) {
        parsedAge = calculateAgeFromBirthDate(parsedBirthDate);
      } else if (!parsedBirthDate && hasExplicitAge) {
        // Approximate birth date from age so automatic yearly aging works
        const approxYear = new Date().getFullYear() - parsedAge;
        parsedBirthDate = `${approxYear}-07-01`;
      } else if (!parsedBirthDate && !hasExplicitAge) {
        warning = 'لم يتم تحديد العمر أو المواليد، تم الاعتماد الافتراضي 8 سنوات (براعم)';
      }

      // 3. Category derivation or matching
      let category: ScoutCategory = getCategoryFromAge(parsedAge);
      const rawCat = catIdx !== -1 && row[catIdx] ? String(row[catIdx]).trim() : '';
      if (rawCat) {
        if (rawCat.includes('برعم') || rawCat.includes('براعم')) {
          category = 'براعم';
        } else if (rawCat.includes('شبل') || rawCat.includes('أشبال') || rawCat.includes('اشبال')) {
          category = 'أشبال';
        } else if (rawCat.includes('كشاف')) {
          category = 'كشافة';
        }
      }

      // 4. Phone parsing with robust normalization
      const rawPhone = phoneIdx !== -1 ? row[phoneIdx] : undefined;
      const parsedPhone = normalizePhoneNumber(rawPhone);

      // 5. Notes
      const rawNotes = notesIdx !== -1 && row[notesIdx] ? String(row[notesIdx]).trim() : undefined;

      parsed.push({
        originalIndex: rIdx - hRowIdx,
        name: rawName,
        age: parsedAge,
        category,
        birthDate: parsedBirthDate,
        phone: parsedPhone,
        notes: rawNotes,
        isValid: true,
        warning,
      });
    }

    setParsedRows(parsed);
  };

  const handleSheetChange = (newSheet: string) => {
    setSelectedSheet(newSheet);
    if (rawWorkbook) {
      analyzeSheet(rawWorkbook, newSheet);
    }
  };

  const handleRemap = (
    newNameCol: string,
    newBirthDateCol: string,
    newAgeCol: string,
    newCatCol: string,
    newPhoneCol: string,
    newNotesCol: string
  ) => {
    setNameCol(newNameCol);
    setBirthDateCol(newBirthDateCol);
    setAgeCol(newAgeCol);
    setCategoryCol(newCatCol);
    setPhoneCol(newPhoneCol);
    setNotesCol(newNotesCol);

    if (rawWorkbook && selectedSheet) {
      parseWithMappings(
        rawWorkbook,
        selectedSheet,
        headerRowIndex,
        headers,
        newNameCol,
        newBirthDateCol,
        newAgeCol,
        newCatCol,
        newPhoneCol,
        newNotesCol
      );
    }
  };

  // Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  // Submit & execute import
  const handleConfirmImport = () => {
    if (parsedRows.length === 0) {
      setErrorMessage('لا توجد بيانات صالحة للاستيراد');
      return;
    }

    const newMembers: ScoutMember[] = parsedRows.map((r, i) => ({
      id: `scout_xl_${Date.now()}_${i}`,
      name: r.name,
      age: r.age,
      category: r.category,
      birthDate: r.birthDate,
      phone: r.phone,
      notes: r.notes,
      joinedDate: new Date().toISOString().split('T')[0],
    }));

    onImport(newMembers, importMode);
    onClose();
  };

  // Category counts in preview
  const previewCounts = {
    total: parsedRows.length,
    براعم: parsedRows.filter((r) => r.category === 'براعم').length,
    أشبال: parsedRows.filter((r) => r.category === 'أشبال').length,
    كشافة: parsedRows.filter((r) => r.category === 'كشافة').length,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 my-4 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Header */}
        <div className="bg-[#00685e] dark:bg-[#004f47] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-800/80 dark:bg-emerald-900/90 flex items-center justify-center border border-emerald-400/30">
              <FileSpreadsheet className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg flex items-center gap-2">
                <span>استيراد أفراد الكشافة من ملف إكسل</span>
                <span className="text-xs bg-emerald-800/90 px-2 py-0.5 rounded-full font-mono text-emerald-200">
                  Excel / CSV
                </span>
              </h3>
              <p className="text-[11px] text-emerald-100">
                قراءة أسماء الكشافين، الأعمار، وتوزيع الفئات (براعم، أشبال، كشافة) تلقائياً
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#00554d] hover:bg-[#00433d] flex items-center justify-center text-emerald-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          
          {/* Download Template Banner */}
          <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 rounded-2xl p-3 sm:p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors">
            <div className="flex items-center gap-2.5 text-emerald-900 dark:text-emerald-200">
              <FileText className="w-5 h-5 text-[#00685e] dark:text-emerald-400 shrink-0" />
              <div>
                <strong className="block font-bold text-xs">هل تحتاج إلى نموذج جاهز لتعبئة الأسماء؟</strong>
                <span className="text-[11px] text-slate-600 dark:text-slate-400">
                  يمكنك تنزيل ملف إكسل نموذجي منظم يحتوي على أمثلة للأعمار والفئات والهاتف.
                </span>
              </div>
            </div>

            <button
              onClick={handleDownloadTemplate}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-[#00685e] dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-slate-700/80 font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-2xs transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>تحميل النموذج (.xlsx)</span>
            </button>
          </div>

          {/* Upload Dropzone */}
          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-[#00685e] bg-emerald-50/60 dark:bg-emerald-950/40 ring-4 ring-emerald-500/10'
                  : 'border-slate-300 dark:border-slate-700 hover:border-[#00685e] dark:hover:border-emerald-500 bg-slate-50/60 dark:bg-slate-800/50'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx, .xls, .csv"
                className="hidden"
                onChange={(e) => {
                  const selected = e.target.files?.[0];
                  if (selected) processFile(selected);
                }}
              />

              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-[#00685e] dark:text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <Upload className="w-7 h-7" />
              </div>

              <h4 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100 mb-1">
                اضغط هنا لاختيار ملف الإكسل أو اسحبه إلى هنا
              </h4>
              <p className="text-slate-500 dark:text-slate-400 text-xs max-w-sm mx-auto mb-3">
                يدعم صيغ Excel الحديثة (.xlsx)، والقديمة (.xls)، وملفات القيم المفصولة (.csv)
              </p>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-medium shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>التعرف الذكي التلقائي على أعمدة الأسماء والأعمار</span>
              </div>
            </div>
          ) : (
            /* File is Selected: Details and Mapping Toolbar */
            <div className="space-y-3">
              {/* File Info Bar */}
              <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-[#00685e] dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate block">
                      {fileName}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      تم العثور على {parsedRows.length} كشاف جاهز للإدراج
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Sheet Selector if multiple sheets */}
                  {sheetNames.length > 1 && (
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">الورقة:</span>
                      <select
                        value={selectedSheet}
                        onChange={(e) => handleSheetChange(e.target.value)}
                        className="py-1 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                      >
                        {sheetNames.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    onClick={handleReset}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="تغيير الملف"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Column Mapping Selectors */}
              <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-[#00685e] dark:text-emerald-400" />
                    <span>مطابقة أعمدة الملف (تم التعرف عليها آلياً ويمكنك تعديلها):</span>
                  </div>
                  <span className="text-[10px] text-slate-400">الحقول بعلامة (*) مطلوبة</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-1">
                  {/* Name Column */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      عمود الاسم <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={nameCol}
                      onChange={(e) => handleRemap(e.target.value, birthDateCol, ageCol, categoryCol, phoneCol, notesCol)}
                      className="w-full py-1.5 px-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold text-[11px] outline-none"
                    >
                      <option value="">-- اختر --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Birth Date Column (Optional) */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      المواليد (اختياري)
                    </label>
                    <select
                      value={birthDateCol}
                      onChange={(e) => handleRemap(nameCol, e.target.value, ageCol, categoryCol, phoneCol, notesCol)}
                      className="w-full py-1.5 px-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium text-[11px] outline-none"
                    >
                      <option value="">-- لا يوجد --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Age Column */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      عمود العمر <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={ageCol}
                      onChange={(e) => handleRemap(nameCol, birthDateCol, e.target.value, categoryCol, phoneCol, notesCol)}
                      className="w-full py-1.5 px-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold text-[11px] outline-none"
                    >
                      <option value="">-- اختر --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Category Column (Optional) */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      الفئة (اختياري)
                    </label>
                    <select
                      value={categoryCol}
                      onChange={(e) => handleRemap(nameCol, birthDateCol, ageCol, e.target.value, phoneCol, notesCol)}
                      className="w-full py-1.5 px-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium text-[11px] outline-none"
                    >
                      <option value="">حساب آلي من العمر</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Phone Column */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      الهاتف (اختياري)
                    </label>
                    <select
                      value={phoneCol}
                      onChange={(e) => handleRemap(nameCol, birthDateCol, ageCol, categoryCol, e.target.value, notesCol)}
                      className="w-full py-1.5 px-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium text-[11px] outline-none"
                    >
                      <option value="">-- لا يوجد --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Notes Column */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      ملاحظات (اختياري)
                    </label>
                    <select
                      value={notesCol}
                      onChange={(e) => handleRemap(nameCol, birthDateCol, ageCol, categoryCol, phoneCol, e.target.value)}
                      className="w-full py-1.5 px-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium text-[11px] outline-none"
                    >
                      <option value="">-- لا يوجد --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 text-[11px] text-emerald-900 dark:text-emerald-200">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>
                    <strong>ملاحظة ممتازة:</strong> إذا كان ملفك يحتوي فقط على عمود <strong>الاسم</strong> و<strong>العمر</strong> (أو <strong>المواليد</strong>)، يتعرف عليهما البرنامج فوراً ويحسب الفئة الكشفية آلياً (براعم 6-8، أشبال 9-11، كشافة 12-14) ويتحدث عمر الكشاف وفئته تلقائياً مع مرور السنين.
                  </span>
                </div>
              </div>

              {/* Category Breakdown Counter */}
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">إجمالي المقروء</span>
                  <strong className="text-sm font-black text-slate-900 dark:text-slate-100">{previewCounts.total}</strong>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/50 p-2.5 rounded-xl text-center border border-emerald-200 dark:border-emerald-800/60">
                  <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 block">البراعم (6-8)</span>
                  <strong className="text-sm font-black text-emerald-700 dark:text-emerald-300">{previewCounts.براعم}</strong>
                </div>
                <div className="bg-teal-50 dark:bg-teal-950/50 p-2.5 rounded-xl text-center border border-teal-200 dark:border-teal-800/60">
                  <span className="text-[10px] font-bold text-teal-800 dark:text-teal-300 block">الأشبال (9-11)</span>
                  <strong className="text-sm font-black text-teal-700 dark:text-teal-300">{previewCounts.أشبال}</strong>
                </div>
                <div className="bg-cyan-50 dark:bg-cyan-950/50 p-2.5 rounded-xl text-center border border-cyan-200 dark:border-cyan-800/60">
                  <span className="text-[10px] font-bold text-cyan-800 dark:text-cyan-300 block">الكشافة (12-14)</span>
                  <strong className="text-sm font-black text-cyan-700 dark:text-cyan-300">{previewCounts.كشافة}</strong>
                </div>
              </div>

              {/* Live Preview Table */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-right border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-800/90 sticky top-0 text-[11px] font-bold text-slate-700 dark:text-slate-300 z-10 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2 px-3 w-10 text-center">#</th>
                      <th className="py-2 px-3">الاسم المستخرج</th>
                      <th className="py-2 px-3 text-center">المواليد</th>
                      <th className="py-2 px-3 text-center">العمر المحسوب</th>
                      <th className="py-2 px-3 text-center">الفئة المحددة</th>
                      <th className="py-2 px-3">الهاتف</th>
                      <th className="py-2 px-3">الحالة / ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                    {parsedRows.map((row, idx) => {
                      const catTheme = getCategoryColor(row.category);
                      return (
                        <tr
                          key={idx}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="py-1.5 px-3 text-center font-mono text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-1.5 px-3 font-bold text-slate-900 dark:text-slate-100">
                            {row.name}
                          </td>
                          <td className="py-1.5 px-3 text-center font-mono text-[10px] text-slate-600 dark:text-slate-400">
                            {row.birthDate || '-'}
                          </td>
                          <td className="py-1.5 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                            {row.age} سنة
                          </td>
                          <td className="py-1.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${catTheme.badge}`}>
                              {row.category}
                            </span>
                          </td>
                          <td className="py-1.5 px-3 font-mono text-slate-600 dark:text-slate-400 dir-ltr text-right">
                            {row.phone || '-'}
                          </td>
                          <td className="py-1.5 px-3">
                            {row.warning ? (
                              <span className="text-amber-600 dark:text-amber-400 text-[10px] flex items-center gap-1 font-medium">
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                {row.warning}
                              </span>
                            ) : (
                              <span className="text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                                جاهز للإدراج
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Import Mode Radio Toggle */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  طريقة إضافة الأسماء إلى السجل الحالي:
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      importMode === 'merge'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-[#00685e] dark:border-emerald-600 ring-1 ring-[#00685e]/20'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="accent-[#00685e]"
                    />
                    <div>
                      <strong className="block text-xs font-bold text-slate-800 dark:text-slate-100">
                        دمج وإضافة مع القائمة الحالية (مستحسن)
                      </strong>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        إبقاء الكشافين الحاليين ({currentMembersCount}) وإضافة الأسماء الجديدة.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      importMode === 'replace'
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 dark:border-rose-600 ring-1 ring-rose-500/20'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="accent-rose-600"
                    />
                    <div>
                      <strong className="block text-xs font-bold text-rose-700 dark:text-rose-400">
                        استبدال القائمة بالكامل
                      </strong>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        مسح السجل الحالي واعتماد أسماء ملف الإكسل فقط.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 p-3 rounded-xl border border-rose-200 dark:border-rose-800/60 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-700/80 p-3.5 sm:px-6 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs transition-colors"
          >
            إلغاء
          </button>

          <button
            onClick={handleConfirmImport}
            disabled={parsedRows.length === 0}
            className="px-5 py-2.5 rounded-xl bg-[#00685e] hover:bg-[#00554d] disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs flex items-center gap-2 shadow-md shadow-emerald-900/20 active:scale-95 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>
              تأكيد استيراد ({parsedRows.length}) كشاف داخل البرنامج
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
