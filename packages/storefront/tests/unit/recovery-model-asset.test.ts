import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {gunzipSync} from 'node:zlib';
import {describe, expect, it} from 'vitest';
import {recoverySettings} from '../../app/config/recovery';

describe('animated product asset', () => {
  it('ships a compact content-versioned GLB with the movable head preserved', () => {
    const modelPath = recoverySettings.scene.model;
    expect(modelPath).toMatch(/^\/media\/pulse-[a-f0-9]{8}\.glb$/);
    const asset = readFileSync(resolve(process.cwd(), 'public', modelPath.slice(1)));
    const compressed = readFileSync(resolve(process.cwd(), 'public', `${modelPath.slice(1)}.gz`));
    const original = readFileSync(resolve(process.cwd(), 'public/media/pulse.glb'));
    expect(asset.length).toBeLessThan(original.length / 2);
    expect(compressed.length).toBeLessThan(asset.length / 2);
    expect(gunzipSync(compressed)).toEqual(asset);
    expect(createHash('sha256').update(asset).digest('hex').slice(0, 8))
      .toBe(modelPath.match(/pulse-([a-f0-9]{8})\.glb$/)?.[1]);

    expect(asset.toString('ascii', 0, 4)).toBe('glTF');
    expect(asset.readUInt32LE(4)).toBe(2);
    expect(asset.readUInt32LE(8)).toBe(asset.length);
    const jsonLength = asset.readUInt32LE(12);
    expect(asset.readUInt32LE(16)).toBe(0x4e4f534a);
    const document = JSON.parse(asset.toString('utf8', 20, 20 + jsonLength)) as {
      extensionsRequired?: string[];
      nodes: Array<{name?: string}>;
      meshes: unknown[];
    };
    expect(document.extensionsRequired).toEqual(['KHR_mesh_quantization']);
    expect(document.nodes.filter((node: {name?: string}) => node.name === 'Contact head'))
      .toHaveLength(1);
    expect(document.meshes).toHaveLength(29);
  });
});
