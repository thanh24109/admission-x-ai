export interface AnnouncementItem {
  id: string;
  title: string;
  date: string;
  category: string;
  postLink: string;
  link: string;
  tag?: string;
  excerpt?: string;
  author?: string;
  tags?: Array<{ id: string; name: string; slug: string }>;
  noticeGroup?: string;
  tagHref?: string;
}

export const GENERAL_ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    "id": "3536",
    "category": "Thông Báo",
    "title": "Thông báo tuyển sinh khóa đào tạo kiểm toán viên năng lượng tháng 10 năm 2026",
    "excerpt": "",
    "author": "Trường Đại học Điện lực",
    "date": "06/10/2026",
    "tags": [
      {
        "id": "/asset/daotaothuongxuyen.avif",
        "name": "Đào tạo",
        "slug": "dao-tao"
      }
    ],
    "noticeGroup": "other",
    "tagHref": "/tintuc/thongbao?tags=dao-tao",
    "postLink": "/post/thong-bao-tuyen-sinh-khoa-dao-tao-kiem-toan-vien-nang-luong-thang-10-nam-2026-gR6HJ.html",
    "link": "/tintuc/thongbao?tags=dao-tao"
  },
  {
    "id": "3529",
    "category": "Thông Báo",
    "title": "Thông báo về việc tổ chức thi đánh giá năng lực tiếng Anh trình độ tương đương B1, B2",
    "excerpt": "",
    "author": "Trường Đại học Điện lực",
    "date": "05/10/2026",
    "tags": [
      {
        "id": "/asset/daotaothuongxuyen.avif",
        "name": "Đào tạo",
        "slug": "dao-tao"
      }
    ],
    "noticeGroup": "other",
    "tagHref": "/tintuc/thongbao?tags=dao-tao",
    "postLink": "/post/thong-bao-ve-viec-to-chuc-thi-danh-gia-nang-luc-tieng-anh-trinh-do-tuong-duong-b1-b2-cua-truong-dai-hoc-dien-luc-lmriG.html",
    "link": "/tintuc/thongbao?tags=dao-tao"
  },
  {
    "id": "3519",
    "category": "Thông Báo",
    "title": "Quyết định ban hành Quy chế thực hiện dân chủ ở cơ sở tại Trường Đại học Điện lực",
    "excerpt": "",
    "author": "Trường Đại học Điện lực",
    "date": "01/10/2026",
    "tags": [
      {
        "id": "/asset/daotaothuongxuyen.avif",
        "name": "Hoạt động chung",
        "slug": "hoat-dong-chung"
      }
    ],
    "noticeGroup": "other",
    "tagHref": "/tintuc/thongbao?tags=hoat-dong-chung",
    "postLink": "/post/quyet-dinh-so-3266-qd-dhdl-ve-viec-ban-hanh-quy-che-thuc-hien-dan-chu-o-co-so-tai-truong-dai-hoc-dien-luc-ZVUMU.html",
    "link": "/tintuc/thongbao?tags=hoat-dong-chung"
  },
  {
    "id": "3517",
    "category": "Thông Báo",
    "title": "Thông tin bảo vệ luận án tiến sĩ cấp cơ sở của nghiên cứu sinh Lê Thị Trang, khóa 6 (2023–2026), đợt 1 năm 2023, ngành Kỹ thuật điện tử",
    "excerpt": "",
    "author": "Trường Đại học Điện lực",
    "date": "01/10/2026",
    "tags": [
      {
        "id": "/asset/daotaothuongxuyen.avif",
        "name": "Đào tạo",
        "slug": "dao-tao"
      }
    ],
    "noticeGroup": "other",
    "tagHref": "/tintuc/thongbao?tags=dao-tao",
    "postLink": "/post/thong-tin-bao-ve-luan-an-tien-si-cap-co-so-cua-nghien-cuu-sinh-le-thi-trang-khoa-6-2023-2026-dot-1-nam-2023-nganh-ky-thuat-dien-tu-Xgfbb.html",
    "link": "/tintuc/thongbao?tags=dao-tao"
  }
];

export const ADMISSION_ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    "id": "3390",
    "category": "Thông Báo",
    "title": "Điểm trúng tuyển đại học chính quy năm 2026",
    "excerpt": "",
    "author": "Trường Đại học Điện lực",
    "date": "09/08/2026",
    "tags": [
      {
        "id": "/asset/daotaothuongxuyen.avif",
        "name": "Tuyển sinh",
        "slug": "tuyen-sinh"
      }
    ],
    "noticeGroup": "admissions",
    "tagHref": "/tintuc/thongbao?tags=tuyen-sinh",
    "postLink": "/post/diem-trung-tuyen-dai-hoc-chinh-quy-nam-2026-J1QaE.html",
    "link": "/tintuc/thongbao?tags=tuyen-sinh"
  },
  {
    "id": "180",
    "category": "Thông Báo",
    "title": "Thông tin tư vấn tuyển sinh theo ngành đào tạo năm 2026",
    "excerpt": "",
    "author": "Trường Đại học Điện lực",
    "date": "04/05/2026",
    "tags": [
      {
        "id": "/asset/daotaothuongxuyen.avif",
        "name": "Tuyển sinh",
        "slug": "tuyen-sinh"
      }
    ],
    "noticeGroup": "admissions",
    "tagHref": "/tintuc/thongbao?tags=tuyen-sinh",
    "postLink": "/post/thong-tin-tu-van-tuyen-sinh-theo-nganh-dao-tao-nam-2026-Ae5s1.html",
    "link": "/tintuc/thongbao?tags=tuyen-sinh"
  },
  {
    "id": "176",
    "category": "Thông Báo",
    "title": "Thông báo tuyển sinh Đại học liên thông Ngành Công nghệ thông tin, hình thức đào tạo thường xuyên năm 2026",
    "excerpt": "",
    "author": "Trường Đại học Điện lực",
    "date": "26/03/2026",
    "tags": [
      {
        "id": "/asset/daotaothuongxuyen.avif",
        "name": "Tuyển sinh",
        "slug": "tuyen-sinh"
      }
    ],
    "noticeGroup": "admissions",
    "tagHref": "/tintuc/thongbao?tags=tuyen-sinh",
    "postLink": "/post/thong-bao-tuyen-sinh-dai-hoc-lien-thong-nganh-cong-nghe-thong-tin-hinh-thuc-dao-tao-thuong-xuyen-nam-2026-IoavB.html",
    "link": "/tintuc/thongbao?tags=tuyen-sinh"
  },
  {
    "id": "177",
    "category": "Thông Báo",
    "title": "Thông báo tuyển sinh Đại học liên thông Ngành Công nghệ kỹ thuật điện, điện tử, hình thức đào tạo thường xuyên năm 2026",
    "excerpt": "",
    "author": "Trường Đại học Điện lực",
    "date": "26/03/2026",
    "tags": [
      {
        "id": "/asset/daotaothuongxuyen.avif",
        "name": "Tuyển sinh",
        "slug": "tuyen-sinh"
      }
    ],
    "noticeGroup": "admissions",
    "tagHref": "/tintuc/thongbao?tags=tuyen-sinh",
    "postLink": "/post/thong-bao-tuyen-sinh-dai-hoc-lien-thong-nganh-cong-nghe-ky-thuat-dien-dien-tu-hinh-thuc-dao-tao-thuong-xuyen-nam-2026-KsG5Q.html",
    "link": "/tintuc/thongbao?tags=tuyen-sinh"
  }
];
