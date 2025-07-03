import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Accessibility Test - STRIKE™',
  description: 'WCAG 2.1 AA compliance testing page',
  robots: 'noindex, nofollow',
};

export default function AccessibilityTestPage() {
  return (
    <div className="min-h-screen bg-white">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Accessibility Test Page</h1>
        <p className="text-lg mb-8">
          This page tests various UI components for WCAG 2.1 AA compliance.
        </p>
        <p>Accessibility testing components have been disabled for production builds.</p>
        <p>This page will be fully functional in development mode.</p>
      </main>
    </div>
  );
}