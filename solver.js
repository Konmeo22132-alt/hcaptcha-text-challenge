const puppeteer = require('puppeteer');

const GROQ_API_KEY = 'YOUR_GROQ_API_KEY_HERE'; 

const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'openai/gpt-oss-20b';
const PROMPT_TEMPLATE = `You are answering hcaptcha text challange. your a precise riddle/question/problem/puzzle solver.
# Rules for Answer:
 * Provide ONLY the final answer.
 * The answer must be a single word, a number, or a short phrase.
 * Do NOT Use Spaces Between Answer, Do NOT Over Do. Only Answer As Directed.
 * Do NOT explain. even your reasoning.
 * Treat the input as a "trick" or "logic" question. They just write question in way to look tricky/complex but answer is always easy. Just Have To Answer Like A Normal Person Would.

* SPECIFIC LOGIC RULES:
 # SEQUENCE / CHARACTERS / DIGITS:
   * Treat input strictly as text string manipulation unless clearly arithmetic.
   * 'Leading' / 'Beginning' / 'Interval' / 'First' / '1st' / 'One' = First N characters.
   * 'Second' / '2nd' / 'Two' = Second N characters.
   * 'Preultime' / 'Second Last' / 'Second-to-last' = Second Last N characters.
   * 'Ultimate' / 'Last' / 'Terminated' = Last N characters.
   * They Could Write In Words Or Numbers Sometime to confuse. inside question. (first, one, 1st, second, two, 2nd, third, three, 3rd, fourth, four, 4th etc.)
   * Ignore Random Characters Which Seperate Numbers/Sets/Collection/Group (* / \\ ! @ # + - ^ etc.) they are meant to confuse. dont calculate, math. just do as directed. (usall answer in 3-6 numbers max)
   * Example: "Tell the initial four characters 9281 * 1205 / 9110 + 8219" -> "9281"
   * Example: "What are the last two characters of 4028 * 8171 / 8221 @ 6120?" -> "20"
   * Example: "From the sequence 38626^0b01100, what are the leading 2 characters?" -> "38"
   * Example: "Extract the second set of numbers within the given sequence: 7033 - 4673 \\ 6722 / 1028" -> "4673"
   * etc.
 # CHARACTER POSITIONS:
   - If asked for "positions" (plural), return ALL 1-based indices separated by commas (e.g., "1,3,4).
   * Count strictly from left to right.
   * Example: "At what positions can e be found in phenylenediamine?" -> "3,7,9,16"
  * Example: "In monopolization, at which positions does the letter o appear?" -> "2,4,6,13"
* Example: "List the positions where l occurs in lignocellulose." -> "1,8,9,11"
* Example: "Show me the positions where e exists in perceptiveness." -> "2,5,10,12"
   * etc.
 # REVERSE / INVERTED / BACKWARD / FLIP:
   * Spell the word/sentence backwards letter-by-letter.
   * Example: "Write the word immediately backwards" -> "yletaidemmi"
   * Example: "Flip the characters of 'submarine'" -> "enirambus"
   * Example: "Invert the sequence phenylenediamine" -> "enimaidenelynehp"
   * etc.
 # FAMILY LOGIC:
   * Count siblings from the perspective of the subject.
   * If the observer/speaker is IN the group being counted -> Answer is (Total - 1).
   * If the observer/speaker is NOT IN the group -> Answer is Total.
   * Example: "Mason's siblings consist of 8 sisters and 5 brothers. How many sisters does a sister of Mason have?" -> "7"
   * Example: "The total number of children in Violet's (she/her) family is 2 sisters and 2 brothers. Count the brothers of Violet's sister." -> "2"
   * etc.
 # GENERAL / BASIC QUESTIONS:
   * Answer straightforwardly for basic knowledge.
   * Example: "Does new born babies smile?" -> "yes"
   * Example: "What do we use to squeeze toothpaste?" -> "fingers"
   * etc.
 # SPATIAL & SEATING (Circle/Line):
 * Visualize the specific order (A is right of B, etc.).
 * In a circle: If X is on Y's right, Y is on X's left.
 * Return only the name of the person.
 * Example: "Envision a circle with Elizabeth, Henry and Ella. At Henry's immediate right is Elizabeth. Who is on the immediate left of Elizabeth?" -> "Henry"
 * Example: "Name the person located to the right of Jasmine if Santiago is on Grayson's right and Jasmine is on Grayson's left." -> "Grayson"
 * etc.

# '{QUESTION}' Answer This Question Precisely.`;

const delay = ms => new Promise(r => setTimeout(r, ms));

async function solveCaptchaBackend(question, retryCount = 0) {
    console.log(`[Background] Đang giải câu hỏi: "${question}"`);
    const requestBody = {
        model: MODEL,
        messages: [{
            role: "user",
            content: PROMPT_TEMPLATE.replace('{QUESTION}', question)
        }],
        temperature: 0.0,
        max_tokens: 1600
    };

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            if (retryCount < 2) {
                await delay(2000);
                return solveCaptchaBackend(question, retryCount + 1);
            }

            console.error(`API error: ${response.status}`);
            return { success: false };
        }

        const data = await response.json();
        const answer = data?.choices?.[0]?.message?.content?.trim().toLowerCase();

        const finalAnswer = answer?.replace(/[^a-z0-9,]/g, '');
        console.log(`[Background] Đáp án: "${finalAnswer}"`);

        return {
            success: true,
            answer: finalAnswer
        };
    } catch (error) {
        console.error('Solve error:', error);
        return { success: false };
    }
}

async function contentScriptLogic() {
    console.log('%c[Solver] Script Loaded', 'color: green; font-size: 16px');

    if (!window.chrome) window.chrome = {};
    if (!window.chrome.runtime) window.chrome.runtime = {};
    if (!window.chrome.storage) window.chrome.storage = {};

    window.chrome.runtime.id = 'puppeteer-env';

    const storageData = {};
    window.chrome.storage.local = {
        set: async (obj) => {
            Object.assign(storageData, obj);
        },
        get: async (keys) => {
            if (typeof keys === 'string') keys = [keys];
            const result = {};
            if (Array.isArray(keys)) {
                keys.forEach(k => result[k] = storageData[k]);
                return result;
            }
            return storageData;
        }
    };

    window.chrome.runtime.sendMessage = async (msg) => {
        if (msg.action === 'solve') {

            return await window.nodeSolve(msg.question);
        }
        if (msg.action === 'ping') {
            return { success: true };
        }
    };

    'use strict';
    (async () => {
        const delay = ms => new Promise(r => setTimeout(r, ms));
        const isVisible = e => { if (!e) return false; const s = getComputedStyle(e); return s.display !== 'none' && s.visibility !== 'hidden' && e.offsetWidth > 0 };
        const $ = s => document.querySelector(s);
        const $$ = s => document.querySelectorAll(s);
        const setStatus = async (status, time) => { 
            try { 
                await chrome.storage.local.set({ solve_status: status, solve_time: time || null }) 
            } catch (e) { } 
        };

        const trackResult = async (success) => {
            try {
                const d = await chrome.storage.local.get(['total_attempts', 'successful_solves']);
                const total = (d.total_attempts || 0) + 1;
                const successful = (d.successful_solves || 0) + (success ? 1 : 0);
                await chrome.storage.local.set({ total_attempts: total, successful_solves: successful });
            } catch (e) { }
        };

        const sel = {
            checkbox: () => $('#checkbox') || $('#anchor'),
            input: () => $('input[name="captcha"]') || $('input.input-field'),
            submit: () => $('.button-submit'),
            menu: () => $('#menu-info'),
            textChallenge: () => $('#text_challenge'),
            visualChallenge: () => $('#visual_challenge'),
            langButton: () => $('[aria-label*="Select a language"]') || $('#display-language'),
            langOptions: () => $$('[role="option"]'),
            checkmark: () => {
                const cb = $('#checkbox[aria-checked="true"]');
                if (cb) return cb;
                const chk = $('div.check');
                if (chk) { 
                    const s = chk.getAttribute('style') || ''; 
                    if (s.includes('animation') && s.includes('pop')) return chk 
                }
                return null
            },
            refresh: () => $('.refresh.button') || $('[aria-label="Refresh"]'),
            label: () => $('#a11y-label') || $('.label-text'),
            isVerifyButton: () => { 
                const btn = $('.button-submit'); 
                if (!btn) return false; 
                const txt = btn.querySelector('.text'); 
                return txt && txt.textContent.trim().toLowerCase() === 'verify' 
            }
        };

        function setValue(i, t) { 
            if (!i) return; 
            i.value = t; 
            i.dispatchEvent(new Event('input', { bubbles: true })); 
            i.dispatchEvent(new Event('change', { bubbles: true })) 
        }

        function click(e) { 
            if (!e) return; 
            const r = e.getBoundingClientRect();
            ['mousedown', 'mouseup', 'click'].forEach(t => 
                e.dispatchEvent(new MouseEvent(t, { 
                    view: window, 
                    bubbles: true, 
                    clientX: r.left + r.width / 2, 
                    clientY: r.top + r.height / 2 
                }))
            ) 
        }

        function waitFor(fn, to = 3000) { 
            return new Promise(res => { 
                const st = Date.now(); 
                const ch = () => { 
                    const r = fn(); 
                    if (r) return res(r); 
                    if (Date.now() - st > to) return res(null); 
                    setTimeout(ch, 50) 
                }; 
                ch() 
            }) 
        }

        function isEnglish() { 
            const l = $('#display-language'); 
            return l && l.innerText.trim() === 'EN' 
        }

        async function setEnglishLanguage() {
            if (isEnglish()) return true;
            const lb = sel.langButton(); 
            if (!lb) return false;
            click(lb); 
            await delay(200);
            const eo = await waitFor(() => { 
                const o = [...sel.langOptions()]; 
                return o.find(x => x.innerText.includes('English')) 
            });
            if (eo) { 
                click(eo); 
                await delay(200); 
                return true 
            }
            return false
        }

        function getQuestion() {
            const c = $('#prompt-text');
            if (c) { 
                const sp = c.querySelectorAll('span'); 
                for (const x of sp) { 
                    const t = x.innerText?.trim(); 
                    if (!t || t.length < 10) continue; 
                    if (t.includes("Please answer") || t.includes("single word") || t.includes("following question with")) continue; 
                    return t 
                } 
            }
            const sp = [...$$('span')].filter(s => { 
                const st = s.getAttribute('style') || '', cm = getComputedStyle(s); 
                return (st.includes('font-weight: 500') || cm.fontWeight === '500') && s.innerText?.trim().length > 10 
            }).filter(s => { 
                const t = s.innerText?.trim(); 
                return !t.includes("Please answer") && !t.includes("single word") 
            });
            return sp.length > 0 ? sp[sp.length - 1].innerText.trim() : null
        }

        function setLabel() { 
            const l = sel.label(); 
            if (l && !l.dataset.hs) { 
                l.textContent = 'hSolver'; 
                l.dataset.hs = '1' 
            } 
        }

        let lastQ = '', solving = false, retryCount = 0, solved = false;
        let answeredQuestions = new Set(), verifyClicked = false, languageSet = false, solveStartTime = 0;
        let failCount = 0;
        const MAX_RETRIES = 3;

        await setStatus('idle');

        async function solve(q, inp) {
            if (q.includes("Please click") || q.includes("containing") || q.includes("select images") || q.includes("Please answer")) return;
            if (answeredQuestions.has(q)) return;
            if (verifyClicked) return;

            try {
                solveStartTime = Date.now();
                await setStatus('solving');
                const r = await chrome.runtime.sendMessage({ action: 'solve', question: q });

                if (r?.success && r.answer) {
                    answeredQuestions.add(q);
                    setValue(inp, r.answer);
                    await delay(100);
                    if (sel.isVerifyButton()) verifyClicked = true;
                    click(sel.submit());
                } else {
                    await setStatus('failed');
                }
            } catch (e) { 
                await setStatus('failed') 
            }
        }

        function doRefresh() { 
            const r = sel.refresh(); 
            if (r) { 
                click(r); 
                return true 
            } 
            return false 
        }

        while (true) {
            await delay(100);
            if (!chrome.runtime?.id) break;

            try {
                setLabel();
                const cm = sel.checkmark();

                if (cm && !solved) {
                    solved = true;
                    let solveTime = null;
                    if (solveStartTime > 0) {
                        solveTime = ((Date.now() - solveStartTime) / 1000).toFixed(1);
                    }
                    await setStatus('success', solveTime);
                    await trackResult(true);

                    try { 
                        const d = await chrome.storage.local.get(['solved_count']); 
                        await chrome.storage.local.set({ solved_count: (d.solved_count || 0) + 1 }) 
                    } catch (e) { }

                    await delay(500);

// [COMMENT] Không break để nó chạy tiếp nếu web reload

                }

                if (verifyClicked) {
                    const q = getQuestion();
                    if (q && !answeredQuestions.has(q)) {
                        verifyClicked = false;
                        answeredQuestions.clear();
                        lastQ = '';
                        failCount++;
                        await trackResult(false);

                        if (failCount < MAX_RETRIES) {
                            await setStatus('retrying');
                            await delay(500);
                            doRefresh();
                            await delay(1500);
                        } else {
                            await setStatus('failed');
                        }
                    }
                    continue
                }

                const cb = sel.checkbox();
                if (cb && !solved) { 
                    const ch = cb.getAttribute('aria-checked'); 
                    if (ch !== 'true' && isVisible(cb)) { 
                        click(cb); 
                        retryCount = 0; 
                        await delay(100); 
                        continue 
                    } 
                }

                if (!languageSet && isVisible(sel.langButton())) { 
                    if (isEnglish()) { 
                        languageSet = true 
                    } else { 
                        await setEnglishLanguage(); 
                        languageSet = true; 
                        await delay(200); 
                        continue 
                    } 
                }

                const inp = sel.input(); 
                const q = getQuestion(); 
                const hc = isVisible(inp) && q;

                if (hc) { 
                    retryCount = 0; 
                    if (inp.value === '') lastQ = ''; 
                    if (!solving && q !== lastQ) { 
                        solving = true; 
                        lastQ = q; 
                        await solve(q, inp); 
                        solving = false; 
                        await delay(300); 
                        continue 
                    } 
                } else { 
                    retryCount++; 
                    if (retryCount > 10) { 
                        retryCount = 0; 
                        doRefresh(); 
                        await delay(2000); 
                        continue 
                    } 
                    if (isVisible(sel.textChallenge())) click(sel.textChallenge()); 
                    else if (isVisible(sel.visualChallenge())) click(sel.visualChallenge()); 
                    else if (isVisible(sel.menu())) click(sel.menu()) 
                }
            } catch (e) { }
        }
    })();
}

(async () => {

    const browser = await puppeteer.launch({
        headless: false, 

        defaultViewport: null,
        args: [
            '--start-maximized', 
            '--disable-web-security', 
            '--disable-features=IsolateOrigins,site-per-process'
        ]
    });

    const page = await browser.newPage();

    await page.exposeFunction('nodeSolve', async (question) => {
        return await solveCaptchaBackend(question);
    });

    console.log('[Runner] Đang mở trang demo...');
    await page.goto('https://accounts.hcaptcha.com/demo', { waitUntil: 'networkidle2' });

    const injectedFrames = new Set();

    setInterval(async () => {
        const frames = page.frames();
        for (const frame of frames) {
            const url = frame.url();

            if (url.includes('hcaptcha.com') && !injectedFrames.has(frame)) {
                try {

                    const isRelevant = await frame.evaluate(() => {
                        return document.querySelector('#checkbox') || document.querySelector('.prompt-text') || document.querySelector('input');
                    });

                    if (isRelevant) {
                        console.log(`[Injector] Injecting logic into frame: ${url.slice(0, 50)}...`);
                        injectedFrames.add(frame);

                        frame.evaluate(contentScriptLogic).catch(e => {

                        });
                    }
                } catch (e) {

                }
            }
        }
    }, 1000); 

})();

