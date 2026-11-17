export const QINIU_REGIONS = [
    'cn-east-1', 'cn-east-2', 'cn-north-1', 'cn-south-1',
    'us-north-1', 'ap-southeast-1', 'ap-southeast-2', 'ap-southeast-3',
];

export function applyQiniuPreset(channel, region = 'cn-east-1') {
    if (!QINIU_REGIONS.includes(region)) throw new Error('Invalid Qiniu storage region');
    return {
        ...channel,
        provider: 'qiniu',
        region,
        endpoint: `https://s3.${region}.qiniucs.com`,
        pathStyle: true,
    };
}
