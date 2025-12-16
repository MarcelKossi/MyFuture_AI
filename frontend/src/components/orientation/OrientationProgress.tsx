
interface OrientationProgressProps {
  currentStep: number;
  totalSteps: number;
}

const OrientationProgress = ({ currentStep, totalSteps }: OrientationProgressProps) => {
  const percentage = Math.min(100, Math.max(0, (currentStep / totalSteps) * 100));

  return (
    <div className="mb-8" aria-live="polite">
      <div className="w-full bg-gray-200 rounded-full h-2" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={totalSteps}>
        <div 
          className="bg-gradient-to-r from-blue-600 to-green-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
        {[...Array(totalSteps)].map((_, index) => {
          const stepIndex = index + 1;
          const isActive = stepIndex === currentStep;
          const isDone = stepIndex < currentStep;
          return (
            <div key={stepIndex} className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-blue-600' : isDone ? 'bg-green-500' : 'bg-gray-300'}`} aria-hidden="true" />
              <span className={`${isActive ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
                {stepIndex} / {totalSteps}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrientationProgress;
