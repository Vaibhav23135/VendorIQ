'use client';

import React, { useState, useEffect } from 'react';
import { useTheme, useWidgetState, useWidgetSDK } from '@nitrostack/widgets';
import {
  Sliders,
  Check,
  AlertTriangle,
  Calendar,
  DollarSign,
  Package,
  Shield,
  FileText,
  ArrowRight,
  TrendingDown,
  Info,
  Clock,
  Sparkles,
  CheckCircle2,
  Lock,
  MessageSquare
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface VendorScoreBreakdown {
  vendorId: string;
  name: string;
  category: string;
  imageUrl: string;
  city: string;
  unitPrice: number;
  deliveryDays: number;
  effectiveDeliveryDays: number;
  costScore: number;
  deliveryScore: number;
  qualityScore: number;
  complianceScore: number;
  finalScore: number;
  rank: number;
  dataGaps: string[];
  certifications: string[];
  complianceFlags: string[];
  advisories: string[];
}

interface VendorRankingData {
  intake: {
    item: string;
    category: string;
    quantity: number;
    budgetInr: number;
    deadline: string;
  };
  candidates: VendorScoreBreakdown[];
  topVendorId: string | null;
  scenarioUsed: string;
  weightsApplied: {
    cost: number;
    delivery: number;
    quality: number;
    compliance: number;
  };
  splitOrderSuggestion: {
    suggestion: string;
    vendor1: string;
    vendor2: string;
    qty1: number;
    qty2: number;
  } | null;
  budgetAdvisory: string | null;
  message: string;
}

export default function VendorRankingWidget() {
  const theme = useTheme();
  const { isReady, getToolOutput } = useWidgetSDK();

  // SDK State for selected vendor
  const [sdkState, setSdkState] = useWidgetState<{ selectedVendorId: string | null }>(() => ({
    selectedVendorId: null,
  }));

  const data = getToolOutput<VendorRankingData>();

  // Interactive local states
  const [costWeight, setCostWeight] = useState(35);
  const [deliveryWeight, setDeliveryWeight] = useState(25);
  const [qualityWeight, setQualityWeight] = useState(20);
  const [complianceWeight, setComplianceWeight] = useState(20);
  const [activeScenario, setActiveScenario] = useState('default');

  // Workflow states
  const [activeTab, setActiveTab] = useState<'rankings' | 'negotiation' | 'po'>('rankings');
  const [negoTarget, setNegoTarget] = useState<string>('');
  const [negoStep, setNegoStep] = useState(0);
  const [isNegoRunning, setIsNegoRunning] = useState(false);
  const [negoLog, setNegoLog] = useState<Array<{ round: number; actor: string; offer: number; message: string }>>([]);
  const [settledNego, setSettledNego] = useState<any>(null);
  const [poStatus, setPoStatus] = useState<'draft' | 'approved' | 'shipped' | 'delivered'>('draft');
  const [poId, setPoId] = useState('');

  // Initialise weights from tool output
  useEffect(() => {
    if (data?.weightsApplied) {
      setCostWeight(Math.round(data.weightsApplied.cost * 100));
      setDeliveryWeight(Math.round(data.weightsApplied.delivery * 100));
      setQualityWeight(Math.round(data.weightsApplied.quality * 100));
      setComplianceWeight(Math.round(data.weightsApplied.compliance * 100));
      setActiveScenario(data.scenarioUsed || 'default');
      
      // Suggest realistic negotiation target (90% of list price)
      if (data.candidates && data.candidates.length > 0) {
        const topCandidate = data.candidates[0];
        setNegoTarget(Math.round(topCandidate.unitPrice * 0.9).toString());
      }
    }
  }, [data]);

  if (!isReady || !data) {
    return (
      <div style={{
        padding: '32px',
        textAlign: 'center',
        color: theme === 'dark' ? '#f8fafc' : '#0f172a',
        fontFamily: 'system-ui, sans-serif',
      }}>
        <div style={{ fontSize: '16px', fontWeight: 600 }}>Loading Sourcing Intelligence...</div>
      </div>
    );
  }

  const isDark = theme === 'dark';
  const bgColor = isDark ? '#0f172a' : '#ffffff';
  const cardBg = isDark ? '#1e293b' : '#f8fafc';
  const borderCol = isDark ? '#334155' : '#e2e8f0';
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const mutedText = isDark ? '#94a3b8' : '#64748b';
  const highlightBg = isDark ? '#1e1b4b' : '#e0e7ff';
  const highlightBorder = isDark ? '#4338ca' : '#6366f1';

  const candidates = data.candidates ?? [];
  const intake = data.intake ?? { item: 'Unknown', category: 'Unknown', quantity: 1, budgetInr: 0, deadline: '' };

  // Calculate live normalized weights
  const totalWeight = costWeight + deliveryWeight + qualityWeight + complianceWeight;
  const wCost = totalWeight > 0 ? costWeight / totalWeight : 0.25;
  const wDelivery = totalWeight > 0 ? deliveryWeight / totalWeight : 0.25;
  const wQuality = totalWeight > 0 ? qualityWeight / totalWeight : 0.25;
  const wCompliance = totalWeight > 0 ? complianceWeight / totalWeight : 0.25;

  // Live Recalculation & Re-ranking (Keeps excluded at bottom)
  const evaluatedCandidates = candidates.map((c) => {
    const finalScore = Math.round(
      c.costScore * wCost +
      c.deliveryScore * wDelivery +
      c.qualityScore * wQuality +
      c.complianceScore * wCompliance
    );
    return { ...c, finalScore };
  });

  const activeCandidates = evaluatedCandidates.filter(c => !c.excluded);
  const excludedCandidates = evaluatedCandidates.filter(c => c.excluded);

  activeCandidates.sort((a, b) => b.finalScore - a.finalScore);
  excludedCandidates.sort((a, b) => b.finalScore - a.finalScore);

  const reRankedCandidates = [...activeCandidates, ...excludedCandidates];
  reRankedCandidates.forEach((c, index) => {
    c.rank = index + 1;
  });

  const selectedId = sdkState?.selectedVendorId ?? (reRankedCandidates.find(c => !c.excluded)?.vendorId || reRankedCandidates[0]?.vendorId);
  const selectedVendor = reRankedCandidates.find((c) => c.vendorId === selectedId) ?? reRankedCandidates[0];

  const formatInr = (amount: number) => {
    if (!amount) return '₹0';
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} Lakh`;
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Scenario quick presets
  const applyPreset = (preset: string) => {
    setActiveScenario(preset);
    if (preset === 'urgent') {
      setCostWeight(10); setDeliveryWeight(65); setQualityWeight(15); setComplianceWeight(10);
    } else if (preset === 'budget') {
      setCostWeight(65); setDeliveryWeight(15); setQualityWeight(12); setComplianceWeight(8);
    } else if (preset === 'quality') {
      setCostWeight(10); setDeliveryWeight(15); setQualityWeight(40); setComplianceWeight(35);
    } else {
      setCostWeight(35); setDeliveryWeight(25); setQualityWeight(20); setComplianceWeight(20);
    }
  };

  // Simulation of negotiation logic
  const handleNegotiationStart = () => {
    if (!selectedVendor) return;
    setIsNegoRunning(true);
    setNegoStep(1);
    setNegoLog([]);
    setSettledNego(null);

    const targetPrice = parseInt(negoTarget, 10) || Math.round(selectedVendor.unitPrice * 0.9);
    
    // Round 1
    const baseDiscount = selectedVendor.vendorId.includes('DELL') ? 6 : selectedVendor.vendorId.includes('HP') ? 4 : 3;
    const r1Price = Math.round(selectedVendor.unitPrice * (1 - baseDiscount / 100));
    const round1 = {
      round: 1,
      actor: selectedVendor.name,
      offer: r1Price,
      message: `Initial proposal offered at ₹${r1Price.toLocaleString('en-IN')}/unit (${baseDiscount}% discount off list).`
    };

    setTimeout(() => {
      setNegoLog(prev => [...prev, round1]);
      setNegoStep(2);
      
      // Round 2
      setTimeout(() => {
        const round2 = {
          round: 2,
          actor: 'Buyer (You)',
          offer: targetPrice,
          message: `Counter-proposed at target price of ₹${targetPrice.toLocaleString('en-IN')}/unit.`
        };
        setNegoLog(prev => [...prev, round2]);
        setNegoStep(3);

        // Round 3
        setTimeout(() => {
          // Resolve final settled price
          const gap = r1Price - targetPrice;
          const conceded = Math.round(gap * 0.55); // meet slightly more than halfway
          const finalPrice = Math.max(targetPrice, r1Price - conceded);
          const finalDiscount = Math.round((1 - finalPrice / selectedVendor.unitPrice) * 100 * 10) / 10;
          
          const warrantyMonths = selectedVendor.category === 'Medical' ? 24 : 36;
          const totalAmount = finalPrice * intake.quantity;
          const savings = (selectedVendor.unitPrice - finalPrice) * intake.quantity;

          const round3 = {
            round: 3,
            actor: 'Close',
            offer: finalPrice,
            message: `Deal Settled! Final price negotiated to ₹${finalPrice.toLocaleString('en-IN')}/unit (${finalDiscount}% discount). Agreed to ${warrantyMonths}-month extended warranty.`
          };

          setNegoLog(prev => [...prev, round3]);
          setSettledNego({
            finalPrice,
            finalDiscount,
            warrantyMonths,
            totalAmount,
            savings,
            poId: `PO-${Date.now().toString(36).toUpperCase()}`
          });
          setIsNegoRunning(false);
          setNegoStep(4);
        }, 1500);
      }, 1500);
    }, 1000);
  };

  const handleGeneratePO = () => {
    if (!settledNego) return;
    setPoId(settledNego.poId);
    setPoStatus('draft');
    setActiveTab('po');
  };

  return (
    <div style={{
      background: bgColor,
      color: textColor,
      borderRadius: '16px',
      border: `1px solid ${borderCol}`,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '750px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.12)',
      overflow: 'hidden',
    }}>
      {/* Header Area */}
      <div style={{
        padding: '24px',
        borderBottom: `1px solid ${borderCol}`,
        background: isDark ? 'linear-gradient(to right, #1e1b4b, #0f172a)' : 'linear-gradient(to right, #f5f3ff, #ffffff)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                background: '#4f46e5',
                color: '#fff',
                padding: '3px 8px',
                borderRadius: '8px',
                letterSpacing: '0.05em'
              }}>{intake.category}</span>
              <span style={{ fontSize: '12px', color: mutedText, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={12} style={{ color: '#f59e0b' }} /> Agentic Sourcing
              </span>
            </div>
            <h2 style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em' }}>
              {intake.item}
            </h2>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: mutedText, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Budget</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#10b981' }}>
              {intake.budgetInr ? formatInr(intake.budgetInr) : 'N/A'}
            </div>
            <div style={{ fontSize: '12px', color: mutedText, marginTop: '2px' }}>
              Qty: <strong>{intake.quantity}</strong>
            </div>
          </div>
        </div>

        {/* Dynamic Budget Warning Banner */}
        {data.budgetAdvisory && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2',
            border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2'}`,
            borderRadius: '10px',
            padding: '12px 14px',
            marginTop: '16px',
            fontSize: '12px',
            color: isDark ? '#fca5a5' : '#b91c1c'
          }}>
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <div>{data.budgetAdvisory}</div>
          </div>
        )}
      </div>

      {/* Tabs / Navigation */}
      <div style={{
        display: 'flex',
        borderBottom: `1px solid ${borderCol}`,
        background: isDark ? '#111827' : '#f8fafc',
        padding: '0 12px'
      }}>
        {[
          { id: 'rankings', label: '1. Sourcing Rankings', icon: Sliders },
          { id: 'negotiation', label: '2. Contract Negotiation', icon: MessageSquare, disabled: !selectedVendor },
          { id: 'po', label: '3. Purchase Order', icon: FileText, disabled: !poId }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              disabled={tab.disabled}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 16px',
                border: 'none',
                background: 'none',
                color: isActive ? '#4f46e5' : (tab.disabled ? (isDark ? '#4b5563' : '#cbd5e1') : mutedText),
                fontSize: '13px',
                fontWeight: isActive ? '700' : '500',
                borderBottom: isActive ? '2px solid #4f46e5' : '2px solid transparent',
                cursor: tab.disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                outline: 'none'
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Viewport */}
      <div style={{ padding: '24px' }}>
        
        {/* TAB 1: Sourcing Rankings */}
        {activeTab === 'rankings' && (
          <div>
            {/* Scenario Preset Selection */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: mutedText, marginBottom: '8px', textTransform: 'uppercase' }}>
                Weight Scoring Preset
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { id: 'default', label: 'Balanced', color: '#6366f1' },
                  { id: 'urgent', label: '⚡ Urgent Sourcing', color: '#f59e0b' },
                  { id: 'budget', label: '💰 Budget-First', color: '#10b981' },
                  { id: 'quality', label: '🏆 Quality-Critical', color: '#8b5cf6' }
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => applyPreset(s.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      border: `1px solid ${activeScenario === s.id ? s.color : borderCol}`,
                      background: activeScenario === s.id ? (isDark ? 'rgba(99, 102, 241, 0.15)' : '#e0e7ff') : 'transparent',
                      color: activeScenario === s.id ? s.color : textColor,
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Slider Adjustments Panel */}
            <div style={{
              background: cardBg,
              border: `1px solid ${borderCol}`,
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '16px'
            }}>
              {[
                { label: 'Cost', val: costWeight, set: setCostWeight, color: '#10b981' },
                { label: 'Delivery', val: deliveryWeight, set: setDeliveryWeight, color: '#3b82f6' },
                { label: 'Quality', val: qualityWeight, set: setQualityWeight, color: '#f59e0b' },
                { label: 'Compliance', val: complianceWeight, set: setComplianceWeight, color: '#8b5cf6' }
              ].map((s) => (
                <div key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold' }}>
                    <span>{s.label} Weight</span>
                    <span style={{ color: s.color }}>{s.val}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={s.val}
                    onChange={(e) => {
                      s.set(parseInt(e.target.value, 10));
                      setActiveScenario('custom');
                    }}
                    style={{
                      accentColor: s.color,
                      height: '4px',
                      cursor: 'pointer',
                      background: isDark ? '#334155' : '#cbd5e1',
                      borderRadius: '2px',
                      outline: 'none'
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Main Split Pane */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '20px' }}>
              {/* Left Column: Vendor List */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: mutedText, marginBottom: '10px' }}>
                  Scored Candidates ({reRankedCandidates.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '380px', overflowY: 'auto' }}>
                  {reRankedCandidates.map((c) => {
                    const isSelected = c.vendorId === selectedId;
                    return (
                      <div
                        key={c.vendorId}
                        onClick={() => setSdkState({ selectedVendorId: c.vendorId })}
                        style={{
                          padding: '12px',
                          background: isSelected ? highlightBg : cardBg,
                          border: `1px solid ${isSelected ? highlightBorder : borderCol}`,
                          borderRadius: '10px',
                          cursor: 'pointer',
                          opacity: c.excluded ? 0.5 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: c.excluded ? '#6b7280' : (c.rank === 1 ? '#fbbf24' : '#6366f1'),
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: 'bold',
                          }}>
                            {c.rank}
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '13px' }}>{c.name}</div>
                            <div style={{ fontSize: '10px', color: mutedText }}>{c.city}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          {c.excluded ? (
                            <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: 'bold' }}>EXCLUDED</span>
                          ) : (
                            <>
                              <div style={{ fontSize: '14px', fontWeight: '800', color: '#4f46e5' }}>{c.finalScore}</div>
                              <div style={{ fontSize: '9px', color: mutedText }}>score</div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Selected Vendor Detail */}
              {selectedVendor ? (
                <div style={{
                  background: cardBg,
                  borderRadius: '12px',
                  border: `1px solid ${borderCol}`,
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  {/* Vendor Title Card */}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <img
                      src={selectedVendor.imageUrl}
                      alt={selectedVendor.name}
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '10px',
                        objectFit: 'cover',
                        border: `1px solid ${borderCol}`
                      }}
                    />
                    <div>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>{selectedVendor.name}</h3>
                      <div style={{ fontSize: '11px', color: mutedText }}>
                        Rank #{selectedVendor.rank} • {selectedVendor.city}
                      </div>
                    </div>
                  </div>

                  {selectedVendor.excluded ? (
                    <div style={{
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      fontSize: '11px',
                      color: '#ef4444'
                    }}>
                      <strong>Constraint Violated:</strong> {selectedVendor.excludedReason}
                    </div>
                  ) : (
                    <>
                      {/* Metric Scores */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[
                          { label: 'Cost Dimension', val: selectedVendor.costScore, color: '#10b981' },
                          { label: 'Delivery Speed', val: selectedVendor.deliveryScore, color: '#3b82f6' },
                          { label: 'Quality Score', val: selectedVendor.qualityScore, color: '#f59e0b' },
                          { label: 'Compliance Audit', val: selectedVendor.complianceScore, color: '#8b5cf6' }
                        ].map((bar) => (
                          <div key={bar.label}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '2px', fontWeight: 'bold' }}>
                              <span>{bar.label}</span>
                              <span>{bar.val}/100</span>
                            </div>
                            <div style={{ height: '6px', background: isDark ? '#334155' : '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${bar.val}%`, height: '100%', background: bar.color }} />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Details Box */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '10px',
                        background: isDark ? '#0f172a' : '#ffffff',
                        padding: '12px',
                        borderRadius: '10px',
                        fontSize: '12px',
                        border: `1px solid ${borderCol}`
                      }}>
                        <div>
                          <div style={{ color: mutedText, fontSize: '10px' }}>Unit List Price</div>
                          <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#10b981' }}>
                            {formatInr(selectedVendor.unitPrice)}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: mutedText, fontSize: '10px' }}>Effective Delivery</div>
                          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                            {selectedVendor.effectiveDeliveryDays} Days
                          </div>
                        </div>
                      </div>

                      {/* Specifications Compliance verification */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: mutedText }}>Technical Specifications</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                            <CheckCircle2 size={12} style={{ color: '#10b981' }} />
                            <span>Warranty: {selectedVendor.category === 'Medical' ? '2 Years Standard' : '3 Years On-Site'}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                            <CheckCircle2 size={12} style={{ color: '#10b981' }} />
                            <span>ISO Certification: Valid</span>
                          </div>
                        </div>
                      </div>

                      {/* Advisories list */}
                      {selectedVendor.advisories && selectedVendor.advisories.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {selectedVendor.advisories.map((adv, idx) => (
                            <div key={idx} style={{
                              background: isDark ? 'rgba(245, 158, 11, 0.1)' : '#fffbeb',
                              border: `1px solid ${isDark ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7'}`,
                              borderRadius: '8px',
                              padding: '8px 10px',
                              fontSize: '11px',
                              color: isDark ? '#fbbf24' : '#b45309',
                              display: 'flex',
                              gap: '6px',
                              alignItems: 'center'
                            }}>
                              <Info size={12} style={{ flexShrink: 0 }} />
                              <span>{adv}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* CTA Action to Negotiation */}
                      <button
                        onClick={() => setActiveTab('negotiation')}
                        style={{
                          background: '#4f46e5',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          fontWeight: '600',
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          marginTop: 'auto',
                          transition: 'background 0.2s'
                        }}
                      >
                        Start Agentic Negotiation <ArrowRight size={14} />
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: mutedText }}>
                  Select a candidate to view details
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Negotiation Simulator */}
        {activeTab === 'negotiation' && selectedVendor && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* Negotiation Inputs / Settings */}
              <div style={{ background: cardBg, border: `1px solid ${borderCol}`, borderRadius: '12px', padding: '20px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '800' }}>Negotiate Deal</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: mutedText, marginBottom: '6px' }}>
                      Vendor Name
                    </div>
                    <input
                      type="text"
                      disabled
                      value={selectedVendor.name}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        border: `1px solid ${borderCol}`,
                        background: isDark ? '#111827' : '#ffffff',
                        color: textColor,
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: mutedText, marginBottom: '6px' }}>
                      Target Unit Price (INR)
                    </div>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '10px', color: mutedText }}>₹</span>
                      <input
                        type="number"
                        disabled={isNegoRunning || settledNego}
                        value={negoTarget}
                        onChange={(e) => setNegoTarget(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 10px 10px 24px',
                          borderRadius: '8px',
                          border: `1px solid ${borderCol}`,
                          background: isDark ? '#111827' : '#ffffff',
                          color: textColor,
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '10px', color: mutedText, display: 'block', marginTop: '4px' }}>
                      Standard price is ₹{selectedVendor.unitPrice.toLocaleString('en-IN')}. Suggested target: ₹{Math.round(selectedVendor.unitPrice * 0.9).toLocaleString('en-IN')}.
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button
                      disabled={isNegoRunning || settledNego}
                      onClick={handleNegotiationStart}
                      style={{
                        flex: 1,
                        background: '#10b981',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '12px 14px',
                        fontWeight: '600',
                        fontSize: '13px',
                        cursor: (isNegoRunning || settledNego) ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      {isNegoRunning ? 'Negotiating...' : 'Simulate Negotiation'}
                    </button>

                    {settledNego && (
                      <button
                        onClick={() => {
                          setSettledNego(null);
                          setNegoLog([]);
                          setNegoStep(0);
                        }}
                        style={{
                          padding: '12px',
                          borderRadius: '8px',
                          border: `1px solid ${borderCol}`,
                          background: 'transparent',
                          color: textColor,
                          cursor: 'pointer'
                        }}
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Negotiation Process Timeline */}
              <div style={{ background: cardBg, border: `1px solid ${borderCol}`, borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '800' }}>Negotiation Log</h3>

                {negoLog.length === 0 && !isNegoRunning && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: mutedText, textAlign: 'center' }}>
                    <MessageSquare size={32} style={{ marginBottom: '10px' }} />
                    <span style={{ fontSize: '12px' }}>Click "Simulate Negotiation" to begin dynamic price rounds.</span>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
                  {negoLog.map((log) => (
                    <div key={log.round} style={{
                      display: 'flex',
                      gap: '12px',
                      background: log.round === 3 ? (isDark ? 'rgba(16, 185, 129, 0.1)' : '#ecfdf5') : (isDark ? '#111827' : '#ffffff'),
                      border: `1px solid ${log.round === 3 ? '#10b981' : borderCol}`,
                      borderRadius: '10px',
                      padding: '10px 14px'
                    }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: log.round === 3 ? '#10b981' : '#6366f1',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        flexShrink: 0
                      }}>
                        R{log.round}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '220px' }}>
                          <strong style={{ color: log.round === 3 ? '#10b981' : textColor }}>{log.actor}</strong>
                          <span style={{ fontWeight: 'bold' }}>₹{log.offer.toLocaleString('en-IN')}</span>
                        </div>
                        <div style={{ color: mutedText, fontSize: '11px', marginTop: '2px' }}>{log.message}</div>
                      </div>
                    </div>
                  ))}

                  {/* Typing loader */}
                  {isNegoRunning && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: mutedText, paddingLeft: '32px' }}>
                      <Clock size={12} className="animate-spin" />
                      <span>Round {negoStep} simulation running...</span>
                    </div>
                  )}

                  {/* Settle summary */}
                  {settledNego && (
                    <div style={{
                      marginTop: 'auto',
                      borderTop: `1px dashed ${borderCol}`,
                      paddingTop: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div style={{ background: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5', padding: '10px', borderRadius: '8px', border: '1px solid #10b981' }}>
                          <span style={{ fontSize: '10px', color: mutedText }}>Negotiated Unit Price</span>
                          <div style={{ fontSize: '18px', fontWeight: '800', color: '#10b981' }}>
                            {formatInr(settledNego.finalPrice)}
                          </div>
                        </div>
                        <div style={{ background: isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff', padding: '10px', borderRadius: '8px', border: '1px solid #3b82f6' }}>
                          <span style={{ fontSize: '10px', color: mutedText }}>Total Savings</span>
                          <div style={{ fontSize: '18px', fontWeight: '800', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <TrendingDown size={16} /> {formatInr(settledNego.savings)}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleGeneratePO}
                        style={{
                          background: '#4f46e5',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          fontWeight: '600',
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          marginTop: '6px'
                        }}
                      >
                        Approve Deal & Issue PO <FileText size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Purchase Order */}
        {activeTab === 'po' && settledNego && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Interactive PO Tracker status bar */}
            <div style={{
              background: cardBg,
              border: `1px solid ${borderCol}`,
              borderRadius: '12px',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              {[
                { stage: 'Draft', done: true },
                { stage: 'Negotiated', done: true },
                { stage: 'Approved', done: poStatus !== 'draft' },
                { stage: 'Shipped', done: poStatus === 'shipped' || poStatus === 'delivered' },
                { stage: 'Delivered', done: poStatus === 'delivered' }
              ].map((step, idx) => (
                <React.Fragment key={step.stage}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: step.done ? '#10b981' : (isDark ? '#334155' : '#cbd5e1'),
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px'
                    }}>
                      {step.done ? <Check size={12} /> : idx + 1}
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: step.done ? 'bold' : 'normal', color: step.done ? '#10b981' : mutedText }}>
                      {step.stage}
                    </span>
                  </div>
                  {idx < 4 && (
                    <div style={{
                      flex: 1,
                      height: '2px',
                      background: step.done ? '#10b981' : (isDark ? '#334155' : '#cbd5e1'),
                      margin: '0 8px',
                      marginTop: '-16px'
                    }} />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* PO Layout Receipt */}
            <div style={{
              background: isDark ? '#1e293b' : '#ffffff',
              border: `1px solid ${borderCol}`,
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${borderCol}`, paddingBottom: '16px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>PURCHASE ORDER</h4>
                  <div style={{ fontSize: '11px', color: mutedText, marginTop: '2px' }}>
                    PO ID: <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{poId}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 'bold',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    background: poStatus === 'draft' ? '#f59e0b' : '#10b981',
                    color: '#fff'
                  }}>
                    {poStatus === 'draft' ? 'PENDING APPROVAL' : poStatus.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Vendor & Order Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '12px' }}>
                <div>
                  <div style={{ fontWeight: 'bold', color: mutedText, marginBottom: '6px' }}>VENDOR DETAILS</div>
                  <div><strong>{selectedVendor.name}</strong></div>
                  <div style={{ color: mutedText }}>{selectedVendor.city}</div>
                </div>
                <div>
                  <div style={{ fontWeight: 'bold', color: mutedText, marginBottom: '6px' }}>ORDER DETAIL</div>
                  <div>Item: <strong>{intake.item}</strong></div>
                  <div>Quantity: <strong>{intake.quantity} Units</strong></div>
                  <div>Warranty: <strong>{settledNego?.warrantyMonths || 12} Months</strong></div>
                </div>
              </div>

              {/* Invoice Receipt Row */}
              <div style={{
                background: cardBg,
                padding: '14px',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: `1px solid ${borderCol}`
              }}>
                <div>
                  <span style={{ fontSize: '11px', color: mutedText }}>Unit Negotiated Price</span>
                  <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{formatInr(settledNego?.finalPrice)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', color: mutedText }}>Total Cost</span>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#10b981' }}>
                    {formatInr(settledNego?.totalAmount)}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', borderTop: `1px solid ${borderCol}`, paddingTop: '16px' }}>
                {poStatus === 'draft' && (
                  <button
                    onClick={() => setPoStatus('approved')}
                    style={{
                      background: '#10b981',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      fontWeight: '700',
                      fontSize: '13px',
                      cursor: 'pointer',
                      flex: 1,
                      textAlign: 'center'
                    }}
                  >
                    Approve PO & Send to Vendor
                  </button>
                )}

                {poStatus === 'approved' && (
                  <button
                    onClick={() => setPoStatus('shipped')}
                    style={{
                      background: '#3b82f6',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      fontWeight: '700',
                      fontSize: '13px',
                      cursor: 'pointer',
                      flex: 1,
                      textAlign: 'center'
                    }}
                  >
                    Simulate Vendor Shipment
                  </button>
                )}

                {poStatus === 'shipped' && (
                  <button
                    onClick={() => setPoStatus('delivered')}
                    style={{
                      background: '#8b5cf6',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      fontWeight: '700',
                      fontSize: '13px',
                      cursor: 'pointer',
                      flex: 1,
                      textAlign: 'center'
                    }}
                  >
                    Simulate Shipment Delivery
                  </button>
                )}

                {poStatus === 'delivered' && (
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    color: '#10b981',
                    borderRadius: '8px',
                    padding: '12px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    flex: 1,
                    fontSize: '13px'
                  }}>
                    🎉 PO Successfully Fulfilled & Delivered!
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
