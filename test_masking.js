const MaskingService = require('./src/services/masking.service');

const testCases = [
    {
        input: 'Hello, call me at 9876543210 please.',
        expectedPhoneMasked: true,
    },
    {
        input: 'My international number is +91 9876543210 for queries.',
        expectedPhoneMasked: true,
    },
    {
        input: 'You can reach me at (555) 123-4567 anytime.',
        expectedPhoneMasked: true,
    },
    {
        input: 'Send your cv to john.doe@example.com right now.',
        expectedEmailMasked: true,
    },
    {
        input: 'Contact contact@company.org or phone +1 800 555 1234.',
        expectedBothMasked: true,
    },
];

console.log('--- Testing PII Masking Engine ---');
testCases.forEach((tc, idx) => {
    const masked = MaskingService.maskMessage(tc.input);
    console.log(`\nTest #${idx + 1}:`);
    console.log(`Input:  "${tc.input}"`);
    console.log(`Output: "${masked}"`);
});
