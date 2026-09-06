const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
(async () => {
 const browser = await chromium.launch({channel:'msedge', headless:true});
 const context = await browser.newContext({viewport:{width:1440,height:1000}});
 const page = await context.newPage();
 const errors=[]; page.on('pageerror', e=>{errors.push(e.message);console.log('BROWSER ERROR: '+e.message)}); page.on('console', m=>{if(m.type()==='error'){errors.push(m.text());console.log('CONSOLE ERROR: '+m.text())}});
 const shots=path.join(__dirname,'screenshots'); fs.mkdirSync(shots,{recursive:true});
 async function shot(name) { await page.screenshot({path:path.join(shots,name+'.png'),fullPage:true,caret:'initial'}); }
 async function overflow(name) { const result=await page.evaluate(()=>({width:innerWidth,document:document.documentElement.scrollWidth})); assert.ok(result.document<=result.width+1,`${name} overflows: ${JSON.stringify(result)}`); }
 async function goto(route) { await page.goto('http://localhost:3000'+route); await page.locator('h1').first().waitFor(); if(!['/login','/register'].includes(route)) { await page.locator('.page-content').waitFor(); await page.locator('.skeleton').first().waitFor({state:'detached'}); } await overflow(route); }
 await goto('/login'); await shot('login-desktop');
 await page.getByLabel('Email address').fill('test@example.com'); await page.getByLabel('Password',{exact:true}).fill('password123');
 await page.getByRole('button',{name:'Show password',exact:true}).click(); assert.equal(await page.locator('#password').getAttribute('type'),'text');
 await page.getByRole('button',{name:'Login',exact:true}).click(); await page.waitForURL('**/dashboard'); await page.locator('table').waitFor(); await overflow('member dashboard'); await shot('member-dashboard-desktop');
 const own = (await (await context.request.get('http://localhost:5000/api/reports/my')).json()).reports;
 const editable = own.find(r=>['DRAFT','NEEDS_CORRECTION'].includes(r.status)); assert.ok(editable,'A seeded editable report is available');
 await goto('/reports/'+editable.id); await page.getByText('Task Breakdown',{exact:true}).waitFor(); await shot('report-detail-desktop');
 await goto('/reports/'+editable.id+'/edit'); await page.getByRole('button',{name:'Save Changes',exact:true}).waitFor(); await shot('edit-report-desktop');
 await goto('/reports/new'); await page.getByRole('button',{name:'Save as Draft',exact:true}).waitFor(); await shot('create-report-desktop');
 await page.getByLabel('Week Start',{exact:true}).fill('2026-09-07'); await page.getByLabel('Week End',{exact:true}).fill('2026-09-13'); await page.locator('#section-0 select').selectOption({index:1});
 await page.getByLabel('Task Name',{exact:true}).fill('UI verification task');
 await page.getByRole('button',{name:'Add Another Task',exact:true}).click(); await page.getByRole('button',{name:'Remove task 2',exact:true}).click();
 await page.getByRole('button',{name:'Add Blocker',exact:true}).click(); await page.getByLabel('Blocker 1',{exact:true}).fill('Review dependency');
 await page.getByRole('button',{name:'Add Achievement',exact:true}).click(); await page.getByLabel('Achievement 1',{exact:true}).fill('UI polished');
 await page.getByRole('button',{name:'Add Work Hour',exact:true}).click(); await page.getByLabel('Hours',{exact:true}).fill('3');
 await page.getByLabel('Next Week Plans',{exact:true}).fill('Finish review'); await page.getByLabel('Notes and links',{exact:true}).fill('UI check');
 let payload;
 await page.route('**/api/reports',async route=>{ if(route.request().method()==='POST'){payload=route.request().postDataJSON(); assert.ok((await route.request().allHeaders()).cookie?.includes('token=')); await route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({report:{id:'ui-check'}})}); } else await route.continue(); });
 await page.getByRole('button',{name:'Save as Draft',exact:true}).click(); await page.waitForURL('**/dashboard'); assert.equal(payload.tasks.length,1); assert.equal(payload.blockers[0].description,'Review dependency'); assert.equal(payload.achievements[0].description,'UI polished'); assert.equal(payload.workHours[0].hours,3); assert.equal(payload.notes,'UI check'); await page.unroute('**/api/reports');
 for (const route of ['/dashboard','/reports/new','/reports/'+editable.id,'/reports/'+editable.id+'/edit']) {await page.setViewportSize({width:390,height:844}); await goto(route); await shot('mobile-'+route.replaceAll('/','-'));}
 await page.getByRole('button',{name:'Open navigation',exact:true}).click(); await page.getByRole('dialog').waitFor(); await shot('mobile-navigation'); await page.keyboard.press('Escape'); assert.equal(await page.getByRole('dialog').count(),0);
 await page.setViewportSize({width:1440,height:1000});
 await context.request.post('http://localhost:5000/api/auth/logout'); await goto('/login');
 await page.getByLabel('Email address').fill('manager@example.com'); await page.getByLabel('Password',{exact:true}).fill('manager123'); await page.getByRole('button',{name:'Login',exact:true}).click(); await page.waitForURL('**/manager'); await page.locator('table').waitFor(); await shot('manager-dashboard-desktop'); await overflow('manager');
 await page.getByPlaceholder('Name or email...').fill('no-matching-person'); await page.getByRole('heading',{name:'No reports found'}).waitFor(); await page.getByRole('button',{name:'Clear filters',exact:true}).click();
 await page.getByRole('button',{name:'Request Changes',exact:true}).first().click(); await page.getByRole('dialog').waitFor(); await shot('request-changes-modal'); await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Approve',exact:true}).first().click(); await shot('approve-modal'); await page.getByRole('button',{name:'Cancel',exact:true}).click();
 await goto('/manager/projects'); await page.getByRole('heading',{name:'All Projects',exact:true}).waitFor(); await shot('projects-desktop'); await page.getByRole('button',{name:'Add Project',exact:true}).first().click(); await shot('add-project-modal'); await page.keyboard.press('Escape');
 for(const route of ['/manager','/manager/projects']) { await page.setViewportSize({width:390,height:844}); await goto(route); await shot('mobile-'+route.replaceAll('/','-')); }
 await context.request.post('http://localhost:5000/api/auth/logout');
 for(const route of ['/login','/register']) { await goto(route); await shot('mobile-'+route.slice(1)); }
 await page.setViewportSize({width:1440,height:1000}); await goto('/register'); await shot('register-desktop');
 await page.getByLabel('Full name').fill('UI Check'); await page.getByLabel('Email address').fill('ui@example.com'); await page.getByLabel('Password',{exact:true}).fill('password123'); await page.getByLabel('Confirm password',{exact:true}).fill('different123'); await page.getByRole('button',{name:'Create Account',exact:true}).click(); await page.getByRole('alert').filter({hasText:'Passwords do not match'}).waitFor();
 assert.deepEqual(errors,[]); console.log('PASS: eight pages, desktop/mobile overflow, real member/manager login, navigation, modal dismissal, password controls, registration mismatch, and create payload/cookies. No report data was changed.');
 console.log('Screenshots: '+shots);
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});



