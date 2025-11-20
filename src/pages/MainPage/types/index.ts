export interface Project {
  id: string
  title: string
  thumbnailUrl?: string
  lastModified: string
  ownerName?: string
  ownerProfileImage?: string
  isOwner?: boolean // 현재 사용자가 OWNER인지 여부
}
