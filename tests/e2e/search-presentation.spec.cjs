const {test, expect} = require('./isolated-fixture.cjs');
const {installPublicFixture, assertNoHorizontalOverflow} = require('./public-fixture.cjs');

const priced = {
  propertyId:'33333333-3333-4333-8333-333333333333',
  propertyTitle:'Readable Barcelona home',
  city:'Barcelona', ownerDisplayName:'Fixture host', accommodationType:'entire_place',
  bedrooms:3, sleeps:5, availableFrom:'2026-11-10', availableTo:'2026-11-17', links:[],
  price:{estimatedAmountCents:61600, nights:7, cleaningFeeCents:7000}
};
const unpriced = {
  ...priced,
  propertyId:'44444444-4444-4444-8444-444444444444',
  propertyTitle:'Room with price on request', accommodationType:'private_room', price:null
};

async function openResults(page, viewport) {
  await page.setViewportSize(viewport);
  await installPublicFixture(page,{items:[priced,unpriced]});
  await page.goto('/search.html');
  await page.locator('[name="country"]').selectOption('ES');
  await expect(page.locator('[name="city"]')).toBeEnabled();
  await page.locator('[name="city"]').selectOption('Barcelona');
  await page.locator('[name="from"]').fill('2026-11-10');
  await page.locator('[name="to"]').fill('2026-11-17');
  await page.locator('#availability-form button[type="submit"]').click();
  await expect(page.locator('.availability-card')).toHaveCount(2);
  await expect(page.locator('.message-property-link')).toHaveCount(2);
  await expect(page.locator('.message-property-link').first()).toBeVisible();
}

test('PM-057: Search hierarchy stays light, readable and keyboard-visible in every locale', async ({page}) => {
  await openResults(page,{width:1363,height:936});

  const presentation = await page.evaluate(() => {
    const style = selector => getComputedStyle(document.querySelector(selector));
    const title = style('.availability-intro h1');
    const form = style('.availability-form');
    const panel = style('.standalone-search');
    const fact = style('.availability-fact');
    const separator = getComputedStyle(document.querySelectorAll('.availability-fact')[1],'::before');
    const contact = style('.message-property-link');
    const activeLine = getComputedStyle(document.querySelector('.housing-tabs a.active'),'::after');
    return {
      titleSize:title.fontSize, titleLine:title.lineHeight,
      titleColor:title.color, titleAccent:style('.availability-intro h1 span').color,
      titleBreak:style('.availability-intro h1 br').display,
      panelBorder:panel.borderTopWidth, panelBackground:panel.backgroundColor,
      formBorder:form.borderTopWidth, formBackground:form.backgroundColor,
      factBorder:fact.borderTopWidth, factRadius:fact.borderRadius,
      separator:separator.content,
      contactHeight:document.querySelector('.message-property-link').getBoundingClientRect().height,
      activeLine:activeLine.content
    };
  });
  expect(presentation).toMatchObject({
    titleSize:'40px', titleLine:'48px', titleBreak:'none',
    panelBorder:'0px', panelBackground:'rgba(0, 0, 0, 0)',
    formBorder:'0px', formBackground:'rgba(0, 0, 0, 0)',
    factBorder:'0px', factRadius:'0px'
  });
  expect(presentation.titleAccent).toBe(presentation.titleColor);
  expect(presentation.separator).not.toBe('none');
  expect(presentation.contactHeight).toBeGreaterThanOrEqual(44);
  expect(presentation.activeLine).not.toBe('none');

  for (const language of ['en','es','ca','ru']) {
    await page.locator(`[data-search-lang="${language}"]`).click();
    await expect(page.locator('html')).toHaveAttribute('lang',language);
    await expect(page.locator('.availability-price-note')).toBeVisible();
    await expect(page.locator('.availability-price.unknown')).toBeVisible();
    await expect(page.locator('.availability-owner').first()).toBeVisible();
    await expect(page.locator('.message-property-link').first()).toBeVisible();
    await assertNoHorizontalOverflow(page);
    if (language === 'ca') {
      const selectedValue = await page.locator('#filter-accommodation-type').evaluate(select => {
        const style = getComputedStyle(select);
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = style.font;
        const text = select.options[select.selectedIndex].text;
        const required = context.measureText(text).width + parseFloat(style.paddingLeft) +
          parseFloat(style.paddingRight) + parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth);
        return {text, width:select.getBoundingClientRect().width, required};
      });
      expect(selectedValue.text).toBe('Qualsevol tipus');
      expect(selectedValue.width).toBeGreaterThanOrEqual(selectedValue.required);
    }
  }

  const country = page.locator('[name="country"]');
  await country.focus();
  const focus = await country.evaluate(node => {
    const style=getComputedStyle(node);
    return {width:style.outlineWidth,style:style.outlineStyle,color:style.outlineColor,offset:style.outlineOffset};
  });
  expect(focus).toMatchObject({width:'2px',style:'solid',offset:'3px'});

  await page.keyboard.press('Tab');
  await expect(page.locator('[name="city"]')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(country).toBeFocused();
});

test('PM-057: compact Search uses paired controls at 390px and one column at 320px', async ({page}) => {
  await openResults(page,{width:390,height:844});
  await page.locator('[data-search-lang="es"]').click();
  await assertNoHorizontalOverflow(page);

  const compact = await page.evaluate(() => {
    const labels=[...document.querySelectorAll('.availability-form>label')].map(node=>node.getBoundingClientRect());
    const title=getComputedStyle(document.querySelector('.availability-intro h1'));
    return {
      titleSize:title.fontSize,titleLine:title.lineHeight,
      countryWidth:labels[0].width,cityWidth:labels[1].width,
      fromTop:labels[2].top,toTop:labels[3].top,
      bedroomsTop:labels[4].top,sleepsTop:labels[5].top
    };
  });
  expect(compact).toMatchObject({titleSize:'30px',titleLine:'35px'});
  expect(compact.countryWidth).toBeGreaterThan(350);
  expect(compact.cityWidth).toBeGreaterThan(350);
  expect(Math.abs(compact.fromTop-compact.toTop)).toBeLessThan(1);
  expect(Math.abs(compact.bedroomsTop-compact.sleepsTop)).toBeLessThan(1);

  await page.setViewportSize({width:320,height:844});
  await assertNoHorizontalOverflow(page);
  const narrow = await page.evaluate(() => {
    const labels=[...document.querySelectorAll('.availability-form>label')].map(node=>node.getBoundingClientRect());
    return {fromTop:labels[2].top,toTop:labels[3].top,fromWidth:labels[2].width,toWidth:labels[3].width};
  });
  expect(narrow.toTop).toBeGreaterThan(narrow.fromTop);
  expect(Math.abs(narrow.fromWidth-narrow.toWidth)).toBeLessThan(1);
});
