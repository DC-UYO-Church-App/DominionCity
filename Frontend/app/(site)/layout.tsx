/* Marketing layout — wraps every public page in the site chrome (header,
   footer, enhancement layer) and emits Church structured data so a first-time
   visitor can find service times via search too. */
import { church } from '@/data/site'
import SiteShell from '@/components/site/SiteShell'

const ldJson = {
  '@context': 'https://schema.org',
  '@type': 'Church',
  name: church.name,
  slogan: church.tagline,
  telephone: church.phone,
  email: church.email,
  address: {
    '@type': 'PostalAddress',
    streetAddress: `${church.address.line1}, ${church.address.line2}`,
    addressLocality: church.city,
    addressCountry: 'NG',
  },
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldJson) }}
      />
      <SiteShell>{children}</SiteShell>
    </>
  )
}
