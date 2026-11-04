import React, { useState } from 'react';
import { m } from 'framer-motion';
import { Calculator, SlidersHorizontal, Sparkles } from 'lucide-react';
import { PageHeader } from '../../components/console/common';
import { Badge, Card, CardHeader, CountUp, DemoBadge, EmptyState, Skeleton, cn } from '../../design/ui';
import { errorMessage, usePresets, useSimulation, type ModelKey } from '../../data/hooks';

const MIN = Math.log(0.001);
const MAX = Math.log(0.2);
const toPrev = (s: number) => Math.exp(MIN + (s / 1000) * (MAX - MIN));
const toSlider = (p: number) => Math.round(((Math.log(p) - MIN) / (MAX - MIN)) * 1000);

const BandBar: React.FC<{ low: number; high: number }> = ({ low, high }) => (
  <div className="relative mt-2 h-3 overflow-hidden rounded-full bg-surface-2" aria-label={`Bands: authentic below ${low}, manipulated at or above ${high}`}>
    <m.div className="absolute inset-y-0 left-0 bg-band-authentic/70" initial={{ width: 0 }} animate={{ width: `${low * 100}%` }} transition={{ duration: 0.4 }} />
    <m.div className="absolute inset-y-0 bg-band-review/70" style={{ left: `${low * 100}%` }} initial={{ width: 0 }} animate={{ width: `${(high - low) * 100}%` }} transition={{ duration: 0.4, delay: 0.05 }} />
    <m.div className="absolute inset-y-0 right-0 bg-band-manipulated/70" initial={{ width: 0 }} animate={{ width: `${(1 - high) * 100}%` }} transition={{ duration: 0.4, delay: 0.1 }} />
  </div>
);

const Policies: React.FC = () => {
  const presets = usePresets();
  const [selected, setSelected] = useState('strict-low-fpr');
  const [model] = useState<ModelKey>('ST');
  const [fpr, setFpr] = useState<0.01 | 0.05>(0.01);
  const [slider, setSlider] = useState(toSlider(0.01));
  const [volume, setVolume] = useState(10_000);
  const prevalence = toPrev(slider);
  const sim = useSimulation(model, fpr, prevalence, volume);
  const list = Object.values(presets.data?.data ?? {});
  const active = presets.data?.data[selected];

  const handleSelectPolicy = (policyId: string) => {
    setSelected(policyId);
    if (policyId === 'strict-low-fpr') {
      setFpr(0.01);
      setSlider(toSlider(0.01));
    } else if (policyId === 'transfer-calibrated') {
      setFpr(0.01);
      setSlider(toSlider(0.05));
    } else if (policyId === 'evidence-desk') {
      setFpr(0.05);
      setSlider(toSlider(0.20));
    }
  };

  return (
    <>
      <PageHeader
        title="Policies"
        description="Select an operational screening policy and simulate expected detection accuracy and reviewer workload."
        meta={presets.data?.isDemo ? <DemoBadge /> : undefined}
      />

      <div className="grid gap-4 md:grid-cols-3">
        {presets.isLoading
          ? Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-40" />)
          : presets.isError
            ? <Card className="md:col-span-3"><EmptyState title="Could not load policies" body={errorMessage(presets.error)} /></Card>
            : list.map((p) => (
                <button
                  key={p.policy_id}
                  type="button"
                  onClick={() => handleSelectPolicy(p.policy_id)}
                  className="text-left"
                  aria-pressed={selected === p.policy_id}
                >
                  <Card interactive className={cn('h-full p-5 transition-all', selected === p.policy_id && 'border-accent shadow-glow ring-1 ring-accent/30')}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-semibold text-text">{p.name}</h3>
                        <p className="font-mono text-xs text-muted">{p.policy_id}</p>
                      </div>
                      <Badge tone={selected === p.policy_id ? 'accent' : 'neutral'}>v{p.version}</Badge>
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs text-muted">{p.description}</p>
                    <BandBar low={p.thresholds.tau_authentic} high={p.thresholds.tau_manipulated} />
                    <div className="mt-1.5 flex justify-between font-mono text-[10px] text-muted">
                      <span>Authentic &lt; {p.thresholds.tau_authentic.toFixed(2)}</span>
                      <span>Manipulated &ge; {p.thresholds.tau_manipulated.toFixed(2)}</span>
                    </div>
                  </Card>
                </button>
              ))}
      </div>

      {active && (
        <Card className="mt-6">
          <CardHeader title={`${active.name} · details`} icon={<SlidersHorizontal className="h-4 w-4" />} />
          <dl className="grid gap-x-8 gap-y-3 p-5 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {[
              ['Target deepfake rate', `${(active.target_prevalence * 100).toFixed(0)}% base traffic`],
              ['Authentic threshold', `Score < ${active.thresholds.tau_authentic.toFixed(2)}`],
              ['Manipulated threshold', `Score ≥ ${active.thresholds.tau_manipulated.toFixed(2)}`],
              ['Review band', `${active.thresholds.tau_authentic.toFixed(2)} – ${active.thresholds.tau_manipulated.toFixed(2)}`],
              ['Background audit check', `${(active.audit_sample_rate * 100).toFixed(0)}% of authentic videos`],
              ['Active model', 'S-MSDT (Spatio-Temporal)'],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-4 border-b border-border pb-2">
                <dt className="text-muted">{k}</dt>
                <dd className="font-mono text-text">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="px-5 pb-5 text-xs text-muted">Policy editing and activation need the admin API; presets are read-only here.</p>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader
          title="Policy simulator"
          icon={<Calculator className="h-4 w-4" />}
          actions={sim.data && <Badge tone={sim.data.computedBy === 'api' ? 'success' : 'warning'}>{sim.data.computedBy === 'api' ? 'computed by API' : 'computed in browser'}</Badge>}
        />
        <div className="grid gap-6 p-5 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-5 text-sm">
            <div>
              <span className="mb-1.5 block text-xs font-medium text-muted">Sensitivity</span>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { val: 0.01, label: 'Strict (1% false alarms)' },
                  { val: 0.05, label: 'High (5% false alarms)' },
                ] as const).map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setFpr(opt.val)}
                    aria-pressed={fpr === opt.val}
                    className={cn(
                      'h-9 rounded-md border text-xs font-medium transition-colors',
                      fpr === opt.val
                        ? 'border-accent bg-accent/10 text-accent font-semibold'
                        : 'border-border text-muted hover:bg-surface-2'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium text-muted">
                <span>Estimated deepfakes in traffic</span>
                <span className="font-mono text-accent font-semibold">
                  {(prevalence * 100).toFixed(prevalence < 0.01 ? 2 : 1)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1000}
                value={slider}
                onChange={(e) => setSlider(Number(e.target.value))}
                className="range"
              />
              <div className="flex gap-2 pt-1">
                {[
                  { label: '1% (Rare)', val: 0.01 },
                  { label: '5% (Moderate)', val: 0.05 },
                  { label: '20% (High risk)', val: 0.20 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setSlider(toSlider(preset.val))}
                    className="rounded border border-border px-2 py-0.5 text-[11px] text-muted hover:border-accent hover:text-text transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="block text-xs font-medium text-muted">Daily video volume</span>
              <input
                type="number"
                min={1}
                step={1000}
                value={volume}
                onChange={(e) => setVolume(Math.max(1, Number(e.target.value) || 1))}
                className="h-9 w-full rounded-md border border-border bg-bg px-3 font-mono text-text focus:border-accent focus:outline-none"
              />
              <div className="flex gap-2 pt-1">
                {[1_000, 10_000, 50_000].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVolume(v)}
                    className={cn(
                      'rounded border px-2 py-0.5 text-[11px] transition-colors',
                      volume === v
                        ? 'border-accent bg-accent/10 text-accent font-medium'
                        : 'border-border text-muted hover:border-accent hover:text-text'
                    )}
                  >
                    {v.toLocaleString()} videos
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            {sim.isError ? (
              <EmptyState title="Simulation failed" body={errorMessage(sim.error)} />
            ) : !sim.data ? (
              <Skeleton className="h-48" />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-accent/25 bg-accent/5 p-4 sm:col-span-2">
                  <p className="text-xs text-muted">Flag Accuracy (Precision)</p>
                  <p className="text-3xl font-semibold tabular-nums tracking-tight text-text">
                    <CountUp value={sim.data.precision * 100} decimals={1} suffix="%" duration={0.3} />
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Portion of flagged videos expected to be confirmed deepfakes
                  </p>
                </div>
                {[
                  ['Videos flagged / day', sim.data.daily.flags],
                  ['Deepfakes caught', sim.data.daily.caught],
                  ['False alarms', sim.data.daily.falseAlarms],
                  ['Missed deepfakes', sim.data.daily.missed],
                ].map(([k, v]) => (
                  <div key={k as string} className="rounded-md border border-border bg-surface-2 p-3">
                    <p className="text-xs text-muted">{k}</p>
                    <p className="font-mono text-xl font-semibold text-text">
                      <CountUp value={Number(v)} duration={0.3} />
                    </p>
                  </div>
                ))}
                {sim.data.daily.reviewHours != null && (
                  <p className="text-xs text-muted sm:col-span-2">
                    Estimated reviewer workload: <strong className="text-text">{sim.data.daily.reviewHours.toFixed(1)} hours/day</strong>.
                  </p>
                )}
              </div>
            )}
            <p className="mt-3 text-[11px] text-muted">
              Estimates calculated from benchmark performance for the S-MSDT video model calibrated to your traffic volume and base rate.
            </p>
          </div>
        </div>
      </Card>
    </>
  );
};

export default Policies;
