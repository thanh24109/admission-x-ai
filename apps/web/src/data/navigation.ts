export interface NavSubItem {
  name: string;
  href?: string;
  slug?: string;
  type?: string;
  children?: NavSubItem[];
}

export interface NavItem {
  name: string;
  href?: string;
  slug?: string;
  icon?: string;
  type?: string;
  children?: NavSubItem[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    "name": "Trang chủ",
    "href": "/",
    "icon": "home"
  },
  {
    "name": "Giới thiệu",
    "slug": "/gioithieu",
    "type": "page",
    "children": [
      {
        "name": "Tổng quan",
        "type": "page",
        "slug": "/tongquan",
        "children": [
          {
            "name": "Lịch sử - Truyền thống",
            "type": "page",
            "slug": "/lich-su-truyen-thong",
            "href": "/page/lich-su-truyen-thong"
          },
          {
            "name": "Tầm nhìn - Sứ mệnh",
            "type": "page",
            "slug": "/tam-nhin-su-menh",
            "href": "/page/tam-nhin-su-menh"
          },
          {
            "name": "Triết lý giáo dục",
            "type": "page",
            "slug": "/triet-ly-giao-duc",
            "href": "/page/triet-ly-giao-duc"
          },
          {
            "name": "Chiến lược phát triển",
            "type": "page",
            "slug": "/chien-luoc-phat-trien",
            "href": "/page/chien-luoc-phat-trien"
          },
          {
            "name": "Mẫu bằng cấp, chứng chỉ",
            "type": "page",
            "slug": "/mau-bang-cap-chung-chi",
            "href": "/page/mau-bang-cap-chung-chi"
          },
          {
            "name": "Bộ nhận diện thương hiệu",
            "type": "page",
            "slug": "/bo-nhan-dien-thuong-hieu",
            "href": "/page/bo-nhan-dien-thuong-hieu"
          }
        ],
        "href": "/page/tongquan"
      },
      {
        "name": "Cơ cấu tổ chức",
        "type": "page",
        "slug": "/cocautochuc",
        "children": [
          {
            "name": "BCH Đảng bộ",
            "type": "page",
            "slug": "/bch-dang-bo",
            "href": "/page/bch-dang-bo"
          },
          {
            "name": "Ban giám hiệu",
            "type": "page",
            "slug": "/ban-giam-hieu",
            "href": "/page/ban-giam-hieu"
          },
          {
            "name": "Hội đồng Khoa học Đào tạo",
            "type": "page",
            "slug": "/hoi-dong-khoa-hoc-dao-tao",
            "href": "/page/hoi-dong-khoa-hoc-dao-tao"
          },
          {
            "name": "Các đơn vị",
            "type": "page",
            "slug": "/cac-don-vi",
            "href": "/page/cac-don-vi"
          }
        ],
        "href": "/page/cocautochuc"
      },
      {
        "name": "Thông tin công khai",
        "type": "post-list",
        "slug": "/thongtincongkhai",
        "children": [
          {
            "name": "Báo cáo thường niên",
            "type": "post-list",
            "slug": "/thongtincongkhai/baocaothuongnien",
            "href": "/thongtincongkhai/baocaothuongnien"
          },
          {
            "name": "Công khai ngân sách",
            "type": "post-list",
            "slug": "/thongtincongkhai/congkhaingansach",
            "href": "/thongtincongkhai/congkhaingansach"
          }
        ],
        "href": "/thongtincongkhai"
      }
    ],
    "href": "/page/gioithieu"
  },
  {
    "name": "Tin tức",
    "href": "/tintuc/all",
    "type": "post-list",
    "children": [
      {
        "name": "Tin tức",
        "type": "post-list",
        "slug": "/tintuc",
        "href": "/tintuc"
      },
      {
        "name": "Thông báo",
        "type": "post-list",
        "slug": "/tintuc/thongbao",
        "href": "/tintuc/thongbao"
      },
      {
        "name": "Bản tin nội bộ",
        "type": "post-list",
        "slug": "/tintuc/bantinnoibo",
        "href": "/tintuc/bantinnoibo"
      },
      {
        "name": "Văn bản nội bộ",
        "type": "page",
        "slug": "/van-ban-noi-bo",
        "href": "/page/van-ban-noi-bo"
      }
    ]
  },
  {
    "name": "Tuyển sinh",
    "slug": "/tuyensinh",
    "type": "post-list",
    "children": [
      {
        "name": "Đại học",
        "type": "post-list",
        "slug": "/tuyensinh/daihoc",
        "href": "/tuyensinh/daihoc"
      },
      {
        "name": "Cao học",
        "type": "post-list",
        "slug": "/tuyensinh/caohoc",
        "href": "/tuyensinh/caohoc"
      },
      {
        "name": "Nghiên cứu sinh",
        "type": "post-list",
        "slug": "/tuyensinh/nghiencuusinh",
        "href": "/tuyensinh/nghiencuusinh"
      },
      {
        "name": "Đào tạo thường xuyên",
        "type": "post-list",
        "slug": "/tuyensinh/daotaothuongxuyen",
        "href": "/tuyensinh/daotaothuongxuyen"
      },
      {
        "name": "Cổng thông tin tuyển sinh",
        "href": "https://xettuyen.epu.edu.vn/"
      }
    ],
    "href": "/tuyensinh"
  },
  {
    "name": "Đào tạo",
    "type": "page",
    "slug": "/daotao",
    "children": [
      {
        "name": "Đại học",
        "type": "page",
        "slug": "/dai-hoc",
        "href": "/page/dai-hoc"
      },
      {
        "name": "Thạc sĩ",
        "type": "page",
        "slug": "/thac-si",
        "href": "/page/thac-si"
      },
      {
        "name": "Tiến sĩ",
        "type": "page",
        "slug": "/tien-si",
        "href": "/page/tien-si"
      },
      {
        "name": "Đào tạo thường xuyên",
        "href": "https://ctc.epu.edu.vn/"
      },
      {
        "name": "Tra cứu văn bằng",
        "type": "",
        "slug": "/tra-cuu-van-bang",
        "href": "/tra-cuu-van-bang"
      }
    ],
    "href": "/page/daotao"
  },
  {
    "name": "Khảo thí & ĐBCL",
    "type": "page",
    "slug": "/khaothi",
    "children": [
      {
        "name": "Kiểm định chương trình",
        "type": "page",
        "slug": "/kiem-dinh-chuong-trinh",
        "href": "/page/kiem-dinh-chuong-trinh"
      },
      {
        "name": "Quy trình ISO",
        "type": "page",
        "slug": "/quy-trinh-iso",
        "href": "/page/quy-trinh-iso"
      },
      {
        "name": "Cổng Khảo thí",
        "href": "https://ktdbcl.epu.edu.vn/"
      }
    ],
    "href": "/page/khaothi"
  },
  {
    "name": "Sinh viên",
    "type": "post-list",
    "slug": "/sinhvien",
    "children": [
      {
        "name": "Hoạt động sinh viên",
        "type": "post-list",
        "slug": "/sinhvien/hoatdongsinhvien",
        "href": "/sinhvien/hoatdongsinhvien"
      },
      {
        "name": "Học bổng",
        "type": "page",
        "slug": "/hocbong",
        "href": "/page/hocbong"
      },
      {
        "name": "Hỗ trợ sinh viên",
        "type": "page",
        "slug": "/hotrosinhvien",
        "href": "/page/hotrosinhvien"
      },
      {
        "name": "Dịch vụ cho sinh viên",
        "type": "page",
        "slug": "/dichvuchosinhvien",
        "href": "/page/dichvuchosinhvien"
      },
      {
        "name": "Hướng nghiệp - Việc làm",
        "type": "page",
        "slug": "/huongnghiepvieclam",
        "href": "/page/huongnghiepvieclam"
      },
      {
        "name": "Đoàn thanh niên - Hội sinh viên",
        "type": "page",
        "slug": "/doanthannienhoisinhvien",
        "href": "/page/doanthannienhoisinhvien"
      },
      {
        "name": "Câu lạc bộ sinh viên",
        "type": "page",
        "slug": "/caulacbosinhvien",
        "href": "/page/caulacbosinhvien"
      },
      {
        "name": "Câu hỏi thường gặp",
        "type": "page",
        "slug": "/cauhoithuonggap",
        "href": "/page/cauhoithuonggap"
      }
    ],
    "href": "/sinhvien"
  },
  {
    "name": "KHCN&ĐMST",
    "href": "/khcn-dmst",
    "type": "page",
    "children": [
      {
        "name": "Thông tin khoa học công nghệ",
        "type": "page",
        "slug": "/thong-tin-khoa-hoc-cong-nghe",
        "href": "/page/thong-tin-khoa-hoc-cong-nghe"
      },
      {
        "name": "Đối tác phát triển",
        "type": "page",
        "slug": "/doi-tac-phat-trien",
        "href": "/page/doi-tac-phat-trien"
      },
      {
        "name": "Sản phẩm KHCN",
        "type": "page",
        "slug": "/san-pham-khcn",
        "href": "/page/san-pham-khcn"
      },
      {
        "name": "Sở hữu trí tuệ",
        "type": "page",
        "slug": "/van-bang-so-huu-tri-tue",
        "href": "/page/van-bang-so-huu-tri-tue"
      },
      {
        "name": "Hoạt động KHCN & ĐMST",
        "type": "page",
        "slug": "/hoat-dong-khcn-dmst",
        "children": [
          {
            "name": "Đề tài - Dự án",
            "type": "page",
            "slug": "/de-tai-nghien-cuu-khoa-hoc",
            "href": "/page/de-tai-nghien-cuu-khoa-hoc"
          },
          {
            "name": "Công bố khoa học",
            "type": "page",
            "slug": "/cong-bo-khoa-hoc",
            "href": "/page/cong-bo-khoa-hoc"
          },
          {
            "name": "Định hướng nghiên cứu",
            "type": "page",
            "slug": "/dinh-huong-nghien-cuu",
            "href": "/page/dinh-huong-nghien-cuu"
          },
          {
            "name": "Các biểu mẫu khoa học",
            "type": "page",
            "slug": "/cac-bieu-mau-khoa-hoc",
            "href": "/page/cac-bieu-mau-khoa-hoc"
          }
        ],
        "href": "/page/hoat-dong-khcn-dmst"
      },
      {
        "name": "Các nhóm nghiên cứu",
        "type": "page",
        "slug": "/cac-nhom-nghien-cuu",
        "href": "/page/cac-nhom-nghien-cuu"
      },
      {
        "name": "Tạp chí khoa học",
        "type": "page",
        "slug": "/tap-chi-khoa-hoc",
        "href": "/page/tap-chi-khoa-hoc"
      }
    ]
  }
];

export const TOPBAR_LINKS = [
  { name: 'Cổng cán bộ', href: 'https://eoffice.epu.edu.vn/' },
  { name: 'Cổng sinh viên', href: 'https://sv.epu.edu.vn/' },
  { name: 'Thư viện', href: 'https://thuvien.epu.edu.vn/' },
];
