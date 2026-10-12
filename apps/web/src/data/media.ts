export interface MediaItem {
  id: string;
  label: string;
  title: string;
  description: string;
  poster: string;
  youtubeId: string;
}

export const MEDIA_DATA: MediaItem[] = [
  {
    "id": "epu-overview",
    "label": "Giới thiệu",
    "title": "Tiên phong đào tạo, nghiên cứu và đổi mới sáng tạo trong lĩnh vực năng lượng",
    "description": "Xem video giới thiệu tổng quan về hành trình 60 năm xây dựng và phát triển của Trường Đại học Điện lực.",
    "poster": "/asset/banner-2.avif",
    "youtubeId": "kHLQurZuy84"
  },
  {
    "id": "epu-campus",
    "label": "Khuôn viên",
    "title": "Hội thảo Khoa học Quốc tế IEEE về Môi trường và Kỹ thuật điện – Châu Á 2025",
    "description": "Không gian nghiên cứu, phòng thí nghiệm hiện đại và khuôn viên năng động của EPU.",
    "poster": "/asset/banner-2.jpg",
    "youtubeId": "OLCUQ6uSYFQ"
  },
  {
    "id": "epu-activities",
    "label": "Sự kiện",
    "title": "Đảng bộ Trường Đại học Điện lực: Phát huy vai trò lãnh đạo toàn diện của tổ chức Đảng",
    "description": "Chuỗi hoạt động phong trào, hội nghị khoa học và các sự kiện lớn của Nhà trường.",
    "poster": "/asset/epu.avif",
    "youtubeId": "IKLzgXr7vPo"
  }
];
