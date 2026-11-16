import React from 'react';
import { Info } from 'lucide-react';

interface ScoreReadoutProps {
  p_bal: number;
  p_prior?: number;
  prior_prevalence?: number;
  size?: 'md' | 'lg';
}

/**
 * SPEC §14.4: shows p_bal as "Score 0.62" (never more than 2 decimals) and p_prior as
 * "≈ 1.6% at 1% prevalence", with the validation caveat.
 */
export const ScoreReadout: React.FC<ScoreReadoutProps> = ({ p_bal, p_prior, prior_prevalence = 0.01, size = 'lg' }) => {
  const [open, setOpen] = React.useState(false);
  const formattedScore = p_bal.toFixed(2);
  const formattedPrior = p_prior !== undefined ? (p_prior * 100).toFixed(1) : null;
  const prevalencePercent = (prior_prevalence * 100).toFixed(prior_prevalence < 0.01 ? 1 : 0);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className={`font-mono font-semibold tracking-tight text-text ${size === 'lg' ? 'text-3xl' : 'text-xl'}`}>
          Score {formattedScore}
        </span>
        {formattedPrior && (
          <span className="group relative inline-flex items-center gap-1 text-sm font-medium text-muted">
            ≈ {formattedPrior}% at {prevalencePercent}% prevalence
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              onBlur={() => setOpen(false)}
              className="inline-flex cursor-pointer items-center text-muted hover:text-text focus:outline-none"
              aria-label="Prevalence details"
            >
              <Info className="h-3.5 w-3.5" aria-hidden />
            </button>
            <span
              role="tooltip"
              className={`absolute left-0 top-full z-20 mt-2 w-72 rounded-md border border-border bg-surface p-3 text-xs font-normal leading-relaxed text-text shadow-2 transition-opacity ${
                open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0 group-hover:opacity-100'
              }`}
            >
              The base score measures detected visual manipulation evidence. The estimated percentage reflects the
              real-world likelihood of manipulation, adjusted for your organization&apos;s screening policy.
            </span>
          </span>
        )}
      </div>
      <p className="text-xs text-muted">Based on validation data; may differ on your traffic.</p>
    </div>
  );
};
