import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { storageGet, storageSet } from "./storage";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_EN = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const SUNDAY_TIMES = ["6:30am","9:00am","11:00am","6:00pm"];
const WEEKDAY_TIMES = ["6:30am"];
const DEFAULT_COLS = [
  { id: "c1", label: "Unang Pagbasa", color: "#4A7C59" },
  { id: "c2", label: "Salmo", color: "#C67B3C" },
  { id: "c3", label: "Ikalawang Pagbasa", color: "#C9A84C" },
  { id: "c4", label: "Panalangin ng Bayan / Pambungad na Panalangin", color: "#A63D40" },
];
const RT = { MASS: "mass", BANNER: "banner" };
const SK = { data: "pa-v7", auth: "pa-v7-admin", published: "pa-v7-pub" };

async function sG(k) {
  return await storageGet(k);
}
async function sS(k, v) {
  await storageSet(k, v);
}

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const dimM = (y, m) => new Date(y, m + 1, 0).getDate();
const dowF = (y, m, d) => new Date(y, m, d).getDay();
function sord(y, m, d) {
  let c = 0;
  for (let i = 1; i <= d; i++) if (new Date(y, m, i).getDay() === 0) c++;
  return ["1st","2nd","3rd","4th","5th"][c - 1] || "";
}

function genMonth(y, m) {
  const rows = [];
  for (let d = 1; d <= dimM(y, m); d++) {
    const dw = dowF(y, m, d);
    const isSun = dw === 0;
    const times = isSun ? SUNDAY_TIMES : WEEKDAY_TIMES;
    times.forEach((t, ti) => {
      rows.push({
        id: uid(), type: RT.MASS,
        date: ti === 0 ? String(d) : "",
        day: ti === 0 ? (isSun ? sord(y, m, d) + "Sunday" : DAYS_EN[dw]) : "",
        time: t, cells: {}, isSunday: isSun,
        dateFmt: {}, dayFmt: {}, timeFmt: {},
      });
    });
  }
  return rows;
}

function holyWeekRows() {
  const r = [];
  const B = (t, bg) => ({ id: uid(), type: RT.BANNER, text: t, bgColor: bg || "#4a0080", textColor: "#fff", fontSize: 14, bold: true });
  const M = (d, dl, t) => ({ id: uid(), type: RT.MASS, date: d, day: dl, time: t, cells: {}, isSunday: false, dateFmt: {}, dayFmt: {}, timeFmt: {} });
  r.push(M("1", "Miyerkules Santo", "6:30am"));
  r.push(B("PAGDIRIWANG NG TENEBRE"));
  ["a) Salmo 140","b) Salmo 141","c) Salmo 142","d) Panaghoy 1:1-12","e) Panaghoy 3:1-9:5-57","f) Panaghoy 5:15-22","g) Awit sa Mahal na Birhen"].forEach(s => {
    r.push(M("", s, "6:00pm"));
  });
  r.push(M("", "Choir", "6:00pm"));
  r.push(M("2", "Huwebes Santo", "6:00pm"));
  r.push(B("Pag huhugas ng Paa Huling Hapunan", "#800000"));
  r.push(M("3", "Biyernes Santo", "6:30am"));
  r.push(B("Pasyon Ni Kristo", "#800000"));
  r.push(M("", "Pasyon ni Kristo", "3:00pm"));
  r.push(M("", "Pari", "3:00pm"));
  r.push(B("Panalangin pangkalahatan", "#C67B3C"));
  r.push(M("4", "Sabado de Gloria", "6:30am"));
  r.push(B("Bihilya sa Paskong Pagkabuhay", "#4a0080"));
  r.push(M("", "", "6:30pm"));
  r.push(M("", "Easter 1st Sunday Salubungan", "4:30am"));
  return r;
}

function misaDeGalloRows() {
  const r = [];
  r.push({ id: uid(), type: RT.BANNER, text: "Misa de Gallo December 16-24", bgColor: "#4a0080", textColor: "#FFD700", fontSize: 14, bold: true });
  for (let d = 16; d <= 24; d++) {
    r.push({ id: uid(), type: RT.MASS, date: String(d), day: "", time: "5:00am", cells: {}, isSunday: false, dateFmt: {}, dayFmt: {}, timeFmt: {} });
    r.push({ id: uid(), type: RT.MASS, date: "", day: "", time: "8:00pm", cells: {}, isSunday: false, dateFmt: {}, dayFmt: {}, timeFmt: {} });
  }
  return r;
}

function defaultCV(text) { return { text: text || "", bold: false, fontSize: 12, color: "", bgColor: "" }; }
function getCV(row, colId) {
  const v = row.cells && row.cells[colId];
  if (!v) return defaultCV();
  if (typeof v === "string") return defaultCV(v);
  return { ...defaultCV(), ...v };
}
function fmtSt(fmt) {
  if (!fmt || typeof fmt !== "object") return {};
  const s = {};
  if (fmt.bold) s.fontWeight = "700";
  if (fmt.fontSize) s.fontSize = fmt.fontSize + "px";
  if (fmt.color) s.color = fmt.color;
  if (fmt.bgColor) s.backgroundColor = fmt.bgColor;
  return s;
}

// ─── Extracted Components ───

function LectorPicker({ lectors, current, onAssign, onClose }) {
  const [q, setQ] = useState("");
  const ref = useRef(null);
  const filtered = lectors.filter(l => l.toLowerCase().includes(q.toLowerCase()));
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  return (
    <div ref={ref} className="picker">
      <input autoFocus placeholder="Search lector..." value={q} onChange={e => setQ(e.target.value)} className="picker-input" />
      <div className="picker-list">
        <div className="picker-item picker-clear" onClick={() => onAssign("")}>— Clear —</div>
        {filtered.map(l => (
          <div key={l} className={"picker-item" + (l === current ? " active" : "")} onClick={() => onAssign(l)}>{l}</div>
        ))}
        {filtered.length === 0 && <div className="picker-empty">No match</div>}
      </div>
    </div>
  );
}

function ModalComp({ onClose, title, children }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3 className="modal-title">{title}</h3>
          <button onClick={onClose} className="btn-xs">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── MAIN ───
export default function App() {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("viewer");
  const [pin, setPin] = useState("");
  const [setupMode, setSetupMode] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [memberCode, setMemberCode] = useState("");

  const [appData, setAppData] = useState({
    lectors: [], columns: DEFAULT_COLS, months: {},
    settings: {
      parishName: "Holy Spirit Parish Alido",
      preparedBy: "Maria Magdalena G. Serrano",
      approvedBy: "Rev. Fr. Msgr. Pablo S. Legaspi Jr.",
      memberCode: "lector2025",
    },
  });

  const [tab, setTab] = useState("schedule");
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [editCell, setEditCell] = useState(null); // for lector picker
  const [editingField, setEditingField] = useState(null); // {rowId, field} for inline text edit
  const [toast, setToast] = useState(null);
  const [showAddRow, setShowAddRow] = useState(null);
  const [showEventPicker, setShowEventPicker] = useState(null);
  const [newLector, setNewLector] = useState("");
  const [lectorSearch, setLectorSearch] = useState("");
  const [newColLabel, setNewColLabel] = useState("");
  const [newColColor, setNewColColor] = useState("#607D8B");
  const [addRowType, setAddRowType] = useState("mass");
  const [addBannerText, setAddBannerText] = useState("");
  const [addBannerColor, setAddBannerColor] = useState("#4a0080");
  const [fmtTarget, setFmtTarget] = useState(null);
  const [showFmtBar, setShowFmtBar] = useState(false);
  const [loginTab, setLoginTab] = useState("admin");
  const [dragIdx, setDragIdx] = useState(null);
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [changePin, setChangePin] = useState("");
  const [changePinConfirm, setChangePinConfirm] = useState("");
  const [showChangePin, setShowChangePin] = useState(false);
  const [showForgotPin, setShowForgotPin] = useState(false);
  const [forgotAnswer, setForgotAnswer] = useState("");
  const [forgotNewPin, setForgotNewPin] = useState("");
  const [publishedData, setPublishedData] = useState(null);
  const [unpublishedMonths, setUnpublishedMonths] = useState({});

  const isAdmin = role === "admin";
  const isMember = role === "member";
  const showToast = useCallback((msg, type) => { setToast({ msg, type: type || "ok" }); setTimeout(() => setToast(null), 2400); }, []);
  const mk = year + "-" + month;
  const captureRef = useRef(null);

  // Screenshot: capture schedule as image
  const handleScreenshot = async () => {
    if (!captureRef.current) return;
    showToast("Generating image...");
    try {
      // Dynamically load html2canvas
      if (!window.html2canvas) {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
        document.head.appendChild(script);
        await new Promise((res, rej) => { script.onload = res; script.onerror = rej; });
      }
      const canvas = await window.html2canvas(captureRef.current, {
        scale: 2,
        backgroundColor: "#FAF7F2",
        useCORS: true,
        logging: false,
      });
      canvas.toBlob(async (blob) => {
        if (!blob) { showToast("Failed to capture", "err"); return; }
        // Try native share (mobile)
        if (navigator.share && navigator.canShare) {
          const file = new File([blob], "lectors-schedule-" + MONTHS[month] + "-" + year + ".png", { type: "image/png" });
          try {
            await navigator.share({ files: [file], title: "Lectors Schedule" });
            showToast("Shared!");
            return;
          } catch (e) {
            // User cancelled or share failed, fall through to download
          }
        }
        // Fallback: download
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "lectors-schedule-" + MONTHS[month] + "-" + year + ".png";
        a.click();
        URL.revokeObjectURL(url);
        showToast("Image saved!");
      }, "image/png");
    } catch (e) {
      console.error("Screenshot error:", e);
      showToast("Screenshot failed", "err");
    }
  };

  // Excel export
  const handleExcelExport = () => {
    try {
      // Build CSV content (works on all devices, opens in Excel)
      const sep = ",";
      const esc = (v) => {
        const s = String(v || "").replace(/"/g, '""');
        return '"' + s + '"';
      };
      const headerRow = ["Date", "Day", "Time", ...cols.map(c => c.label)];
      const csvRows = [headerRow.map(esc).join(sep)];

      rows.forEach(row => {
        if (row.type === RT.BANNER) {
          csvRows.push(esc(row.text));
          return;
        }
        const cellValues = cols.map(c => {
          const cv = getCV(row, c.id);
          return cv.text || "";
        });
        csvRows.push([esc(row.date), esc(row.day), esc(row.time), ...cellValues.map(esc)].join(sep));
      });

      // Add header and footer info
      const settings = isMember && publishedData && publishedData.settings ? publishedData.settings : appData.settings;
      const header = [
        esc(settings.parishName),
        esc("Lectors Schedule of Duty for the Month of " + MONTHS[month] + " 1-" + dimM(year, month) + ", " + year),
        ""
      ];
      const footer = [
        "",
        esc("Prepared by: " + settings.preparedBy),
        esc("Approved by: " + settings.approvedBy),
      ];

      const fullCsv = [...header, ...csvRows, ...footer].join("\n");

      // BOM for Excel to recognize UTF-8
      const blob = new Blob(["\uFEFF" + fullCsv], { type: "text/csv;charset=utf-8;" });

      // Try native share on mobile
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], "lectors-schedule-" + MONTHS[month] + "-" + year + ".csv", { type: "text/csv" });
        navigator.share({ files: [file], title: "Lectors Schedule" }).catch(() => {});
      }

      // Also download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "lectors-schedule-" + MONTHS[month] + "-" + year + ".csv";
      a.click();
      URL.revokeObjectURL(url);
      showToast("Excel file saved!");
    } catch (e) {
      console.error("Export error:", e);
      showToast("Export failed", "err");
    }
  };

  useEffect(() => {
    (async () => {
      const d = await sG(SK.data);
      const a = await sG(SK.auth);
      const p = await sG(SK.published);
      if (d) setAppData(d);
      if (p) setPublishedData(p);
      // Only show setup if truly first time:
      // - No auth record AND no data AND no published data AND no adminCreated flag
      const adminExists = (a && a.pin) || (d && d.adminCreated) || p;
      if (!adminExists) {
        setSetupMode(true);
      } else {
        setSetupMode(false);
      }
      setMonth(new Date().getMonth());
      setYear(new Date().getFullYear());
      setLoading(false);
    })();
  }, []);

  const save = useCallback(async (nd) => {
    setAppData(nd);
    await sS(SK.data, nd);
    // Mark current month as having unpublished changes
    setUnpublishedMonths(prev => ({ ...prev, [mk]: true }));
  }, [mk]);

  // Admin sees draft (appData), Member sees published version
  const rows = useMemo(() => {
    if (isMember && publishedData && publishedData.months && publishedData.months[mk]) {
      return publishedData.months[mk];
    }
    return appData.months[mk] || genMonth(year, month);
  }, [appData.months, publishedData, mk, year, month, isMember]);

  // Members see published columns
  const cols = useMemo(() => {
    if (isMember && publishedData && publishedData.columns) return publishedData.columns;
    return appData.columns;
  }, [appData.columns, publishedData, isMember]);

  const totalCols = 3 + cols.length;

  const hasUnpublished = unpublishedMonths[mk] || false;

  // Publish current month
  const publishMonth = useCallback(async () => {
    const newPub = publishedData ? { ...publishedData } : { months: {}, columns: [], settings: {}, timestamps: {} };
    newPub.months = { ...(newPub.months || {}), [mk]: rows };
    newPub.columns = appData.columns;
    newPub.settings = appData.settings;
    newPub.timestamps = { ...(newPub.timestamps || {}), [mk]: Date.now() };
    setPublishedData(newPub);
    await sS(SK.published, newPub);
    setUnpublishedMonths(prev => { const n = { ...prev }; delete n[mk]; return n; });
    showToast("Published! Members can now see " + MONTHS[month] + " schedule.");
  }, [publishedData, mk, rows, appData, month, showToast]);

  const updateRows = useCallback(async (nr) => {
    await save({ ...appData, months: { ...appData.months, [mk]: nr } });
  }, [appData, mk, save]);

  // Direct text edit for date/day/time fields
  const updateTextField = useCallback(async (rowId, field, val) => {
    await updateRows(rows.map(r => (r.id === rowId ? { ...r, [field]: val } : r)));
  }, [rows, updateRows]);

  // Lector assignment
  const assignCell = useCallback(async (rowId, colId, val) => {
    const nr = rows.map(r => {
      if (r.id !== rowId) return r;
      const ex = getCV(r, colId);
      return { ...r, cells: { ...r.cells, [colId]: { ...ex, text: val } } };
    });
    await updateRows(nr);
    setEditCell(null);
  }, [rows, updateRows]);

  // Cell formatting
  const updateCellFmt = useCallback(async (rowId, colId, fk, fv) => {
    const nr = rows.map(r => {
      if (r.id !== rowId) return r;
      const ex = getCV(r, colId);
      return { ...r, cells: { ...r.cells, [colId]: { ...ex, [fk]: fv } } };
    });
    await updateRows(nr);
  }, [rows, updateRows]);

  const updateFieldFmt = useCallback(async (rowId, field, fk, fv) => {
    const ff = field + "Fmt";
    await updateRows(rows.map(r => {
      if (r.id !== rowId) return r;
      return { ...r, [ff]: { ...(r[ff] || {}), [fk]: fv } };
    }));
  }, [rows, updateRows]);

  const updateBannerFmt = useCallback(async (rowId, fk, fv) => {
    await updateRows(rows.map(r => (r.id !== rowId ? r : { ...r, [fk]: fv })));
  }, [rows, updateRows]);

  // Row ops
  const insertRow = useCallback(async (afterIdx, type, extra) => {
    let newRow;
    if (type === "banner") {
      newRow = { id: uid(), type: RT.BANNER, text: (extra && extra.text) || "Event Title", bgColor: (extra && extra.bg) || "#4a0080", textColor: "#fff", fontSize: 14, bold: true };
    } else {
      newRow = { id: uid(), type: RT.MASS, date: "", day: "", time: "6:30am", cells: {}, isSunday: false, dateFmt: {}, dayFmt: {}, timeFmt: {} };
    }
    const nr = [...rows];
    nr.splice(afterIdx + 1, 0, newRow);
    await updateRows(nr);
    showToast("Row added");
  }, [rows, updateRows, showToast]);

  const deleteRow = useCallback(async (id) => {
    await updateRows(rows.filter(r => r.id !== id));
    showToast("Row deleted");
  }, [rows, updateRows, showToast]);

  const moveRow = useCallback(async (id, dir) => {
    const i = rows.findIndex(r => r.id === id);
    if ((dir === -1 && i === 0) || (dir === 1 && i === rows.length - 1)) return;
    const nr = [...rows];
    const tmp = nr[i]; nr[i] = nr[i + dir]; nr[i + dir] = tmp;
    await updateRows(nr);
  }, [rows, updateRows]);

  // Drag reorder
  const handleDragStart = (idx) => { if (isAdmin) setDragIdx(idx); };
  const handleDragOver = (e) => { e.preventDefault(); };
  const handleDrop = useCallback(async (targetIdx) => {
    if (dragIdx === null || dragIdx === targetIdx) { setDragIdx(null); return; }
    const nr = [...rows];
    const [moved] = nr.splice(dragIdx, 1);
    nr.splice(targetIdx, 0, moved);
    await updateRows(nr);
    setDragIdx(null);
    showToast("Row moved");
  }, [dragIdx, rows, updateRows, showToast]);

  const insertTemplate = useCallback(async (tRows, afterIdx) => {
    const nr = [...rows];
    nr.splice(afterIdx + 1, 0, ...tRows);
    await updateRows(nr);
    setShowEventPicker(null);
    showToast("Template inserted!");
  }, [rows, updateRows, showToast]);

  // Column ops
  const addColumn = useCallback(async () => {
    if (!newColLabel.trim()) return;
    await save({ ...appData, columns: [...appData.columns, { id: uid(), label: newColLabel.trim(), color: newColColor }] });
    setNewColLabel(""); showToast("Column added");
  }, [appData, save, newColLabel, newColColor, showToast]);
  const removeColumn = useCallback(async (id) => { await save({ ...appData, columns: appData.columns.filter(c => c.id !== id) }); showToast("Column removed"); }, [appData, save, showToast]);
  const updateColumn = useCallback(async (id, f, v) => { await save({ ...appData, columns: appData.columns.map(c => (c.id === id ? { ...c, [f]: v } : c)) }); }, [appData, save]);
  const moveColumn = useCallback(async (id, dir) => {
    const i = appData.columns.findIndex(c => c.id === id);
    if ((dir === -1 && i === 0) || (dir === 1 && i === appData.columns.length - 1)) return;
    const nc = [...appData.columns]; const tmp = nc[i]; nc[i] = nc[i + dir]; nc[i + dir] = tmp;
    await save({ ...appData, columns: nc });
  }, [appData, save]);

  // Lectors
  const addLector = useCallback(async () => {
    const n = newLector.trim();
    if (!n || appData.lectors.includes(n)) return;
    await save({ ...appData, lectors: [...appData.lectors, n].sort((a, b) => a.localeCompare(b)) });
    setNewLector(""); showToast(n + " added");
  }, [newLector, appData, save, showToast]);
  const removeLector = useCallback(async (name) => {
    await save({ ...appData, lectors: appData.lectors.filter(l => l !== name) });
    showToast(name + " removed");
  }, [appData, save, showToast]);

  const updateSetting = useCallback(async (k, v) => { await save({ ...appData, settings: { ...appData.settings, [k]: v } }); }, [appData, save]);
  const resetMonth = useCallback(async () => { await updateRows(genMonth(year, month)); showToast("Month reset"); }, [year, month, updateRows, showToast]);

  // Auth — PIN stored in SHARED storage so it's the same on all devices
  const handleSetup = async () => {
    if (newPin.length < 4) { showToast("Min 4 digits", "err"); return; }
    if (newPin !== confirmPin) { showToast("PINs don't match", "err"); return; }
    if (!securityAnswer.trim()) { showToast("Enter security answer", "err"); return; }
    // Save PIN to shared storage
    await sS(SK.auth, { pin: newPin, security: securityAnswer.trim().toLowerCase() });
    // Also save initial app data with adminCreated flag so other devices know admin exists
    const initData = { ...appData, adminCreated: true };
    await sS(SK.data, initData);
    setAppData(initData);
    setSetupMode(false);
    setRole("admin");
    showToast("Welcome, Admin!");
  };
  const handleLogin = async () => {
    const a = await sG(SK.auth);
    if (a && a.pin === pin) { setRole("admin"); setPin(""); showToast("Welcome!"); }
    else showToast("Wrong PIN", "err");
  };
  const handleMemberLogin = () => {
    if (memberCode === appData.settings.memberCode) { setRole("member"); setMemberCode(""); showToast("Welcome!"); }
    else showToast("Wrong code", "err");
  };
  const handleChangePin = async () => {
    if (changePin.length < 4) { showToast("Min 4 digits", "err"); return; }
    if (changePin !== changePinConfirm) { showToast("PINs don't match", "err"); return; }
    const a = await sG(SK.auth);
    await sS(SK.auth, { ...a, pin: changePin });
    setChangePin(""); setChangePinConfirm(""); setShowChangePin(false);
    showToast("PIN changed!");
  };
  const handleForgotPin = async () => {
    const a = await sG(SK.auth);
    if (!a || !a.security) { showToast("No security answer set", "err"); return; }
    if (forgotAnswer.trim().toLowerCase() !== a.security) { showToast("Wrong answer", "err"); return; }
    if (forgotNewPin.length < 4) { showToast("New PIN min 4 digits", "err"); return; }
    await sS(SK.auth, { ...a, pin: forgotNewPin });
    setForgotAnswer(""); setForgotNewPin(""); setShowForgotPin(false);
    setRole("admin"); showToast("PIN reset! You're logged in.");
  };

  // Format bar
  const getFmtInfo = useCallback(() => {
    if (!fmtTarget) return null;
    const row = rows.find(r => r.id === fmtTarget.rowId);
    if (!row) return null;
    if (fmtTarget.field === "banner") return { bold: row.bold !== false, fontSize: row.fontSize || 14, color: row.textColor || "#ffffff", bgColor: row.bgColor || "#4a0080" };
    if (fmtTarget.colId) { const v = getCV(row, fmtTarget.colId); return { bold: v.bold, fontSize: v.fontSize || 12, color: v.color || "#2C1810", bgColor: v.bgColor || "" }; }
    const fmt = row[(fmtTarget.field || "date") + "Fmt"] || {};
    return { bold: fmt.bold || false, fontSize: fmt.fontSize || 12, color: fmt.color || "#2C1810", bgColor: fmt.bgColor || "" };
  }, [fmtTarget, rows]);

  const applyFmt = useCallback(async (key, val) => {
    if (!fmtTarget) return;
    if (fmtTarget.field === "banner") { await updateBannerFmt(fmtTarget.rowId, key === "color" ? "textColor" : key, val); return; }
    if (fmtTarget.colId) { await updateCellFmt(fmtTarget.rowId, fmtTarget.colId, key, val); return; }
    await updateFieldFmt(fmtTarget.rowId, fmtTarget.field, key, val);
  }, [fmtTarget, updateCellFmt, updateFieldFmt, updateBannerFmt]);

  const openFmt = (rowId, colId, field) => {
    if (!isAdmin) return;
    setFmtTarget({ rowId: rowId, colId: colId || null, field: field || null });
    setShowFmtBar(true);
  };

  const fmtInfo = getFmtInfo();

  // Inline edit helper: just use editingField as a string key like "d-rowid"
  const isFieldEditing = (key) => editingField === key;
  const startEdit = (key) => { if (isAdmin) setEditingField(key); };

  const eventTemplates = [
    { n: "⛪ Mahal na Araw (Holy Week)", fn: holyWeekRows },
    { n: "🌟 Misa de Gallo (Dec 16-24)", fn: misaDeGalloRows },
    { n: "🎄 Simbang Gabi + Pasko", fn: () => {
      const r = misaDeGalloRows();
      r.push({ id: uid(), type: RT.BANNER, text: "Noche Buena / Christmas", bgColor: "#800000", textColor: "#FFD700", fontSize: 14, bold: true });
      r.push({ id: uid(), type: RT.MASS, date: "25", day: "Christmas Day", time: "6:30am", cells: {}, isSunday: false, dateFmt: {}, dayFmt: {}, timeFmt: {} });
      return r;
    }},
    { n: "🎆 Bagong Taon", fn: () => [
      { id: uid(), type: RT.BANNER, text: "Bagong Taon", bgColor: "#1a5276", textColor: "#FFD700", fontSize: 14, bold: true },
      { id: uid(), type: RT.MASS, date: "31", day: "New Year's Eve", time: "6:30am", cells: {}, isSunday: false, dateFmt: {}, dayFmt: {}, timeFmt: {} },
      { id: uid(), type: RT.MASS, date: "", day: "", time: "8:00pm", cells: {}, isSunday: false, dateFmt: {}, dayFmt: {}, timeFmt: {} },
      { id: uid(), type: RT.MASS, date: "1", day: "Solemnity of Mary", time: "6:30am", cells: {}, isSunday: false, dateFmt: {}, dayFmt: {}, timeFmt: {} },
    ]},
    { n: "👑 Christ the King", fn: () => [
      { id: uid(), type: RT.BANNER, text: "Christ the King", bgColor: "#800000", textColor: "#FFD700", fontSize: 14, bold: true },
      ...SUNDAY_TIMES.map((t, i) => ({ id: uid(), type: RT.MASS, date: "", day: i === 0 ? "Christ the King" : "", time: t, cells: {}, isSunday: true, dateFmt: {}, dayFmt: {}, timeFmt: {} })),
    ]},
  ];

  // ── RENDER ──

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "Georgia, serif", color: "#8B7355" }}>
        <style>{CSS}</style>
        <div style={{ fontSize: 40 }}>✝</div>
        <div>Loading...</div>
      </div>
    );
  }

  if (setupMode) {
    return (
      <div className="app-root">
        <style>{CSS}</style>
        {toast && <div className={"toast" + (toast.type === "err" ? " toast-err" : "")}>{toast.msg}</div>}
        <div className="setup-card">
          <div style={{ fontSize: 40, color: "#6B2737", marginBottom: 6 }}>✝</div>
          <h2 className="setup-title">Lectors Schedule</h2>
          <p className="setup-sub">First time setup — create your Admin PIN</p>
          <input type="password" placeholder="New PIN (min 4 digits)" value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, ""))} className="inp" maxLength={8} />
          <input type="password" placeholder="Confirm PIN" value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ""))} className="inp mt8" maxLength={8} />
          <p className="hint mt12">Security question (for PIN recovery):</p>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#6B2737", marginBottom: 4 }}>What is your mother's maiden name?</p>
          <input placeholder="Your answer" value={securityAnswer} onChange={e => setSecurityAnswer(e.target.value)} className="inp" onKeyDown={e => { if (e.key === "Enter") handleSetup(); }} />
          <button onClick={handleSetup} className="btn-primary mt16">Set PIN & Start</button>
        </div>
      </div>
    );
  }

  if (role === "viewer") {
    return (
      <div className="app-root">
        <style>{CSS}</style>
        {toast && <div className={"toast" + (toast.type === "err" ? " toast-err" : "")}>{toast.msg}</div>}
        <div className="setup-card">
          <div style={{ fontSize: 40, color: "#6B2737", marginBottom: 6 }}>✝</div>
          <h2 className="setup-title">{appData.settings.parishName}</h2>
          <p className="setup-sub">Lectors Schedule of Duty</p>
          <div className="login-tabs-full">
            <button className={"ltab-f" + (loginTab === "admin" ? " ltab-f-on" : "")} onClick={() => setLoginTab("admin")}>Admin</button>
            <button className={"ltab-f" + (loginTab === "member" ? " ltab-f-on" : "")} onClick={() => setLoginTab("member")}>Member</button>
          </div>
          {loginTab === "admin" ? (
            <div>
              <input type="password" placeholder="Enter Admin PIN" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ""))} className="inp mt8" maxLength={8} onKeyDown={e => { if (e.key === "Enter") handleLogin(); }} />
              <button onClick={handleLogin} className="btn-primary mt12">Login as Admin</button>
              <button onClick={() => setShowForgotPin(true)} className="forgot-link">Forgot PIN?</button>
            </div>
          ) : (
            <div>
              <input type="password" placeholder="Enter Member Code" value={memberCode} onChange={e => setMemberCode(e.target.value)} className="inp mt8" onKeyDown={e => { if (e.key === "Enter") handleMemberLogin(); }} />
              <button onClick={handleMemberLogin} className="btn-primary mt12">Login as Member</button>
            </div>
          )}
          {showForgotPin && (
            <div className="forgot-box">
              <p style={{ fontSize: 13, fontWeight: 600, color: "#6B2737", marginBottom: 4 }}>What is your mother's maiden name?</p>
              <input placeholder="Your answer" value={forgotAnswer} onChange={e => setForgotAnswer(e.target.value)} className="inp" />
              <input type="password" placeholder="New PIN (min 4 digits)" value={forgotNewPin} onChange={e => setForgotNewPin(e.target.value.replace(/\D/g, ""))} className="inp mt8" maxLength={8} onKeyDown={e => { if (e.key === "Enter") handleForgotPin(); }} />
              <button onClick={handleForgotPin} className="btn-primary mt8">Reset PIN & Login</button>
              <button onClick={() => setShowForgotPin(false)} className="forgot-link">Cancel</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app-root">
      <style>{CSS}</style>
      {toast && <div className={"toast" + (toast.type === "err" ? " toast-err" : "")}>{toast.msg}</div>}

      {/* TOP BAR */}
      <div className="auth-bar no-print">
        {role === "admin" && <span className="badge admin-b">ADMIN</span>}
        {role === "member" && <span className="badge member-b">MEMBER</span>}
        <button onClick={() => setRole("viewer")} className="btn-sm">Logout</button>
        {isAdmin && (
          <nav className="tabs-inline">
            <button onClick={() => setTab("schedule")} className={"tab" + (tab === "schedule" ? " tab-on" : "")}>📅</button>
            <button onClick={() => setTab("lectors")} className={"tab" + (tab === "lectors" ? " tab-on" : "")}>👥</button>
            <button onClick={() => setTab("columns")} className={"tab" + (tab === "columns" ? " tab-on" : "")}>📊</button>
            <button onClick={() => setTab("settings")} className={"tab" + (tab === "settings" ? " tab-on" : "")}>⚙️</button>
          </nav>
        )}
      </div>

      {/* FORMAT BAR */}
      {showFmtBar && isAdmin && fmtInfo && (
        <div className="fmt-bar no-print">
          <button className={"fmt-btn" + (fmtInfo.bold ? " fmt-on" : "")} onClick={() => applyFmt("bold", !fmtInfo.bold)}><b>B</b></button>
          <select value={fmtInfo.fontSize || 12} onChange={e => applyFmt("fontSize", Number(e.target.value))} className="fmt-sel">
            {[9,10,11,12,13,14,16,18,20,24].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <label className="fmt-cw" title="Text color">
            <span style={{ fontWeight: 800, textDecoration: "underline", color: fmtInfo.color || "#2C1810" }}>A</span>
            <input type="color" value={fmtInfo.color || "#2C1810"} onChange={e => applyFmt("color", e.target.value)} className="fmt-ci" />
          </label>
          <label className="fmt-cw" title="Fill">
            <span style={{ display: "inline-block", width: 14, height: 14, borderRadius: 3, border: "1px solid #ccc", backgroundColor: fmtInfo.bgColor || "#fff" }} />
            <input type="color" value={fmtInfo.bgColor || "#ffffff"} onChange={e => applyFmt("bgColor", e.target.value)} className="fmt-ci" />
          </label>
          <button className="fmt-btn" onClick={() => { applyFmt("bgColor", ""); applyFmt("color", ""); }}>Reset</button>
          <button className="fmt-btn" onClick={() => { setShowFmtBar(false); setFmtTarget(null); }}>✓</button>
        </div>
      )}

      {/* ═══ SCHEDULE ═══ */}
      {tab === "schedule" && (
        <div id="schedule-capture" ref={captureRef}>
          {/* TITLE HEADER (always visible) */}
          <div className="sched-header">
            <div className="sh-parish">{isMember && publishedData && publishedData.settings ? publishedData.settings.parishName : appData.settings.parishName}</div>
            <div className="sh-month">Lectors Schedule of Duty for the Month of {MONTHS[month]} 1-{dimM(year, month)}, {year}</div>
          </div>

          {/* Month nav */}
          <div className="month-nav no-print">
            {isAdmin && (
              <button className="btn-icon" onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }}>◀</button>
            )}
            {isAdmin ? (
              <>
                <select value={month} onChange={e => setMonth(Number(e.target.value))} className="sel">
                  {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <select value={year} onChange={e => setYear(Number(e.target.value))} className="sel">
                  {[2024,2025,2026,2027,2028,2029].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </>
            ) : (
              <span style={{ fontSize: 13, fontWeight: 500, color: "#8B7355" }}>{MONTHS[month]} {year}</span>
            )}
            {isAdmin && (
              <button className="btn-icon" onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }}>▶</button>
            )}
            <div style={{ flex: 1 }} />
            {isAdmin && hasUnpublished && (
              <button className="btn-publish" onClick={publishMonth}>📢 Publish</button>
            )}
            {isAdmin && !hasUnpublished && (
              <button className="btn-republish" onClick={publishMonth}>📢 Re-publish</button>
            )}
            {isAdmin && publishedData && publishedData.timestamps && publishedData.timestamps[mk] && (
              <span className="pub-status" title={"Last published: " + new Date(publishedData.timestamps[mk]).toLocaleString()}>✅ {new Date(publishedData.timestamps[mk]).toLocaleDateString()}</span>
            )}
            {isAdmin && <button className="btn-sm" onClick={resetMonth}>🔄</button>}
            <button className="btn-sm" onClick={() => window.print()}>🖨️</button>
            <button className="btn-sm" onClick={handleScreenshot}>📸</button>
            <button className="btn-sm" onClick={handleExcelExport}>📊</button>
          </div>

          {/* Draft indicator */}
          {isAdmin && hasUnpublished && (
            <div className="draft-bar no-print">
              ⚠️ You have unpublished changes for {MONTHS[month]}. Members won't see updates until you press <b>Publish</b>.
            </div>
          )}
          {isMember && (!publishedData || !publishedData.months || !publishedData.months[mk]) && (
            <div className="draft-bar no-print" style={{ background: "#fde8e8", borderColor: "#c0392b" }}>
              📋 No published schedule for {MONTHS[month]} yet. Please check back later.
            </div>
          )}

          {/* TABLE */}
          <div className="table-wrap">
            <table className="st">
              <thead>
                <tr>
                  <th className="th-f th-date">Date</th>
                  <th className="th-f th-day">Day</th>
                  <th className="th-f th-time">Time</th>
                  {cols.map(c => (
                    <th key={c.id} style={{ background: c.color, color: "#fff" }} className="th-col">{c.label}</th>
                  ))}
                  {isAdmin && <th className="th-f th-act">+/-</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => {
                  // BANNER
                  if (row.type === RT.BANNER) {
                    return (
                      <tr key={row.id} className="banner-row"
                        draggable={isAdmin} onDragStart={() => handleDragStart(ri)} onDragOver={handleDragOver} onDrop={() => handleDrop(ri)}
                        style={{ opacity: dragIdx === ri ? 0.4 : 1 }}>
                        <td colSpan={isAdmin ? totalCols + 1 : totalCols} className="banner-cell"
                          style={{ background: row.bgColor || "#4a0080", color: row.textColor || "#fff", fontSize: (row.fontSize || 14) + "px", fontWeight: row.bold !== false ? "700" : "400" }}
                          onClick={() => openFmt(row.id, null, "banner")}>
                          {isAdmin && (
                            <span className="banner-drag" title="Drag to reorder">☰</span>
                          )}
                          {isAdmin ? (
                            isFieldEditing("b-" + row.id) ? (
                              <input autoFocus value={row.text}
                                onChange={e => updateRows(rows.map(r => (r.id === row.id ? { ...r, text: e.target.value } : r)))}
                                onBlur={() => setEditingField(null)}
                                onKeyDown={e => { if (e.key === "Enter") setEditingField(null); }}
                                style={{ background: "rgba(255,248,231,.9)", border: "1.5px solid #B8860B", borderRadius: 4, outline: "none", padding: "2px 6px", width: "70%", textAlign: "center", fontFamily: "inherit", fontSize: "inherit", fontWeight: "inherit", color: "#2C1810" }}
                              />
                            ) : (
                              <strong onDoubleClick={() => startEdit("b-" + row.id)}>{row.text || "..."}</strong>
                            )
                          ) : (
                            <strong>{row.text}</strong>
                          )}
                          {isAdmin && (
                            <button className="banner-del" onClick={(e) => { e.stopPropagation(); deleteRow(row.id); }} title="Delete banner">✕</button>
                          )}
                        </td>
                      </tr>
                    );
                  }

                  // MASS ROW
                  return (
                    <tr key={row.id} className={"mass-row" + (row.isSunday ? " sunday" : "")}
                      draggable={isAdmin} onDragStart={() => handleDragStart(ri)} onDragOver={handleDragOver} onDrop={() => handleDrop(ri)}
                      style={{ opacity: dragIdx === ri ? 0.4 : 1 }}>
                      <td className="td-date" style={fmtSt(row.dateFmt)} onClick={() => openFmt(row.id, null, "date")}>
                        {isAdmin && isFieldEditing("d-" + row.id) ? (
                          <input autoFocus value={row.date}
                            onChange={e => updateTextField(row.id, "date", e.target.value)}
                            onBlur={() => setEditingField(null)}
                            onKeyDown={e => { if (e.key === "Enter") setEditingField(null); }}
                            style={{ background: "rgba(255,248,231,.9)", border: "1.5px solid #B8860B", borderRadius: 4, outline: "none", padding: "2px 4px", width: 40, textAlign: "center", fontFamily: "inherit", fontSize: "inherit", fontWeight: "inherit", color: "inherit" }}
                          />
                        ) : (
                          <span onDoubleClick={() => startEdit("d-" + row.id)} style={{ cursor: isAdmin ? "pointer" : "default", display: "inline-block", minWidth: 20, minHeight: 18 }}>
                            {row.date || (isAdmin ? <span style={{ color: "#ccc", fontSize: 10 }}>...</span> : "")}
                          </span>
                        )}
                      </td>
                      <td className="td-day" style={fmtSt(row.dayFmt)} onClick={() => openFmt(row.id, null, "day")}>
                        {isAdmin && isFieldEditing("dy-" + row.id) ? (
                          <input autoFocus value={row.day}
                            onChange={e => updateTextField(row.id, "day", e.target.value)}
                            onBlur={() => setEditingField(null)}
                            onKeyDown={e => { if (e.key === "Enter") setEditingField(null); }}
                            style={{ background: "rgba(255,248,231,.9)", border: "1.5px solid #B8860B", borderRadius: 4, outline: "none", padding: "2px 4px", width: "100%", fontFamily: "inherit", fontSize: "inherit", fontWeight: "inherit", color: "inherit" }}
                          />
                        ) : (
                          <span onDoubleClick={() => startEdit("dy-" + row.id)} style={{ cursor: isAdmin ? "pointer" : "default", display: "inline-block", minWidth: 20, minHeight: 18 }}>
                            {row.day || (isAdmin ? <span style={{ color: "#ccc", fontSize: 10 }}>...</span> : "")}
                          </span>
                        )}
                      </td>
                      <td className="td-time" style={fmtSt(row.timeFmt)} onClick={() => openFmt(row.id, null, "time")}>
                        {isAdmin && isFieldEditing("t-" + row.id) ? (
                          <input autoFocus value={row.time}
                            onChange={e => updateTextField(row.id, "time", e.target.value)}
                            onBlur={() => setEditingField(null)}
                            onKeyDown={e => { if (e.key === "Enter") setEditingField(null); }}
                            style={{ background: "rgba(255,248,231,.9)", border: "1.5px solid #B8860B", borderRadius: 4, outline: "none", padding: "2px 4px", width: 58, fontFamily: "inherit", fontSize: "inherit", fontWeight: "inherit", color: "inherit" }}
                          />
                        ) : (
                          <span onDoubleClick={() => startEdit("t-" + row.id)} style={{ cursor: isAdmin ? "pointer" : "default", display: "inline-block", minWidth: 20, minHeight: 18 }}>
                            {row.time || (isAdmin ? <span style={{ color: "#ccc", fontSize: 10 }}>...</span> : "")}
                          </span>
                        )}
                      </td>
                      {cols.map(c => {
                        const cv = getCV(row, c.id);
                        const ck = row.id + "-" + c.id;
                        const isE = editCell === ck;
                        return (
                          <td key={c.id} className={"td-cell" + (isE ? " td-editing" : "")} style={fmtSt(cv)}
                            onClick={() => { if (isAdmin) { setEditCell(isE ? null : ck); openFmt(row.id, c.id, null); } }}>
                            {cv.text || (isAdmin ? <span className="ph">tap...</span> : "—")}
                            {isE && isAdmin && (
                              <LectorPicker lectors={appData.lectors} current={cv.text} onAssign={v => assignCell(row.id, c.id, v)} onClose={() => setEditCell(null)} />
                            )}
                          </td>
                        );
                      })}
                      {isAdmin && (
                        <td className="td-act">
                          <button className="act-btn act-add" onClick={() => insertRow(ri, "mass")} title="Add row below">+</button>
                          <button className="act-btn act-del" onClick={() => deleteRow(row.id)} title="Delete row">−</button>
                          <button className="act-btn act-evt" onClick={() => setShowEventPicker(ri)} title="Insert template">⛪</button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {isAdmin && (
            <div className="add-bar no-print">
              <button className="btn-add" onClick={() => insertRow(rows.length - 1, "mass")}>+ Add Mass Row</button>
              <button className="btn-add btn-add-b" onClick={() => setShowAddRow(rows.length - 1)}>+ Add Banner</button>
              <button className="btn-add btn-add-e" onClick={() => setShowEventPicker(rows.length - 1)}>⛪ Event Template</button>
            </div>
          )}

          {/* FOOTER (always visible) */}
          <div className="sched-footer">
            <div>
              <div className="sf-label">Prepared by:</div>
              <div className="sf-name">{isMember && publishedData && publishedData.settings ? publishedData.settings.preparedBy : appData.settings.preparedBy}</div>
              <div className="sf-role">Pres. Lectors</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="sf-label">Approved by:</div>
              <div className="sf-name">{isMember && publishedData && publishedData.settings ? publishedData.settings.approvedBy : appData.settings.approvedBy}</div>
              <div className="sf-role">Parish Priest</div>
            </div>
          </div>

          {isMember && <div className="hint-bar no-print">📖 Member view — current month only. Contact admin for changes.</div>}

          {/* ADD BANNER MODAL */}
          {showAddRow !== null && isAdmin && (
            <ModalComp onClose={() => setShowAddRow(null)} title="Add Banner">
              <label className="lbl">Banner Text</label>
              <input value={addBannerText} onChange={e => setAddBannerText(e.target.value)} className="inp" placeholder="e.g. PAGDIRIWANG NG TENEBRE" />
              <label className="lbl mt8">Color</label>
              <input type="color" value={addBannerColor} onChange={e => setAddBannerColor(e.target.value)} />
              <button className="btn-primary mt16" onClick={async () => { await insertRow(showAddRow, "banner", { text: addBannerText, bg: addBannerColor }); setShowAddRow(null); setAddBannerText(""); }}>Insert Banner</button>
            </ModalComp>
          )}

          {/* EVENT TEMPLATE */}
          {showEventPicker !== null && isAdmin && (
            <ModalComp onClose={() => setShowEventPicker(null)} title="Event Template">
              <p style={{ fontSize: 13, color: "#8B7355", marginBottom: 12 }}>Editable after inserting.</p>
              <div className="tpl-list">
                {eventTemplates.map(t => (
                  <button key={t.n} className="tpl-btn" onClick={() => insertTemplate(t.fn(), showEventPicker)}>{t.n}</button>
                ))}
              </div>
            </ModalComp>
          )}
        </div>
      )}

      {/* ═══ LECTORS ═══ */}
      {tab === "lectors" && isAdmin && (
        <div className="panel">
          <h3 className="panel-title">Manage Lectors</h3>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={newLector} onChange={e => setNewLector(e.target.value)} placeholder="New name..." className="inp" onKeyDown={e => { if (e.key === "Enter") addLector(); }} />
            <button onClick={addLector} className="btn-primary" style={{ width: "auto", padding: "8px 16px" }}>+</button>
          </div>
          <input value={lectorSearch} onChange={e => setLectorSearch(e.target.value)} placeholder="Search..." className="inp mt8" />
          <div className="lector-list">
            {appData.lectors.filter(l => l.toLowerCase().includes(lectorSearch.toLowerCase())).map(l => (
              <div key={l} className="lector-item"><span>{l}</span><button onClick={() => removeLector(l)} className="btn-del">✕</button></div>
            ))}
          </div>
          <p className="hint mt8">Total: {appData.lectors.length}</p>
        </div>
      )}

      {/* ═══ COLUMNS ═══ */}
      {tab === "columns" && isAdmin && (
        <div className="panel">
          <h3 className="panel-title">Columns</h3>
          <div className="col-list">
            {cols.map(c => (
              <div key={c.id} className="col-item">
                <div style={{ width: 14, height: 14, borderRadius: 4, background: c.color, flexShrink: 0 }} />
                <input value={c.label} onChange={e => updateColumn(c.id, "label", e.target.value)} className="inp-col" />
                <input type="color" value={c.color} onChange={e => updateColumn(c.id, "color", e.target.value)} style={{ width: 28, height: 24, border: "none", cursor: "pointer" }} />
                <button onClick={() => moveColumn(c.id, -1)} className="btn-xs">◀</button>
                <button onClick={() => moveColumn(c.id, 1)} className="btn-xs">▶</button>
                <button onClick={() => removeColumn(c.id)} className="btn-xs" style={{ color: "#c0392b" }}>✕</button>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <input value={newColLabel} onChange={e => setNewColLabel(e.target.value)} placeholder="Name..." className="inp" style={{ flex: 1 }} />
            <input type="color" value={newColColor} onChange={e => setNewColColor(e.target.value)} style={{ width: 28, height: 30, border: "none" }} />
            <button onClick={addColumn} className="btn-primary" style={{ width: "auto", padding: "8px 14px" }}>+</button>
          </div>
          <button className="btn-sm mt8" onClick={async () => { await save({ ...appData, columns: [...appData.columns, { id: uid(), label: "Familia Sponsor", color: "#8B4513" }] }); showToast("Added!"); }}>+ Familia Sponsor</button>
        </div>
      )}

      {/* ═══ SETTINGS ═══ */}
      {tab === "settings" && isAdmin && (
        <div className="panel">
          <h3 className="panel-title">Settings</h3>
          <label className="lbl">Parish Name</label>
          <input value={appData.settings.parishName} onChange={e => updateSetting("parishName", e.target.value)} className="inp" />
          <label className="lbl mt12">Prepared By</label>
          <input value={appData.settings.preparedBy} onChange={e => updateSetting("preparedBy", e.target.value)} className="inp" />
          <label className="lbl mt12">Approved By</label>
          <input value={appData.settings.approvedBy} onChange={e => updateSetting("approvedBy", e.target.value)} className="inp" />
          <label className="lbl mt12">Member Code</label>
          <input value={appData.settings.memberCode} onChange={e => updateSetting("memberCode", e.target.value)} className="inp" />
          <p className="hint mt8">Share this code with lectors for view access.</p>

          {/* Change PIN */}
          <div className="security-section mt16">
            <h4 style={{ fontFamily: "var(--fd)", fontSize: 15, color: "var(--maroon)", marginBottom: 8 }}>🔒 Security</h4>
            {!showChangePin ? (
              <button className="btn-sm" onClick={() => setShowChangePin(true)}>Change Admin PIN</button>
            ) : (
              <div className="change-pin-box">
                <input type="password" placeholder="New PIN (min 4 digits)" value={changePin} onChange={e => setChangePin(e.target.value.replace(/\D/g, ""))} className="inp" maxLength={8} />
                <input type="password" placeholder="Confirm new PIN" value={changePinConfirm} onChange={e => setChangePinConfirm(e.target.value.replace(/\D/g, ""))} className="inp mt8" maxLength={8} />
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button className="btn-primary" style={{ flex: 1 }} onClick={handleChangePin}>Save New PIN</button>
                  <button className="btn-sm" onClick={() => { setShowChangePin(false); setChangePin(""); setChangePinConfirm(""); }}>Cancel</button>
                </div>
              </div>
            )}
          </div>

          <div className="tips mt16">
            <b>💡 Tips:</b> Double-click any date/day/time to edit text. Tap a lector cell to assign. Use +/− buttons on each row. Use format bar for bold, size, colors.
          </div>
        </div>
      )}
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');
:root {
  --fd: 'Crimson Pro', Georgia, serif;
  --fb: 'DM Sans', system-ui, sans-serif;
  --maroon: #6B2737; --gold: #B8860B; --gold-l: #FFF8E7;
  --ivory: #FAF7F2; --surface: #fff; --text: #2C1810; --text-m: #8B7355;
  --border: #E8DFD0; --row-alt: #FDFAF5; --sunday: #FFF5E6;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
.app-root { font-family: var(--fb); background: var(--ivory); color: var(--text); min-height: 100vh; max-width: 1100px; margin: 0 auto; padding: 0 8px 32px; }

/* Auth bar */
.auth-bar { display: flex; align-items: center; gap: 6px; padding: 8px 0; border-bottom: 1.5px solid var(--border); margin-bottom: 6px; flex-wrap: wrap; }
.badge { padding: 2px 8px; border-radius: 10px; font-size: 9px; font-weight: 700; letter-spacing: .8px; }
.admin-b { background: var(--maroon); color: #fff; }
.member-b { background: #2E7D32; color: #fff; }
.login-area { display: flex; gap: 4px; align-items: center; flex-wrap: wrap; }
.login-tabs { display: flex; gap: 1px; }
.ltab { padding: 3px 8px; border: 1px solid var(--border); background: var(--surface); border-radius: 5px 5px 0 0; cursor: pointer; font-size: 10px; color: var(--text-m); font-family: var(--fb); }
.ltab-on { background: var(--gold-l); color: var(--maroon); font-weight: 600; }
.login-row { display: flex; gap: 4px; align-items: center; }
.tabs-inline { display: flex; gap: 2px; margin-left: auto; }
.tab { padding: 5px 10px; border: none; background: transparent; cursor: pointer; font-size: 14px; border-radius: 6px; }
.tab:hover { background: var(--gold-l); }
.tab-on { background: var(--gold-l); }

/* Schedule header */
.sched-header { text-align: center; padding: 10px 0 6px; }
.sh-parish { font-family: var(--fd); font-size: 18px; font-weight: 700; color: var(--maroon); }
.sh-month { font-size: 12px; color: var(--text); font-weight: 500; margin-top: 2px; }

/* Schedule footer */
.sched-footer { display: flex; justify-content: space-between; padding: 24px 8px 8px; margin-top: 12px; border-top: 1px solid var(--border); }
.sf-label { font-size: 11px; color: var(--text-m); }
.sf-name { font-size: 13px; font-weight: 600; margin-top: 2px; }
.sf-role { font-size: 10px; color: var(--text-m); font-style: italic; }

.setup-card { background: var(--surface); padding: 32px; border-radius: 16px; max-width: 340px; width: 100%; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,.07); position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); }
.setup-title { font-family: var(--fd); font-size: 20px; color: var(--maroon); margin-bottom: 2px; }
.setup-sub { font-size: 12px; color: var(--text-m); margin-bottom: 16px; }

.inp { width: 100%; padding: 8px 10px; border: 1.5px solid var(--border); border-radius: 8px; font-family: var(--fb); font-size: 14px; outline: none; background: var(--surface); color: var(--text); }
.inp:focus { border-color: var(--gold); }
.inp-sm { padding: 4px 8px; border: 1.5px solid var(--border); border-radius: 6px; font-family: var(--fb); font-size: 12px; outline: none; background: var(--surface); color: var(--text); width: 70px; }
.inp-col { flex: 1; background: transparent; border: none; border-bottom: 1.5px solid var(--border); color: var(--text); font-family: var(--fb); font-size: 13px; outline: none; padding: 2px 4px; }
.mt8 { margin-top: 8px; } .mt12 { margin-top: 12px; } .mt16 { margin-top: 16px; }

.btn-primary { width: 100%; padding: 10px; border: none; border-radius: 8px; background: var(--maroon); color: #fff; font-family: var(--fb); font-size: 14px; font-weight: 600; cursor: pointer; }
.btn-sm { padding: 4px 10px; border: 1.5px solid var(--border); border-radius: 6px; background: var(--surface); cursor: pointer; font-family: var(--fb); font-size: 11px; font-weight: 500; color: var(--text); }
.btn-sm:hover { background: var(--gold-l); }
.btn-icon { width: 28px; height: 28px; border: 1.5px solid var(--border); border-radius: 6px; background: var(--surface); cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center; }
.btn-xs { padding: 2px 6px; border: 1px solid rgba(0,0,0,.12); border-radius: 4px; background: transparent; cursor: pointer; font-size: 11px; font-family: var(--fb); }
.btn-del { background: none; border: none; color: #c0392b; cursor: pointer; font-size: 15px; }
.sel { padding: 4px 6px; border: 1.5px solid var(--border); border-radius: 6px; font-family: var(--fb); font-size: 12px; background: var(--surface); color: var(--text); cursor: pointer; }
.month-nav { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; flex-wrap: wrap; }
.btn-publish { padding: 5px 14px; border: none; border-radius: 6px; background: #27ae60; color: #fff; cursor: pointer; font-family: var(--fb); font-size: 12px; font-weight: 600; animation: pulse 1.5s infinite; }
.btn-publish:hover { background: #219a52; }
.btn-republish { padding: 5px 14px; border: 1.5px solid #27ae60; border-radius: 6px; background: var(--surface); color: #27ae60; cursor: pointer; font-family: var(--fb); font-size: 12px; font-weight: 600; }
.btn-republish:hover { background: #e8f8f0; }
@keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(39,174,96,.4); } 50% { box-shadow: 0 0 0 6px rgba(39,174,96,0); } }
.pub-status { font-size: 10px; color: #27ae60; font-weight: 500; }
.draft-bar { padding: 8px 12px; background: #FFF5E6; border: 1.5px solid var(--gold); border-radius: 8px; font-size: 12px; color: var(--text); margin-bottom: 8px; }

/* Format bar */
.fmt-bar { display: flex; align-items: center; gap: 4px; padding: 6px 8px; background: var(--surface); border: 1.5px solid var(--gold); border-radius: 8px; margin-bottom: 6px; flex-wrap: wrap; }
.fmt-btn { padding: 4px 8px; border: 1.5px solid var(--border); border-radius: 5px; background: var(--surface); cursor: pointer; font-family: var(--fb); font-size: 12px; }
.fmt-on { background: var(--gold-l) !important; border-color: var(--gold) !important; font-weight: 700; }
.fmt-sel { padding: 2px 4px; border: 1.5px solid var(--border); border-radius: 5px; font-size: 11px; cursor: pointer; }
.fmt-cw { display: flex; align-items: center; cursor: pointer; position: relative; border: 1.5px solid var(--border); border-radius: 5px; padding: 3px 6px; background: var(--surface); }
.fmt-ci { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }

/* Table */
.table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); }
.st { width: 100%; border-collapse: collapse; font-size: 12px; }
.st th { padding: 6px 4px; text-align: left; font-size: 9px; font-weight: 700; letter-spacing: .3px; text-transform: uppercase; position: sticky; top: 0; z-index: 2; }
.th-f { background: var(--maroon); color: #fff; }
.th-date { width: 34px; text-align: center; }
.th-day { min-width: 70px; }
.th-time { width: 52px; }
.th-col { min-width: 85px; }
.th-act { width: 70px; text-align: center; }

.mass-row td { border-bottom: 1px solid var(--border); }
.mass-row:nth-child(even) { background: var(--row-alt); }
.mass-row.sunday { background: var(--sunday); }

.td-date { padding: 3px 2px; text-align: center; font-weight: 700; font-size: 14px; color: #4A1A26; vertical-align: middle; }
.td-day { padding: 3px 4px; font-weight: 500; font-size: 11.5px; vertical-align: middle; }
.td-time { padding: 3px 4px; font-weight: 500; font-size: 11.5px; vertical-align: middle; }
.td-cell { padding: 3px 4px; position: relative; cursor: pointer; min-width: 80px; vertical-align: middle; font-size: 11.5px; }
.td-cell:hover { background: rgba(184,134,11,.06); }
.td-editing { background: var(--gold-l) !important; }
.ph { color: #ccc; font-style: italic; font-size: 10px; }

/* Action buttons column */
.td-act { padding: 2px; text-align: center; vertical-align: middle; white-space: nowrap; }
.act-btn { width: 22px; height: 22px; border: 1px solid var(--border); border-radius: 5px; cursor: pointer; font-size: 14px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; margin: 0 1px; background: var(--surface); font-family: var(--fb); }
.act-add { color: #27ae60; border-color: #27ae60; }
.act-add:hover { background: #e8f8f0; }
.act-del { color: #c0392b; border-color: #c0392b; }
.act-del:hover { background: #fde8e8; }
.act-evt { color: #4a0080; border-color: #4a0080; font-size: 11px; }
.act-evt:hover { background: #f0e6ff; }

/* Add bar */
.add-bar { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
.btn-add { padding: 8px 14px; border: 1.5px dashed var(--border); border-radius: 8px; background: var(--surface); cursor: pointer; font-family: var(--fb); font-size: 12px; font-weight: 500; color: var(--text-m); }
.btn-add:hover { background: var(--gold-l); border-color: var(--gold); }
.btn-add-b { color: #4a0080; border-color: #4a0080; }
.btn-add-e { color: var(--maroon); border-color: var(--maroon); }

.banner-row td { border-bottom: 1px solid var(--border); }
.banner-cell { padding: 7px 10px; text-align: center; font-family: var(--fd); letter-spacing: .3px; cursor: pointer; position: relative; }
.banner-drag { position: absolute; left: 8px; top: 50%; transform: translateY(-50%); opacity: 0.5; cursor: grab; font-size: 12px; }
.banner-del { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,.25); border: 1px solid rgba(255,255,255,.4); color: inherit; border-radius: 4px; cursor: pointer; font-size: 11px; padding: 1px 5px; opacity: 0.7; }
.banner-del:hover { opacity: 1; background: rgba(255,255,255,.4); }
.login-tabs-full { display: flex; gap: 0; margin-bottom: 4px; }
.ltab-f { flex: 1; padding: 8px; border: 1.5px solid var(--border); background: var(--surface); cursor: pointer; font-family: var(--fb); font-size: 13px; color: var(--text-m); }
.ltab-f:first-child { border-radius: 8px 0 0 8px; }
.ltab-f:last-child { border-radius: 0 8px 8px 0; }
.ltab-f-on { background: var(--gold-l); color: var(--maroon); font-weight: 600; border-color: var(--gold); }
tr[draggable="true"] { cursor: grab; }
tr[draggable="true"]:active { cursor: grabbing; }

.picker { position: absolute; top: 100%; left: 0; z-index: 50; background: var(--surface); border: 2px solid var(--gold); border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,.16); min-width: 180px; max-height: 240px; overflow: hidden; }
.picker-input { width: 100%; padding: 6px 8px; border: none; border-bottom: 1px solid var(--border); outline: none; font-family: var(--fb); font-size: 12px; }
.picker-list { max-height: 190px; overflow-y: auto; }
.picker-item { padding: 6px 8px; cursor: pointer; font-size: 12px; }
.picker-item:hover { background: var(--gold-l); }
.picker-item.active { background: var(--gold-l); font-weight: 600; }
.picker-clear { color: #999; border-bottom: 1px solid var(--border); }
.picker-empty { padding: 8px; color: #999; font-size: 11px; }

.overlay { position: fixed; inset: 0; background: rgba(0,0,0,.3); display: flex; align-items: center; justify-content: center; z-index: 300; padding: 12px; }
.modal { background: var(--surface); border-radius: 14px; padding: 20px; max-width: 400px; width: 100%; max-height: 80vh; overflow-y: auto; box-shadow: 0 8px 30px rgba(0,0,0,.12); }
.modal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.modal-title { font-family: var(--fd); font-size: 17px; color: var(--maroon); }
.tpl-list { display: flex; flex-direction: column; gap: 5px; }
.tpl-btn { padding: 10px 14px; border: 1.5px solid var(--border); border-radius: 8px; background: var(--surface); cursor: pointer; font-family: var(--fb); font-size: 13px; text-align: left; }
.tpl-btn:hover { background: var(--gold-l); border-color: var(--gold); }

.panel { max-width: 480px; }
.panel-title { font-family: var(--fd); font-size: 17px; color: var(--maroon); margin-bottom: 12px; }
.lector-list { display: flex; flex-direction: column; gap: 3px; margin-top: 8px; }
.lector-item { display: flex; justify-content: space-between; align-items: center; padding: 7px 10px; background: var(--surface); border-radius: 7px; border: 1px solid var(--border); font-size: 13px; }
.col-list { display: flex; flex-direction: column; gap: 5px; }
.col-item { display: flex; align-items: center; gap: 5px; padding: 6px 8px; background: var(--surface); border: 1px solid var(--border); border-radius: 7px; }
.hint { color: var(--text-m); font-size: 12px; }
.hint-bar { text-align: center; padding: 10px; font-size: 12px; color: var(--text-m); }
.lbl { display: block; font-size: 10px; font-weight: 600; color: var(--text-m); text-transform: uppercase; letter-spacing: .4px; margin-bottom: 2px; }
.tips { background: var(--gold-l); border-radius: 8px; padding: 12px; font-size: 12px; }
.forgot-link { display: block; background: none; border: none; color: var(--maroon); font-size: 12px; cursor: pointer; margin-top: 8px; text-decoration: underline; font-family: var(--fb); text-align: center; width: 100%; }
.forgot-box { margin-top: 12px; padding: 14px; background: #FFF5E6; border-radius: 10px; border: 1.5px solid var(--gold); }
.security-section { padding: 14px; background: var(--surface); border: 1.5px solid var(--border); border-radius: 10px; }
.change-pin-box { margin-top: 8px; }

.toast { position: fixed; top: 10px; right: 10px; padding: 8px 16px; border-radius: 8px; color: #fff; font-size: 12px; font-weight: 500; z-index: 2000; background: #27ae60; box-shadow: 0 3px 10px rgba(0,0,0,.12); animation: ti .2s; }
.toast-err { background: #c0392b; }
@keyframes ti { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }

@media print {
  .no-print { display: none !important; }
  .app-root { padding: 0; max-width: 100%; }
  .auth-bar { display: none !important; }
  .sched-header { padding: 4px 0; }
  .sh-parish { font-size: 16px; }
  .sh-month { font-size: 11px; }
  .sched-footer { padding-top: 30px; }
  .table-wrap { border: none; border-radius: 0; overflow: visible; }
  .st { font-size: 9px; }
  .st th { padding: 2px 2px; font-size: 7.5px; position: static; }
  .st td { padding: 2px; }
  .th-act, .td-act { display: none !important; }
  .ph { display: none; }
  .banner-cell { padding: 3px 6px; font-size: 10px; }
  .td-date { font-size: 10px; }
  .add-bar { display: none !important; }
  .hint-bar { display: none; }
  body { background: white !important; }
  .toast { display: none !important; }
  .fmt-bar { display: none !important; }
}
@media (max-width: 640px) {
  .sh-parish { font-size: 15px; }
  .st { font-size: 11px; }
  .st th { font-size: 8px; }
  .td-cell { min-width: 70px; }
  .act-btn { width: 20px; height: 20px; font-size: 12px; }
}
`;
