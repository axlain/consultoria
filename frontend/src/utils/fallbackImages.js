// Fallback Unsplash photos when service/professional has no image_url in DB.
// Each array has enough variety that the first 6-8 items look distinct.

export const SERVICE_PHOTOS = [
  'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=128&h=128&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=128&h=128&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=128&h=128&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1593702295094-b9cbc99b23a0?w=128&h=128&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=128&h=128&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1596728325488-58c87691e9af?w=128&h=128&fit=crop&auto=format',
]

export const PROFESSIONAL_PHOTOS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=128&h=128&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&h=128&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=128&h=128&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=128&h=128&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=128&h=128&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=128&h=128&fit=crop&auto=format',
]

export function servicePhoto(index) {
  return SERVICE_PHOTOS[index % SERVICE_PHOTOS.length]
}

export function professionalPhoto(index) {
  return PROFESSIONAL_PHOTOS[index % PROFESSIONAL_PHOTOS.length]
}
