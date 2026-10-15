import { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { ProgramDetailView } from "@/components/training/ProgramDetailView";
import {
  UNDERGRADUATE_PROGRAMS,
  getProgramBySlug,
  getAllProgramSlugs,
} from "@/data/undergraduatePrograms";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllProgramSlugs().map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const program = getProgramBySlug(slug);

  if (!program) {
    return {
      title: "Không tìm thấy chương trình đào tạo | EPU",
    };
  }

  return {
    title: `${program.name} (Mã: ${program.code}) | Đào tạo Đại học EPU`,
    description: `Thông tin chi tiết chương trình đào tạo ngành ${program.name}, mã ngành ${program.code}, văn bằng ${program.degreeType === "ENGINEER" ? "Kỹ sư" : "Cử nhân"} tại Trường Đại học Điện lực.`,
  };
}

export default async function ProgramDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const program = getProgramBySlug(slug);

  if (!program) {
    notFound();
  }

  return (
    <PublicLayout>
      <ProgramDetailView program={program} basePath="/page/dai-hoc" />
    </PublicLayout>
  );
}
