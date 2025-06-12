"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-white section-padding border-t border-subtle">
      <div className="strike-container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Newsletter Signup Column */}
          <div className="md:col-span-2 lg:col-span-1">
            <h3 className="text-xs font-bold mb-3 uppercase tracking-wider">JOIN THE STRIKE™ COMMUNITY</h3>
            <p className="text-xs text-[var(--subtle-text-color)] mb-4">
              Sign up for 10% off your first order & updates on new arrivals, promotions and events.
            </p>
            <div className="flex mb-3">
              <input type="email" placeholder="Your Email" className="footer-input flex-grow" />
              <Button className="button-primary ml-2 h-12 px-4 rounded-none">→</Button>
            </div>
            <div className="space-y-1.5">
              {["Womenswear", "Menswear", "Kids"].map((pref) => (
                <div key={pref} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`footer-${pref.toLowerCase()}`}
                    className="h-3 w-3 text-black border-gray-300 focus:ring-black rounded-sm"
                  />
                  <label
                    htmlFor={`footer-${pref.toLowerCase()}`}
                    className="ml-2 text-[10px] text-[var(--subtle-text-color)]"
                  >
                    {pref}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Links Columns */}
          <div>
            <h4 className="text-xs font-bold mb-3 uppercase tracking-wider">HELP</h4>
            <ul className="space-y-1.5 text-xs">
              {["FAQ", "Shipping", "Returns", "Order Tracking", "Size Guide", "Contact Us"].map((link) => (
                <li key={link}>
                  <Link
                    href={`/${link.toLowerCase().replace(" ", "-")}`}
                    className="hover:text-black text-[var(--subtle-text-color)] transition-colors"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold mb-3 uppercase tracking-wider">LEGAL AREA</h4>
            <ul className="space-y-1.5 text-xs">
              {["Terms & Conditions", "Privacy Policy", "Cookie Policy", "Accessibility"].map((link) => (
                <li key={link}>
                  <Link
                    href={`/${link.toLowerCase().replace(/[\s&]+/g, "-")}`}
                    className="hover:text-black text-[var(--subtle-text-color)] transition-colors"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold mb-3 uppercase tracking-wider">COMPANY</h4>
            <ul className="space-y-1.5 text-xs">
              {["About Strike™", "Careers", "Press", "Sustainability"].map((link) => (
                <li key={link}>
                  <Link
                    href={`/${link.toLowerCase().replace(/[\s™]+/g, "-")}`}
                    className="hover:text-black text-[var(--subtle-text-color)] transition-colors"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-subtle pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-[var(--subtle-text-color)]">
            <div className="mb-4 sm:mb-0">
              <span>Country: United States</span> | <span className="ml-2">Language: EN</span>
            </div>
            <div className="flex space-x-4 mb-4 sm:mb-0">
              {[Facebook, Instagram, Twitter, Youtube].map((Icon, index) => (
                <Link
                  key={index}
                  href="#"
                  aria-label="Social media link"
                  className="hover:text-black transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>
          <div className="text-center sm:text-left text-[10px] text-gray-400 mt-4">
            <p>Copyright © {new Date().getFullYear()} Strike™ LLC. All Rights Reserved.</p>
            <p className="mt-0.5">
              Licensee: Strike 17 S.r.l. Registered Office: 123 Fashion Avenue, New York, NY. Company Reg: 12345678901
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
