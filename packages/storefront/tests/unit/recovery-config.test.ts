import {describe, expect, it} from 'vitest';
import {readFileSync, readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {previewSettings} from '../../preview/settings';
const base=process.cwd();
const walk=(directory:string):string[] => readdirSync(directory,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(resolve(directory,entry.name)):[resolve(directory,entry.name)]);
describe('local preview configuration boundary',()=>{
 it('keeps provider access and obvious secrets out of frontend source',()=>{
  const files=['app/features/recovery','app/config','app/content','preview'].flatMap(dir=>walk(resolve(base,dir))).filter(file=>/\.(tsx?|json|html)$/.test(file));
  const forbidden=[/sk-(?:or-v1-)?[a-zA-Z0-9]{20,}/,/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,/https:\/\/(?:api\.openai\.com|openrouter\.ai)/,/process\.env\.(?:OPENROUTER|OPENAI|SHOPIFY|SESSION)/];
  for(const file of files)for(const pattern of forbidden)expect(readFileSync(file,'utf8'),file).not.toMatch(pattern);
 });
 it('documents and validates the configurable server boundary',()=>{
  const example=readFileSync(resolve(base,'preview/.env.example'),'utf8');
  expect(example).toContain('FRONTEND_HOST=');expect(example).toContain('FRONTEND_PORT=');
  expect(previewSettings({FRONTEND_HOST:'127.0.0.1',FRONTEND_PORT:'4321'})).toEqual({host:'127.0.0.1',port:4321});
  expect(()=>previewSettings({FRONTEND_PORT:'invalid'})).toThrow();
 });
});
