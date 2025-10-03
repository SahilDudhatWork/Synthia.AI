import React from "react";
import { useRouter } from "next/router";
import { useTranslations } from "next-intl";

interface AIModel {
  id: string;
  name: string;
  role: string;
  img?: string;
  personality: string;
  workspace_id: string;
  predefined?: boolean;
  topics?: string[];
  config?: {
    bg?: string;
    hover?: string;
  };
}

interface Props {
  member?: AIModel; // Make member optional for Add Model
  workspaceId: string;
  isAddModel?: boolean; // New prop to identify Add Model
  onAddClick?: () => void; // Callback for Add Model click
}

const AIModelModel: React.FC<Props> = ({ member, workspaceId, isAddModel = false, onAddClick }) => {
  const router = useRouter();

  // Generate derived fields from the AIModel data
  const getDerivedFields = (model: AIModel) => {
    return {
      nameSlug: model.name.toLowerCase().replace(/\s+/g, "-"),
      roleSlug: model.role.toLowerCase().replace(/\s+/g, "-"),
      img: model.role ? `/${model.role}.png` : "/default-avatar.png",
      bg: model.config?.bg || "#ffffff",
      hover: model.config?.hover || model.config?.bg || "#f8fafc",
      system_prompt: model.personality
    };
  };

  const derivedFields = member ? getDerivedFields(member) : null;

  const handleClick = () => {
    if (isAddModel) {
      // Handle Add Model click
      if (onAddClick) {
        onAddClick();
      }
      return;
    }

    if (!member) return;

    // Save AIModel ID in sessionStorage
    sessionStorage.setItem("activeAIModelId", member.id);

    router.push({
      pathname: `/ai-model/${member.id}`,
      query: {
        workspaceId,
      },
    });
  };

  const t = useTranslations("AIModels");

  // Add Model configuration
  const addModelConfig = {
    bg: "#f8fafc",
    hover: "#e2e8f0",
    img: "/add-icon.svg", // You can replace this with your add icon
  };

  return (
    <div
      onClick={handleClick}
      className="cursor-pointer transition-transform duration-300 ease-out hover:-translate-y-2 flex items-center justify-center flex-col"
    >
      <div
        style={{ backgroundColor: isAddModel ? addModelConfig.bg : derivedFields?.bg }}
        className="relative w-[150px] h-[150px] rounded-full shadow-lg flex items-center justify-center overflow-hidden group"
      >
        {/* Hover overlay */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-full"
          style={{ backgroundColor: isAddModel ? addModelConfig.hover : derivedFields?.hover }}
        />

        {/* Inner content */}
        {isAddModel ? (
          <div className="flex items-center justify-center text-gray-500 w-full h-full">
            <svg
              className="w-16 h-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
        ) : (
          <img
            src={derivedFields?.img}
            alt={member?.name}
            className="w-full h-full object-cover rounded-full"
            onError={(e) => {
              (e.target as HTMLImageElement).src = derivedFields?.img || "default-avatar.png";
            }}
          />
        )}
      </div>



      {/* Name + role or Add Model text */}
      <div className="text-center mt-4">
        {isAddModel ? (
          // Add Model content
          <>
            <h3 className="text-xl font-bold leading-tight text-gray-800">
              {"Add New"}
            </h3>
            <p className="text-sm text-gray-600">
              {"Create a new partener"}
            </p>
          </>
        ) : (
          // Regular AI Model content
          <>
            <h3 className="text-xl font-bold leading-tight text-gray-800">
              {member?.name}
            </h3>
            <p className="text-sm text-gray-600">
              {member?.role}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default AIModelModel;