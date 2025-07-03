import { Metadata } from 'next';
import { SiteHeader } from '@/components/navigation';
import Footer from '@/components/footer';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'STRIKE™ Privacy Policy - How we collect, use, and protect your data',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-typewriter font-bold mb-8">PRIVACY POLICY</h1>
        <p className="text-sm text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
        
        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-typewriter font-bold mb-4">1. INFORMATION WE COLLECT</h2>
            <p>We collect information you provide directly to us, such as:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Contact information (name, email, phone number, address)</li>
              <li>Payment information (processed securely via Stripe)</li>
              <li>Account credentials</li>
              <li>Purchase history and preferences</li>
              <li>Communications with us</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-typewriter font-bold mb-4">2. HOW WE USE YOUR INFORMATION</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Process and fulfill your orders</li>
              <li>Send order confirmations and shipping updates</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Send marketing communications (with your consent)</li>
              <li>Improve our products and services</li>
              <li>Prevent fraud and enhance security</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-typewriter font-bold mb-4">3. DATA SHARING</h2>
            <p>We do not sell, trade, or rent your personal information. We may share your information with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Service providers (Shopify, Stripe, shipping carriers)</li>
              <li>Law enforcement when required by law</li>
              <li>Business partners with your consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-typewriter font-bold mb-4">4. DATA SECURITY</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal data 
              against unauthorized or unlawful processing, accidental loss, destruction, or damage.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-typewriter font-bold mb-4">5. YOUR RIGHTS</h2>
            <p>Under GDPR, you have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal data</li>
              <li>Rectify inaccurate personal data</li>
              <li>Request deletion of your personal data</li>
              <li>Object to processing of your personal data</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-typewriter font-bold mb-4">6. COOKIES</h2>
            <p>
              We use cookies and similar technologies to enhance your browsing experience, 
              analyze site traffic, and personalize content. You can manage your cookie 
              preferences through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-typewriter font-bold mb-4">7. CONTACT US</h2>
            <p>
              If you have any questions about this Privacy Policy or our data practices, 
              please contact us at:
            </p>
            <p className="mt-2">
              Email: privacy@strike-shop.com<br />
              Address: STRIKE™, 123 Fashion Street, London, UK
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}