"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { getAIRSBreakdown } from "@/lib/scoring/airs";

interface AIRSChartProps {
  airsScore: number;
  // Pass raw domain scores to derive AIRS breakdown
  communicationScore?: number;
  technicalScore?: number;
  codingScore?: number;
  problemSolvingScore?: number;
  toneScore?: number;
}

export function AIRSChart({
  airsScore,
  communicationScore = 50,
  technicalScore = 50,
  codingScore = 50,
  problemSolvingScore = 50,
  toneScore = 50,
}: AIRSChartProps) {
  const breakdown = getAIRSBreakdown({
    resumeScore: 50,
    communicationScore,
    technicalScore,
    codingScore,
    problemSolvingScore,
    toneScore,
  });

  const data = [
    {
      subject: "Communication",
      score: breakdown.communication.score,
      max: breakdown.communication.max,
      fullMark: 20,
    },
    {
      subject: "Technical",
      score: breakdown.technicalKnowledge.score,
      max: breakdown.technicalKnowledge.max,
      fullMark: 25,
    },
    {
      subject: "Coding",
      score: breakdown.codingAbility.score,
      max: breakdown.codingAbility.max,
      fullMark: 20,
    },
    {
      subject: "Problem Solving",
      score: breakdown.problemSolving.score,
      max: breakdown.problemSolving.max,
      fullMark: 10,
    },
    {
      subject: "Professional Tone",
      score: breakdown.professionalTone.score,
      max: breakdown.professionalTone.max,
      fullMark: 5,
    },
    {
      subject: "Resume Strength",
      score: breakdown.resumeStrength.score,
      max: breakdown.resumeStrength.max,
      fullMark: 20,
    },
  ];

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">AIRS Breakdown</h2>
        <div className="text-right">
          <p className="text-3xl font-bold text-primary-600">{airsScore}</p>
          <p className="text-xs text-gray-500">out of 100</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data}>
          <PolarGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "#6b7280", fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, "auto"]}
            tick={{ fill: "#9ca3af", fontSize: 10 }}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.25}
            strokeWidth={2}
          />
          <Tooltip
            formatter={(value: number, name: string, props: any) => [
              `${value}/${props.payload.max}`,
              props.payload.subject,
            ]}
            contentStyle={{
              backgroundColor: "#1f2937",
              border: "none",
              borderRadius: "8px",
              color: "#f9fafb",
              fontSize: "12px",
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
