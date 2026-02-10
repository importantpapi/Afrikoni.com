import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProductWizardProgress({ currentStep, steps, completionPercent }) {
  return (
    <div className="w-full">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[var(--os-text-primary)]">
            {completionPercent}% Complete
          </span>
          <span className="text-xs text-[var(--os-text-secondary)]">
            Step {currentStep} of {steps.length}
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-white transition-all"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isUpcoming = stepNumber > currentStep;

          return (
            <div
              key={step.id}
              className={cn('flex-1 flex flex-col items-center', isUpcoming && 'opacity-50')}
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300',
                  isCompleted && 'bg-white text-black',
                  isCurrent && 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]',
                  isUpcoming && 'bg-white/10 text-[var(--os-text-secondary)]'
                )}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : stepNumber}
              </div>
              <div className="mt-2 text-center hidden sm:block">
                <p className={cn('text-xs font-medium', isCurrent ? 'text-[var(--os-text-primary)]' : 'text-[var(--os-text-secondary)]')}>
                  {step.title}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-center sm:hidden">
        <p className="text-sm font-medium text-[var(--os-text-primary)]">
          {steps[currentStep - 1]?.title}
        </p>
        <p className="text-xs text-[var(--os-text-secondary)] mt-0.5">
          {steps[currentStep - 1]?.description}
        </p>
      </div>
    </div>
  );
}
