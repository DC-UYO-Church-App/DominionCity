import type { Metadata } from 'next';
import SiteShell from '@/components/site/SiteShell';
import PageHero from '@/components/site/PageHero';
import { Button } from '@/components/site/ui/button';
import './not-found.css';

export const metadata: Metadata = {
  title: 'Page not found',
};

export default function NotFound() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="404"
        title="That page wandered off."
        lede="The link is broken, but you’re still welcome. Here’s the way back."
      />
      <section className="section">
        <div className="shell u-center">
          <p className="nf__btns">
            <Button asChild variant="gold"><a href="/">Back to home</a></Button>
            <Button asChild variant="ghost"><a href="/plan-your-visit/">Plan your visit</a></Button>
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
