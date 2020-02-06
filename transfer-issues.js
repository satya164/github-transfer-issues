const arg = require('arg');
const puppeteer = require('puppeteer');
const prompts = require('prompts');

const args = arg({
  '--org': String,
  '--from': String,
  '--to': String,
  '--github-username': String,
  '--github-password': String,
  '--github-otp': String,
});

async function main() {
  const browser = await puppeteer.launch({ headless: false });

  const page = await browser.newPage();

  await page.goto('https://github.com/login');

  await page.waitForSelector('#login_field');
  await page.type('#login_field', args['--github-username']);
  await page.type('#password', args['--github-password']);
  await page.click('.btn.btn-primary.btn-block');

  let otp;

  if (args['--github-otp']) {
    otp = args['--github-otp'];
  } else {
    const response = await prompts({
      type: 'text',
      name: 'otp',
      message: 'Enter OTP for GitHub',
    });

    otp = response.otp;
  }

  await page.waitForSelector('#otp');
  await page.type('#otp', otp);
  await page.click('.btn.btn-primary.btn-block');

  while (true) {
    await page.goto(
      `https://github.com/${args['--org']}/${args['--from']}/issues?q=is%3Aissue+is%3Aclosed`
    );

    await page.waitForSelector('[data-hovercard-type="issue"]');
    await page.click('[data-hovercard-type="issue"]');

    const url = await page.url();

    const transfer = `[action="${url.replace(
      'https://github.com',
      ''
    )}/transfer"]`;

    await page.waitForSelector(transfer);
    await page.click(transfer);

    await page.waitForSelector(`${transfer} .select-menu-button`);
    await page.click(`${transfer} .select-menu-button`);

    await page.waitForSelector('[placeholder="Find a repository"]');
    await page.type('[placeholder="Find a repository"]', args['--to']);

    await page.waitForSelector(
      '#transfer-possible-repositories-menu .select-menu-item'
    );
    await page.click('#transfer-possible-repositories-menu .select-menu-item');

    await page.waitForSelector('[data-disable-with="Transferring issue…"');
    await page.click('[data-disable-with="Transferring issue…"');

    await page.waitFor(500);
  }
}

main();
