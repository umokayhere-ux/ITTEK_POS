import type { Metadata } from 'next';
import { LegalShell, Section } from '@/components/legal-shell';

export const metadata: Metadata = {
  title: 'Terms & Conditions — iTtEk POS',
  description: 'The terms governing your use of the iTtEk POS platform.',
};

export default function TermsPage() {
  return (
    <LegalShell title="Terms & Conditions" updated="27 July 2026">
      <p className="text-sm leading-relaxed text-muted-foreground">
        These Terms &amp; Conditions (&ldquo;Terms&rdquo;) govern your access to and use of the iTtEk
        POS platform, including the point-of-sale, inventory, reporting and related services
        (together, the &ldquo;Service&rdquo;) provided by iTtEk POS (&ldquo;we&rdquo;,
        &ldquo;us&rdquo; or &ldquo;our&rdquo;). By creating an account or using the Service, you
        agree to these Terms.
      </p>

      <Section title="1. Accounts and eligibility">
        <p>
          To use the Service you must create a business account and provide accurate, complete
          information. New business accounts are reviewed and must be approved before going live.
          You are responsible for maintaining the confidentiality of your login credentials and for
          all activity that occurs under your account.
        </p>
        <p>
          You must be authorised to act on behalf of the business you register, and you are
          responsible for the actions of every staff member you invite to your account.
        </p>
      </Section>

      <Section title="2. Acceptable use">
        <p>You agree not to:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>use the Service for any unlawful, fraudulent or harmful purpose;</li>
          <li>attempt to gain unauthorised access to the Service, other accounts or our systems;</li>
          <li>interfere with or disrupt the integrity or performance of the Service;</li>
          <li>reverse engineer or copy any part of the Service except as permitted by law.</li>
        </ul>
      </Section>

      <Section title="3. Your data">
        <p>
          You retain ownership of the business and transaction data you enter into the Service
          (&ldquo;Your Data&rdquo;). You grant us a limited licence to host, process and display Your
          Data solely to provide and improve the Service. You are responsible for the accuracy and
          legality of Your Data and for having the rights needed to use it.
        </p>
        <p>
          Our handling of personal data is described in our{' '}
          <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
        </p>
      </Section>

      <Section title="4. Subscriptions and payments">
        <p>
          Some features are offered on a paid subscription. Fees, billing periods and any trial are
          shown at the point of purchase. Unless stated otherwise, fees are non-refundable and
          subscriptions renew for successive periods until cancelled. We may change pricing on
          reasonable notice.
        </p>
      </Section>

      <Section title="5. Availability and support">
        <p>
          We work to keep the Service available and reliable but do not guarantee uninterrupted
          access. We may perform maintenance, and may suspend the Service where necessary to protect
          it or our users. Support is available through the in-app Support section.
        </p>
      </Section>

      <Section title="6. Suspension and termination">
        <p>
          We may suspend or terminate an account that breaches these Terms, is used unlawfully, or
          poses a risk to the platform or other users. You may stop using the Service at any time.
          On termination, your right to use the Service ends; we may retain or delete Your Data in
          line with the Privacy Policy and applicable law.
        </p>
      </Section>

      <Section title="7. Disclaimers and liability">
        <p>
          The Service is provided &ldquo;as is&rdquo; without warranties of any kind, to the fullest
          extent permitted by law. We are not liable for indirect, incidental or consequential
          losses, or for loss of profits, revenue or data. Nothing in these Terms limits liability
          that cannot be limited by law.
        </p>
        <p>
          You are responsible for keeping your own backups of Your Data and for your compliance with
          tax, accounting and other laws that apply to your business.
        </p>
      </Section>

      <Section title="8. Changes to these Terms">
        <p>
          We may update these Terms from time to time. Material changes will be notified through the
          Service or by email. Continued use after changes take effect constitutes acceptance of the
          updated Terms.
        </p>
      </Section>

      <Section title="9. Contact">
        <p>
          Questions about these Terms can be sent to{' '}
          <a href="mailto:support@ittek.pos" className="text-primary hover:underline">support@ittek.pos</a>{' '}
          or through the in-app Support section.
        </p>
      </Section>
    </LegalShell>
  );
}
