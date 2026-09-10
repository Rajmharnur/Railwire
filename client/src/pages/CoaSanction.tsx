import { useState } from "react";
import { RailLayout, Pill } from "@/components/RailLayout";
import {
  CheckCircle2,
  Copy,
  Download,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Printer,
  QrCode,
  Shield,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import type { CoaSanctionSheet } from "@shared/railblockTypes";

const SAMPLE_MEMO: CoaSanctionSheet = {
  sanctionNumber: "IR/NCR/OP-BLK/2026/894102",
  sanctionDate: "10 Sep 2026",
  controlOffice: "Delhi–Palwal Section Control, Divisional Rail Office, Delhi / Agra",
  division: "Delhi / Agra (Northern / North Central Railway)",
  corridorCode: "C-01",
  corridorName: "New Delhi – Palwal (Corridor C-1 Double Line Electrified BG)",
  blockType: "INTEGRATED_SHADOW",
  participatingDepartments: [
    {
      dept: "TRD",
      supervisor: "SSE / Traction / Mathura (S. Khan)",
      contactNumber: "+91 97176 99108",
      workDescription: "TRD-101: OHE contact wire renewal & tensioning (25kV Catenary Isolated)",
      kmSpan: "KM 142.000 to 144.500 (Up Line)",
      overheadPowerCutRequired: true,
      tractionMachineryUsed: "Diesel Tower Wagon TW-410 (Self-propelled diesel)",
    },
    {
      dept: "P-WAY",
      supervisor: "SSE / P-Way / Palwal (A. Prakash)",
      contactNumber: "+91 97176 43012",
      workDescription: "PW-302: Manual sleeper packing & track alignment (Safe co-utilization)",
      kmSpan: "KM 143.100 to 143.800 (Up Line)",
      overheadPowerCutRequired: false,
      tractionMachineryUsed: "Manual Gang (e_i = 0, power-safe under isolated OHE)",
    },
    {
      dept: "S&T",
      supervisor: "SSE / Signal / Mathura (R. Menon)",
      contactNumber: "+91 97176 88204",
      workDescription: "ST-204: Point machine motor replacement (Facing Point 102A)",
      kmSpan: "KM 144.000 (Point 102A)",
      overheadPowerCutRequired: false,
      tractionMachineryUsed: "Manual Signal Technicians (Dispatched post advance PO arrival)",
    },
  ],
  grantedWindow: {
    startTime: "09:30 IST",
    endTime: "13:00 IST",
    totalDurationMinutes: 210,
  },
  trafficPrecautionConditions: [
    "Traction power supply 25kV isolated on Up Line with certified earth-pole discharge grounding confirmed by TRD supervisor before P-Way gang entry.",
    "PW-305 Heavy Electric Track Tamper strictly deferred from de-energized block window B-1 to avoid electrical flashover. Rerouted to alternative energized window post 06:40 IST.",
    "Caution Order of 30 km/h on adjacent Down Line during maintenance work as per General & Subsidiary Rules (G&SR) Rule 15.09.",
    "Container Goods Train BOXN-42 delayed by +75 mins accommodated downline without perturbation to Gatimaan Express #12056 or Mumbai Rajdhani #12952.",
    "Station Masters Palwal & Mathura Jn shall ensure slot interlocking revocation locked until joint clearing memo signed by SSE/TRD, SSE/P-Way, and SSE/Signal.",
  ],
  authorizedBy: "A. Krishnan",
  chiefControllerDesignation: "Chief Traffic Controller (CTC-1), Central Operations Control, Delhi",
  digitalSignatureHash: "SHA256:7FA89E01CB3299AF28D34B876C120489AA3401B",
  iPasRequisitionRef: "iPAS-PO-REQ-NCR-2026-9041",
};

export default function CoaSanction() {
  const [memo, setMemo] = useState<CoaSanctionSheet>(SAMPLE_MEMO);

  const handlePrint = () => {
    window.print();
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(memo, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `IR_COA_SanctionMemo_${memo.sanctionNumber.replace(/\//g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("COA JSON memo exported");
  };

  const handleExportCsv = () => {
    let csv = `Sanction Number,${memo.sanctionNumber}\nDate,${memo.sanctionDate}\nCorridor,${memo.corridorCode} - ${memo.corridorName}\nBlock Type,${memo.blockType}\nWindow,${memo.grantedWindow.startTime} to ${memo.grantedWindow.endTime} (${memo.grantedWindow.totalDurationMinutes} mins)\n\n`;
    csv += "Department,Supervisor,Contact,Work Description,KM Span,Power Cut\n";
    for (const d of memo.participatingDepartments) {
      csv += `"${d.dept}","${d.supervisor}","${d.contactNumber}","${d.workDescription}","${d.kmSpan}","${d.overheadPowerCutRequired ? "YES" : "NO"}"\n`;
    }
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `IR_COA_SanctionMemo_${memo.sanctionNumber.replace(/\//g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("COA CSV memo exported");
  };

  return (
    <RailLayout
      currentBreadcrumb="COA Sanction Memo"
      pageTitle="Indian Railways COA / ICMS Block Sanction Memo"
      pageSubtitle="Official Control Office Application (COA) multi-department shadow block authorization."
      actions={
        <div className="flex items-center gap-2">
          <button type="button" className="secondary-button" onClick={handleExportCsv}>
            <FileSpreadsheet size={15} /> Export CSV
          </button>
          <button type="button" className="secondary-button" onClick={handleExportJson}>
            <Download size={15} /> Export COA JSON
          </button>
          <button type="button" className="primary-button" onClick={handlePrint}>
            <Printer size={15} /> Print Authorization Memo
          </button>
        </div>
      }
    >
      {/* Official Indian Railways Block Memo Card */}
      <div className="max-w-4xl mx-auto bg-[#0e1619] border-2 border-[#2b3d45] rounded-xl p-8 shadow-2xl text-[#e7eef0] relative overflow-hidden print:border-black print:text-black print:bg-white">
        {/* Header Strip */}
        <div className="border-b-2 border-[#385058] pb-6 mb-6 flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono tracking-widest text-[#9bbe37] uppercase font-bold">
              GOVERNMENT OF INDIA · MINISTRY OF RAILWAYS
            </span>
            <h1 className="text-xl font-extrabold tracking-tight text-[#f0f6f5]">
              NORTH CENTRAL RAILWAY · DIVISIONAL CONTROL OFFICE
            </h1>
            <p className="text-xs text-[#93a4aa]">
              Control Office Application (COA) · Integrated Multi-Department Block Sanction Order
            </p>
          </div>

          <div className="text-right font-mono text-xs">
            <div className="bg-[#18262b] px-3 py-1.5 rounded border border-[#2b3d45] inline-block">
              <span className="text-[#718188] block text-[9px] uppercase">SANCTION ORDER NO.</span>
              <strong className="text-[#b9f227] text-sm">{memo.sanctionNumber}</strong>
            </div>
            <div className="text-[#718188] text-[10px] mt-1">Date: {memo.sanctionDate}</div>
          </div>
        </div>

        {/* Corridor & Window Details */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 rounded-lg bg-[#111c20] border border-[#233339] mb-6 font-mono text-xs">
          <div>
            <span className="text-[#718188] text-[10px] block uppercase">CORRIDOR / SECTION</span>
            <strong className="text-[#e7eef0]">{memo.corridorCode}</strong>
            <p className="text-[11px] text-[#93a4aa]">{memo.corridorName}</p>
          </div>
          <div>
            <span className="text-[#718188] text-[10px] block uppercase">BLOCK TYPE</span>
            <strong className="text-[#b9f227]">{memo.blockType}</strong>
            <p className="text-[11px] text-[#93a4aa]">Shadow Co-utilization</p>
          </div>
          <div>
            <span className="text-[#718188] text-[10px] block uppercase">SANCTIONED WINDOW</span>
            <strong className="text-[#e7eef0]">
              {memo.grantedWindow.startTime} – {memo.grantedWindow.endTime}
            </strong>
            <p className="text-[11px] text-[#93a4aa]">{memo.grantedWindow.totalDurationMinutes} Minutes</p>
          </div>
          <div>
            <span className="text-[#718188] text-[10px] block uppercase">TRAFFIC IMPACT</span>
            <strong className="text-[#6ee7f9]">Zero Express Delay</strong>
            <p className="text-[11px] text-[#93a4aa]">Gatimaan & Rajdhani Clear</p>
          </div>
          <div>
            <span className="text-[#718188] text-[10px] block uppercase">iPAS PROCUREMENT</span>
            <strong className="text-[#f3b454] font-mono">{memo.iPasRequisitionRef ?? "iPAS-REQ-NCR-2026-9041"}</strong>
            <p className="text-[11px] text-[#93a4aa]">Vendor PO Fulfilled</p>
          </div>
        </div>

        {/* Participating Departments Table */}
        <div className="mb-6">
          <h3 className="text-xs font-mono uppercase tracking-wider text-[#9bbe37] font-bold mb-3 flex items-center gap-2">
            <FileCheck size={14} /> PARTICIPATING DEPARTMENTS & SECTION SUPERVISORS
          </h3>
          <div className="border border-[#233339] rounded-lg overflow-hidden font-mono text-xs">
            <table className="w-full text-left">
              <thead className="bg-[#142025] text-[#718188] text-[10px] uppercase border-b border-[#233339]">
                <tr>
                  <th className="p-3">Department</th>
                  <th className="p-3">Supervisor In-Charge</th>
                  <th className="p-3">Scope of Maintenance</th>
                  <th className="p-3">Machinery / Gang</th>
                  <th className="p-3">Kilometer Span</th>
                  <th className="p-3 text-center">OHE Power Cut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#202d33]">
                {memo.participatingDepartments.map((d, i) => (
                  <tr key={i} className="hover:bg-[#152328]">
                    <td className="p-3 font-bold">
                      <span
                        className="px-2 py-0.5 rounded text-[10px]"
                        style={{
                          background:
                            d.dept === "P-WAY"
                              ? "#b9f22722"
                              : d.dept === "S&T"
                                ? "#6ee7f922"
                                : "#f3b45422",
                          color:
                            d.dept === "P-WAY"
                              ? "#b9f227"
                              : d.dept === "S&T"
                                ? "#6ee7f9"
                                : "#f3b454",
                        }}
                      >
                        {d.dept}
                      </span>
                    </td>
                    <td className="p-3">
                      <strong className="text-[#e7eef0] block">{d.supervisor}</strong>
                      <span className="text-[#718188] text-[10px]">{d.contactNumber}</span>
                    </td>
                    <td className="p-3 text-[#c9d5d8]">{d.workDescription}</td>
                    <td className="p-3 text-[#b9f227] text-[11px]">{d.tractionMachineryUsed ?? "Manual Team"}</td>
                    <td className="p-3 text-[#93a4aa]">{d.kmSpan}</td>
                    <td className="p-3 text-center">
                      {d.overheadPowerCutRequired ? (
                        <span className="px-2 py-0.5 rounded bg-[#f3b454]/10 text-[#f3b454] border border-[#f3b454]/30 text-[10px] font-bold">
                          25kV ISOLATED
                        </span>
                      ) : (
                        <span className="text-[#718188] text-[10px]">POWER SAFE</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Traffic Precautions & Safety Rules */}
        <div className="mb-6 p-4 rounded-lg bg-[#11191c] border border-[#233339]">
          <h3 className="text-xs font-mono uppercase tracking-wider text-[#ff6b6b] font-bold mb-2 flex items-center gap-2">
            <Shield size={14} /> MANDATORY TRAFFIC PRECAUTIONS (G&SR RULES)
          </h3>
          <ul className="space-y-1.5 text-xs text-[#93a4aa] list-disc pl-5">
            {memo.trafficPrecautionConditions.map((cond, i) => (
              <li key={i}>{cond}</li>
            ))}
          </ul>
        </div>

        {/* Digital Signature & Authorization Footer */}
        <div className="pt-4 border-t-2 border-[#233339] flex items-center justify-between text-xs font-mono">
          <div className="space-y-1">
            <span className="text-[#718188] text-[10px] block uppercase">DIGITAL AUTHORIZATION SIGNATURE</span>
            <strong className="text-[#e7eef0] text-sm block">{memo.authorizedBy}</strong>
            <p className="text-[11px] text-[#718188]">{memo.chiefControllerDesignation}</p>
            <div className="text-[9px] text-[#b9f227] tracking-wider pt-1">{memo.digitalSignatureHash}</div>
          </div>

          <div className="p-3 rounded bg-[#162328] border border-[#26373e] flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded p-1 flex items-center justify-center">
              <QrCode size={40} className="text-black" />
            </div>
            <div className="text-[10px] text-[#718188]">
              <span className="block text-[#e7eef0] font-bold">COA LIVE VERIFIED</span>
              <span>Scan to verify sanction with Divisional Server</span>
            </div>
          </div>
        </div>
      </div>
    </RailLayout>
  );
}
