export interface TrainingProgram {
  name: string;
  slug?: string;
  image: string;
  href: string;
}

export const TRAINING_PROGRAMS: TrainingProgram[] = [
  {
    name: "Đại học",
    slug: "/dai-hoc",
    image: "/asset/daihoc.avif",
    href: "/page/dai-hoc"
  },
  {
    name: "Thạc sĩ",
    slug: "/thac-si",
    image: "/asset/thsi.avif",
    href: "/page/thac-si"
  },
  {
    name: "Tiến sĩ",
    slug: "/tien-si",
    image: "/asset/tiensi.avif",
    href: "/page/tien-si"
  },
  {
    name: "Đào tạo thường xuyên",
    image: "/asset/daotaothuongxuyen.avif",
    href: "https://ctc.epu.edu.vn/"
  }
];
