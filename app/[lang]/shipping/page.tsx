import { Metadata } from 'next';
import { SiteHeader } from '@/components/navigation';
import Footer from '@/components/footer';

export const metadata: Metadata = {
  title: 'Shipping & Returns',
  description: 'STRIKE™ Shipping & Returns Policy - Delivery information and return process',
};

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-typewriter font-bold mb-8">SHIPPING & RETURNS</h1>
        
        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-typewriter font-bold mb-4">SHIPPING INFORMATION</h2>
            
            <h3 className="text-xl font-typewriter font-semibold mt-6 mb-3">Delivery Times</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>UK Standard (3-5 business days):</strong> £5.00</li>
              <li><strong>UK Express (1-2 business days):</strong> £12.00</li>
              <li><strong>EU Standard (5-7 business days):</strong> £10.00</li>
              <li><strong>EU Express (2-3 business days):</strong> £20.00</li>
              <li><strong>International (7-14 business days):</strong> £25.00</li>
            </ul>
            <p className="mt-4 text-sm italic">FREE SHIPPING on all orders over £100</p>

            <h3 className="text-xl font-typewriter font-semibold mt-6 mb-3">Processing Time</h3>
            <p>
              Orders are processed within 1-2 business days. Orders placed after 2 PM GMT on 
              Friday will be processed on the following Monday.
            </p>

            <h3 className="text-xl font-typewriter font-semibold mt-6 mb-3">Tracking</h3>
            <p>
              Once your order ships, you'll receive a confirmation email with tracking information. 
              Track your order anytime through your account dashboard.
            </p>

            <h3 className="text-xl font-typewriter font-semibold mt-6 mb-3">Customs & Duties</h3>
            <p>
              International orders may be subject to customs duties and taxes. These charges are 
              the responsibility of the recipient and are not included in the shipping cost.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-typewriter font-bold mb-4">RETURNS POLICY</h2>
            
            <h3 className="text-xl font-typewriter font-semibold mt-6 mb-3">30-Day Returns</h3>
            <p>
              We offer a 30-day return window from the date of delivery. Items must be unworn, 
              unwashed, and in original condition with all tags attached.
            </p>

            <h3 className="text-xl font-typewriter font-semibold mt-6 mb-3">How to Return</h3>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Log into your account and navigate to your order history</li>
              <li>Select the items you wish to return</li>
              <li>Print the prepaid return label (UK only)</li>
              <li>Pack items securely in original packaging</li>
              <li>Drop off at any designated carrier location</li>
            </ol>

            <h3 className="text-xl font-typewriter font-semibold mt-6 mb-3">Non-Returnable Items</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Sale/clearance items (FINAL SALE)</li>
              <li>Underwear and swimwear (hygiene reasons)</li>
              <li>Customized or personalized items</li>
              <li>Items without original tags</li>
            </ul>

            <h3 className="text-xl font-typewriter font-semibold mt-6 mb-3">Refund Process</h3>
            <p>
              Once we receive your return, we'll inspect the items and process your refund within 
              5-10 business days. Refunds are issued to the original payment method. Shipping 
              costs are non-refundable unless the return is due to our error.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-typewriter font-bold mb-4">EXCHANGES</h2>
            <p>
              We don't offer direct exchanges. To exchange an item, please return it for a refund 
              and place a new order for the desired item. This ensures faster processing and 
              availability.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-typewriter font-bold mb-4">DAMAGED OR INCORRECT ITEMS</h2>
            <p>
              If you receive a damaged or incorrect item, please contact us within 48 hours of 
              delivery with photos. We'll arrange a replacement or full refund including shipping 
              costs.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-typewriter font-bold mb-4">CONTACT US</h2>
            <p>
              For questions about shipping or returns, please contact our customer service team:
            </p>
            <p className="mt-2">
              Email: support@strike-shop.com<br />
              Phone: +44 (0) 20 1234 5678<br />
              Hours: Monday-Friday, 9 AM - 6 PM GMT
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}