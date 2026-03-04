export const formatVerifiedDate = (value) => {
    if (!value) return 'Not verified';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Not verified';
    return date.toLocaleDateString();
};

export const formatProcessingRange = (minDays, maxDays) => {
    const hasMin = Number.isFinite(minDays);
    const hasMax = Number.isFinite(maxDays);
    if (hasMin && hasMax) return `${minDays} - ${maxDays} days`;
    if (hasMin) return `${minDays}+ days`;
    if (hasMax) return `Up to ${maxDays} days`;
    return null;
};

export const normalizeDocList = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.trim().length > 0) return [value];
    return [];
};
