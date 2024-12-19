export const validBlogFieldInput = {
    name: 'name',
    description: 'description',
    websiteUrl: 'https://superblog.com',
};

export const invalidUrls = [
    'http://superblog.com',
    'https:superblog.com',
    'superblog.com',
    'https://superblog',
    'https://superblog.',
    'https://.com',
    'https://superblog!.com',
];