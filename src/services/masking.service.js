/**
 * MaskingService
 * Detects sensitive personal identifiable information (PII) like phone numbers
 * and email addresses in text messages and automatically masks them:
 * - Phone numbers: First 2 and last 2 digits visible, middle digits masked with asterisks (*).
 * - Email addresses: First part (username) masked, @ and domain remaining visible.
 */
class MaskingService {
    /**
     * Masks email addresses in text:
     * e.g., "contact john.doe@example.com today" -> "contact j******e@example.com today"
     * e.g., "write to me@domain.org" -> "write to **@domain.org"
     */
    static maskEmail(text) {
        if (!text || typeof text !== 'string') return '';
        const emailRegex = /([a-zA-Z0-9_.+-]+)@([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)/gi;

        return text.replace(emailRegex, (match, localPart, domain) => {
            if (localPart.length <= 2) {
                return `${'*'.repeat(localPart.length)}@${domain}`;
            }
            const firstChar = localPart[0];
            const lastChar = localPart[localPart.length - 1];
            const maskedMiddle = '*'.repeat(localPart.length - 2);
            return `${firstChar}${maskedMiddle}${lastChar}@${domain}`;
        });
    }

    /**
     * Masks phone numbers in text:
     * First 2 digits and last 2 digits visible, middle digits masked with *.
     * Handles local, national, and international formats with '+', brackets, hyphens, and spaces.
     * e.g., "Call +91 9876543210" -> "Call +91 98******10"
     * e.g., "Phone: 9876543210" -> "Phone: 98******10"
     * e.g., "(555) 123-4567" -> "55******67"
     */
    static maskPhone(text) {
        if (!text || typeof text !== 'string') return '';
        // Match numbers containing 7 to 15 digits with optional phone formatting (+, (), -, spaces)
        const phoneRegex = /(?:\+?\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/g;

        return text.replace(phoneRegex, (match) => {
            const digits = match.replace(/\D/g, '');
            // Only mask if it has at least 7 digits (avoid small numbers like years or item counts)
            if (digits.length < 7) {
                return match;
            }

            const prefix = digits.slice(0, 2);
            const suffix = digits.slice(-2);
            const maskedMiddle = '*'.repeat(digits.length - 4);
            const hasPlus = match.trim().startsWith('+');

            return `${hasPlus ? '+' : ''}${prefix}${maskedMiddle}${suffix}`;
        });
    }

    /**
     * Master masking pipeline:
     * Applies both email and phone masking sequentially to a message string.
     */
    static maskMessage(content) {
        if (!content || typeof content !== 'string') return '';
        let sanitized = this.maskEmail(content);
        sanitized = this.maskPhone(sanitized);
        return sanitized;
    }
}

module.exports = MaskingService;
