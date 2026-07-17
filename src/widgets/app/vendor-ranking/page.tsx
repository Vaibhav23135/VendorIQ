'use client';

import { useTheme, useWidgetState, useWidgetSDK } from '@nitrostack/widgets';

export const dynamic = 'force-dynamic';

interface VendorScoreBreakdown {
  vendorId: string;
  name: string;
  category: string;
  imageUrl: string;
  city: string;
  unitPrice: number;
  deliveryDays: number;
  costScore: number;
  deliveryScore: number;
  qualityScore: number;
  complianceScore: number;
  finalScore: number;
  rank: number;
  dataGaps: string[];
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
  message: string;
}

export default function VendorRankingWidget() {
  const theme = useTheme();
  const { isReady, getToolOutput } = useWidgetSDK();
  const [state, setState] = useWidgetState<{ selectedVendorId: string | null }>(() => ({
    selectedVendorId: null,
  }));

  const data = getToolOutput<VendorRankingData>();

  if (!isReady || !data) {
    return (
      <div style={{
        padding: '24px',
        textAlign: 'center',
        color: theme === 'dark' ? '#fff' : '#000',
        fontFamily: 'system-ui, sans-serif',
      }}>
        Loading Vendor Rankings...
      </div>
    );
  }

  const isDark = theme === 'dark';
  const bgColor = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#0f172a' : '#0f172a';
  const cardBg = isDark ? '#334155' : '#f1f5f9';
  const borderColor = isDark ? '#475569' : '#cbd5e1';
  const mutedText = isDark ? '#94a3b8' : '#64748b';

  const candidates = data.candidates ?? [];
  const intake = data.intake ?? { item: 'Unknown', category: 'Unknown', quantity: 0, budgetInr: 0, deadline: '' };

  const selectedId = state?.selectedVendorId ?? data.topVendorId;
  const selectedVendor = candidates.find((c) => c.vendorId === selectedId) ?? candidates[0];

  const formatInr = (amount: number) => {
    if (!amount) return '₹0';
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} Lakh`;
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <div style={{
      padding: '20px',
      background: bgColor,
      color: isDark ? '#f8fafc' : '#0f172a',
      borderRadius: '12px',
      border: `1px solid ${borderColor}`,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '650px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    }}>
      {/* Header / Intake Summary */}
      <div style={{ marginBottom: '20px', borderBottom: `1px solid ${borderColor}`, paddingBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{
              fontSize: '11px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              background: '#3b82f6',
              color: '#fff',
              padding: '2px 8px',
              borderRadius: '12px',
              display: 'inline-block',
              marginBottom: '6px',
            }}>
              {intake.category}
            </span>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>{intake.item}</h2>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: mutedText }}>Budget</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981' }}>
              {intake.budgetInr ? formatInr(intake.budgetInr) : 'N/A'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '13px', color: mutedText }}>
          <div>📦 Qty: <strong>{intake.quantity || 1}</strong></div>
          {intake.deadline && <div>📅 Deadline: <strong>{intake.deadline}</strong></div>}
        </div>
      </div>

      {/* Grid layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: mutedText }}>
            Candidates ({candidates.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
            {candidates.map((c) => {
              const isSelected = c.vendorId === selectedId;
              return (
                <div
                  key={c.vendorId}
                  onClick={() => setState({ selectedVendorId: c.vendorId })}
                  style={{
                    padding: '10px 12px',
                    background: isSelected ? (isDark ? '#1e293b' : '#e2e8f0') : cardBg,
                    border: `2px solid ${isSelected ? '#3b82f6' : 'transparent'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: c.rank === 1 ? '#fbbf24' : '#94a3b8',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}>
                      {c.rank}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '13px' }}>{c.name}</div>
                      <div style={{ fontSize: '11px', color: mutedText }}>{c.city}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#3b82f6' }}>{c.finalScore}</div>
                    <div style={{ fontSize: '10px', color: mutedText }}>score</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column */}
        {selectedVendor ? (
          <div style={{
            background: cardBg,
            borderRadius: '10px',
            padding: '16px',
            border: `1px solid ${borderColor}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {selectedVendor.imageUrl && (
                <img
                  src={selectedVendor.imageUrl}
                  alt={selectedVendor.name}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    objectFit: 'cover',
                    border: `1px solid ${borderColor}`,
                  }}
                />
              )}
              <div>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>{selectedVendor.name}</h4>
                <div style={{ fontSize: '12px', color: mutedText }}>Rank #{selectedVendor.rank} • {selectedVendor.city}</div>
              </div>
            </div>

            {/* Score Breakdown Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              {[
                { label: 'Cost Score', val: selectedVendor.costScore, color: '#10b981' },
                { label: 'Delivery Score', val: selectedVendor.deliveryScore, color: '#3b82f6' },
                { label: 'Quality Score', val: selectedVendor.qualityScore, color: '#f59e0b' },
                { label: 'Compliance Score', val: selectedVendor.complianceScore, color: '#8b5cf6' },
              ].map((bar) => (
                <div key={bar.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '2px' }}>
                    <span>{bar.label}</span>
                    <strong>{bar.val}/100</strong>
                  </div>
                  <div style={{ height: '6px', background: isDark ? '#475569' : '#cbd5e1', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${bar.val}%`, height: '100%', background: bar.color, borderRadius: '3px' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Key Metrics */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              background: isDark ? '#1e293b' : '#ffffff',
              padding: '10px',
              borderRadius: '8px',
              fontSize: '12px',
              marginTop: '4px',
            }}>
              <div>
                <span style={{ color: mutedText }}>Unit Price:</span>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{formatInr(selectedVendor.unitPrice)}</div>
              </div>
              <div>
                <span style={{ color: mutedText }}>Delivery:</span>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{selectedVendor.deliveryDays} Days</div>
              </div>
            </div>

            {/* Data Gaps / Warnings */}
            {selectedVendor.dataGaps && selectedVendor.dataGaps.length > 0 && (
              <div style={{
                background: isDark ? 'rgba(245,158,11,0.1)' : '#fef3c7',
                border: `1px solid ${isDark ? 'rgba(245,158,11,0.2)' : '#fde68a'}`,
                borderRadius: '6px',
                padding: '8px 10px',
                fontSize: '11px',
                color: isDark ? '#fbbf24' : '#b45309',
              }}>
                ⚠️ {selectedVendor.dataGaps[0]}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: mutedText }}>
            Select a vendor to view details
          </div>
        )}
      </div>
    </div>
  );
}
