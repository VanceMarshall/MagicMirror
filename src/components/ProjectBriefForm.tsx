// filepath: src/components/ProjectBriefForm.tsx
"use client";

import { useState } from "react";

export default function ProjectBriefForm({ projectId, initialBrief }: { projectId: string, initialBrief: any }) {
  const [busy, setBusy] = useState(false);
  const [brief, setBrief] = useState({
    businessType: initialBrief?.businessType || "ECOMMERCE",
    niche: initialBrief?.niche || "",
    buyerType: initialBrief?.buyerType || "OPERATOR",
    angle: initialBrief?.angle || "CASHFLOW"
  });

  async function save() {
    setBusy(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/brief`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(brief)
      });
      if (!res.ok) alert("Failed to save strategy");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-bold uppercase text-gray-500">Business Type</label>
        <select 
          className="mt-1 w-full rounded border p-2"
          value={brief.businessType}
          onChange={e => setBrief({...brief, businessType: e.target.value})}
        >
          <option value="ECOMMERCE">Ecommerce Store</option>
          <option value="SERVICE">Service Business</option>
        </select>
      </div>
      <div>
        <label className="text-xs font-bold uppercase text-gray-500">Niche / Industry</label>
        <input 
          className="mt-1 w-full rounded border p-2" 
          placeholder="e.g. Tactical Gear, HVAC, Beauty" 
          value={brief.niche}
          onChange={e => setBrief({...brief, niche: e.target.value})}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold uppercase text-gray-500">Target Buyer</label>
          <select 
            className="mt-1 w-full rounded border p-2"
            value={brief.buyerType}
            onChange={e => setBrief({...brief, buyerType: e.target.value})}
          >
            <option value="OPERATOR">Owner-Operator</option>
            <option value="INVESTOR">Passive Investor</option>
            <option value="STRATEGIC">Strategic Competitor</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-bold uppercase text-gray-500">Marketing Angle</label>
          <select 
            className="mt-1 w-full rounded border p-2"
            value={brief.angle}
            onChange={e => setBrief({...brief, angle: e.target.value})}
          >
            <option value="CASHFLOW">Strong Cashflow</option>
            <option value="LIFESTYLE">Work from Home</option>
            <option value="GROWTH">Huge Growth Potential</option>
          </select>
        </div>
      </div>
      <button 
        onClick={save} 
        disabled={busy}
        className="w-full rounded bg-gray-100 py-2 text-sm font-semibold hover:bg-gray-200 disabled:opacity-50"
      >
        {busy ? "Saving..." : "Save Strategy"}
      </button>
    </div>
  );
}
