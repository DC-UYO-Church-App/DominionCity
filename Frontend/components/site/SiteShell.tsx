/* Marketing site chrome — skip link, header, the <main> landmark, footer, the
   floating verse cloud and the deferred enhancement layer. Used by the (site)
   layout and by 404. */
import Header from './Header';
import Footer from './Footer';
import Enhance from './Enhance';
import VerseToast from './VerseToast';

export default function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <VerseToast />
      <Enhance />
    </>
  );
}
