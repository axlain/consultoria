import { useEffect } from 'react'

function setMetaTag(attr, key, content) {
  if (!content) return
  let tag = document.querySelector(`meta[${attr}="${key}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, key)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

// RNF03: per-page title, meta description, and Open Graph tags driven by tenant JSON.
export function TenantSeo({ tenant }) {
  useEffect(() => {
    if (!tenant) return
    document.title = tenant.seo.title
    setMetaTag('name', 'description', tenant.seo.description)
    setMetaTag('property', 'og:title', tenant.seo.title)
    setMetaTag('property', 'og:description', tenant.seo.description)
    setMetaTag('property', 'og:image', tenant.seo.og_image)
  }, [tenant])

  return null
}
