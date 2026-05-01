/**
 * Sanitizes image URLs to prevent ERR_NAME_NOT_RESOLVED for broken placeholder services.
 * @param {string} url - The image URL to sanitize.
 * @param {'avatar' | 'car'} type - The type of image to provide a default for.
 * @returns {string} - The sanitized URL or a local premium asset path.
 */
export const sanitizeImageUrl = (url, type = 'car') => {
    const DEFAULT_AVATAR = '/assets/images/default-avatar.png';
    const DEFAULT_CAR = '/assets/images/default-car.png';

    if (!url || typeof url !== 'string') {
        return type === 'avatar' ? DEFAULT_AVATAR : DEFAULT_CAR;
    }

    const brokenDomains = [
        'via.placeholder.com',
        'placeholder.com',
        'placehold.jp',
        'placeimg.com'
    ];

    const isBroken = brokenDomains.some(domain => url.includes(domain));

    if (isBroken) {
        return type === 'avatar' ? DEFAULT_AVATAR : DEFAULT_CAR;
    }

    // Handle relative paths for uploaded images
    if (url.startsWith('/uploads/')) {
        const backendUrl = `http://localhost:5008`;
        return `${backendUrl}${url}`;
    }

    return url;
};
