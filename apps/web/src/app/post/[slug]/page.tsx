import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Tag, Share2 } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { ADMISSION_ARTICLES, getArticleBySlug } from "@/data/admissionsPosts";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return ADMISSION_ARTICLES.slice(0, 30).map((a) => ({
    slug: a.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    return {
      title: "Thông báo tuyển sinh | EPU",
    };
  }

  return {
    title: `${article.title} | Tuyển sinh EPU`,
    description: article.summary || article.title,
  };
}

export default async function PostDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 max-w-4xl">
        {/* Back Link */}
        <Link
          href="/tuyensinh"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-school-navy dark:hover:text-amber-400 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh mục Tuyển sinh</span>
        </Link>

        {/* Article Container */}
        <article className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-10 shadow-sm space-y-6">
          {/* Metadata badges */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 ring-1 ring-slate-200/80 dark:ring-slate-700/80">
              <Tag className="w-3 h-3 text-school-navy dark:text-amber-400" />
              <span>{article.category}</span>
            </span>

            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-slate-500">
              <Calendar className="w-3.5 h-3.5" />
              <span className="font-mono">{article.displayDate}</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-school-navy dark:text-white leading-snug">
            {article.title}
          </h1>

          {/* Body Content / Notice */}
          <div className="prose dark:prose-invert max-w-none text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-2 space-y-4">
            <p>
              Trường Đại học Điện lực (EPU) trân trọng thông báo đến toàn thể thí sinh, phụ huynh và học viên về nội dung: <strong>{article.title}</strong>.
            </p>
            <p>
              Thí sinh vui lòng theo dõi kỹ các mốc thời gian, hồ sơ yêu cầu và quy trình thực hiện theo hướng dẫn trên Cổng tuyển sinh trực tuyến của Nhà trường.
            </p>

            <div className="mt-8 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <h3 className="text-sm font-bold text-school-navy dark:text-slate-200">
                Kênh hỗ trợ và nộp hồ sơ trực tuyến:
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                • Cổng đăng ký xét tuyển: <a href="https://xettuyen.epu.edu.vn/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-amber-400 font-semibold underline">xettuyen.epu.edu.vn</a>
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                • Hotline tư vấn tuyển sinh: 024 2218 5607 / 024 2245 2662
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                • Trợ lý AI EPU trực tuyến: <Link href="/chat" className="text-blue-600 dark:text-amber-400 font-semibold underline">Tư vấn tuyển sinh 24/7</Link>
              </p>
            </div>
          </div>
        </article>
      </div>
    </PublicLayout>
  );
}
