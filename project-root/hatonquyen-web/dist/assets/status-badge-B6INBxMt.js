import{c as d,j as t}from"./index-BNbBgkxf.js";/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const c=[["path",{d:"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",key:"1nclc0"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]],i=d("eye",c),n={active:"bg-[#2D5A3D]/10 text-[#2D5A3D] border-[#2D5A3D]/15",inactive:"bg-muted text-muted-foreground border-border",pending:"bg-[#C9A84C]/10 text-[#A8890A] border-[#C9A84C]/15",draft:"bg-secondary text-muted-foreground border-border",archived:"bg-destructive/8 text-destructive border-destructive/15"},o={active:"Hiển thị",inactive:"Ẩn",pending:"Chờ duyệt",draft:"Bản nháp",archived:"Đã lưu trữ"};function a({variant:e,label:r}){return t.jsxs("span",{className:`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] border ${n[e]}`,children:[t.jsx("span",{className:`w-1.5 h-1.5 rounded-full ${e==="active"?"bg-[#2D5A3D]":e==="pending"?"bg-[#C9A84C]":e==="archived"?"bg-destructive":"bg-muted-foreground"}`}),r||o[e]]})}export{i as E,a as S};
