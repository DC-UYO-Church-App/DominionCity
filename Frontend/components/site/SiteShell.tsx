/* Marketing site chrome — skip link, header, the <main> landmark, footer, and
   the deferred enhancement layer. Used by the (site) layout and by 404. */
import Header from './Header';
import Footer from './Footer';
import Enhance from './Enhance';

export default function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <Enhance />
    </>
  );
}
