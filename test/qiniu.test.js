import { describe, expect, it, vi } from 'vitest';
vi.mock('@/utils/fetchWithAuth', () => ({ default: vi.fn() }));
import SysCogUpload from '@/components/config/SysCogUpload.vue';
import { applyQiniuPreset, QINIU_REGIONS } from '@/utils/qiniuConfig';
import { compileRender } from './helpers/renderTemplate';
import zh from '@/locales/zh-CN.json';
import en from '@/locales/en.json';

describe('Qiniu channel settings', () => {
    it('uses the regional preset while preserving bucket, credentials, CDN and quota', () => {
        const original = { name: 'Qiniu', accessKeyId: 'ak', secretAccessKey: 'sk', bucketName: 'bucket', cdnDomain: 'https://cdn.test', quota: { enabled: true } };
        for (const region of QINIU_REGIONS) {
            const preset = applyQiniuPreset(original, region);
            expect(preset).toMatchObject({ ...original, region, provider: 'qiniu', pathStyle: true, endpoint: `https://s3.${region}.qiniucs.com` });
            expect(zh.sysUpload.qiniuRegions[region]).toBeTruthy();
            expect(en.sysUpload.qiniuRegions[region]).toBeTruthy();
        }
        expect(original).not.toHaveProperty('provider');
        expect(() => applyQiniuPreset(original, 'auto')).toThrow();
    });

    it('switches providers without losing user credentials and resets Qiniu state on a channel-type change', () => {
        const vm = { newChannel: { type: 's3', provider: 'qiniu', name: 'Cloud', accessKeyId: 'ak', secretAccessKey: 'sk' } };
        SysCogUpload.methods.onStorageProviderChange.call(vm);
        expect(vm.newChannel.endpoint).toBe('https://s3.cn-east-1.qiniucs.com');
        SysCogUpload.methods.onQiniuRegionChange.call(vm, 'cn-south-1');
        expect(vm.newChannel.endpoint).toBe('https://s3.cn-south-1.qiniucs.com');
        vm.newChannel.provider = '';
        SysCogUpload.methods.onStorageProviderChange.call(vm);
        expect(vm.newChannel).toMatchObject({ accessKeyId: 'ak', secretAccessKey: 'sk', endpoint: '', region: 'auto', pathStyle: false });
        SysCogUpload.methods.onChannelTypeChange.call(vm);
        expect(vm.newChannel.provider).toBe('');
    });

    it('saves Qiniu as an ordinary S3 channel with its provider marker and stable name', () => {
        const vm = { ...SysCogUpload.data(), $t: key => key, $message: { warning: vi.fn() }, $refs: { addForm: { validate: callback => callback(true) } }, saveSettings: vi.fn() };
        vm.getSettings = SysCogUpload.methods.getSettings.bind(vm);
        vm.newChannel = applyQiniuPreset({ ...vm.newChannel, type: 's3', name: 'Qiniu', bucketName: 'bucket', accessKeyId: 'ak', secretAccessKey: 'sk' }, 'ap-southeast-1');
        SysCogUpload.methods.confirmAddChannel.call(vm);
        expect(vm.s3Settings.channels[0]).toMatchObject({ type: 's3', provider: 'qiniu', name: 'Qiniu', endpoint: 'https://s3.ap-southeast-1.qiniucs.com', region: 'ap-southeast-1' });
        expect(vm.saveSettings).toHaveBeenCalledOnce();
    });

    it('compiles provider selection, translated region choices and the S3 bucket guidance in the real form', () => {
        const { code } = compileRender('src/components/config/SysCogUpload.vue');
        expect(code).toContain('sysUpload.qiniuProvider');
        expect(code).toContain('sysUpload.qiniuBucketName');
        expect(code).toContain('onQiniuRegionChange');
        expect(zh.sysUpload.qiniuTip).toContain('S3 空间名');
        expect(en.sysUpload.qiniuTip).toContain('S3 bucket name');
    });
});
