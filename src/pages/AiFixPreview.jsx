// src/pages/AiFixPreview.jsx
import React, { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { CheckCircle, ArrowLeft } from "lucide-react";
import api from "../configs/api";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";

const AiFixPreview = () => {
  const { resumeId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);

  const { suggestions, resumeData, feedback, score } = location.state || {};
  const [applying, setApplying] = useState(false);

  if (!suggestions || !resumeData) {
    return (
      <div className="p-10 text-center text-gray-600">
        <p>No AI suggestions found.</p>
        <button
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded"
          onClick={() => navigate(-1)}
        >
          Go Back
        </button>
      </div>
    );
  }

  const applyFixes = async () => {
    try {
      setApplying(true);

      const merged = structuredClone(resumeData);
      if (suggestions.professional_summary)
        merged.professional_summary = suggestions.professional_summary;
      if (Array.isArray(suggestions.experience))
        merged.experience = suggestions.experience;
      if (Array.isArray(suggestions.education))
        merged.education = suggestions.education;
      if (Array.isArray(suggestions.project))
        merged.project = suggestions.project;
      if (Array.isArray(suggestions.skills))
        merged.skills = suggestions.skills;
      if (suggestions.personal_info)
        merged.personal_info = {
          ...merged.personal_info,
          ...suggestions.personal_info,
        };

      const formData = new FormData();
      formData.append("resumeId", resumeId);
      formData.append("resumeData", JSON.stringify(merged));

      await api.put("/api/resumes/update", formData, {
        headers: { Authorization: token },
      });

      toast.success("AI fixes applied successfully!");
      navigate(`/app/resume/${resumeId}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to apply AI fixes.");
    } finally {
      setApplying(false);
    }
  };

  const renderSection = (title, before, after) => (
    <div className="mb-6 border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-2 bg-gray-50 border-b font-semibold text-gray-700">
        {title}
      </div>
      <div className="grid grid-cols-2">
        <div className="p-4 border-r border-gray-200">
          <div className="text-sm text-gray-500 font-medium mb-1">Before</div>
          <pre className="text-xs text-gray-700 whitespace-pre-wrap">
            {typeof before === "object"
              ? JSON.stringify(before, null, 2)
              : before || "—"}
          </pre>
        </div>
        <div className="p-4 bg-green-50">
          <div className="text-sm text-green-700 font-medium mb-1">After</div>
          <pre className="text-xs text-gray-900 whitespace-pre-wrap">
            {typeof after === "object"
              ? JSON.stringify(after, null, 2)
              : after || "—"}
          </pre>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="size-4" /> Back
        </button>

        <div className="text-right">
          <div className="text-xs text-gray-400">Current AI Score</div>
          <div className="text-3xl font-bold text-indigo-600">{score}/100</div>
          <div className="text-sm text-gray-600">{feedback}</div>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-gray-800 mb-4">
        AI Suggested Fixes Preview
      </h1>
      <p className="text-gray-500 mb-8">
        Review all recommended updates carefully. Once confirmed, these changes
        will replace your existing resume content.
      </p>

      {renderSection(
        "Professional Summary",
        resumeData.professional_summary,
        suggestions.professional_summary
      )}

      {renderSection(
        "Experience",
        resumeData.experience,
        suggestions.experience
      )}

      {renderSection(
        "Projects",
        resumeData.project,
        suggestions.project
      )}

      {renderSection(
        "Education",
        resumeData.education,
        suggestions.education
      )}

      {renderSection("Skills", resumeData.skills, suggestions.skills)}

      {renderSection(
        "Personal Info",
        resumeData.personal_info,
        suggestions.personal_info
      )}

      <div className="mt-10 flex justify-end">
        <button
          onClick={applyFixes}
          disabled={applying}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-md shadow-md hover:opacity-90 transition-all"
        >
          <CheckCircle className="size-4" />
          {applying ? "Applying..." : "Confirm & Apply Fixes"}
        </button>
      </div>
    </div>
  );
};

export default AiFixPreview;
