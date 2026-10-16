import React from "react";
import type { Metadata } from "next";
import { CandidateLayout } from "@/components/candidate/layout/CandidateLayout";
import { CandidateChatWorkspace } from "@/components/chat/CandidateChatWorkspace";

export const metadata: Metadata = {
  title: "Chat AI — Trợ lý Tuyển sinh | Trường Đại học Điện lực (EPU)",
  description:
    "Trợ lý Tuyển sinh AI thông minh hỗ trợ giải đáp trực tiếp thông tin ngành đào tạo, phương thức xét tuyển, điểm chuẩn và học phí tại Trường Đại học Điện lực.",
};

export default function CandidateChatPage() {
  return (
    <CandidateLayout>
      <CandidateChatWorkspace />
    </CandidateLayout>
  );
}
