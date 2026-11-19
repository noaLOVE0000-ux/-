// SPDX-License-Identifier: AGPL-3.0-or-later
// Artwork is separately licensed CC-BY-4.0; see BUNDLED_SKINS.json and licenses.html#skins.
// Personal build addition (2026-11-10): an original Delta-style GBA skin with
// self-drawn artwork under assets/skins/delta/gba (no third-party artwork).
import {tr} from '../i18n/index.js';
export const bundledSkins=[...['gb','gbc','gba','nes','snes','md','nds'].map(system=>({
 id:'bundled:manic-'+system,system,name:'ManicEMU '+(system==='nds'?'DS':system.toUpperCase()),folder:`manic/${system}`,pattern:/^[a-z0-9_-]+\.pdf\.png$/i
})),{id:'bundled:delta-gba',system:'gba',name:'Delta Style GBA',folder:'delta/gba',pattern:/^[a-z0-9_-]+\.png$/i}];
const cached=new Map();
export async function bundledSkin(system,id){
 const entry=bundledSkins.find(s=>s.id===id&&s.system===system);
 if(!entry)return null;
 if(!cached.has(id)){
  const url=new URL(`../../assets/skins/${entry.folder}/skin.json`,import.meta.url);
  const promise=fetch(url).then(async response=>{
   if(!response.ok)throw Error(tr('同梱スキンを読み込めません。オンラインで再度お試しください。'));
   const skin=await response.json();
   if(skin.id!==id||skin.system!==system)throw Error(tr('同梱スキンの設定が正しくありません。'));
   const images=Object.fromEntries(Object.entries(skin.images).map(([key,name])=>{
    if(!entry.pattern.test(name))throw Error(tr('同梱スキンの画像名が正しくありません。'));
    return [key,new URL(name,url).href];
   }));
   return {...skin,images};
  }).catch(error=>{cached.delete(id);throw error;});
  cached.set(id,promise);
 }
 return structuredClone(await cached.get(id));
}
