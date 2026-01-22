// Node.js polyfills for nostr-tools compatibility
// MUST load BEFORE any other JavaScript
if(typeof globalThis==="undefined"){self.globalThis=self;}
if(typeof process==="undefined"){self.process={env:{},version:"",nextTick:fn=>setTimeout(fn,0),cwd:()=>"/",platform:"browser",browser:true};}
if(typeof require==="undefined"){const cache={};self.require=function(id){console.warn("[Polyfill] require():",id);return cache[id]};self.require.cache=cache;self.require.resolve=id=>id;self.require.extensions={};}
if(typeof module==="undefined"){self.module={exports:{},children:[],parent:null};}
if(typeof exports==="undefined"){self.exports={};}
