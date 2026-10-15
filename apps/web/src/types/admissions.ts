export type AdmissionCategoryType =
  | "Đại học"
  | "Cao học"
  | "Nghiên cứu sinh"
  | "Đào tạo thường xuyên";

export type AdmissionCategorySlug =
  | "daihoc"
  | "caohoc"
  | "nghiencuusinh"
  | "daotaothuongxuyen";

export interface AdmissionArticle {
  id: string;
  title: string;
  slug: string;
  date: string;
  displayDate: string;
  category: AdmissionCategoryType;
  categorySlug: AdmissionCategorySlug;
  summary?: string;
  thumbnail?: string;
  content?: string;
}

export type AdmissionTabId = "all" | AdmissionCategorySlug;
