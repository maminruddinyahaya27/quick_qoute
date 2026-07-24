import './globals.css';
import Script from 'next/script';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'Q-Qoute — Quotations & Invoices',
  description: 'Create and manage quotations and invoices.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="strip-extension-attrs" strategy="beforeInteractive">
          {`
            (function () {
              try {
                var shouldRemove = function (name) {
                  return (
                    name === 'bis_skin_checked' ||
                    name === 'bis_register' ||
                    name.indexOf('__processed_') === 0
                  );
                };

                var stripOnElement = function (el) {
                  if (!el || !el.getAttributeNames) return;
                  var attrs = el.getAttributeNames();
                  for (var i = 0; i < attrs.length; i++) {
                    var name = attrs[i];
                    if (shouldRemove(name)) {
                      el.removeAttribute(name);
                    }
                  }
                };

                var removeInjectedAttrs = function () {
                  stripOnElement(document.documentElement);
                  stripOnElement(document.body);
                  var all = document.getElementsByTagName('*');
                  for (var i = 0; i < all.length; i++) stripOnElement(all[i]);
                };

                removeInjectedAttrs();
                document.addEventListener('DOMContentLoaded', removeInjectedAttrs, { once: true });

                var observer = new MutationObserver(function (mutations) {
                  for (var i = 0; i < mutations.length; i++) {
                    var m = mutations[i];
                    if (m.type === 'attributes') {
                      var attr = m.attributeName || '';
                      if (shouldRemove(attr)) {
                        m.target.removeAttribute(attr);
                      }
                    }
                    if (m.type === 'childList') {
                      var added = m.addedNodes || [];
                      for (var j = 0; j < added.length; j++) {
                        var node = added[j];
                        if (node && node.nodeType === 1) {
                          stripOnElement(node);
                          if (node.querySelectorAll) {
                            var descendants = node.querySelectorAll('*');
                            for (var k = 0; k < descendants.length; k++) {
                              stripOnElement(descendants[k]);
                            }
                          }
                        }
                      }
                    }
                  }
                });

                observer.observe(document.documentElement, {
                  subtree: true,
                  childList: true,
                  attributes: true,
                });

                setTimeout(function () {
                  observer.disconnect();
                }, 5000);
              } catch (e) {
                // no-op
              }
            })();
          `}
        </Script>
      </head>
      <body className="min-h-screen font-body" suppressHydrationWarning>
        <Navbar />
        <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
