import { Metadata } from 'next';
import { SiteHeader } from '@/components/navigation';
import Footer from '@/components/footer';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'STRIKE™ Terms & Conditions - Terms of use for our website and services',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-typewriter font-bold mb-8">TERMS & CONDITIONS</h1>
        <p className="text-sm text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
        
        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-typewriter font-bold mb-4">1. ACCEPTANCE OF TERMS</h2>
            <p>
              By accessing and using the STRIKE™ website, you accept and agree to be bound by these 
              Terms and Conditions. If you do not agree to these terms, please do not use our website.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-typewriter font-bold mb-4">2. USE OF WEBSITE</h2>
            <p>You may use our website for lawful purposes only. You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe upon intellectual property rights</li>
              <li>Transmit harmful code or malware</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Engage in any activity that disrupts our services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-typewriter font-bold mb-4">3. PRODUCT INFORMATION</h2>
            <p>
              We strive to ensure accuracy in product descriptions, pricing, and availability. 
              However, we reserve the right to correct any errors and update information without 
              prior notice. Colors may vary slightly due to monitor settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-typewriter font-bold mb-4">4. ORDERING & PAYMENT</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>All orders are subject to acceptance and availability</li>
              <li>We reserve the right to refuse any order</li>
              <li>Prices are in EUR/GBP and include VAT where applicable</li>
              <li>Payment is processed securely through Stripe</li>
              <li>We accept major credit cards and digital payment methods</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-typewriter font-bold mb-4">5. SHIPPING & DELIVERY</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Free shipping on orders over €100</li>
              <li>Delivery times are estimates and not guaranteed</li>
              <li>Risk of loss passes to you upon delivery</li>
              <li>International orders may be subject to customs duties</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-typewriter font-bold mb-4">6. RETURNS & REFUNDS</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>30-day return policy for unworn items with tags</li>
              <li>Original packaging must be included</li>
              <li>Sale items are final sale</li>
              <li>Refunds processed within 5-10 business days</li>
              <li>Return shipping costs are the customer's responsibility</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-typewriter font-bold mb-4">7. INTELLECTUAL PROPERTY</h2>
            <p>
              All content on this website, including text, images, logos, and designs, is the 
              property of STRIKE™ and protected by intellectual property laws. Unauthorized use 
              is strictly prohibited.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-typewriter font-bold mb-4">8. LIMITATION OF LIABILITY</h2>
            <p>
              STRIKE™ shall not be liable for any indirect, incidental, special, or consequential 
              damages arising from your use of our website or products. Our total liability shall 
              not exceed the amount paid for the product in question.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-typewriter font-bold mb-4">9. PRIVACY</h2>
            <p>
              Your use of our website is also governed by our Privacy Policy. Please review our 
              Privacy Policy to understand our practices.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-typewriter font-bold mb-4">10. GOVERNING LAW</h2>
            <p>
              These Terms and Conditions are governed by the laws of the United Kingdom. Any 
              disputes shall be resolved in the courts of England and Wales.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-typewriter font-bold mb-4">11. CONTACT INFORMATION</h2>
            <p>
              For questions about these Terms & Conditions, please contact us at:
            </p>
            <p className="mt-2">
              Email: legal@strike-shop.com<br />
              Address: STRIKE™, 123 Fashion Street, London, UK
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}