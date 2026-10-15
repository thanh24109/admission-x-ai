import { Metadata } from "next";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AdmissionsList } from "@/components/admissions/AdmissionsList";
import { ADMISSION_ARTICLES } from "@/data/admissionsPosts";

export const metadata: Metadata = {
  title: "Tuyển sinh | Cổng thông tin tuyển sinh Trường Đại học Điện lực (EPU)",
  description:
    "Tổng hợp thông báo tuyển sinh Đại học chính quy, Sau đại học (Thạc sĩ, Tiến sĩ), Đào tạo thường xuyên và xét tuyển sớm tại Trường Đại học Điện lực.",
};

export default function TuyensinhPage() {
  return (
    <PublicLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 max-w-5xl">
        <AdmissionsList initialArticles={ADMISSION_ARTICLES} initialCategory="all" pageSize={10} />
      </div>
    </PublicLayout>
  );
}
