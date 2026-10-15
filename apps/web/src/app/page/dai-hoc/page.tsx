import { Metadata } from "next";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { TrainingProgramsPage } from "@/components/training/TrainingProgramsPage";
import { UNDERGRADUATE_PROGRAMS } from "@/data/undergraduatePrograms";

export const metadata: Metadata = {
  title: "Chương trình đào tạo Đại học | Trường Đại học Điện lực (EPU)",
  description:
    "Danh sách 38 ngành và chuyên ngành đào tạo bậc Đại học hệ chính quy tại Trường Đại học Điện lực. Tìm hiểu mã ngành, loại bằng cấp và thông tin chương trình đào tạo.",
};

export default function PageDaiHoc() {
  return (
    <PublicLayout>
      <TrainingProgramsPage programs={UNDERGRADUATE_PROGRAMS} basePath="/page/dai-hoc" />
    </PublicLayout>
  );
}
