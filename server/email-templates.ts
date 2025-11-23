/**
 * Reusable Email Template Components and Builders
 * 
 * This module provides a unified system for building consistent, branded emails
 * with shared components (headers, footers, CTAs, info boxes).
 */

// ============================================================================
// Constants and Configuration
// ============================================================================

const APP_URL = process.env.REPLIT_DOMAINS?.split(',')[0] || 'https://pmy.app';
const BRAND_NAME = 'PMY';
const BRAND_TAGLINE = 'Title IX Consent Documentation';

// Color palette for email themes
const COLORS = {
  // Primary brand colors
  primary: '#667eea',
  primaryDark: '#764ba2',
  
  // Success/positive
  success: '#16a34a',
  successDark: '#15803d',
  
  // Info/neutral
  info: '#2563eb',
  infoDark: '#1d4ed8',
  
  // Warning/caution
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  
  // Danger/error
  danger: '#dc2626',
  dangerDark: '#991b1b',
  
  // Neutrals
  gray50: '#f9f9f9',
  gray100: '#f7f7f7',
  gray200: '#e5e5e5',
  gray400: '#888',
  gray500: '#666',
  gray700: '#333',
  gray800: '#555',
} as const;

type EmailTheme = 'primary' | 'success' | 'info' | 'warning' | 'danger';

const THEME_GRADIENTS: Record<EmailTheme, string> = {
  primary: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
  success: `linear-gradient(135deg, ${COLORS.success} 0%, ${COLORS.successDark} 100%)`,
  info: `linear-gradient(135deg, ${COLORS.info} 0%, ${COLORS.infoDark} 100%)`,
  warning: `linear-gradient(135deg, ${COLORS.warning} 0%, #d97706 100%)`,
  danger: `linear-gradient(135deg, ${COLORS.danger} 0%, ${COLORS.dangerDark} 100%)`,
};

// ============================================================================
// Base Styles
// ============================================================================

const BASE_FONT_FAMILY = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`;

const STYLES = {
  body: `font-family: ${BASE_FONT_FAMILY}; line-height: 1.6; color: ${COLORS.gray700}; max-width: 600px; margin: 0 auto; padding: 20px;`,
  header: (theme: EmailTheme) => `background: ${THEME_GRADIENTS[theme]}; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;`,
  content: `background: white; padding: 30px; border: 1px solid ${COLORS.gray200}; border-top: none; border-radius: 0 0 10px 10px;`,
  footer: `text-align: center; padding: 20px; color: ${COLORS.gray400}; font-size: 12px;`,
  button: (theme: EmailTheme) => `display: inline-block; background: ${THEME_GRADIENTS[theme]}; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;`,
};

// ============================================================================
// Reusable Template Components
// ============================================================================

interface EmailHeaderOptions {
  theme?: EmailTheme;
  title: string;
  subtitle?: string;
}

function emailHeader({ theme = 'primary', title, subtitle }: EmailHeaderOptions): string {
  return `
    <div style="${STYLES.header(theme)}">
      <h1 style="color: white; margin: 0; font-size: 28px;">${title}</h1>
      ${subtitle ? `<p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">${subtitle}</p>` : ''}
    </div>
  `;
}

interface EmailFooterOptions {
  additionalText?: string;
}

function emailFooter({ additionalText }: EmailFooterOptions = {}): string {
  return `
    <div style="${STYLES.footer}">
      <p>${BRAND_NAME} - Secure ${BRAND_TAGLINE}</p>
      ${additionalText ? `<p>${additionalText}</p>` : ''}
    </div>
  `;
}

interface CTAButtonOptions {
  theme?: EmailTheme;
  text: string;
  url: string;
}

function ctaButton({ theme = 'primary', text, url }: CTAButtonOptions): string {
  return `
    <div style="margin: 30px 0; text-align: center;">
      <a href="${url}" style="${STYLES.button(theme)}">
        ${text}
      </a>
    </div>
  `;
}

type InfoBoxType = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

interface InfoBoxOptions {
  type?: InfoBoxType;
  title?: string;
  content: string;
}

function infoBox({ type = 'neutral', title, content }: InfoBoxOptions): string {
  const boxStyles: Record<InfoBoxType, { bg: string; border: string; text: string }> = {
    neutral: { bg: COLORS.gray50, border: COLORS.gray200, text: COLORS.gray700 },
    success: { bg: '#d1fae5', border: COLORS.success, text: '#065f46' },
    warning: { bg: COLORS.warningLight, border: COLORS.warning, text: '#92400e' },
    danger: { bg: '#fee2e2', border: COLORS.danger, text: '#7f1d1d' },
    info: { bg: '#e0e7ff', border: COLORS.info, text: '#1e3a8a' },
  };

  const style = boxStyles[type];
  
  return `
    <div style="background: ${style.bg}; border-left: 4px solid ${style.border}; padding: 15px; margin: 20px 0; border-radius: 4px;">
      ${title ? `<p style="margin: 0 0 5px 0; font-weight: bold; color: ${style.text};">${title}</p>` : ''}
      <p style="margin: 0; color: ${style.text}; ${title ? 'font-style: italic;' : ''}">${content}</p>
    </div>
  `;
}

interface DetailCardOptions {
  items: Array<{ label: string; value: string }>;
}

function detailCard({ items }: DetailCardOptions): string {
  const itemsHtml = items
    .map(({ label, value }) => `<p style="margin: 5px 0;"><strong>${label}:</strong> ${value}</p>`)
    .join('\n');
  
  return `
    <div style="background: ${COLORS.gray50}; padding: 20px; border-radius: 6px; margin: 20px 0;">
      ${itemsHtml}
    </div>
  `;
}

interface JoinPMYInviteOptions {
  context?: 'document' | 'amendment' | 'generic';
}

function joinPMYInvite({ context = 'generic' }: JoinPMYInviteOptions = {}): string {
  const messages = {
    document: 'Want to manage your own consent documentation?',
    amendment: 'Want full control over your consent contracts?',
    generic: 'Want to join PMY?',
  };

  return `
    <div style="background: ${THEME_GRADIENTS.primary}; padding: 25px; border-radius: 8px; margin: 30px 0; text-align: center;">
      <h3 style="color: white; margin: 0 0 15px 0; font-size: 20px;">${messages[context]}</h3>
      <p style="color: rgba(255,255,255,0.95); margin: 0 0 20px 0; font-size: 15px;">
        Join PMY for free to create, manage, and share consent documentation with these features:
      </p>
      <ul style="color: rgba(255,255,255,0.9); text-align: left; margin: 0 auto; display: inline-block; max-width: 400px; font-size: 14px;">
        <li>4 secure documentation methods (signature, audio, photo, biometric)</li>
        <li>Collaborative contract creation and amendments</li>
        <li>University-specific Title IX policy guidance</li>
        <li>Encrypted storage and verified identity badges</li>
      </ul>
      <div style="margin: 20px 0 0 0;">
        <a href="${APP_URL}" style="${STYLES.button('success')} background: white; color: ${COLORS.primary};">
          Join PMY Free
        </a>
      </div>
    </div>
  `;
}

// ============================================================================
// Email Template Builders
// ============================================================================

interface BaseEmailTemplate {
  to: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  from?: string;
  attachments?: Array<{ filename: string; content: Buffer }>;
}

interface EmailBuilderOptions {
  theme?: EmailTheme;
  headerTitle: string;
  headerSubtitle?: string;
  greeting: string;
  bodyHtml: string;
  bodyText: string;
  footerText?: string;
}

function buildEmail({
  theme = 'primary',
  headerTitle,
  headerSubtitle,
  greeting,
  bodyHtml,
  bodyText,
  footerText,
}: EmailBuilderOptions): { htmlContent: string; textContent: string } {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${headerTitle}</title>
    </head>
    <body style="${STYLES.body}">
      ${emailHeader({ theme, title: headerTitle, subtitle: headerSubtitle })}
      
      <div style="${STYLES.content}">
        <h2 style="color: ${COLORS.gray700}; margin-top: 0;">${greeting}</h2>
        ${bodyHtml}
      </div>
      
      ${emailFooter({ additionalText: footerText })}
    </body>
    </html>
  `;

  const textContent = `
${headerTitle}
${headerSubtitle || ''}

${greeting}

${bodyText}
  `.trim();

  return { htmlContent, textContent };
}

// ============================================================================
// Exported Template Builders
// ============================================================================

export const EmailTemplates = {
  // Components for custom email building
  components: {
    header: emailHeader,
    footer: emailFooter,
    ctaButton,
    infoBox,
    detailCard,
    joinPMYInvite,
  },

  // Helpers
  build: buildEmail,
  appUrl: APP_URL,
  brandName: BRAND_NAME,
  colors: COLORS,
  themeGradients: THEME_GRADIENTS,
};
