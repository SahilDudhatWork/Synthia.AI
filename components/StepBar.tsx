import { useTranslations } from "next-intl";
import React from "react";

interface StepBarProps {
  progress: number; // 0-100
  stepsLeft?: number;
  onBack?: () => void;
}

const StepBar: React.FC<StepBarProps> = ({ progress, stepsLeft, onBack }) => {
  const t = useTranslations("workspace");
  return (
    <div className="w-full max-w-md mx-auto pt-6 pb-4 z-10">
      <div className="flex items-center justify-between mb-2">
        {/* Back Button */}
        <button
          type="button"
          onClick={onBack}
          className="mr-3 text-white hover:text-white/50"
        >
          <svg
            className="feather feather-chevrons-left"
            fill="none"
            height="24"
            width="24"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* <polyline points="11 17 6 12 11 7" /> */}
            <polyline points="18 17 13 12 18 7" />
          </svg>
        </button>

        {/* Progress Bar */}
        <div className="flex-1 h-1 bg-white/40 rounded-full mx-2">
          <div
            className="h-1 bg-white rounded-full"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Steps Left */}
        {stepsLeft !== undefined && (
          <div className="px-2 text-xs text-gray-200">
            {stepsLeft} {t("left")}
          </div>
        )}
      </div>
    </div>
  );
};

export default StepBar;
