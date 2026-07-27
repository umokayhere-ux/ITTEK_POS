import type { Metadata } from 'next';
import { LegalShell, Section } from '@/components/legal-shell';

export const metadata: Metadata = {
  title: 'Privacy Policy — iTtEk POS',
  description: 'How iTtEk POS collects, uses and protects your information.',
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" updated="27 July 2026">
      <p className="text-sm leading-relaxed text-muted-foreground">
        This Privacy Policy explains how iTtEk POS (&ldquo;we&rdquo;, &ldquo;us&rdquo; or
        &ldquo;our&rdquo;) collects, uses and protects information when you use the iTtEk POS platform
        (the &ldquo;Service&rdquo;). We are committed to handling your information responsibly and in
        line with applicable data-protection laws.
      </p>

      <Section title="1. Information we collect">
        <ul className="list-disc space-y-1 pl-6">
          <li>
            <span className="font-medium text-foreground">Account details</span> — business name,
            owner name, email, phone, country, currency and timezone provided at registration.
          </li>
          <li>
            <span className="font-medium text-foreground">Business data</span> — the products,
            sales, customers, suppliers, inventory and other records you enter into the Service.
          </li>
          <li>
            <span className="font-medium text-foreground">Usage &amp; device data</span> — basic
            technical information such as log data needed to operate and secure the Service.
          </li>
        </ul>
      </Section>

      <Section title="2. How we use information">
        <ul className="list-disc space-y-1 pl-6">
          <li>to provide, maintain and improve the Service;</li>
          <li>to authenticate users and secure accounts;</li>
          <li>to process subscriptions and payments where applicable;</li>
          <li>to send important service messages and respond to support requests;</li>
          <li>to comply with legal obligations and prevent misuse.</li>
        </ul>
      </Section>

      <Section title="3. Multi-tenant isolation">
        <p>
          iTtEk POS is multi-tenant: each business&rsquo;s data is logically isolated and accessible
          only to that business&rsquo;s authorised users. Platform administrators may access
          operational information to run and support the platform, but do not access individual
          businesses&rsquo; financial figures (such as revenue, expenses and debts).
        </p>
      </Section>

      <Section title="4. Sharing of information">
        <p>
          We do not sell your personal information. We share information only with service providers
          who help us operate the Service (for example, hosting, database, email and image-storage
          providers), under agreements that require them to protect it, and where required by law.
        </p>
      </Section>

      <Section title="5. Data security">
        <p>
          We use reasonable technical and organisational measures to protect information, including
          encryption in transit, hashed passwords, access controls and role-based permissions. No
          method of transmission or storage is completely secure; you are responsible for keeping
          your credentials confidential and for keeping backups of your own data.
        </p>
      </Section>

      <Section title="6. Data retention">
        <p>
          We retain information for as long as your account is active and as needed to provide the
          Service, comply with legal obligations, resolve disputes and enforce agreements. You may
          request deletion of your account, after which we will delete or anonymise personal data
          subject to legal retention requirements.
        </p>
      </Section>

      <Section title="7. Your rights">
        <p>
          Subject to applicable law, you may request access to, correction of, or deletion of your
          personal information, and may object to or restrict certain processing. To exercise these
          rights, contact us using the details below.
        </p>
      </Section>

      <Section title="8. Children">
        <p>The Service is intended for businesses and is not directed at children.</p>
      </Section>

      <Section title="9. Changes to this policy">
        <p>
          We may update this Privacy Policy from time to time. Material changes will be notified
          through the Service or by email, and the &ldquo;Last updated&rdquo; date above will change.
        </p>
      </Section>

      <Section title="10. Contact">
        <p>
          For privacy questions or requests, contact{' '}
          <a href="mailto:support@ittek.pos" className="text-primary hover:underline">support@ittek.pos</a>{' '}
          or use the in-app Support section.
        </p>
      </Section>
    </LegalShell>
  );
}
