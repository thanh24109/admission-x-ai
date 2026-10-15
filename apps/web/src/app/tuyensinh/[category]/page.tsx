import { Metadata } from "next";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AdmissionsList } from "@/components/admissions/AdmissionsList";
import { ADMISSION_ARTICLES } from "@/data/admissionsPosts";
import { AdmissionCategorySlug } from "@/types/admissions";

interface PageProps {
  params: Promise<{ category: string }>;
}

export async function generateStaticParams() {
  return [
    { category: "daihoc" },
    { category: "caohoc" },
    { category: "nghiencuusinh" },
    { category: "daotaothuongxuyen" },
  ];
}

const categoryTitleMap: Record<string, string> = {
  daihoc: "Đại học",
  caohoc: "Cao học",
  nghiencuusinh: "Nghiên cứu sinh",
  daotaothuongxuyen: "Đào tạo thường xuyên",
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const catTitle = categoryTitleMap[category] || "Tuyển sinh";

  return {
    title: `Tuyển sinh ${catTitle} | Trường Đại học Điện lực (EPU)`,
    description: `Danh sách thông báo tuyển sinh hệ ${catTitle} mới nhất tại Trường Đại học Điện lực.`,
  };
}

export default async function TuyensinhCategoryPage({ params }: PageProps) {
  const { category } = await params;
  const validatedCat = (categoryTitleMap[category] ? category : "all") as AdmissionCategorySlug;

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 max-w-5xl">
        <AdmissionsList
          initialArticles={ADMISSION_ARTICLES}
          initialCategory={validatedCat}
          pageSize={10}
        />
      </div>
    </PublicLayout>
  );
}
