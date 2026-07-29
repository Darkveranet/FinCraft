import fs from 'node:fs';
import path from 'node:path';
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';

const root=process.cwd();
const files=[];
for (const base of ['js/api','js/pages','js/treasury']) {
  const dir=path.join(root,base); if(!fs.existsSync(dir)) continue;
  const visit=d=>fs.readdirSync(d,{withFileTypes:true}).forEach(e=>e.isDirectory()?visit(path.join(d,e.name)):e.name.endsWith('.js')&&files.push(path.join(d,e.name)));
  visit(dir);
}
const tests=[];
const visitTests=d=>fs.readdirSync(d,{withFileTypes:true}).forEach(e=>e.isDirectory()?visitTests(path.join(d,e.name)):e.name.endsWith('.mjs')&&tests.push(path.join(d,e.name)));
visitTests(path.join(root,'tests-e2e'));
const testText=tests.map(f=>fs.readFileSync(f,'utf8')).join('\n');
const rows=[];
for(const f of files.sort()){
 const rel=path.relative(root,f).replaceAll('\\','/'); const src=fs.readFileSync(f,'utf8');
 let ast; try{ast=acorn.parse(src,{ecmaVersion:'latest',sourceType:'module'});}catch{continue;}
 walk.simple(ast,{
  FunctionDeclaration(n){if(n.id) add(n.id.name,n.loc)},
  MethodDefinition(n){if(n.key?.name) add(n.key.name,n.loc)},
  Property(n){if((n.value?.type==='ArrowFunctionExpression'||n.value?.type==='FunctionExpression')&&n.key){add(n.key.name||n.key.value,n.loc)}},
  VariableDeclarator(n){if(n.id?.name&&(n.init?.type==='ArrowFunctionExpression'||n.init?.type==='FunctionExpression'))add(n.id.name,n.loc)}
 },walk.base,{locations:true});
 function add(name){if(typeof name!=='string'||!name)return; const token=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); const referenced=new RegExp(`\\b${token}\\b`).test(testText); rows.push({module:rel,function:name,e2eReference:referenced,status:referenced?'REFERENCED':'UNTESTED'});}
}
const outDir=path.join(root,'test-results');fs.mkdirSync(outDir,{recursive:true});
const byModule={}; for(const r of rows){const m=byModule[r.module]??={total:0,referenced:0,untested:0};m.total++;r.e2eReference?m.referenced++:m.untested++;}
const summary={generatedAt:new Date().toISOString(),sourceFiles:files.length,totalFunctions:rows.length,referenced:rows.filter(r=>r.e2eReference).length,untested:rows.filter(r=>!r.e2eReference).length,modules:byModule};
fs.writeFileSync(path.join(outDir,'function-inventory.json'),JSON.stringify({summary,functions:rows},null,2));
let md=`# FinCraft E2E Function Inventory\n\nGenerated: ${summary.generatedAt}\n\n- Source files: ${summary.sourceFiles}\n- Functions discovered: ${summary.totalFunctions}\n- Referenced by E2E specs: ${summary.referenced}\n- Not referenced by E2E specs: ${summary.untested}\n\n> REFERENCED is evidence of test ownership, not proof that every branch executed. PASS/FAIL comes from Playwright/JUnit results.\n\n## Module summary\n\n| Module | Functions | Referenced | Untested |\n|---|---:|---:|---:|\n`;
for(const [m,v] of Object.entries(byModule))md+=`| ${m} | ${v.total} | ${v.referenced} | ${v.untested} |\n`;
md+='\n## Untested functions\n\n'; for(const r of rows.filter(x=>!x.e2eReference))md+=`- \`${r.module}\` — \`${r.function}\`\n`;
fs.writeFileSync(path.join(outDir,'function-inventory.md'),md);
console.log(JSON.stringify(summary,null,2));
