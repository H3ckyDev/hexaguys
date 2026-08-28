import { memo } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "../../../components/Icons";

interface LayerStepperProps {
  label: string;
  name: string;
  onPrev: () => void;
  onNext: () => void;
}

export const LayerStepper = memo(function LayerStepper({
  label,
  name,
  onPrev,
  onNext,
}: LayerStepperProps) {
  return (
    <div className="flex items-center justify-between p-2 bg-[#080c16] border border-white/10">
      <div className="flex flex-col text-left">
        <span className="text-[9px] font-mono text-slate-400 uppercase font-bold">{label}</span>
        <span className="text-xs font-bold text-white font-mono">{name}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onPrev}
          className="btn-esports-ghost min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
          aria-label={`Anterior ${label}`}
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>
        <button
          onClick={onNext}
          className="btn-esports-ghost min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
          aria-label={`Siguiente ${label}`}
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});
